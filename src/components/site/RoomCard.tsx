import Image from 'next/image'
import Link from 'next/link'

import type { Branch, Room } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { mediaUrl, mediaAlt } from '@/utilities/media'
import { formatNumber, formatPrice } from '@/utilities/format'
import { cn } from '@/utilities/ui'

/**
 * Rooms are sold on the photograph and two numbers: what it costs and how
 * many it sleeps. Everything else waits for the room page, which is why this
 * card carries a caption rather than a specification list.
 */
export function RoomCard({
  room,
  locale,
  t,
  showBranch = false,
  priority = false,
}: {
  room: Room
  locale: Locale
  t: Dictionary
  showBranch?: boolean
  priority?: boolean
}) {
  const cover = room.images?.[0]?.image
  const url = mediaUrl(cover, 'large')
  const price = formatPrice(room.priceFrom, room.currency, locale)
  const branch = typeof room.branch === 'object' ? (room.branch as Branch) : null

  const meta = [
    showBranch && branch ? branch.name : null,
    room.maxGuests ? `${t.room.guests} ${formatNumber(room.maxGuests, locale)}` : null,
    room.bedType ? (t.bed[room.bedType] ?? room.bedType) : null,
  ].filter(Boolean) as string[]

  return (
    <Link
      href={`/${locale}/rooms/${room.slug}`}
      className="group block focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-sand">
        {url ? (
          <Image
            src={url}
            alt={mediaAlt(cover) || room.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
          />
        ) : null}
        {room.isAvailable === false && (
          <span className="absolute top-4 start-4 bg-ink/85 px-3 py-1.5 text-[0.6rem] tracking-[0.2em] text-bone uppercase rtl:tracking-normal">
            {t.room.unavailable}
          </span>
        )}
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <h3 className="font-display text-2xl leading-tight text-ink">{room.name}</h3>

        {meta.length > 0 && (
          <p className="mt-1.5 text-xs tracking-[0.12em] text-muted-ink uppercase rtl:tracking-normal">
            {meta.join(' · ')}
          </p>
        )}

        {price && (
          <p className="mt-4 flex items-baseline gap-2 text-sm text-muted-ink">
            <span className="text-[0.65rem] tracking-[0.2em] uppercase rtl:tracking-normal">
              {t.room.from}
            </span>
            <span className={cn('font-display text-xl text-ink')}>{price}</span>
            <span className="text-xs">{t.room.perNight}</span>
          </p>
        )}
      </div>
    </Link>
  )
}
