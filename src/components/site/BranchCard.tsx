import Image from 'next/image'
import Link from 'next/link'

import type { Branch } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { cn } from '@/utilities/ui'

/**
 * A single hotel as a photographic panel. Used where the full switcher would
 * be too much — the about page, and anywhere a branch needs to appear in a
 * plain grid. The photograph carries the card; the interface stays quiet.
 */
export function BranchCard({
  branch,
  locale,
  t,
  index,
  priority = false,
  className,
}: {
  branch: Branch
  locale: Locale
  t: Dictionary
  index?: number
  priority?: boolean
  className?: string
}) {
  const hero = mediaUrl(branch.heroImage, 'large')

  return (
    <Link
      href={`/${locale}/branches/${branch.slug}`}
      className={cn(
        'group relative flex aspect-4/5 flex-col justify-end overflow-hidden bg-sand focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2',
        className,
      )}
    >
      {hero ? (
        <Image
          src={hero}
          alt={mediaAlt(branch.heroImage) || branch.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
          priority={priority}
        />
      ) : null}

      {/* Enough scrim for white text to stay legible over any photograph. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
      />

      <div className="relative p-6 sm:p-7">
        {(typeof index === 'number' || branch.city) && (
          <p className="text-[0.65rem] tracking-[0.24em] text-brass-bright uppercase rtl:tracking-normal">
            {typeof index === 'number' ? String(index + 1).padStart(2, '0') : ''}
            {typeof index === 'number' && branch.city ? ' · ' : ''}
            {branch.city ?? ''}
          </p>
        )}
        <h3 className="font-display mt-3 text-3xl leading-tight text-white">{branch.name}</h3>
        {branch.tagline && (
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">{branch.tagline}</p>
        )}
        <span className="link-line mt-5 inline-block text-[0.65rem] tracking-[0.22em] text-white uppercase rtl:tracking-normal">
          {t.common.viewDetails}
        </span>
      </div>
    </Link>
  )
}
