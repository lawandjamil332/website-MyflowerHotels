import Link from 'next/link'

import type { Branch, Room } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { mediaUrl, mediaAlt } from '@/utilities/media'
import { formatNumber, formatPrice } from '@/utilities/format'
import { cn } from '@/utilities/ui'
import { PhotoFrame } from './PhotoFrame'
import { monogramOf } from '@/utilities/monogram'

/**
 * A room given a full editorial row rather than a cell in a grid.
 *
 * Three equal cards is what every hotel template does, and it makes every
 * room look interchangeable. Alternating a large photograph against a narrow
 * column of type gives each room its own page-width moment, and the reversal
 * every other row is what keeps a long list from becoming a rhythm you stop
 * reading.
 */
export function RoomFeature({
  room,
  locale,
  t,
  index,
  priority = false,
}: {
  room: Room
  locale: Locale
  t: Dictionary
  index: number
  priority?: boolean
}) {
  const cover = room.images?.[0]
  const price = formatPrice(room.priceFrom, room.currency, locale)
  const branch = typeof room.branch === 'object' ? (room.branch as Branch) : null
  const flipped = index % 2 === 1

  const facts = [
    room.maxGuests ? `${t.room.guests} ${formatNumber(room.maxGuests, locale)}` : null,
    room.bedType ? (t.bed[room.bedType] ?? room.bedType) : null,
    room.sizeSqm ? `${formatNumber(room.sizeSqm, locale)} m²` : null,
  ].filter(Boolean) as string[]

  return (
    <article className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
      <Link
        href={`/${locale}/rooms/${room.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          'relative aspect-4/3 overflow-hidden rounded-2xl bg-sand lg:col-span-7 lg:aspect-3/2',
          // The photograph swaps sides each row; in RTL the whole grid is
          // already mirrored, so this stays in logical column order.
          flipped ? 'lg:order-2 lg:col-start-6' : 'lg:order-1',
        )}
      >
        <PhotoFrame
          src={mediaUrl(cover, 'xlarge')}
          alt={mediaAlt(cover) || room.name}
          sizes="(min-width: 1024px) 58vw, 100vw"
          monogram={monogramOf(room.name)}
          priority={priority}
          imageClassName="transition-transform duration-[1600ms] ease-luxe group-hover:scale-105"
        />
      </Link>

      <div
        className={cn(
          'lg:col-span-5',
          flipped ? 'lg:order-1 lg:col-start-1 lg:row-start-1' : 'lg:order-2',
        )}
      >
        <span className="text-xs tracking-[0.2em] tabular-nums text-brand">
          {String(index + 1).padStart(2, '0')}
        </span>

        <h3 className="font-display display-lg mt-4 text-ink">
          <Link href={`/${locale}/rooms/${room.slug}`} className="link-line">
            {room.name}
          </Link>
        </h3>

        {branch && (
          <p className="mt-3 text-xs tracking-[0.18em] text-muted-ink uppercase rtl:tracking-normal">
            {branch.name}
          </p>
        )}

        {facts.length > 0 && (
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm text-ink-soft">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        )}

        {price && (
          <p className="mt-6 flex items-baseline gap-2 text-muted-ink">
            <span className="text-[0.65rem] tracking-[0.2em] uppercase rtl:tracking-normal">
              {t.room.from}
            </span>
            <span className="font-display text-3xl text-ink">{price}</span>
            <span className="text-xs">{t.room.perNight}</span>
          </p>
        )}
      </div>
    </article>
  )
}
