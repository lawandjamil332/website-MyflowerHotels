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

  const payload = await getPayload({ config: configPromise })

  const verdict = await provider.verifyCallback(request.headers, rawBody)
  if (!verdict.ok) {
    /**
     * Logged, because the reason matters enormously and the answer cannot say it.
     *
     * A forged message and a genuine one we could not read look identical from
     * outside — deliberately, since telling a forger which part was wrong helps
     * them. But they are not the same problem: one is noise, the other is an
     * integration that will never record a payment and will retry forever.
     * Written down, the difference is one line in the log on go-live day
     * instead of a week of "why has nothing been marked paid".
     */
    payload.logger.warn(`Payment callback refused: ${verdict.why}`)
    // 401, not 200: this one really should be retried, and if it is somebody
    // forging messages they should learn nothing from the answer.
    return new Response('No.', { status: 401 })
  }

  const { reference, paid, settled, recognised, providerReference, minorAmount, currency, rawStatus } =
    verdict

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
       * Two rules here, and both of them exist to stop a guest being charged
       * twice.
       *
       * FIRST: a failure never overwrites a success. Gateways redeliver, and
       * they send lifecycle events out of order. Without the guard a stale
       * message landing after the capture turned a settled booking unpaid, and
       * the desk would have asked for money already taken.
       *
       * SECOND, and the one that bit harder: a message that is not a final
       * answer is written as `pending`, not as `failed`. Every non-success used
       * to be a failure — so an "authorized" arriving before its capture told
       * the guest their payment had failed, and the pass page helpfully offered
       * the Pay button again. They pay a second time, both settle, and the
       * hotel is refunding one of them and explaining the other.
       *
       * An unrecognised word counts as not final, deliberately. The two
       * mistakes are not equally expensive: a live payment called failed invites
       * a second charge, while a dead one called pending leaves a guest to ring
       * the hotel — recoverable, and visible in the admin panel. The log names
       * the word so the processor's own vocabulary can be added.
       */
      if (!recognised) {
        payload.logger.warn(
          `Payment for ${reference}: "${rawStatus}" is not a status this site knows as ` +
            `finished, so it is held as pending rather than failed. If the processor uses ` +
            `this word for a real failure, add it to PAYMENT_FAILED_STATUSES.`,
        )
      }

      const nextStatus = settled ? 'failed' : 'pending'
      const { rows } = await dbPool(payload).query<{ id: number }>(
        `UPDATE bookings
            SET payment_status = $5,
                payment_provider = $2,
                payment_status_raw = $3,
                payment_reference = COALESCE($4, payment_reference),
                updated_at = NOW()
          WHERE id = $1
            AND payment_status <> 'paid'
        RETURNING id`,
        [booking.id, provider.id, rawStatus ?? null, providerReference ?? null, nextStatus],
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
        // Guarded like the other two writes. A processor that reports the net
        // figure after its fee on a later "settled" event would otherwise walk
        // an already-paid booking back to failed, and the desk would ask a
        // guest to pay for a room they have paid for.
        await dbPool(payload).query(
          `UPDATE bookings
              SET payment_status = 'failed',
                  payment_status_raw = $2,
                  payment_provider = $3,
                  updated_at = NOW()
            WHERE id = $1
              AND payment_status <> 'paid'`,
          [
            booking.id,
            `underpaid: ${rawStatus ?? 'paid'} ${reported} ${currency}`,
            provider.id,
          ],
        )
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
