import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { dbPool } from '@/utilities/db'

/**
 * The three numbers the top bar carries, on every screen.
 *
 * Booking.com's blue bar has a cluster of icons on the right with a red dot on
 * whichever one needs you. These are the same idea and the same three
 * questions: is anyone arriving, is anyone leaving, is anyone waiting for a
 * reply. They follow you into every screen, so noticing an unanswered enquiry
 * no longer depends on being on the dashboard when it lands.
 *
 * One query, because it runs on every page load in the panel. Failure returns
 * nulls rather than throwing: the bar is chrome, and chrome must never be the
 * reason a page will not open.
 */

export type Counts = {
  arrivals: number | null
  departures: number | null
  enquiries: number | null
  hotels: number | null
}

const EMPTY: Counts = { arrivals: null, departures: null, enquiries: null, hotels: null }

export const runCounts = async (): Promise<Counts> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const pool = dbPool(payload)

    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const tomorrow = new Date(today.getTime() + 86_400_000)

    const { rows } = await pool.query<{
      arrivals: string
      departures: string
      enquiries: string
      hotels: string
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE check_in  >= $1 AND check_in  < $2) AS arrivals,
         COUNT(*) FILTER (WHERE check_out >= $1 AND check_out < $2) AS departures,
         (SELECT COUNT(*) FROM enquiries WHERE status = 'new')      AS enquiries,
         (SELECT COUNT(*) FROM branches)                            AS hotels
       FROM bookings
      WHERE status IN ('held', 'confirmed')`,
      [today, tomorrow],
    )

    const row = rows[0]
    if (!row) return EMPTY

    return {
      arrivals: Number(row.arrivals),
      departures: Number(row.departures),
      enquiries: Number(row.enquiries),
      hotels: Number(row.hotels),
    }
  } catch {
    return EMPTY
  }
}
