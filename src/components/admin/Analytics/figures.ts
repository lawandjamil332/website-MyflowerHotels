import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { dbPool } from '@/utilities/db'

/**
 * A year of trading, counted from the bookings themselves.
 *
 * Booking.com's extranet has an Analytics tab and this panel had nothing: the
 * dashboard could say what is happening tonight and the calendar what is left
 * to sell, but nobody could answer "is September better than last September",
 * which is the question that decides a price. Every number needed was already
 * in the database and none of it was ever added up.
 *
 * Two queries, and the arithmetic in JavaScript. A year of stays at four small
 * hotels is hundreds of rows, not millions, and every figure here — occupancy,
 * how far ahead people book, how long they stay — is a different slice of the
 * same rows. Twelve SQL aggregates over the same table would be twelve chances
 * to define "a month" differently.
 *
 * Occupancy is room-nights sold over room-nights available, which is the
 * definition every hotel uses, and the denominator is the rooms actually on
 * sale times the nights in the month. A month with a room switched off is a
 * month with fewer room-nights, not a month that looks fuller.
 */

/** Statuses that hold a room. Mirrors OCCUPYING in utilities/booking.ts. */
const OCCUPYING = ['held', 'confirmed', 'completed']

export type Month = { key: string; label: string; short: string }

export type Bucket = { label: string; value: number }

export type Analytics = {
  months: Month[]
  /** Room-nights sold and available, per month. */
  occupancy: { month: string; sold: number; available: number; percent: number }[]
  /** Money booked in each month, by the currency it was taken in. */
  revenue: { currency: string; byMonth: { month: string; value: number }[] }[]
  /** How far ahead people book, in days, bucketed. */
  window: Bucket[]
  /** How many nights they stay, bucketed. */
  lengths: Bucket[]
  /** Room-nights sold in the year, per hotel. */
  hotels: Bucket[]
  /** How bookings ended, over the year. */
  outcomes: { status: string; count: number; share: number }[]
  /** The headline numbers, for the tiles across the top. */
  headline: {
    occupancy30: number | null
    sold30: number
    booked30: { currency: string; amount: number }[]
    cancelledShare: number | null
    averageStay: number | null
    averageWindow: number | null
    bookings: number
  }
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const startOfMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
const addMonths = (date: Date, by: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + by, 1))
const monthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
const days = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 86_400_000)

/** Whole days of a stay that fall inside a window. Nights, not dates. */
const overlap = (checkIn: Date, checkOut: Date, from: Date, to: Date): number => {
  const start = Math.max(checkIn.getTime(), from.getTime())
  const end = Math.min(checkOut.getTime(), to.getTime())
  return Math.max(0, Math.round((end - start) / 86_400_000))
}

const bucket = (value: number, edges: { limit: number; label: string }[]): string => {
  for (const edge of edges) if (value <= edge.limit) return edge.label
  return edges[edges.length - 1].label
}

type Row = {
  branch_id: number | null
  status: string
  check_in: Date
  check_out: Date
  nights: string | null
  total_amount: string | null
  currency: string | null
  created_at: Date
}

