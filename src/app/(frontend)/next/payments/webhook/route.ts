import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { dbPool } from '@/utilities/db'
import { activeProvider, fromMinorUnits } from '@/payments'

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
 * ALWAYS ANSWERS 200 ONCE THE SIGNATURE IS GOOD. Gateways retry anything that
 * is not a 2xx, sometimes for days, and a retry storm caused by our own bug is
 * worse than a payment that needs looking at by hand. A message that is signed
 * but that we cannot act on is logged loudly and acknowledged — refusing it
 * would not make it correct, it would only make it arrive again.
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
      // A failure is recorded and nothing else changes. The room was never
      // taken out of stock by the payment, so there is nothing to give back.
      await payload.update({
        collection: 'bookings',
        id: booking.id,
        data: {
          paymentStatus: 'failed',
          paymentStatusRaw: rawStatus ?? null,
          paymentProvider: provider.id,
          ...(providerReference ? { paymentReference: providerReference } : {}),
        },
        overrideAccess: true,
      })
      payload.logger.info(`Payment for ${reference} did not go through (${rawStatus}).`)
      return Response.json({ ok: true })
    }

    /**
     * Does the money match what was asked for?
     *
     * Checked against the amount recorded when the payment was started, which
     * is itself derived from the booking rather than from anything a guest
     * sent. Under-payment is refused rather than accepted quietly: a room
     * marked paid for less than it costs is a loss nobody will notice until
     * the month is reconciled.
     *
     * A gateway that reports no amount at all is trusted on this point, because
     * some do not send one and refusing them would break the integration for a
     * check they cannot satisfy.
     */
    if (typeof minorAmount === 'number' && currency) {
      const reported = fromMinorUnits(minorAmount, currency)
      const expected = Number(booking.paymentAmount ?? booking.totalAmount)
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
    // Signed, believable, and something here failed. Answer 200 so the gateway
    // stops retrying, and shout — this is the case that needs a person.
    payload.logger.error(`Payment callback for ${reference} could not be applied: ${error}`)
    return Response.json({ ok: true, noted: 'logged for review' })
  }
}

/** Some processors check the address with a GET before sending anything to it. */
export async function GET(): Promise<Response> {
  return Response.json({ ok: true, endpoint: 'payments/webhook' })
}
