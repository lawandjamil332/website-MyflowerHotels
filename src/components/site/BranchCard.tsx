import type { Branch } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { branchLocative } from '@/utilities/teasers'
import { monogramOf } from '@/utilities/monogram'
import { shippedPhoto } from '@/utilities/shippedPhoto'
import { OpeningMark, isOpeningSoon, openingLabel } from './OpeningMark'
import { PhotoCard } from './PhotoCard'

/**
 * A single hotel as a photographic panel, in the rails on the homepage and the
 * about page. The photograph carries the card; the interface stays quiet.
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
  return (
    <PhotoCard
      href={`/${locale}/branches/${branch.slug}`}
      src={mediaUrl(branch.heroImage, 'large')}
      alt={mediaAlt(branch.heroImage) || branch.name}
      monogram={monogramOf(branch.name)}
      fallbackSrc={shippedPhoto(branch.slug)}
      title={branch.name}
      meta={branchLocative(branch) || branch.tagline}
      priority={priority}
      className={className}
      badge={
        isOpeningSoon(branch) ? (
          <OpeningMark label={openingLabel(branch, t.branch.openingSoon)} tone="light" />
        ) : null
      }
    />
  )
}
