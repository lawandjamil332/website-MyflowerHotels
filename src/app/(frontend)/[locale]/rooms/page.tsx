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
import { shell } from '@/components/site/ui'
import type { Branch } from '@/payload-types'

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

  const filtered = rooms.filter((room) => {
    const branch = typeof room.branch === 'object' ? (room.branch as Branch) : null
    if (hotel && branch?.slug !== hotel) return false
    if (guests && (room.maxGuests ?? 0) < guests) return false
    if (bed && room.bedType !== bed) return false
    return true
  })

  // A filter link keeps whatever else is already chosen, and clears its own
  // value when it is the one already active.
  const linkTo = (key: string, value: string) => {
    const next = new URLSearchParams()
    if (hotel) next.set('hotel', hotel)
    if (guests) next.set('guests', String(guests))
    if (bed) next.set('bed', bed)
    if (next.get(key) === value) next.delete(key)
    else next.set(key, value)
    const q = next.toString()
    return `/${locale}/rooms${q ? `?${q}` : ''}`
  }

  const chip = (active: boolean) =>
    cn(
      'inline-block border px-4 py-2 text-[0.65rem] tracking-[0.16em] uppercase transition-colors duration-500 ease-luxe rtl:tracking-normal',
      active
        ? 'border-ink bg-ink text-bone'
        : 'border-line text-muted-ink hover:border-ink hover:text-ink',
    )

  const heroSource = branches[0]?.heroImage
  const beds: Array<keyof typeof t.bed> = ['single', 'double', 'twin', 'king', 'suite']
  const anyFilter = Boolean(hotel || guests || bed)

  return (
    <>
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

        {filtered.length > 0 ? (
          <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((room, i) => (
              <Reveal key={room.id} delay={(i % 3) * 90}>
                <RoomCard room={room} locale={locale} t={t} showBranch priority={i < 3} />
              </Reveal>
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
  return { title: t.roomsPage.title, description: t.roomsPage.lead }
}
