import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches } from '@/utilities/branches'
import { availableRoomsAcross, nightsBetween, type AvailableRoom } from '@/utilities/booking'
import { formatNumber } from '@/utilities/format'
import { Price } from '@/components/site/Currency'
import { cn } from '@/utilities/ui'
import { BookingForm } from '@/components/site/BookingForm'
import { StayFinder } from '@/components/site/StayFinder'
import { PageHero } from '@/components/site/PageHero'
import { SectionHeading } from '@/components/site/SectionHeading'
import { btnOutline, btnPrimary, sectionY, shell } from '@/components/site/ui'

type Args = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const one = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '')

/** Accepts only a plain YYYY-MM-DD, so nothing odd reaches the date maths. */
const parseDay = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export default async function BookPage({ params, searchParams }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const query = await searchParams

  const t = getDictionary(locale)
  const branches = await getBranches(locale)

  const hotelSlug = one(query.hotel)
  const branch = branches.find((b) => b.slug === hotelSlug) ?? null
  const checkInRaw = one(query.checkIn)
  const checkOutRaw = one(query.checkOut)
  const checkIn = parseDay(checkInRaw)
  const checkOut = parseDay(checkOutRaw)
  const guestsRaw = Number(one(query.guests))
  const guests = Number.isFinite(guestsRaw) && guestsRaw > 0 ? guestsRaw : null
  const chosenRoomId = Number(one(query.room))

  // A search needs two sensible dates. It does not need a hotel: a guest who
  // has not been to Erbil before has no way to pick one yet, and "Any hotel"
  // says on the tin that they need not. Without dates there is nothing to
  // answer, so the finder is shown again rather than guessed at.
  const searchable = Boolean(checkIn && checkOut && checkOut > checkIn)

  // One hotel if they named one, otherwise every hotel taking guests. A hotel
  // still being built has nothing to sell and would only be a dead heading.
  const open = branches.filter((b) => b.status !== 'openingSoon')
  const targets = branch ? [branch] : open
  const groupSearch = !branch

  let rooms: AvailableRoom[] = []
  let hotelHasRooms = true
  if (searchable) {
    const payload = await getPayload({ config: configPromise })
    rooms = await availableRoomsAcross(payload, {
      branchIds: targets.map((b) => b.id),
      checkIn: checkIn!,
      checkOut: checkOut!,
      guests,
      locale,
    })

    // Nothing free and nothing to be free: until the room types are entered,
    // "try different nights" is advice that cannot work. Worth one extra query
    // only when a search came back empty.
    if (rooms.length === 0 && targets.length > 0) {
      const { totalDocs } = await payload.count({
        collection: 'rooms',
        where: { branch: { in: targets.map((b) => b.id) } },
      })
      hotelHasRooms = totalDocs > 0
    }
  }

  const nights = searchable ? nightsBetween(checkIn!, checkOut!) : 0
  const chosen = rooms.find((room) => room.id === chosenRoomId) ?? null
  const total = chosen?.priceFrom ? chosen.priceFrom * nights : null

  // Which hotel the guest is actually booking into. When they searched the
  // whole group there is no hotel in the URL, so it comes from the room they
  // pressed — the room knows, and the room is the thing they chose.
  const chosenBranch = chosen ? (branches.find((b) => b.id === chosen.branchId) ?? branch) : branch

  const back =
    `/${locale}/book?checkIn=${checkInRaw}&checkOut=${checkOutRaw}` +
    (hotelSlug ? `&hotel=${hotelSlug}` : '') +
    (guests ? `&guests=${guests}` : '')

  const byHotel = targets
    .map((b) => ({ hotel: b, rooms: rooms.filter((r) => r.branchId === b.id) }))
    .filter((group) => group.rooms.length > 0)

  return (
    <>
      <PageHero
        title={chosenBranch ? chosenBranch.name : t.search.title}
        lead={
          searchable ? `${checkInRaw} → ${checkOutRaw} · ${nights} ${t.booking.nights}` : undefined
        }
      />

      <section className={cn(shell, sectionY)}>
        {!searchable ? (
          // Arriving here from "Reserve" with nothing chosen yet: ask the
          // question rather than sending them back to the homepage to be asked
          // it there.
          <div className="mx-auto max-w-4xl">
            <SectionHeading title={t.search.title} lead={t.booking.lead} className="mb-10" />
            <StayFinder
              hotels={branches.map((b) => ({
                slug: b.slug,
                name: b.name,
                openingSoon: b.status === 'openingSoon',
              }))}
              locale={locale}
              t={t}
              className="shadow-none ring-1 ring-line"
            />
          </div>
        ) : chosen ? (
          <div className="mx-auto max-w-3xl">
            {/* What they are about to book, restated. Nobody should have to
                scroll back to check which room they pressed. */}
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl text-ink sm:text-3xl">{chosen.name}</h1>
                <p className="mt-1.5 text-[0.95rem] text-muted-ink">
                  {chosenBranch?.name} · {checkInRaw} → {checkOutRaw}
                </p>
              </div>
              <Link href={back} className="link-line tap-safe text-sm text-brand">
                {t.booking.changeDates}
              </Link>
            </div>

            {total !== null && (
              <p className="mb-8 flex items-baseline gap-3 border-y border-line py-5">
                <span className="text-[0.72rem] font-semibold tracking-[0.16em] text-muted-ink uppercase rtl:tracking-normal">
                  {t.booking.total}
                </span>
                <Price
                  amount={total}
                  currency={chosen.currency}
                  locale={locale}
                  className="font-display text-3xl text-ink"
                />
                <span className="text-sm text-muted-ink">
                  · {nights} {t.booking.nights}
                </span>
              </p>
            )}

            <BookingForm
              locale={locale}
              room={chosen}
              branchId={chosen.branchId}
              checkIn={checkInRaw}
              checkOut={checkOutRaw}
              guests={guests}
              nights={nights}
              total={total}
              t={t}
            />
          </div>
        ) : (
          <>
            <SectionHeading
              title={t.booking.title}
              lead={t.booking.lead}
              className="mb-12 lg:mb-16"
            />

            {rooms.length === 0 ? (
              <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-line p-10 text-center">
                <p className="text-[1.02rem] leading-relaxed text-muted-ink">
                  {hotelHasRooms ? t.booking.none : t.booking.noRoomsYet}
                </p>
                <Link
                  href={
                    hotelHasRooms
                      ? `/${locale}`
                      : `/${locale}/${branch ? `branches/${branch.slug}` : 'contact'}#enquire`
                  }
                  className={cn(btnOutline, 'mt-7')}
                >
                  {hotelHasRooms ? t.booking.changeDates : t.branch.enquire}
                </Link>
              </div>
            ) : (
              // Grouped under their hotels when the whole group was searched.
              // A flat list of a dozen rooms across four buildings is not a
              // result, it is a pile — the hotel is the first thing a guest
              // chooses between, so it has to be the thing they see.
              <div className="mx-auto grid max-w-4xl gap-12">
                {byHotel.map(({ hotel, rooms: hotelRooms }) => (
                  <div key={hotel.id}>
                    {groupSearch && (
                      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="font-display text-2xl text-ink">{hotel.name}</h2>
                        <Link
                          href={`/${locale}/branches/${hotel.slug}`}
                          className="link-line tap-safe text-sm text-brand"
                        >
                          {t.common.viewDetails}
                        </Link>
                      </div>
                    )}
                    <ul className="grid gap-4">
                      {hotelRooms.map((room) => (
                        <li
                          key={room.id}
                          className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-line bg-card p-6 sm:p-7"
                        >
                          <div className="min-w-0">
                            <h3 className="font-display text-xl leading-tight text-ink sm:text-2xl">
                              {room.name}
                            </h3>
                            <p className="mt-2 text-[0.85rem] text-muted-ink">
                              {[
                                room.maxGuests
                                  ? `${t.room.guests} ${formatNumber(room.maxGuests, locale)}`
                                  : null,
                                room.bedType
                                  ? (t.bed[room.bedType as keyof typeof t.bed] ?? room.bedType)
                                  : null,
                                `${formatNumber(room.left, locale)} ${t.booking.roomsLeft}`,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-5">
                            {room.priceFrom ? (
                              <p className="flex items-baseline gap-2">
                                <Price
                                  amount={room.priceFrom * nights}
                                  currency={room.currency}
                                  locale={locale}
                                  className="font-display text-2xl text-ink"
                                />
                                <span className="text-xs text-muted-ink">
                                  {nights} {t.booking.nights}
                                </span>
                              </p>
                            ) : null}
                            <Link href={`${back}&room=${room.id}`} className={btnPrimary}>
                              {t.booking.reserve}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  // A booking in progress is nobody's search result.
  return { title: t.booking.title, robots: { index: false, follow: false } }
}