export const runAnalytics = async (): Promise<Analytics | null> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const pool = dbPool(payload)

    const now = new Date()
    const thisMonth = startOfMonth(now)
    // Twelve months ending with the one we are in.
    const from = addMonths(thisMonth, -11)
    const to = addMonths(thisMonth, 1)

    const [bookings, rooms] = await Promise.all([
      pool.query<Row>(
        `SELECT branch_id, status, check_in, check_out, nights, total_amount, currency, created_at
           FROM bookings
          WHERE (check_out > $1 AND check_in < $2) OR created_at >= $1`,
        [from, to],
      ),
      pool.query<{ branch_id: number; hotel: string | null; quantity: string }>(
        `SELECT r.branch_id, bl.name AS hotel, SUM(r.quantity) AS quantity
           FROM rooms r
           LEFT JOIN branches b            ON b.id = r.branch_id
           LEFT JOIN branches_locales bl   ON bl._parent_id = b.id AND bl._locale = 'en'
          WHERE r.is_available IS NOT FALSE
          GROUP BY r.branch_id, bl.name, b."order", b.id
          ORDER BY b."order" NULLS LAST, b.id`,
      ),
    ])

    const months: Month[] = Array.from({ length: 12 }, (_, i) => {
      const date = addMonths(from, i)
      return {
        key: monthKey(date),
        label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
        short: SHORT[date.getUTCMonth()],
      }
    })

    const stock = rooms.rows.reduce((sum, row) => sum + Number(row.quantity), 0)
    const hotelNames = new Map(
      rooms.rows.map((row) => [row.branch_id, row.hotel || `Hotel ${row.branch_id}`]),
    )

    const occupying = bookings.rows.filter((row) => OCCUPYING.includes(row.status))

    // ---- Occupancy, month by month ----
    const occupancy = months.map((month, i) => {
      const start = addMonths(from, i)
      const end = addMonths(from, i + 1)
      const sold = occupying.reduce(
        (total, row) =>
          total + overlap(new Date(row.check_in), new Date(row.check_out), start, end),
        0,
      )
      const available = stock * days(start, end)
      return {
        month: month.key,
        sold,
        available,
        percent: available > 0 ? Math.round((sold / available) * 100) : 0,
      }
    })

    // ---- Money booked, by the month it was taken ----
    const currencies = [...new Set(occupying.map((row) => row.currency || 'IQD'))]
    const revenue = currencies
      .map((currency) => ({
        currency,
        byMonth: months.map((month, i) => {
          const start = addMonths(from, i)
          const end = addMonths(from, i + 1)
          const value = occupying
            .filter(
              (row) =>
                (row.currency || 'IQD') === currency &&
                new Date(row.created_at) >= start &&
                new Date(row.created_at) < end,
            )
            .reduce((total, row) => total + Number(row.total_amount ?? 0), 0)
          return { month: month.key, value }
        }),
      }))
      .filter((line) => line.byMonth.some((entry) => entry.value > 0))

    // ---- How far ahead they book ----
    const windowEdges = [
      { limit: 0, label: 'Same day' },
      { limit: 3, label: '1–3 days' },
      { limit: 7, label: '4–7 days' },
      { limit: 14, label: '1–2 weeks' },
      { limit: 30, label: '2–4 weeks' },
      { limit: 90, label: '1–3 months' },
      { limit: Number.MAX_SAFE_INTEGER, label: '3 months +' },
    ]
    const windowCounts = new Map(windowEdges.map((edge) => [edge.label, 0]))
    const lead: number[] = []
    for (const row of occupying) {
      const ahead = days(startOfDay(new Date(row.created_at)), startOfDay(new Date(row.check_in)))
      if (ahead < 0) continue
      lead.push(ahead)
      const label = bucket(ahead, windowEdges)
      windowCounts.set(label, (windowCounts.get(label) ?? 0) + 1)
    }

    // ---- How long they stay ----
    const lengthEdges = [
      { limit: 1, label: '1 night' },
      { limit: 2, label: '2 nights' },
      { limit: 3, label: '3 nights' },
      { limit: 7, label: '4–7 nights' },
      { limit: 14, label: '1–2 weeks' },
      { limit: Number.MAX_SAFE_INTEGER, label: '2 weeks +' },
    ]
    const lengthCounts = new Map(lengthEdges.map((edge) => [edge.label, 0]))
    const stays: number[] = []
    for (const row of occupying) {
      const nights = Number(row.nights ?? 0) || days(new Date(row.check_in), new Date(row.check_out))
      if (nights <= 0) continue
      stays.push(nights)
      const label = bucket(nights, lengthEdges)
      lengthCounts.set(label, (lengthCounts.get(label) ?? 0) + 1)
    }

    // ---- Room-nights per hotel, over the year ----
    const perHotel = new Map<number, number>()
    for (const row of occupying) {
      if (row.branch_id === null) continue
      const nights = overlap(new Date(row.check_in), new Date(row.check_out), from, to)
      perHotel.set(row.branch_id, (perHotel.get(row.branch_id) ?? 0) + nights)
    }

    // ---- How they ended ----
    const inWindow = bookings.rows.filter((row) => new Date(row.created_at) >= from)
    const byStatus = new Map<string, number>()
    for (const row of inWindow) byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1)
    const outcomes = [...byStatus.entries()]
      .map(([status, count]) => ({
        status,
        count,
        share: inWindow.length ? Math.round((count / inWindow.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // ---- The last thirty nights, for the tiles ----
    const monthAgo = new Date(startOfDay(now).getTime() - 30 * 86_400_000)
    const today = startOfDay(now)
    const sold30 = occupying.reduce(
      (total, row) =>
        total + overlap(new Date(row.check_in), new Date(row.check_out), monthAgo, today),
      0,
    )
    const available30 = stock * 30

    const booked30 = currencies
      .map((currency) => ({
        amount: occupying
          .filter(
            (row) => (row.currency || 'IQD') === currency && new Date(row.created_at) >= monthAgo,
          )
          .reduce((total, row) => total + Number(row.total_amount ?? 0), 0),
        currency,
      }))
      .filter((line) => line.amount > 0)

    const lost = inWindow.filter((row) => row.status === 'cancelled' || row.status === 'noShow')
    const mean = (list: number[]) =>
      list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : null

    return {
      headline: {
        averageStay: mean(stays),
        averageWindow: mean(lead),
        booked30,
        bookings: inWindow.length,
        cancelledShare: inWindow.length
          ? Math.round((lost.length / inWindow.length) * 100)
          : null,
        occupancy30: available30 > 0 ? Math.round((sold30 / available30) * 100) : null,
        sold30,
      },
      hotels: [...perHotel.entries()]
        .map(([id, nights]) => ({ label: hotelNames.get(id) ?? `Hotel ${id}`, value: nights }))
        .sort((a, b) => b.value - a.value),
      lengths: lengthEdges.map((edge) => ({
        label: edge.label,
        value: lengthCounts.get(edge.label) ?? 0,
      })),
      months,
      occupancy,
      outcomes,
      revenue,
      window: windowEdges.map((edge) => ({
        label: edge.label,
        value: windowCounts.get(edge.label) ?? 0,
      })),
    }
  } catch {
    return null
  }
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}
