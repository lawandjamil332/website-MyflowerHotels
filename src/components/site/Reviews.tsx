import type { Dictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'
import type { Rating, Review } from '@/utilities/reviews'
import { formatNumber } from '@/utilities/format'
import { cn } from '@/utilities/ui'

/**
 * Five stars, filled to the rating.
 *
 * Drawn rather than written out, because this is the one element on a hotel
 * page a visitor reads without reading — the shape carries the number before
 * any of the words underneath it are looked at.
 */
export function RatingStars({
  value,
  className,
  size = 'sm',
}: {
  value: number
  className?: string
  size?: 'sm' | 'lg'
}) {
  const box = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" className={cn(box, 'shrink-0')}>
          <path
            d="M12 2.5l2.9 6.05 6.6.9-4.8 4.6 1.2 6.55L12 17.5l-5.9 3.1 1.2-6.55-4.8-4.6 6.6-.9z"
            // Half-filled is not attempted. A star that is 62% painted looks
            // like a rendering fault, and rounding to the nearest whole star is
            // what every rating anyone has seen before already does.
            className={n <= Math.round(value) ? 'fill-brand' : 'fill-line'}
          />
        </svg>
      ))}
    </span>
  )
}

/** The average and the count, small enough to sit beside a hotel's name. */
export function RatingBadge({
  rating,
  t,
  locale,
  className,
}: {
  rating: Rating
  t: Dictionary
  locale: Locale
  className?: string
}) {
  // Nothing at all rather than "0.0 from 0 reviews", which reads as a bad
  // score to anybody skimming and is the first impression of a new hotel.
  if (rating.count === 0) return null
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      <RatingStars value={rating.average} />
      <span className="text-[0.85rem] text-muted-ink">
        <span className="font-semibold text-ink">{formatNumber(rating.average, locale)}</span>{' '}
        {t.reviews.fromCount.replace('{count}', formatNumber(rating.count, locale))}
      </span>
    </span>
  )
}

const day = (value?: string | null) => (value ? String(value).slice(0, 10) : '')

/** The reviews themselves. Renders nothing when there are none. */
export function ReviewList({
  reviews,
  rating,
  t,
  locale,
  title,
}: {
  reviews: Review[]
  rating: Rating
  t: Dictionary
  locale: Locale
  title?: string
}) {
  if (reviews.length === 0) return null

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-3xl text-ink">{title ?? t.reviews.title}</h2>
        <RatingBadge rating={rating} t={t} locale={locale} />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {reviews.map((review) => (
          <li key={review.id} className="flow-root rounded-2xl border border-line bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <RatingStars value={review.rating} />
                <span className="text-[0.95rem] font-semibold text-ink">{review.guestName}</span>
              </div>
              {/* The one claim here a person cannot type, so the one worth a
                  mark of its own. */}
              {review.verified && (
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[0.7rem] font-semibold text-brand">
                  {t.reviews.verified}
                </span>
              )}
            </div>
            {review.comment && (
              <p className="mt-4 leading-relaxed text-ink-soft">{review.comment}</p>
            )}
            {(review.stayedOn || review.createdAt) && (
              <p className="mt-4 text-[0.78rem] text-muted-ink" dir="ltr">
                {day(review.stayedOn || review.createdAt)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
