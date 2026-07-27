import Link from 'next/link'

import type { Branch } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { cn } from '@/utilities/ui'
import { branchLocative } from '@/utilities/teasers'
import { OpeningMark, isOpeningSoon, openingLabel } from './OpeningMark'
import { PhotoFrame } from './PhotoFrame'
import { monogramOf } from '@/utilities/monogram'

/**
 * A single hotel as a photographic panel. The photograph carries the card; the
 * interface stays quiet. Sized to sit in a CardRail, which is where both the
 * homepage and the about page put it.
 */
export function BranchCard({
  branch,
  locale,
  t,
  priority = false,
  className,
}: {
  branch: Branch
  locale: Locale
  t: Dictionary
  priority?: boolean
  className?: string
}) {
  const hero = mediaUrl(branch.heroImage, 'large')

  return (
    <Link
      href={`/${locale}/branches/${branch.slug}`}
      className={cn(
        'group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl bg-sand focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2',
        className,
      )}
    >
      <PhotoFrame
        src={hero}
        alt={mediaAlt(branch.heroImage) || branch.name}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        monogram={monogramOf(branch.name)}
        priority={priority}
        imageClassName="transition-transform duration-1000 ease-luxe group-hover:scale-105"
      />

      {/* Enough scrim for white text to stay legible over any photograph. */}
      {hero && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
        />
      )}

      <div className="relative p-6 sm:p-7">
        {branchLocative(branch) && (
          <p className="text-[0.9rem] text-white/80">{branchLocative(branch)}</p>
        )}
        <h3 className="font-display mt-3 text-3xl leading-tight text-white">{branch.name}</h3>
        {isOpeningSoon(branch) && (
          <OpeningMark
            label={openingLabel(branch, t.branch.openingSoon)}
            tone="light"
            className="mt-3"
          />
        )}
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
