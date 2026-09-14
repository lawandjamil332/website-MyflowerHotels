import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import configPromise from '@payload-config'
import { isLocale, defaultLocale, type Locale } from '@/i18n/config'
import { getSettings } from '@/utilities/getSettings'
import { getServerSideURL } from '@/utilities/getURL'
import { verifyReference } from '@/utilities/bookingToken'
import { activeProvider, amountToCharge, paymentsLive, toMinorUnits } from '@/payments'

/**
 * Sends a guest to the gateway's payment page.
 *
 * Reached from the Pay button on a guest's own booking. Everything that decides
 * what is charged is worked out here, on the server, from the booking row —
 * never from the request. A price that arrives in a form field is a price the
 * guest chose, and the oldest trick against a payment page is to send it a
 * smaller one.
 *
 * WHO IS ALLOWED. The same signed link the confirmation email already uses:
 * a reference plus a token that only this site can produce. A reference alone
 * is six characters and readable down a telephone, so it is never enough on its
 * own — that is why the manage-booking form also asks for a phone number, and
 * why this asks for a signature instead.
 */

export const dynamic = 'force-dynamic'

const back = (locale: Locale, reference: string, why: string) =>
  NextResponse.redirect(
    `${getServerSideURL()}/${locale}/booking/paid?ref=${encodeURIComponent(reference)}&problem=${encodeURIComponent(why)}`,
    303,
  )

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url)
  const reference = (url.searchParams.get('ref') || '').trim().toUpperCase()
  const token = (url.searchParams.get('t') || '').trim()
  const rawLocale = url.searchParams.get('locale') || defaultLocale
  const locale = (isLocale(rawLocale) ? rawLocale : defaultLocale) as Locale

  if (!reference || !verifyReference(reference, token)) {
    return new Response('No.', { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const settings = await getSettings(locale)

  if (!paymentsLive(settings)) {
    return back(locale, reference, 'off')
  }

  const provider = activeProvider()
  if (!provider) return back(locale, reference, 'off')

  const { docs } = await payload.find({
    collection: 'bookings',
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const booking = docs[0]
  if (!booking) return back(locale, reference, 'missing')

  // Nothing is charged twice. A guest who presses Pay on a booking that is
  // already settled is shown the receipt rather than a second card form.
  if (booking.paymentStatus === 'paid') {
    return NextResponse.redirect(
      `${getServerSideURL()}/${locale}/booking/paid?ref=${encodeURIComponent(reference)}`,
      303,
    )
  }
  if (booking.status === 'cancelled') return back(locale, reference, 'cancelled')

  const total = Number(booking.totalAmount)
  const currency = String(booking.currency || 'IQD').toUpperCase()
  if (!Number.isFinite(total) || total <= 0) return back(locale, reference, 'amount')

  // The deposit, if the hotel asks for one, worked out from the stored total.
  const charge = amountToCharge(total, settings.onlinePayments?.depositPercent)
  const minor = toMinorUnits(charge, currency)
  if (!minor.ok) {
    // The likeliest reason by far is the dinar exponent not having been
    // confirmed with the processor yet, which money.ts refuses to guess at.
    payload.logger.error(`Payment for ${reference} not started: ${minor.why}`)
    return back(locale, reference, 'config')
  }

  const base = getServerSideURL().replace(/\/$/, '')
  const started = await provider.start({
    reference,
    minorAmount: minor.minor,
    currency,
    guestName: String(booking.guestName || ''),
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    locale,
    description: `My Flower Hotels — booking ${reference}`,
    returnUrl: `${base}/${locale}/booking/paid?ref=${encodeURIComponent(reference)}`,
    cancelUrl: `${base}/${locale}/booking/paid?ref=${encodeURIComponent(reference)}&problem=cancelled`,
    webhookUrl: `${base}/next/payments/webhook`,
  })

  if (!started.ok) {
    payload.logger.error(`Payment for ${reference} not started: ${started.why}`)
    return back(locale, reference, 'gateway')
  }

  /**
   * Marked pending before the guest leaves, not after they come back.
   *
   * If the site crashed at this exact moment the booking would read "payment
   * started" and no money would have moved, which is a state somebody can look
   * at and resolve. The other order — send them to pay, record it afterwards —
   * loses the record of any payment where the guest closes the tab, and those
   * are the ones that turn into an argument at the desk.
   */
  try {
    await payload.update({
      collection: 'bookings',
      id: booking.id,
      data: {
        paymentStatus: 'pending',
        paymentProvider: provider.id,
        paymentCurrency: currency,
        paymentAmount: charge,
        ...(started.providerReference ? { paymentReference: started.providerReference } : {}),
      },
      overrideAccess: true,
      context: { skipPaymentGuard: true },
    })
  } catch (error) {
    // Not fatal. The webhook is what actually settles this, and it can find the
    // booking by reference whether or not this write landed.
    payload.logger.warn(`Payment for ${reference}: could not mark pending — ${error}`)
  }

  return NextResponse.redirect(started.redirectUrl, 303)
}
