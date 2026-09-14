import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { dbPool } from '@/utilities/db'
import { getSettings } from '@/utilities/getSettings'
import { activeProvider, amountToCharge, fromMinorUnits } from '@/payments'

/**
 * Where the gateway's own server reports what happened. The only thing on this
 * site that may mark a booking paid.
 *
 * WHY NOT THE REDIRECT. When a guest finishes paying, two things arrive: their
 * browser comes back to a page on this site, and the gateway's server posts
 * here. Only the second is evidence. The first is a URL, and a URL is something
 * a person can type — believing it means anybody who works out the address of
 * the thank-you page has a free room. So the page a guest lands on reads the
 * database and reports what it finds, and this route is what puts anything in
 * it.
 *
 * WHAT IS CHECKED, IN ORDER
 *
 *   1. The signature, over the exact bytes received. An unsigned or wrongly
 *      signed message is refused before it is even parsed.
 *   2. That the booking exists.
 *   3. That the money matches what we asked for. A gateway reporting a smaller
 *      amount than the booking is owed is not a paid booking — it is either a
 *      misconfiguration or somebody tampering with a price, and both want a
 *      human rather than a confirmed room.
 *   4. That this exact transaction has not already been recorded.
 *
 * WHAT IT ANSWERS. 200 for anything it has dealt with, including a callback it
 * has decided not to act on — an unknown reference, a repeat, an underpayment —
 * because those will not come out differently on a second attempt. 401 for a
 * bad signature. 500 only when something on our side broke, which is the one
 * case where a retry helps: recording a payment is idempotent, so inviting the
 * gateway to ask again is free, and answering 200 to a database error would
 * tell it the money is recorded when it is not.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<Response> {
  const provider = activeProvider()
  if (!provider) {
    return Response.json({ ok: false, why: 'No payment provider is configured.' }, { status: 503 })
  }

  // The raw bytes, before any parsing. A signature is over what was sent, and
  // JSON.parse followed by JSON.stringify does not reproduce it.
  const rawBody = await request.text()

  const verdict = await provider.verifyCallback(request.headers, rawBody)
  if (!verdict.ok) {
    // 401, not 200: this one really should be retried, and if it is somebody
    // forging messages they should learn nothing from the answer.
    return new Response('No.', { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const { reference, paid, providerReference, minorAmount, currency, rawStatus } = verdict

  try {
    const { docs } = await payload.find({
      collection: 'bookings',
      where: { reference: { equals: reference } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const booking = docs[0]

    if (!booking) {
      payload.logger.error(
        `Payment callback names booking ${reference}, which does not exist. Status ${rawStatus}.`,
      )
      return Response.json({ ok: true, noted: 'unknown reference' })
    }

    if (!paid) {
      /**
       * A failure never overwrites a success.
       *
       * Gateways send lifecycle events, not just outcomes — "pending",
       * "authorized", "processing" — and they arrive out of order and get
       * redelivered. Written without this guard, a stale "pending" landing a
       * second after the capture turned a settled booking back into an unpaid
       * one, and the desk would have asked a guest to pay twice. The success
       * path already refused to move a paid row; this is the same rule applied
       * to the branch that can do more damage.
       */
      const { rows } = await dbPool(payload).query<{ id: number }>(
        `UPDATE bookings
            SET payment_status = 'failed',
                payment_provider = $2,
                payment_status_raw = $3,
                payment_reference = COALESCE($4, payment_reference),
                updated_at = NOW()
          WHERE id = $1
            AND payment_status <> 'paid'
        RETURNING id`,
        [booking.id, provider.id, rawStatus ?? null, providerReference ?? null],
      )

      if (rows.length === 0) {
        payload.logger.info(
          `Payment callback for ${reference} reports "${rawStatus}" on a booking already paid; ignored.`,
        )
        return Response.json({ ok: true, noted: 'already paid' })
      }

      payload.logger.info(`Payment for ${reference} did not go through (${rawStatus}).`)
      return Response.json({ ok: true })
    }

    /**
     * Does the money match what was asked for?
     *
     * Under-payment is refused rather than accepted quietly: a room marked paid
     * for less than it costs is a loss nobody notices until the month is
     * reconciled. A gateway that reports no amount at all is trusted on this
     * point, because some do not send one and refusing them would break the
     * integration over a check they cannot satisfy.
     *
     * The expected figure is worked out the way the start route worked it out.
     *
     * `paymentAmount` is written when the payment is started — but that write
     * is allowed to fail without failing the payment, so it can be missing on a
     * booking that is nonetheless being paid correctly. Falling back to the
     * full total was wrong the moment a deposit percentage was set: a guest
     * paying a correct 30% deposit was measured against 100%, declared
     * underpaid, and had their good payment marked failed. The fallback now
     * applies the same deposit the guest was charged.
     */
    const settings = await getSettings()
    const expectedCurrency = String(
      booking.paymentCurrency || booking.currency || '',
    ).toUpperCase()
    const expected = Number(
      booking.paymentAmount ??
        amountToCharge(
          Number(booking.totalAmount),
          settings.onlinePayments?.depositPercent,
          expectedCurrency,
        ),
    )

    /**
     * Only compared when the two sides are talking about the same currency.
     *
     * Converting a dollar figure and comparing it against a dinar total is not
     * a check, it is a coincidence — 80 USD against 250,000 IQD reads as a
     * catastrophic shortfall and would have failed a perfectly good payment.
     * A currency that does not match is a configuration problem worth shouting
     * about rather than quietly resolving in either direction.
     */
    if (typeof minorAmount === 'number' && currency && expectedCurrency && currency !== expectedCurrency) {
      payload.logger.error(
        `Payment for ${reference} came back in ${currency} against ${expectedCurrency} expected. ` +
          `Recorded as paid; check the merchant account's settlement currency.`,
      )
    } else if (typeof minorAmount === 'number' && currency) {
      const reported = fromMinorUnits(minorAmount, currency)
      // A hundredth of a unit of tolerance, for gateways that round.
      if (reported !== null && Number.isFinite(expected) && reported + 0.01 < expected) {
        payload.logger.error(
          `Payment for ${reference} reports ${reported} ${currency} against ${expected} expected. ` +
            `Left unpaid for a person to look at.`,
        )
        await payload.update({
          collection: 'bookings',
          id: booking.id,
          data: {
            paymentStatus: 'failed',
            paymentStatusRaw: `underpaid: ${rawStatus ?? 'paid'} ${reported} ${currency}`,
            paymentProvider: provider.id,
          },
          overrideAccess: true,
        })
        return Response.json({ ok: true, noted: 'amount mismatch' })
      }
    }

    /**
     * Written once, however many times this arrives.
     *
     * A conditional UPDATE rather than a read-then-write: two deliveries of the
     * same webhook can be in flight at the same moment, and between reading
     * "not yet paid" and writing "paid" there is room for the other one to do
     * the same. The database decides instead — only a row that is not already
     * paid is changed, and the second delivery updates nothing and says so.
     */
    const { rows } = await dbPool(payload).query<{ id: number }>(
      `UPDATE bookings
          SET payment_status = 'paid',
              payment_provider = $2,
              payment_reference = COALESCE($3, payment_reference),
              payment_status_raw = $4,
              paid_at = NOW(),
              updated_at = NOW()
        WHERE id = $1
          AND payment_status <> 'paid'
      RETURNING id`,
      [booking.id, provider.id, providerReference ?? null, rawStatus ?? 'paid'],
    )

    if (rows.length === 0) {
      payload.logger.info(`Payment for ${reference} was already recorded; ignoring a repeat.`)
      return Response.json({ ok: true, noted: 'already recorded' })
    }

    payload.logger.info(`Payment received for ${reference} (${rawStatus ?? 'paid'}).`)
    return Response.json({ ok: true })
  } catch (error) {
    /**
     * Signed, believable, and something on our side broke. Ask them to retry.
     *
     * This answered 200 at first, reasoning that a retry storm caused by our
     * own bug is worse than a payment needing a human. That was the wrong way
     * round: the errors that land here are transient — the database blinking,
     * a connection dropped — and a 200 tells the gateway the money is recorded
     * when it is not. The booking then sits unpaid with a guest who has been
     * charged, and nothing will ever correct it because nothing will ask again.
     *
     * Retries are safe to invite. Recording a payment is idempotent: the
     * transaction id is uniquely indexed and every write is conditional, so the
     * same callback arriving fifty times still records one payment.
     */
    payload.logger.error(
      `Payment callback for ${reference} could not be applied, asking for a retry: ${error}`,
    )
    return Response.json({ ok: false, why: 'temporary failure, please retry' }, { status: 500 })
  }
}

/** Some processors check the address with a GET before sending anything to it. */
export async function GET(): Promise<Response> {
  return Response.json({ ok: true, endpoint: 'payments/webhook' })
}
