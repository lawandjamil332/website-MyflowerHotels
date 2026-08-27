import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches, getAllRooms } from '@/utilities/branches'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { cn } from '@/utilities/ui'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import { RoomCard } from '@/components/site/RoomCard'
import { BreadcrumbSchema, RoomListSchema } from '@/components/site/StructuredData'
import { shell } from '@/components/site/ui'
import type { Branch, Room } from '@/payload-types'

type Args = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v)?.trim() ?? ''

/**
 * Every room in the group in one place, filtered.
 *
 * The site could show rooms only from inside a hotel, which assumes the guest
 * has already chosen one. Plenty arrive the other way round — two adults, a
 * king bed, whichever address has it — and had no way to ask that question.
 *
 * Filters are plain links carrying query parameters, so the page works with no
 * JavaScript, every combination is a shareable URL, and the back button
 * behaves.
 */
export default async function RoomsPage({ params, searchParams }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const sp = await searchParams

  const t = getDictionary(locale)
  const [rooms, branches] = await Promise.all([getAllRooms(locale), getBranches(locale)])

  const hotel = one(sp.hotel)
  const guests = Number(one(sp.guests)) || 0
  const bed = one(sp.bed)
  // Free text. Trimmed, folded to lower case and capped, so a pasted essay
  // cannot become a page title or a thousand-character filter chip.
  const q = (one(sp.q) ?? '').trim().slice(0, 80)
  const needle = q.toLocaleLowerCase(locale === 'en' ? 'en' : undefined)

  /**
   * Everything about a room that a person might type.
   *
   * Its name, its hotel, its bed, its neighbourhood and what is in it — all
   * in the language being read, because a guest reading Arabic searches in
   * Arabic and matching only the English would answer nothing.
   */
  const haystack = (room: Room, branch: Branch | null): string =>
    [
      room.name,
      branch?.name,
      branch?.neighbourhood,
      room.bedType ? t.bed[room.bedType as keyof typeof t.bed] : null,
      ...(room.amenities ?? []).map((a) => t.amenity[a] ?? a),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase(locale === 'en' ? 'en' : undefined)

  const filtered = rooms.filter((room) => {
    const branch = typeof room.branch === 'object' ? (room.branch as Branch) : null
    if (hotel && branch?.slug !== hotel) return false
    if (guests && (room.maxGuests ?? 0) < guests) return false
    if (bed && room.bedType !== bed) return false
    // Every word has to appear somewhere, in any order — "double citadel"
    // finds a double room at the hotel near the Citadel, which is how people
    // actually type. Matching the whole phrase would find nothing.
    if (needle) {
      const hay = haystack(room, branch)
      if (!needle.split(/\s+/).every((word) => hay.includes(word))) return false
    }
    return true
  })

  // A filter link keeps whatever else is already chosen, and clears its own
  // value when it is the one already active.
  const linkTo = (key: string, value: string) => {
    const next = new URLSearchParams()
    if (hotel) next.set('hotel', hotel)
    if (guests) next.set('guests', String(guests))
    if (bed) next.set('bed', bed)
    if (q) next.set('q', q)
    if (next.get(key) === value) next.delete(key)
    else next.set(key, value)
    const query = next.toString()
    return `/${locale}/rooms${query ? `?${query}` : ''}`
  }

  const chip = (active: boolean) =>
    cn(
      'inline-block border px-4 py-2 text-[0.65rem] tracking-[0.16em] uppercase transition-colors duration-500 ease-luxe rtl:tracking-normal',
      active
        ? 'border-ink bg-ink text-bone'
        : 'border-line text-muted-ink hover:border-ink hover:text-ink',
    )

  // In the order the hotels are published, so the page does not reshuffle
  // itself when a filter is applied. A hotel with nothing matching drops out
  // rather than showing an empty heading.
  const grouped = branches
    .map((branch) => ({
      branch,
      rooms: filtered.filter((room) => {
        const b = typeof room.branch === 'object' ? (room.branch as Branch) : null
        return b?.id === branch.id
      }),
    }))
    .filter((group) => group.rooms.length > 0)

  const heroSource = branches[0]?.heroImage
  const beds: Array<keyof typeof t.bed> = ['single', 'double', 'twin', 'king', 'suite']
  const anyFilter = Boolean(hotel || guests || bed || q)

  return (
    <>
      <RoomListSchema rooms={filtered} locale={locale} name={t.roomsPage.title} />
      <BreadcrumbSchema locale={locale} trail={[{ name: t.nav.rooms }]} />
      <PageHero
        eyebrow={t.roomsPage.eyebrow}
        title={t.roomsPage.title}
        lead={t.roomsPage.lead}
        imageUrl={mediaUrl(heroSource, 'xlarge')}
        imageAlt={mediaAlt(heroSource)}
      />

      <section className={cn(shell, 'py-14 sm:py-20')}>
        <div className="border-y border-line py-7">
          <div className="flex flex-col gap-6">
            {/* A plain form, submitted by the browser. No JavaScript, no state,
                and the result is a shareable URL like every other filter here
                — which is also what lets the site truthfully declare a search
                action to Google. The hidden inputs carry whatever else is
                already chosen, so searching inside a filtered view keeps the
                filter instead of silently dropping it. */}
            <form
              action={`/${locale}/rooms`}
              method="get"
              className="flex flex-wrap items-center gap-3"
              role="search"
            >
              {hotel && <input type="hidden" name="hotel" value={hotel} />}
              {guests > 0 && <input type="hidden" name="guests" value={String(guests)} />}
              {bed && <input type="hidden" name="bed" value={bed} />}
              <label
                htmlFor="room-search"
                className="me-2 text-[0.58rem] tracking-[0.2em] text-muted-ink uppercase rtl:tracking-normal"
              >
                {t.roomsPage.search}
              </label>
              {/* 16px minimum, or iOS zooms the page on focus and does not
                  zoom back out. */}
              <input
                id="room-search"
                type="search"
                name="q"
                defaultValue={q}
                maxLength={80}
                placeholder={t.roomsPage.searchPlaceholder}
                className="min-w-0 flex-1 border border-line bg-transparent px-4 py-2 text-base text-ink placeholder:text-muted-ink/70 focus:border-ink focus:outline-none sm:max-w-xs"
              />
              <button type="submit" className={chip(false)}>
                {t.roomsPage.apply}
              </button>
            </form>

            {branches.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="me-2 text-[0.58rem] tracking-[0.2em] text-muted-ink uppercase rtl:tracking-normal">
                  {t.roomsPage.filterHotel}
                </span>
                {branches.map((b) => (
                  <Link key={b.id} href={linkTo('hotel', b.slug)} className={chip(hotel === b.slug)}>
                    {b.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className="me-2 text-[0.58rem] tracking-[0.2em] text-muted-ink uppercase rtl:tracking-normal">
                {t.roomsPage.filterGuests}
              </span>
              {[1, 2, 3, 4].map((n) => (
                <Link key={n} href={linkTo('guests', String(n))} className={chip(guests === n)}>
                  {n}
                  {n === 4 ? '+' : ''}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="me-2 text-[0.58rem] tracking-[0.2em] text-muted-ink uppercase rtl:tracking-normal">
                {t.roomsPage.filterBed}
              </span>
              {beds.map((b) => (
                <Link key={b} href={linkTo('bed', b)} className={chip(bed === b)}>
                  {t.bed[b]}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
            <p className="text-sm text-muted-ink">
              <span className="font-display text-xl text-ink">{filtered.length}</span>{' '}
              {t.roomsPage.results}
            </p>
            {anyFilter && (
              <Link
                href={`/${locale}/rooms`}
                className="link-line text-[0.65rem] tracking-[0.18em] text-ink uppercase rtl:tracking-normal"
              >
                {t.roomsPage.clear}
              </Link>
            )}
          </div>
        </div>

        {/* Grouped under the hotel each room belongs to, the way the search
            results already are. Eighteen cards in one grid, each repeating its
            hotel's name in small type, was a pile — and it left the page with
            no headings at all, on the page that carries more links than any
            other on the site. The hotel name doubles as the way through to
            the hotel. */}
        {grouped.length > 0 ? (
          <div className="mt-14 space-y-20">
            {grouped.map(({ branch, rooms: group }, gi) => (
              <div key={branch.id}>
                <h2 className="font-display border-b border-line pb-4 text-2xl text-ink">
                  <Link
                    href={`/${locale}/branches/${branch.slug}`}
                    className="link-line tap-safe hover:text-brand"
                  >
                    {branch.name}
                  </Link>
                </h2>
                <div className="mt-10 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((room, i) => (
                    <Reveal key={room.id} delay={(i % 3) * 90}>
                      <RoomCard
                        room={room}
                        locale={locale}
                        t={t}
                        priority={gi === 0 && i < 3}
                      />
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-14 max-w-md text-muted-ink">{t.roomsPage.none}</p>
        )}
      </section>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  // Neither the title nor the lead said where any of these rooms are, so the
  // one page listing every room in the group was invisible to anybody
  // searching for a room in the city it is in.
  return {
    title: `${t.roomsPage.title} — ${t.seo.hotelsIn} ${t.seo.locality}`,
    description: `${t.roomsPage.lead} ${t.seo.hotelsIn} ${t.seo.locality}. ${t.seo.bookDirect}.`,
  }
}
