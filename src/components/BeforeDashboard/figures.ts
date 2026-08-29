import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { dbPool } from '@/utilities/db'

/**
 * What is happening at the four hotels today.
 *
 * An extranet opens on the day, not on a database. Booking.com's does: who is
 * arriving, who is leaving, who is asleep in a room right now, how full the
 * place is. Everything here is that — counted at the moment the page opens,
 * because a number about today is worth nothing the morning after.
 *
 * All of it is one round trip's worth of SQL rather than Payload queries. The
 * counts are aggregates over every booking ever taken, and asking Payload for
 * them would mean fetching the rows into Node to count them.
 *
 * "Occupying" is the same three statuses the booking engine treats as holding
 * a room — held, confirmed and stayed. Deliberately the same list: a dashboard
 * that counted occupancy differently from the thing that sells the rooms would
 * be a second opinion nobody asked for. Cancelled and no-show gave the room
 * back, so they are not here at all.
 */

/** Statuses that hold a room. Mirrors OCCUPYING in utilities/booking.ts. */
const OCCUPYING = ['held', 'confirmed', 'completed'] as const

export type Stay = {
  id: number
  reference: string
  guestName: string
  guestPhone: string | null
  guestEmail: string | null
  hotel: string | null
  room: string | null
  nights: number | null
  guests: number | null
  status: string
  checkIn: string
  checkOut: string
  amount: number | null
  currency: string | null
}

export type HotelRow = {
  id: number
  name: string | null
  /** Rooms this hotel can sell tonight. */
  stock: number
  /** Rooms of them that are sold. */
  sold: number
  arrivals: number
  departures: number
}

export type Figures = {
  /** Midnight UTC of the day these were counted for. */
  today: string
  arrivals: number
  departures: number
  inHouse: number
  stock: number
  /** Whole percent, or null when no hotel has any sellable room. */
  occupancy: number | null
  bookedThisWeek: number
  newEnquiries: number
  /** Money booked this calendar month, one entry per currency taken. */
  revenue: { currency: string; amount: number }[]
  hotels: HotelRow[]
  arrivalList: Stay[]
  departureList: Stay[]
}

/** Midnight today, UTC — the same clock the booking engine keeps. */
const todayUtc = (): Date => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 86_400_000)

const num = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value)

/**
 * The columns every stay list selects. Hotel and room names live in the
 * `_locales` tables because both are translated; English is what the panel is
 * read in, and a name is required in the default locale, so there is always
 * one to show.
 */
const STAY_COLUMNS = `
  b.id, b.reference, b.guest_name, b.guest_phone, b.guest_email,
  b.nights, b.guests, b.status, b.check_in, b.check_out,
  b.total_amount, b.currency,
  bl.name AS hotel, rl.name AS room`

const STAY_JOINS = `
  FROM bookings b
  LEFT JOIN branches_locales bl ON bl._parent_id = b.branch_id AND bl._locale = 'en'
  LEFT JOIN rooms_locales    rl ON rl._parent_id = b.room_id   AND rl._locale = 'en'`

type StayRow = {
  id: number
  reference: string
  guest_name: string
  guest_phone: string | null
  guest_email: string | null
  nights: string | null
  guests: string | null
  status: string
  check_in: Date
  check_out: Date
  total_amount: string | null
  currency: string | null
  hotel: string | null
  room: string | null
}

const toStay = (row: StayRow): Stay => ({
  id: row.id,
  reference: row.reference,
  guestName: row.guest_name,
  guestPhone: row.guest_phone,
  guestEmail: row.guest_email,
  hotel: row.hotel,
  room: row.room,
  nights: num(row.nights),
  guests: num(row.guests),
  status: row.status,
  checkIn: new Date(row.check_in).toISOString(),
  checkOut: new Date(row.check_out).toISOString(),
  amount: num(row.total_amount),
  currency: row.currency,
})

