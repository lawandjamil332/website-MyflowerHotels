import type { Payload } from 'payload'

import type { Room } from '@/payload-types'

import { dbPool } from './db'

/**
 * The "from" price, taken from the calendar instead of a second number.
 *
 * Every price a guest sees before choosing dates — the room cards, the room
 * page, the cheapest-room line on the hotels index, and the `price` published
 * in the structured data — came from the room's own `Price from` field. The
 * calendar was consulted only once dates were picked. So a rate typed into the
 * calendar changed what a guest was charged and not one number the site
 * advertised, and the owner could raise every night of a season and watch the
 * homepage keep quoting the old figure.
 *
 * That is worse than untidy. Google reads the structured-data price and the
 * booking page, and a hotel whose advertised price does not match what it
 * charges is exactly what the free booking links programme removes properties
 * for. The calendar has to be the only place a price lives.
 *
 * What "from" means here is what a guest would mean by it: **the cheapest
 * night they could actually book in the next ninety days.** Which has a
 * consequence worth stating, because it looks like a bug the first time it is
 * seen — raising one Friday to 180,000 does not move the "from" price, and
 * should not, because Monday is still available at the old rate and "from"
 * would be a lie. It moves when the floor moves.
 *
 * Nights the calendar has closed, or held back to nothing, are not offers and
 * are skipped. Nights with no row are sellable at the room's own rate, so the
 * base price stays a candidate whenever the window is not fully covered — this
 * is what keeps a half-filled calendar honest rather than quoting a floor that
 * only applies to the three days somebody has priced.
 *
 * A room whose every night is closed has no floor to quote; it keeps its base
 * price rather than showing nothing, because the room card has to say
 * something and the booking flow refuses the dates anyway.
 */

/** How far ahead "from" looks. A season, which is as far as anyone books here. */
const WINDOW_DAYS = 90

/**
 * The lowest bookable nightly rate per room, over the window.
 *
 * One query for every room on the page rather than one per room: the hotels
 * index asks about every room in the group, and this is the difference between
 * a query and fifty.
 */
export const lowestNightly = async (
  payload: Payload,
  roomIds: number[],
): Promise<Map<number, number>> => {
  const out = new Map<number, number>()
  if (roomIds.length === 0) return out

  try {
    const { rows } = await dbPool(payload).query<{ id: number; lowest: number | null }>(
      `SELECT r.id,
              LEAST(
                -- The cheapest night that carries a rate and is actually for
                -- sale. A night the calendar closed is not an offer.
                (SELECT MIN(COALESCE(rr.price, r.price_from))
                   FROM room_rates rr
                  WHERE rr.room_id = r.id
                    AND rr.date >= CURRENT_DATE
                    AND rr.date < CURRENT_DATE + $2::int
                    AND rr.closed IS NOT TRUE
                    AND COALESCE(rr.rooms_to_sell, r.quantity) > 0),
                -- And the room's own rate, but only while some night in the
                -- window has no rate of its own to override it.
                CASE WHEN (SELECT COUNT(*) FROM room_rates rr
                            WHERE rr.room_id = r.id
                              AND rr.date >= CURRENT_DATE
                              AND rr.date < CURRENT_DATE + $2::int) < $2::int
                     THEN r.price_from END
              )::float AS lowest
         FROM rooms r
        WHERE r.id = ANY($1::int[])`,
      [roomIds, WINDOW_DAYS],
    )

    for (const row of rows) {
      if (typeof row.lowest === 'number' && row.lowest > 0) out.set(row.id, row.lowest)
    }
  } catch (error) {
    // A calendar the database cannot answer for is not a reason to show a
    // page with no prices on it — callers keep whatever they had. But it is
    // absolutely a reason to say so: written silently first, this swallowed a
    // missing array cast and the site went on quoting the old prices with no
    // sign anything had failed.
    payload.logger.warn(
      `From-price: could not read the calendar, showing standing rates — ${
        error instanceof Error ? error.message : 'unknown error'
      }`,
    )
  }

  return out
}

/**
 * Rewrites `priceFrom` on rooms already loaded, leaving everything else alone.
 *
 * Display only. The stored `Price from` is still the room's standing rate and
 * still what an unpriced night is sold at — this changes the number quoted,
 * never the number charged.
 *
 * Typed against Payload's own `Room` rather than a loose shape with an id on
 * it. The loose version compiled perfectly happily when this was first wired
 * into the *hotel* loader by mistake, which would have printed a room's price
 * on the hotel that happened to share its id. The narrow type makes that a
 * build error rather than something to notice in production.
 */
export const withCalendarPrices = async <T extends Room>(
  payload: Payload,
  rooms: T[],
): Promise<T[]> => {
  const ids = rooms.map((room) => Number(room.id)).filter((id) => Number.isFinite(id))
  if (ids.length === 0) return rooms

  const lowest = await lowestNightly(payload, ids)
  if (lowest.size === 0) return rooms

  return rooms.map((room) => {
    const found = lowest.get(Number(room.id))
    return found === undefined ? room : { ...room, priceFrom: found }
  })
}
