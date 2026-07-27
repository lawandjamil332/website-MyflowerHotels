import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Branch, Offer } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { monogramOf } from '@/utilities/monogram'
import { cn } from '@/utilities/ui'
import { PhotoFrame } from './PhotoFrame'

/**
 * One deal, as a card in the offers rail.
 *
 * There is no basket to put an offer in and no code to apply, so the card does
 * not pretend otherwise — it names the deal, says what it gets you, and hands
 * over to the hotel page or the enquiry, which is where a guest was always
 * going to have to ask for it. The only thing it must do well is be specific
 * enough to quote back at the front desk.
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
    <Link
      href={href}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-sand">
        <PhotoFrame
          src={mediaUrl(offer.image, 'large')}
          alt={mediaAlt(offer.image) || offer.title}
          sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 32vw, (min-width: 640px) 46vw, 78vw"
          monogram={monogramOf(offer.title)}
          priority={priority}
          imageClassName="transition-transform duration-[1.2s] ease-luxe group-hover:scale-105"
        />
      </div>

      <h3 className="font-display mt-5 text-2xl leading-snug text-ink">{offer.title}</h3>

      {/* Which hotel it applies at, or that it applies everywhere — the first
          thing a guest checks after the headline. */}
      <p className="mt-2 text-[0.9rem] text-brand">
        {branch ? branch.name : t.home.offersEverywhere}
      </p>

      {offer.summary && (
        <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-ink">{offer.summary}</p>
      )}

      <span
        className={cn(
          'mt-5 inline-block text-[0.9rem] font-semibold text-brand',
          'underline decoration-1 underline-offset-4',
        )}
      >
        {t.branch.enquire}
      </span>
    </Link>
  )
}
