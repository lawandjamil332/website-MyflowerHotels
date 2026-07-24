import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranchBySlug, getRoomsForBranch } from '@/utilities/branches'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { toMapsHref, toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { RoomCard } from '@/components/site/RoomCard'
import RichText from '@/components/RichText'

type Args = { params: Promise<{ locale: string; slug: string }> }

export default async function BranchPage({ params }: Args) {
  const { locale: raw, slug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const branch = await getBranchBySlug(slug, locale)
  if (!branch) notFound()

  const rooms = await getRoomsForBranch(branch.id, locale)
  const heroUrl = mediaUrl(branch.heroImage, 'xlarge')
  const maps = toMapsHref(branch.googleMapsUrl, branch.latitude, branch.longitude)
  const wa = toWhatsAppHref(
    branch.whatsapp,
    `${t.branch.enquire} — ${branch.name}`,
  )
  const tel = toTelHref(branch.phone)
  const gallery = (branch.gallery ?? []).filter((g) => mediaUrl(g.image))

  return (
    <>
      <section className="relative flex min-h-[55vh] items-end overflow-hidden bg-stone-900 sm:min-h-[65vh]">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={mediaAlt(branch.heroImage) || branch.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">
            {branch.name}
          </h1>
          {branch.tagline && <p className="mt-3 max-w-xl text-white/85">{branch.tagline}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="grid gap-12 py-16 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {branch.description && (
              <RichText data={branch.description} enableGutter={false} className="max-w-none" />
            )}

            {branch.amenities && branch.amenities.length > 0 && (
              <div className="mt-12">
                <h2 className="font-display text-2xl text-stone-900">{t.branch.amenities}</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {branch.amenities.map((a) => (
                    <li
                      key={a}
                      className="rounded-full border border-stone-200 px-4 py-1.5 text-sm text-stone-600"
                    >
                      {t.amenity[a] ?? a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-lg border border-stone-200 p-6">
              {branch.address && (
                <p className="whitespace-pre-line text-sm text-stone-600">{branch.address}</p>
              )}

              {(branch.checkInTime || branch.checkOutTime) && (
                <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-stone-100 pt-5 text-sm">
                  {branch.checkInTime && (
                    <div>
                      <dt className="text-stone-400">{t.branch.checkIn}</dt>
                      <dd className="mt-0.5 text-stone-900">{branch.checkInTime}</dd>
                    </div>
                  )}
                  {branch.checkOutTime && (
                    <div>
                      <dt className="text-stone-400">{t.branch.checkOut}</dt>
                      <dd className="mt-0.5 text-stone-900">{branch.checkOutTime}</dd>
                    </div>
                  )}
                </dl>
              )}

              <div className="mt-6 flex flex-col gap-2">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[#25D366] px-5 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {t.common.whatsapp}
                  </a>
                )}
                {tel && (
                  <a
                    href={tel}
                    dir="ltr"
                    className="rounded-full border border-stone-300 px-5 py-3 text-center text-sm font-medium text-stone-900 transition hover:bg-stone-50"
                  >
                    {branch.phone}
                  </a>
                )}
                {branch.bookingComUrl && (
                  <a
                    href={branch.bookingComUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-stone-900 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-stone-800"
                  >
                    {t.branch.bookNow}
                  </a>
                )}
                {maps && (
                  <a
                    href={maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 text-center text-sm text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
                  >
                    {t.branch.getDirections}
                  </a>
                )}
              </div>
            </div>
          </aside>
        </section>

        {gallery.length > 0 && (
          <section className="pb-16">
            <h2 className="font-display text-2xl text-stone-900">{t.branch.gallery}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item, i) => (
                <div
                  key={item.id ?? i}
                  className="relative aspect-4/3 overflow-hidden rounded-lg bg-stone-200"
                >
                  <Image
                    src={mediaUrl(item.image, 'medium')}
                    alt={mediaAlt(item.image) || branch.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pb-24">
          <h2 className="font-display text-2xl text-stone-900">{t.branch.rooms}</h2>
          {rooms.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} locale={locale} t={t} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-stone-500">{t.branch.noRooms}</p>
          )}
        </section>
      </div>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const branch = await getBranchBySlug(slug, locale)
  if (!branch) return {}

  return {
    title: branch.name,
    description: branch.tagline ?? undefined,
    openGraph: {
      title: branch.name,
      description: branch.tagline ?? undefined,
      images: mediaUrl(branch.heroImage, 'og') || undefined,
    },
  }
}
