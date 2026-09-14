import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatPrice } from '@/utilities/format'
import { verifyReference } from '@/utilities/bookingToken'
import { cn } from '@/utilities/ui'
import { btnPrimary, btnOutline, shell } from '@/components/site/ui'

type Args = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v)?.trim() ?? ''

/**
 * Where a guest lands when they come back from the gateway.
 *
 * READS THE DATABASE. IT DOES NOT BELIEVE THE ADDRESS. The gateway sends the
 * guest here with something like `?status=success` on the end, and a guest can
 * type that themselves — so none of it is looked at. What is shown is whatever
 * the booking row says, and the only thing that writes to that row is the
 * gateway's own server calling /next/payments/webhook with a signature on it.
 *
 * That also makes this page right when it is slow. Card networks settle in
 * seconds but not always before the browser gets back, so a guest can easily
 * arrive here a moment before the webhook does. They are told the payment is
 * still going through and that the page will show it — which is true, and is
 * better than a thank-you that later turns out to be wrong.
 *
 * The one query parameter that is honoured is `problem`, and only to choose
 * which reassuring sentence to show. Every one of them says the same thing in
 * different words: the room is booked either way.
 */

export const dynamic = 'force-dynamic'

export default async function BookingPaidPage({ params, searchParams }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const t = getDictionary(locale)

  const sp = await searchParams
  const reference = one(sp.ref).toUpperCase()
  const token = one(sp.t)
  const problem = one(sp.problem)

  /**
   * The same signed link the rest of this booking's pages require.
   *
   * This page was written without it, and that was a hole rather than an
   * omission: it went on to *mint* a signature for whatever reference arrived
   * in the address bar and render it as a link to the full booking. Anyone who
   * knew a reference — they are six characters, and they are read down a
   * telephone — could have walked from here to a guest's name, telephone
   * number and dates. A page that hands out tokens has to check one first.
   */
  if (!reference || !verifyReference(reference, token)) notFound()

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'bookings',
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 0,
    locale,
    overrideAccess: true,
  })
  const booking = docs[0]
  if (!booking) notFound()

  const status = booking.paymentStatus ?? 'unpaid'
  const paid = status === 'paid'

  const amount =
    typeof booking.paymentAmount === 'number' && booking.paymentAmount > 0
      ? formatPrice(booking.paymentAmount, booking.paymentCurrency || booking.currency, locale)
      : null

  // What to say, in order of how sure we are. A settled payment beats
  // everything; after that a problem the guest was sent here with; then a
  // payment still in flight; then the plain unpaid case, which is what a guest
  // sees if they wander onto this page without having paid.
  const message = paid
    ? t.booking.paidLead
    : problem === 'cancelled'
      ? t.booking.payFailed
      : problem
        ? t.booking.payProblem
        : status === 'pending'
          ? t.booking.payPending
          : status === 'failed'
            ? t.booking.payFailed
            : t.booking.payAtHotelInstead

  // Echoes the token that was verified above rather than making a new one.
  const manageUrl = `/${locale}/booking/pass?ref=${encodeURIComponent(reference)}&t=${encodeURIComponent(token)}`

  return (
    <section className={cn(shell, 'py-16 sm:py-24')}>
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">{t.booking.reference}</p>
        <p className="font-display mt-3 text-3xl tracking-[0.08em] text-ink" dir="ltr">
          {reference}
        </p>

        <h1 className="font-display mt-8 text-3xl leading-tight text-balance text-ink sm:text-4xl">
          {paid ? t.booking.paidTitle : t.booking.doneTitle}
        </h1>

        <p className="mt-4 text-[1.05rem] leading-[1.7] text-muted-ink">{message}</p>

        {paid && amount && (
          <p className="mt-6 inline-flex items-baseline gap-2 rounded-full border border-line px-5 py-2">
            <span className="text-[0.8rem] tracking-[0.14em] text-muted-ink uppercase rtl:tracking-normal">
              {t.booking.paidLabel}
            </span>
            <span className="font-display text-xl text-ink">{amount}</span>
          </p>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={manageUrl} className={btnPrimary}>
            {t.booking.payBackToBooking}
          </Link>
          <Link href={`/${locale}`} className={btnOutline}>
            {t.errors.home}
          </Link>
        </div>
      </div>
    </section>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  // Never indexed: it names a booking reference and belongs to one guest.
  return {
    title: { absolute: t.booking.paidTitle },
    robots: { index: false, follow: false },
  }
}
