import Image from 'next/image'
import Link from 'next/link'

import type { Branch } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { mediaAlt, mediaUrl } from '@/utilities/media'

/**
 * The homepage's centrepiece. Three branches is the group's real
 * differentiator, so each gets an equal, photo-led card rather than a line in
 * a dropdown. The photograph carries the card; the interface stays quiet.
 */
export function BranchCard({
  branch,
  locale,
  t,
  priority = false,
}: {
  branch: Branch
  locale: Locale
  t: Dictionary
  priority?: boolean
}) {
  const hero = mediaUrl(branch.heroImage, 'large')

  return (
    <Link
      href={`/${locale}/branches/${branch.slug}`}
      className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-lg bg-stone-200 focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 sm:aspect-3/4"
    >
      {hero ? (
        <Image
          src={hero}
          alt={mediaAlt(branch.heroImage) || branch.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
          priority={priority}
        />
      ) : null}

      {/* Enough scrim for white text to stay legible over any photograph. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
      />

      <div className="relative p-6">
        <h3 className="font-display text-2xl leading-tight text-white">{branch.name}</h3>
        {branch.tagline && <p className="mt-1 text-sm text-white/80">{branch.tagline}</p>}
        <span className="mt-4 inline-block text-sm text-white/90 underline-offset-4 group-hover:underline">
          {t.common.viewDetails}
        </span>
      </div>
    </Link>
  )
}
