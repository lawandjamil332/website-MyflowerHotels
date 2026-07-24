import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getRoomBySlug } from '@/utilities/branches'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { formatNumber, formatPrice } from '@/utilities/format'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'
import RichText from '@/components/RichText'
import type { Branch } from '@/payload-types'

type Args = { params: Promise<{ locale: string; slug: string }> }

export default async function RoomPage({ params }: Args) {
  const { locale: raw, slug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const room = await getRoomBySlug(slug, locale)
  if (!room) notFound()

  const branch = (typeof room.branch === 'object' ? room.branch : null) as Branch | null
  const images = (room.images ?? []).filter((i) => mediaUrl(i.image))
  const price = formatPrice(room.priceFrom, room.currency, locale)

  // Pre-fills the WhatsApp message with the room, so the guest does not have
  // to explain which one they mean.
  const enquiryText = branch
    ? `${t.room.enquire}: ${room.name} — ${branch.name}`
    : `${t.room.enquire}: ${room.name}`
  const wa = toWhatsAppHref(branch?.whatsapp, enquiryText)
  const tel = toTelHref(branch?.phone)

  const facts = [
    room.maxGuests
      ? { label: t.room.guests, value: formatNumber(room.maxGuests, locale) }
      : null,
    room.bedType ? { label: t.room.bedType, value: t.bed[room.bedType] ?? room.bedType } : null,
    room.sizeSqm ? { label: t.room.size, value: `${formatNumber(room.sizeSqm, locale)} m²` } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {branch && (
        <Link
          href={`/${locale}/branches/${branch.slug}`}
          className="text-sm text-stone-500 underline-offset-4 hover:text-stone-900 hover:underline"
        >
          ← {t.room.backToBranch}
        </Link>
      )}

      {images.length > 0 && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-stone-200 md:row-span-2 md:aspect-auto">
            <Image
              src={mediaUrl(images[0].image, 'xlarge')}
              alt={mediaAlt(images[0].image) || room.name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
          {images.slice(1, 3).map((item, i) => (
            <div
              key={item.id ?? i}
              className="relative aspect-4/3 overflow-hidden rounded-lg bg-stone-200"
            >
              <Image
                src={mediaUrl(item.image, 'medium')}
                alt={mediaAlt(item.image) || room.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 grid gap-12 pb-16 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="font-display text-3xl text-stone-900 sm:text-4xl">{room.name}</h1>
          {branch && <p className="mt-2 text-stone-500">{branch.name}</p>}

          {facts.length > 0 && (
            <dl className="mt-8 grid grid-cols-3 gap-6 border-y border-stone-200 py-6 text-sm">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-stone-400">{f.label}</dt>
                  <dd className="mt-1 text-stone-900">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {room.description && (
            <div className="mt-8">
              <RichText data={room.description} enableGutter={false} className="max-w-none" />
            </div>
          )}

          {room.amenities && room.amenities.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-xl text-stone-900">{t.room.amenities}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {room.amenities.map((a) => (
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
          <div className="rounded-lg border border-stone-200 p-6 lg:sticky lg:top-24">
            {price && (
              <p className="text-sm text-stone-500">
                {t.room.from}{' '}
                <span className="font-display text-2xl text-stone-900">{price}</span>{' '}
                {t.room.perNight}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#25D366] px-5 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
                >
                  {t.room.enquire}
                </a>
              )}
              {tel && (
                <a
                  href={tel}
                  dir="ltr"
                  className="rounded-full border border-stone-300 px-5 py-3 text-center text-sm font-medium text-stone-900 transition hover:bg-stone-50"
                >
                  {branch?.phone}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const room = await getRoomBySlug(slug, locale)
  if (!room) return {}

  return {
    title: room.name,
    openGraph: {
      title: room.name,
      images: mediaUrl(room.images?.[0]?.image, 'og') || undefined,
    },
  }
}
