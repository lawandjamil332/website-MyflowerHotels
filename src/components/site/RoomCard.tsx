import Link from 'next/link'

import type { Branch, Room } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { mediaUrl, mediaAlt } from '@/utilities/media'
import { formatNumber } from '@/utilities/format'
import { cn } from '@/utilities/ui'
import { Price } from './Currency'
import { PhotoFrame } from './PhotoFrame'
import { monogramOf } from '@/utilities/monogram'

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
  const cover = room.images?.[0]
  const url = mediaUrl(cover, 'large')
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
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-sand">
        <PhotoFrame
          src={url}
          alt={mediaAlt(cover) || room.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          monogram={monogramOf(room.name)}
          priority={priority}
          imageClassName="transition-transform duration-1000 ease-luxe group-hover:scale-105"
        />
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

        {typeof room.priceFrom === 'number' && (
          <p className="mt-4 flex items-baseline gap-2 text-sm text-muted-ink">
            <span className="text-[0.65rem] tracking-[0.2em] uppercase rtl:tracking-normal">
              {t.room.from}
            </span>
            <Price
              amount={room.priceFrom}
              currency={room.currency}
              locale={locale}
              className="font-display text-xl text-ink"
            />
            <span className="text-xs">{t.room.perNight}</span>
          </p>
        )}
      </div>
    </Link>
  )
}
