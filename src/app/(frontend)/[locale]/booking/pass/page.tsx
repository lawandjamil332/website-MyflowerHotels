import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { verifyReference } from '@/utilities/bookingToken'
import { formatDateLong, formatNumber, formatPrice } from '@/utilities/format'
import { toMapsHref, toTelHref, toWhatsAppHref, whatsappMessage } from '@/utilities/contact'
import { SITE_NAME } from '@/utilities/site'
import { cn } from '@/utilities/ui'
import { btnPrimary, btnSmall, shell } from '@/components/site/ui'
import { PrintButton } from '@/components/site/PrintButton'
import type { Branch, Room } from '@/payload-types'

type Args = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v)?.trim() ?? ''

/**
 * The confirmation, as a thing that can be printed and shown.
 *
 * The London hotel that started this sent a PDF, and the reason a PDF felt
 * substantial is not the file format — it is having one page holding
 * everything, that survives being saved, forwarded and handed across a desk.
 * A print-ready page does that without a rendering engine on the server, and
 * on a phone "Save as PDF" is already in the share sheet, so the guest ends up
 * with the same file by their own route.
 *
 * Reached only from the link in the confirmation email, which carries a
 * signature over the reference — see bookingToken. Never indexed.
 */
export default async function BookingPassPage({ params, searchParams }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const sp = await searchParams
  const reference = one(sp.ref).toUpperCase()
  const token = one(sp.t)

  if (!verifyReference(reference, token)) notFound()

  const t = getDictionary(locale)
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'bookings',
    where: { reference: { equals: reference } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  const booking = docs[0]
  if (!booking) notFound()

  const branchId = typeof booking.branch === 'object' ? booking.branch?.id : booking.branch
  const roomId = typeof booking.room === 'object' ? booking.room?.id : booking.room
  const [branch, room] = await Promise.all([
    branchId
      ? (payload
          .findByID({
            collection: 'branches',
            id: branchId,
            locale,
            depth: 0,
            overrideAccess: true,
          })
          .catch(() => null) as Promise<Branch | null>)
      : null,
    roomId
      ? (payload
          .findByID({ collection: 'rooms', id: roomId, locale, depth: 0, overrideAccess: true })
          .catch(() => null) as Promise<Room | null>)
      : null,
  ])

  const cancelled = booking.status === 'cancelled'
  const arriving = formatDateLong(booking.checkIn, locale)
  const leaving = formatDateLong(booking.checkOut, locale)
  const total = formatPrice(Number(booking.totalAmount) || null, booking.currency, locale)
  const rate = formatPrice(Number(room?.priceFrom) || null, booking.currency, locale)
  const maps = toMapsHref(branch?.googleMapsUrl, branch?.latitude, branch?.longitude)
  const wa = toWhatsAppHref(
    branch?.whatsapp,
    whatsappMessage(t, { siteName: SITE_NAME, hotel: branch?.name, reference }),
  )
  const tel = toTelHref(branch?.phone)

  // `ltr` for values that are not prose. A telephone number set in Arabic or
  // Kurdish is reordered by the bidi algorithm — "+964 750 111 2222" printed
  // as "2222 111 750 964+", with the plus on the wrong end — on the one
  // document a guest hands to a front desk. Isolating the run fixes it without
  // disturbing the line it sits on.
  const line = (label: string, value?: string | null, ltr = false) =>
    value ? (
      <div className="flex gap-4 border-b border-line py-3 last:border-0">
        <dt className="w-[38%] shrink-0 text-[0.78rem] text-muted-ink">{label}</dt>
        <dd className="text-[0.95rem] text-ink">
          {ltr ? (
            <span dir="ltr" className="inline-block">
              {value}
            </span>
          ) : (
            value
          )}
        </dd>
      </div>
    ) : null

  return (
    <section className={cn(shell, 'py-10 sm:py-14 print:py-0')}>
      <div className="mx-auto max-w-2xl">
        {/* Screen only: the two things somebody does with this page.

            Saving it comes first and looks like a button, because the whole
            point of this page is to become a file the guest can show at the
            desk — and without something to press, guests were screenshotting
            it instead. The browser's print dialog is what turns it into a PDF,
            and it is also the only thing in the stack that lays Arabic and
            Kurdish out correctly. */}
        <div className="mb-8 flex flex-wrap items-center gap-4 print:hidden">
          <PrintButton label={t.booking.savePdf} className={cn(btnPrimary, btnSmall, 'tap-safe')} />
          <Link
            href={`/${locale}/booking`}
            className="link-line tap-safe text-sm text-muted-ink hover:text-ink"
          >
            {t.booking.manageTitle}
          </Link>
        </div>

        <article className="border border-line bg-card p-7 sm:p-10 print:border-0 print:p-0">
          <header className="border-b border-line pb-7 text-center">
            <p className="font-display text-2xl tracking-[0.28em] text-ink uppercase rtl:tracking-normal">
              My Flower Hotels
            </p>
            <p className="mt-2 text-[0.62rem] tracking-[0.22em] text-brand uppercase rtl:tracking-normal">
              {cancelled ? t.email.cxEyebrow : t.email.confirmEyebrow}
            </p>
          </header>

          <div className="mt-8 border border-line bg-sand px-6 py-7 text-center">
            <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-muted-ink uppercase rtl:tracking-normal">
              {t.email.refLabel}
            </p>
            <p
              dir="ltr"
              className="font-display mt-2 text-4xl tracking-[0.12em] text-ink sm:text-5xl"
            >
              {booking.reference}
            </p>
          </div>

          {cancelled && (
            <p className="mt-6 border border-line bg-sand px-5 py-4 text-center text-[0.95rem] text-ink">
              {t.email.cxTitle}
            </p>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="border border-line p-5">
              <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-brand uppercase rtl:tracking-normal">
                {t.email.lArriving}
              </p>
              <p className="font-display mt-2 text-lg leading-snug text-ink">{arriving}</p>
              {(branch?.checkInAnyTime || branch?.checkInTime) && (
                <p className="mt-1 text-[0.8rem] text-muted-ink">
                  {branch.checkInAnyTime
                    ? t.email.checkInAny
                    : `${t.email.lCheckIn} ${branch.checkInTime}`}
                </p>
              )}
            </div>
            <div className="border border-line p-5">
              <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-brand uppercase rtl:tracking-normal">
                {t.email.lLeaving}
              </p>
              <p className="font-display mt-2 text-lg leading-snug text-ink">{leaving}</p>
              {branch?.checkOutTime && (
                <p className="mt-1 text-[0.8rem] text-muted-ink">
                  {t.email.lCheckOut} {branch.checkOutTime}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-8">
            {line(t.email.lHotel, branch?.name)}
            {line(t.email.lRoom, room?.name)}
            {line(t.email.lName, booking.guestName)}
            {line(t.email.lPhone, booking.guestPhone, true)}
            {line(
              t.email.lGuests,
              booking.guests ? formatNumber(Number(booking.guests), locale) : null,
            )}
            {line(
              t.email.lNights,
              booking.nights ? formatNumber(Number(booking.nights), locale) : null,
            )}
            {line(t.email.lRate, rate)}
            {line(t.email.lTotal, total ? `${total} · ${t.email.payAtHotel}` : null)}
            {line(t.email.lAddress, branch?.address)}
            {/* The hotel's own number, as text rather than only as a button.
                It was screen-only, on the reasoning that a link on paper is
                dead ink — true of the button, not of the number. This document
                is what a guest opens standing at an airport at two in the
                morning, and the one thing they want from it then is the number
                of the hotel expecting them. */}
            {line(t.email.lHotelPhone, branch?.phone, true)}
            {line(t.email.lNotes, booking.notes)}
          </dl>

          {!cancelled && (
            <p className="mt-8 border-t border-line pt-6 text-[0.9rem] leading-relaxed text-ink-soft">
              {t.email.deskNotice}
            </p>
          )}
        </article>

        {/* Screen only: acting on it. On paper these are dead ink. */}
        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          {tel && (
            <a
              href={tel}
              dir="ltr"
              className="border border-line px-5 py-3 text-sm text-ink hover:border-ink"
            >
              {branch?.phone}
            </a>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-line px-5 py-3 text-sm text-ink hover:border-ink"
            >
              {t.common.whatsapp}
            </a>
          )}
          {maps && (
            <a
              href={maps}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-line px-5 py-3 text-sm text-ink hover:border-ink"
            >
              {t.email.btnDirections}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  // Never indexed: it is one guest's booking, reachable only from their email.
  return { title: t.email.confirmEyebrow, robots: { index: false, follow: false } }
}