export const runFigures = async (): Promise<Figures | null> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const pool = dbPool(payload)

    const today = todayUtc()
    const tomorrow = addDays(today, 1)
    const weekAgo = addDays(today, -6)
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
    const occupying = [...OCCUPYING]

    const [counts, revenue, hotels, arrivalList, departureList] = await Promise.all([
      // Four counts over the same table, so one pass rather than four.
      pool.query<{
        arrivals: string
        departures: string
        in_house: string
        booked_this_week: string
        new_enquiries: string
      }>(
        `SELECT
           COUNT(*) FILTER (WHERE check_in  >= $1 AND check_in  < $2) AS arrivals,
           COUNT(*) FILTER (WHERE check_out >= $1 AND check_out < $2) AS departures,
           COUNT(*) FILTER (WHERE check_in  <= $1 AND check_out > $1) AS in_house,
           COUNT(*) FILTER (WHERE created_at >= $3)                   AS booked_this_week,
           (SELECT COUNT(*) FROM enquiries WHERE status = 'new')      AS new_enquiries
         FROM bookings
        WHERE status = ANY($4)`,
        [today, tomorrow, weekAgo, occupying],
      ),

      // Kept per currency rather than converted. The dinar-per-dollar rate in
      // Settings is what the website quotes prices at, not what the bank gave
      // anyone, and adding the two together would invent a number.
      pool.query<{ currency: string | null; amount: string | null }>(
        `SELECT currency, SUM(total_amount) AS amount
           FROM bookings
          WHERE status = ANY($2) AND created_at >= $1 AND total_amount IS NOT NULL
          GROUP BY currency
          ORDER BY SUM(total_amount) DESC`,
        [monthStart, occupying],
      ),

      // Tonight, hotel by hotel. This is the group view the owner has and a
      // single-property extranet cannot show: four buildings, side by side.
      pool.query<{
        id: number
        name: string | null
        stock: string
        sold: string
        arrivals: string
        departures: string
      }>(
        `SELECT br.id, bl.name,
            COALESCE((SELECT SUM(r.quantity) FROM rooms r
                       WHERE r.branch_id = br.id AND r.is_available IS NOT FALSE), 0) AS stock,
            (SELECT COUNT(*) FROM bookings b
              WHERE b.branch_id = br.id AND b.status = ANY($2)
                AND b.check_in <= $1 AND b.check_out > $1) AS sold,
            (SELECT COUNT(*) FROM bookings b
              WHERE b.branch_id = br.id AND b.status = ANY($2)
                AND b.check_in >= $1 AND b.check_in < $3) AS arrivals,
            (SELECT COUNT(*) FROM bookings b
              WHERE b.branch_id = br.id AND b.status = ANY($2)
                AND b.check_out >= $1 AND b.check_out < $3) AS departures
           FROM branches br
           LEFT JOIN branches_locales bl ON bl._parent_id = br.id AND bl._locale = 'en'
          ORDER BY br."order" NULLS LAST, br.id`,
        [today, occupying, tomorrow],
      ),

      pool.query<StayRow>(
        `SELECT ${STAY_COLUMNS} ${STAY_JOINS}
          WHERE b.status = ANY($3) AND b.check_in >= $1 AND b.check_in < $2
          ORDER BY bl.name NULLS LAST, b.guest_name
          LIMIT 40`,
        [today, tomorrow, occupying],
      ),

      pool.query<StayRow>(
        `SELECT ${STAY_COLUMNS} ${STAY_JOINS}
          WHERE b.status = ANY($3) AND b.check_out >= $1 AND b.check_out < $2
          ORDER BY bl.name NULLS LAST, b.guest_name
          LIMIT 40`,
        [today, tomorrow, occupying],
      ),
    ])

    const rows = hotels.rows.map((row) => ({
      id: row.id,
      name: row.name,
      stock: Number(row.stock),
      sold: Number(row.sold),
      arrivals: Number(row.arrivals),
      departures: Number(row.departures),
    }))

    const stock = rows.reduce((sum, row) => sum + row.stock, 0)
    const sold = rows.reduce((sum, row) => sum + row.sold, 0)
    const c = counts.rows[0]

    return {
      today: today.toISOString(),
      arrivals: Number(c?.arrivals ?? 0),
      departures: Number(c?.departures ?? 0),
      inHouse: Number(c?.in_house ?? 0),
      stock,
      occupancy: stock > 0 ? Math.round((sold / stock) * 100) : null,
      bookedThisWeek: Number(c?.booked_this_week ?? 0),
      newEnquiries: Number(c?.new_enquiries ?? 0),
      revenue: revenue.rows
        .filter((row) => row.amount !== null)
        .map((row) => ({ currency: row.currency || 'IQD', amount: Number(row.amount) })),
      hotels: rows,
      arrivalList: arrivalList.rows.map(toStay),
      departureList: departureList.rows.map(toStay),
    }
  } catch {
    // No database, or a schema older than this file. The dashboard renders
    // without the day's numbers rather than refusing to render at all — the
    // panel still has to open so somebody can go and fix whatever is wrong.
    return null
  }
}
