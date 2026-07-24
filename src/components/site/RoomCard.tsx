import Image from 'next/image'
import Link from 'next/link'

import type { Room } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { mediaUrl, mediaAlt } from '@/utilities/media'
import { formatPrice } from '@/utilities/format'

export function RoomCard({ room, locale, t }: { room: Room; locale: Locale; t: Dictionary }) {
  const cover = room.images?.[0]?.image
  const url = mediaUrl(cover, 'medium')
  const price = formatPrice(room.priceFrom, room.currency, locale)

  return (
    <Link
      href={`/${locale}/rooms/${room.slug}`}
      className="group block focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-stone-200">
        {url ? (
          <Image
            src={url}
            alt={mediaAlt(cover) || room.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="mt-3">
        <h3 className="font-display text-lg text-stone-900">{room.name}</h3>
        {price && (
          <p className="mt-1 text-sm text-stone-500">
            {t.room.from} <span className="text-stone-900">{price}</span> {t.room.perNight}
          </p>
        )}
      </div>
    </Link>
  )
}
