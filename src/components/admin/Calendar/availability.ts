import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { dbPool } from '@/utilities/db'

/**
 * What is left to sell, room by room, night by night, for a calendar month.
 *
 * This is the screen the extranet is actually built around. Booking.com calls
 * it Rates & Availability and it is a grid: your room types down the side, a
 * month across the top, and in every cell how many of that room are still free
 * that night. A hotel manager looks at it and knows what to do — which is not
 * a question the panel could answer at all before, because the only way to see
 * whether the 14th was full was to open the booking form and try to book it.
 *
 * A calendar month rather than a rolling fortnight, because a month is the
 * unit hotels think in — "how is September looking" — and because a grid whose
 * first column is a different date every time you open it cannot be compared
 * with the one you looked at yesterday.
 *
 * The counting is done here rather than in SQL. One query fetches the stays
 * that touch the month — at four hotels that is tens of rows, not thousands —
 * and the overlap arithmetic happens in JavaScript, where it can be read. A
 * date-series join would be cleverer and nobody would ever check it.
 *
 * "Occupying" is the same three statuses the booking engine treats as holding
 * a room, deliberately: a calendar that disagreed with the thing selling the
 * rooms would be worse than no calendar.
 */

/** Statuses that hold a room. Mirrors OCCUPYING in utilities/booking.ts. */
const OCCUPYING = ['held', 'confirmed', 'completed']

export type Night = {
  /** Midnight UTC, ISO. */
  date: string
  /** Rooms of this type still free. */
  free: number
  /** Rooms of this type sold. */
  sold: number
}

export type RoomRow = {
  id: number
  name: string
  hotel: string
  hotelId: number
  /** How many of this room the hotel has. */
  quantity: number
  /** False when the room is switched off; it sells nothing whatever is free. */
  onSale: boolean
  price: number | null
  currency: string
  nights: Night[]
}

export type Availability = {
  /** Midnight UTC of the first of the month shown. */
  from: string
  /** Every night of that month. */
  dates: string[]
  rooms: RoomRow[]
  /** Rooms sold across the whole group, per night, against the group's stock. */
  totals: { date: string; sold: number; stock: number }[]
}

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))

/**
 * The month a grid is showing, as its first day.
 *
 * `?month=2026-09` in the query string wins, so the arrows either side of the
 * month name are ordinary links and a month is shareable; anything unreadable
 * falls back to this month rather than to an error.
 */
export const monthStart = (month?: string): Date => {
  if (month) {
    const parsed = new Date(`${month}-01T00:00:00.000Z`)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

/** "2026-09", the form the month arrows put back in the URL. */
export const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`

export const shiftMonth = (date: Date, by: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + by, 1))

export const runAvailability = async (month?: string): Promise<Availability | null> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const pool = dbPool(payload)

    const start = monthStart(month)
    const end = shiftMonth(start, 1)
    const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000)
    const dates = Array.from({ length: nights }, (_, i) =>
      new Date(start.getTime() + i * 86_400_000).toISOString(),
    )

    const [rooms, stays] = await Promise.all([
      pool.query<{
        id: number
        name: string
        hotel: string | null
        hotel_id: number
        quantity: string
        is_available: boolean | null
        price_from: string | null
        currency: string | null
      }>(
        `SELECT r.id, rl.name, bl.name AS hotel, r.branch_id AS hotel_id,
                r.quantity, r.is_available, r.price_from, r.currency
           FROM rooms r
           LEFT JOIN rooms_locales    rl ON rl._parent_id = r.id        AND rl._locale = 'en'
           LEFT JOIN branches         b  ON b.id          = r.branch_id
           LEFT JOIN branches_locales bl ON bl._parent_id = b.id        AND bl._locale = 'en'
          ORDER BY b."order" NULLS LAST, b.id, r.id`,
      ),

      // Every stay that overlaps the month at all: starts before it ends, ends
      // after it starts. Touching stays do not overlap — somebody checking out
      // on the 5th frees the room for somebody arriving on the 5th.
      pool.query<{ room_id: number | null; check_in: Date; check_out: Date }>(
        `SELECT room_id, check_in, check_out
           FROM bookings
          WHERE status = ANY($3) AND check_in < $2 AND check_out > $1`,
        [start, end, OCCUPYING],
      ),
    ])

    // room id -> how many of that room are taken on each night of the month.
    const taken = new Map<number, number[]>()
    for (const stay of stays.rows) {
      if (stay.room_id === null) continue
      const counts = taken.get(stay.room_id) ?? new Array(nights).fill(0)
      const checkIn = new Date(stay.check_in).getTime()
      const checkOut = new Date(stay.check_out).getTime()

      for (let i = 0; i < nights; i++) {
        const night = start.getTime() + i * 86_400_000
        if (checkIn <= night && checkOut > night) counts[i] += 1
      }
      taken.set(stay.room_id, counts)
    }

    const rows: RoomRow[] = rooms.rows.map((room) => {
      const quantity = Number(room.quantity) || 0
      const counts = taken.get(room.id) ?? new Array(nights).fill(0)

      return {
        id: room.id,
        name: room.name || `Room ${room.id}`,
        hotel: room.hotel || 'Unassigned',
        hotelId: room.hotel_id,
        quantity,
        onSale: room.is_available !== false,
        price: room.price_from === null ? null : Number(room.price_from),
        currency: room.currency || 'IQD',
        nights: dates.map((date, i) => ({
          date,
          sold: counts[i],
          free: Math.max(0, quantity - counts[i]),
        })),
      }
    })

    const totals = dates.map((date, i) => ({
      date,
      sold: rows.reduce((sum, room) => sum + room.nights[i].sold, 0),
      stock: rows.reduce((sum, room) => sum + (room.onSale ? room.quantity : 0), 0),
    }))

    return { from: start.toISOString(), dates, rooms: rows, totals }
  } catch {
    return null
  }
}

export const startOfDayUtc = startOfUtcDay
