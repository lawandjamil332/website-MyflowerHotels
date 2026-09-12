import { timingSafeEqual } from 'node:crypto'

import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { dbPool } from '@/utilities/db'
import { awardPointsForBooking } from '@/utilities/points'

/**
 * Closes out stays that have ended, and pays the points they earned.
 *
 * A booking is created as `confirmed` and nothing in this site has ever moved
 * it on. So every stay the hotel has ever taken is still filed as an upcoming
 * arrival, however long ago the guest checked out — and two things follow from
 * that, one cosmetic and one expensive.
 *
 * The expensive one: `awardPointsForBooking` refuses any booking that is not
 * `completed`. The site tells guests that booking direct earns points, the
 * admin panel has a rate in it, and not one point has ever been credited to
 * anybody, because the status it waits for is one nothing sets. A promise made
 * on the homepage and silently not kept.
 *
 * The cosmetic one: the Analytics tab's "how they ended" table shows every
 * booking ever taken as confirmed, so the one view of whether guests actually
 * turn up says nothing at all.
 *
 * WHAT IT WILL AND WILL NOT TOUCH. Only `confirmed`, and only once the day of
 * departure has passed. A cancelled booking stays cancelled, a no-show stays a
 * no-show, and a stay still under way is the front desk's business. It cannot
 * mark somebody absent: a guest who never arrived is a judgement the hotel
 * makes, not one a clock makes, and `noShow` is left for a person to set.
 *
 * Safe to call as often as you like. The update matches only rows it has not
 * already changed, so a second run in the same minute finds nothing to do, and
 * points are awarded per booking by a routine that already refuses to pay
 * twice.
 *
 * HOW IT IS CALLED. By a scheduler, once a day — see JOB_SECRET in
 * .env.example for the two ways to arrange that. It is a plain HTTPS request,
 * so anything that can fetch a URL on a timer will do.
 */

export const dynamic = 'force-dynamic'

/**
 * Compared in constant time, so the answer cannot be found one character at a
 * time by measuring how long the refusal takes.
 */
const authorised = (request: NextRequest, secret: string): boolean => {
  const header = request.headers.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : header
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  // timingSafeEqual throws on a length mismatch, which is itself a leak of the
  // length — but the length of a secret is not the secret, and refusing early
  // is better than comparing buffers of different sizes.
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest): Promise<Response> {
  const secret = process.env.JOB_SECRET?.trim()

  // Unset means off, not open. A job endpoint that runs for anybody because
  // nobody configured a password is worse than one that does not run.
  if (!secret) {
    return Response.json(
      { ran: false, why: 'JOB_SECRET is not set on this deployment, so this endpoint is off.' },
      { status: 503 },
    )
  }

  if (!authorised(request, secret)) {
    return new Response('No.', { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    // Compared as a date rather than a timestamp: check_out is the morning the
    // guest leaves, so a stay ending today is over by the time tomorrow starts
    // and not a moment before.
    const { rows } = await dbPool(payload).query<{ id: number }>(
      `UPDATE bookings
          SET status = 'completed', updated_at = NOW()
        WHERE status = 'confirmed'
          AND check_out::date < CURRENT_DATE
      RETURNING id`,
    )

    // Awarded one at a time, and never allowed to undo the close-out: a guest
    // whose points fail to credit has still finished their stay, and leaving
    // the booking open so the next run can retry would mean the ones that did
    // credit get paid twice.
    let paid = 0
    for (const row of rows) {
      const points = await awardPointsForBooking(payload, row.id).catch(() => 0)
      if (points > 0) paid += 1
    }

    if (rows.length > 0) {
      payload.logger.info(
        `Closed ${rows.length} finished ${rows.length === 1 ? 'stay' : 'stays'}; ` +
          `${paid} earned points.`,
      )
    }

    return Response.json({ ran: true, closed: rows.length, earnedPoints: paid })
  } catch (error) {
    payload.logger.error(`Closing finished stays failed: ${error}`)
    return Response.json({ ran: false, why: String(error) }, { status: 500 })
  }
}
