import type { Payload } from 'payload'

/**
 * Points: what a stay earns, and what a guest has.
 *
 * Earned on a stay that actually happened, not on one that was booked. A guest
 * who books ten rooms and turns up to none has earned nothing, and a scheme
 * that pays out on the booking has to claw points back when the booking is
 * cancelled — which is where loyalty schemes go wrong, because the claw-back
 * runs less reliably than the award and balances quietly inflate. Awarding on
 * completion means nothing ever has to be taken away.
 *
 * The balance is never stored. It is the sum of the ledger, so it cannot
 * disagree with the rows that explain it.
 */

const pool = (payload: Payload) => (payload.db as unknown as { pool: any }).pool

/** What a stay of this value is worth, at the rate the owner has set. */
export const pointsForStay = (totalIqd: number, perThousand: number): number =>
  Math.max(0, Math.floor((totalIqd / 1000) * perThousand))

export const pointsBalance = async (payload: Payload, guestId: number): Promise<number> => {
  const { rows } = await pool(payload).query(
    `SELECT COALESCE(SUM(points), 0)::int AS balance FROM point_entries WHERE guest_id = $1`,
    [guestId],
  )
  return rows[0]?.balance ?? 0
}

/**
 * Awards the points for a completed stay.
 *
 * Safe to call more than once. A partial unique index allows one positive entry
 * per booking, so a second attempt is refused by the database rather than by
 * anything this function remembers — which is what makes it safe against a hook
 * that fires twice, a staff member toggling a status back and forth, or two
 * requests arriving together.
 */
export const awardPointsForBooking = async (
  payload: Payload,
  bookingId: number,
): Promise<number> => {
  try {
    const settings = (await payload.findGlobal({ slug: 'settings', depth: 0 })) as {
      pointsEnabled?: boolean | null
      pointsPer1000Iqd?: number | null
    }
    if (settings?.pointsEnabled === false) return 0

    const perThousand = settings?.pointsPer1000Iqd ?? 1
    if (!perThousand || perThousand <= 0) return 0

    const { rows } = await pool(payload).query(
      `SELECT guest_id, total_amount::float AS total, currency, reference, status
         FROM bookings WHERE id = $1`,
      [bookingId],
    )
    const booking = rows[0]
    if (!booking) return 0
    if (booking.status !== 'completed') return 0
    if (!booking.guest_id) return 0 // booked without an account; nothing to credit
    if (!booking.total) return 0 // no price recorded, so nothing to compute from

    // Only dinar stays earn at this rate. A dollar price would need converting,
    // and converting at today's rate a stay priced months ago invents a number.
    if (booking.currency !== 'IQD') return 0

    const points = pointsForStay(booking.total, perThousand)
    if (points <= 0) return 0

    try {
      await pool(payload).query(
        `INSERT INTO point_entries (guest_id, points, reason, booking_id)
         VALUES ($1, $2, $3, $4)`,
        [booking.guest_id, points, `Stay ${booking.reference}`, bookingId],
      )
      payload.logger.info(`Points: ${points} awarded for booking ${booking.reference}`)
      return points
    } catch (error) {
      if ((error as { code?: string })?.code === '23505') return 0 // already awarded
      throw error
    }
  } catch (error) {
    // Points must never be able to fail a booking or a status change.
    payload.logger.error(`Points: could not award for booking ${bookingId} — ${error}`)
    return 0
  }
}
