import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatNumber } from '@/utilities/format'
import { pointsBalance, pointsForStay, pointsHistory, pointsRate } from '@/utilities/points'
import { currentGuest, signOut } from '@/actions/account'
import { cn } from '@/utilities/ui'
import { SignInForm, SignUpForm } from '@/components/site/AccountForms'
import { PageHero } from '@/components/site/PageHero'
import { SectionHeading } from '@/components/site/SectionHeading'
import { btnOutline, sectionY, shell } from '@/components/site/ui'
import type { Branch, Room } from '@/payload-types'

type Args = { params: Promise<{ locale: string }> }

const day = (value?: string | null) => (value ? String(value).slice(0, 10) : '—')

export default async function AccountPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const t = getDictionary(locale)

  const guest = await currentGuest()

  // Signed out: the two forms, side by side, with no wall in front of either.
  if (!guest) {
    return (
      <>
        {/* Named for what a signed-out visitor can do here, not for what they
            would see if they were already signed in. "My bookings" over two
            empty forms is a page describing somebody else's screen. */}
        <PageHero title={t.account.gateTitle} lead={t.account.gateLead} />
        <section className={cn(shell, sectionY)}>
          <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="rounded-2xl border border-line bg-card p-7 sm:p-9">
              <h2 className="font-display text-2xl text-ink">{t.account.signIn}</h2>
              <p className="mt-2 text-sm text-muted-ink">{t.account.haveAccount}</p>
              <div className="mt-8">
                <SignInForm locale={locale} t={t} />
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-card p-7 sm:p-9">
              <h2 className="font-display text-2xl text-ink">{t.account.createTitle}</h2>
              <p className="mt-2 text-sm text-muted-ink">{t.account.createLead}</p>
              <div className="mt-8">
                <SignUpForm locale={locale} t={t} />
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  const payload = await getPayload({ config: configPromise })

  // Only ever this guest's own stays. The filter is on the session's id, not on
  // anything that arrived in the request, so there is no id to tamper with.
  const { docs: bookings } = await payload.find({
    collection: 'bookings',
    where: { guest: { equals: guest.id } },
    sort: '-checkIn',
    depth: 1,
    limit: 100,
    overrideAccess: true,
  })

  const [balance, history, rate] = await Promise.all([
    pointsBalance(payload, guest.id),
    pointsHistory(payload, guest.id),
    pointsRate(payload),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = bookings.filter((b) => day(b.checkIn) >= today && b.status !== 'cancelled')
  const past = bookings.filter((b) => day(b.checkIn) < today || b.status === 'cancelled')

  const Row = ({ booking }: { booking: (typeof bookings)[number] }) => {
    const branch = typeof booking.branch === 'object' ? (booking.branch as Branch) : null
    const room = typeof booking.room === 'object' ? (booking.room as Room) : null

    // What this stay is worth, and whether it has paid out yet. A guest looking
    // at a booking should not have to work out why the balance has not moved.
    const willEarn =
      rate.enabled && booking.currency === 'IQD' && booking.totalAmount
        ? pointsForStay(booking.totalAmount, rate.perThousand)
        : 0
    const earned = booking.status === 'completed'
    const cancelled = booking.status === 'cancelled'

    return (
      <li className="flex flex-wrap items-start justify-between gap-5 rounded-2xl border border-line bg-card p-6">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-ink">{branch?.name ?? '—'}</h3>
          <p className="mt-1.5 text-[0.9rem] text-muted-ink">{room?.name ?? '—'}</p>
          <p className="mt-3 text-[0.9rem] text-ink" dir="ltr">
            {day(booking.checkIn)} → {day(booking.checkOut)}
          </p>
        </div>
        <div className="text-end">
          <p className="font-display text-lg tracking-wide text-brand" dir="ltr">
            {booking.reference}
          </p>
          <p className="mt-1 text-[0.8rem] text-muted-ink">
            {booking.nights ? `${formatNumber(booking.nights, locale)} ${t.booking.nights}` : ''}
          </p>
          {willEarn > 0 && !cancelled && (
            <p
              className={cn(
                'mt-2 text-[0.8rem]',
                earned ? 'font-semibold text-brand' : 'text-muted-ink',
              )}
            >
              {earned ? '+' : ''}
              {formatNumber(willEarn, locale)} {t.account.points.toLowerCase()}
              {earned ? '' : ` · ${t.account.pending}`}
            </p>
          )}
        </div>
      </li>
    )
  }

  return (
    <>
      <PageHero title={guest.name ?? t.account.myBookings} lead={guest.email} />

      <section className={cn(shell, sectionY)}>
        <div className="mx-auto max-w-3xl">
          {/* The balance, and the honest caveat under it: points arrive after
              the stay, not after the booking. */}
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-line bg-sand p-7">
            <div>
              <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted-ink uppercase rtl:tracking-normal">
                {t.account.points}
              </p>
              <p className="font-display mt-1 text-4xl text-ink">{formatNumber(balance, locale)}</p>
              <p className="mt-2 text-[0.85rem] text-muted-ink">{t.account.pointsLead}</p>
            </div>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className={btnOutline}>
                {t.account.signOut}
              </button>
            </form>
          </div>

          {bookings.length === 0 ? (
            <p className="mt-12 rounded-2xl border border-dashed border-line p-10 text-center text-muted-ink">
              {t.account.noBookings}
            </p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mt-14">
                  <SectionHeading title={t.account.upcoming} align="start" className="mb-6" />
                  <ul className="grid gap-4">
                    {upcoming.map((booking) => (
                      <Row key={booking.id} booking={booking} />
                    ))}
                  </ul>
                </div>
              )}
              {past.length > 0 && (
                <div className="mt-14">
                  <SectionHeading title={t.account.past} align="start" className="mb-6" />
                  <ul className="grid gap-4">
                    {past.map((booking) => (
                      <Row key={booking.id} booking={booking} />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* The statement behind the number. A balance nobody can audit is a
              number a guest has to take on trust, and the first time it looks
              wrong to them there is nothing either side can point at. */}
          {rate.enabled && (
            <div className="mt-14">
              <SectionHeading title={t.account.history} align="start" className="mb-6" />
              {history.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line p-8 text-center text-[0.95rem] text-muted-ink">
                  {t.account.noHistory}
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
                  {history.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-5 px-6 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[0.95rem] text-ink">{entry.reason}</p>
                        <p className="mt-0.5 text-[0.8rem] text-muted-ink" dir="ltr">
                          {entry.createdAt.slice(0, 10)}
                        </p>
                      </div>
                      <p
                        className={cn(
                          'font-display shrink-0 text-lg',
                          entry.points >= 0 ? 'text-brand' : 'text-muted-ink',
                        )}
                        dir="ltr"
                      >
                        {entry.points >= 0 ? '+' : ''}
                        {formatNumber(entry.points, locale)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  // Somebody's own bookings are nobody's search result.
  return { title: t.account.myBookings, robots: { index: false, follow: false } }
}
