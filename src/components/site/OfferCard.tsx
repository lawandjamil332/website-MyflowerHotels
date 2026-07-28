import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Branch, Offer } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { monogramOf } from '@/utilities/monogram'
import { PhotoCard } from './PhotoCard'

/**
 * One deal, as a card in the offers rail.
 *
 * There is no basket to put an offer in and no code to apply, so the card does
 * not pretend otherwise — it names the deal, says where it applies, and hands
 * over to the enquiry, which is where a guest was always going to have to ask
 * for it. The only thing it must do well is be specific enough to quote back
 * at the front desk.
 */
export function OfferCard({
  offer,
  locale,
  t,
  priority = false,
}: {
  offer: Offer
  locale: Locale
  t: Dictionary
  priority?: boolean
}) {
  const branch = typeof offer.branch === 'object' ? (offer.branch as Branch) : null
  const href = branch ? `/${locale}/branches/${branch.slug}#enquire` : `/${locale}/contact#enquire`

  return (
    <PhotoCard
      href={href}
      src={mediaUrl(offer.image, 'large')}
      alt={mediaAlt(offer.image) || offer.title}
      monogram={monogramOf(offer.title)}
      title={offer.title}
      meta={branch ? branch.name : t.home.offersEverywhere}
      body={offer.summary}
      priority={priority}
    />
  )
}
