import Link from 'next/link'

import { cn } from '@/utilities/ui'
import { PhotoFrame } from './PhotoFrame'

/**
 * A photograph with its name on a plate at the top.
 *
 * This is the card the reference builds its whole homepage out of, and the
 * shape matters more than it looks. The previous card ran the name along the
 * bottom over a gradient, which is the standard property-card treatment and
 * spends the bottom third of every photograph on a black fade. Lifting the
 * name onto a plate at the top hands the picture back: the plate covers a
 * strip of sky, the photograph keeps its subject, and every card in a row
 * announces itself at the same height instead of at whatever height its own
 * text ran to.
 *
 * The plate is light. That is the second half of it and it is not a detail —
 * a light plate reads as a label attached to a picture, and a dark one reads
 * as a picture with something over it.
 *
 * The mark is an arrow, not the reference's chevron. A chevron promises the
 * card will open in place; these go to a page, and drawing a control that lies
 * about where it takes you is worse than not matching.
 */
export function PhotoCard({
  href,
  src,
  alt,
  monogram,
  fallbackSrc,
  title,
  meta,
  body,
  badge,
  priority = false,
  sizes = '(min-width: 1280px) 24vw, (min-width: 1024px) 32vw, (min-width: 640px) 46vw, 78vw',
  className,
}: {
  href: string
  src: string
  alt: string
  /** Stands in for the picture until one is uploaded — never an empty frame. */
  monogram: string
  fallbackSrc?: string
  title: string
  /** One line under the title — where it is, or which hotel it applies at. */
  meta?: string | null
  /** Two lines at most, for an offer that needs a sentence to make sense. */
  body?: string | null
  /** Sits at the foot of the picture, e.g. "opening soon". */
  badge?: React.ReactNode
  priority?: boolean
  sizes?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative block aspect-3/4 overflow-hidden rounded-2xl bg-sand',
        'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:outline-none',
        className,
      )}
    >
      <PhotoFrame
        src={src}
        alt={alt}
        sizes={sizes}
        monogram={monogram}
        fallbackSrc={fallbackSrc}
        priority={priority}
        imageClassName="transition-transform duration-[1.2s] ease-luxe group-hover:scale-105"
      />

      {/* A light plate, not a dark one.
          It was black glass, on the reasoning that a dark plate keeps a
          photograph looking like a photograph. What it actually did was put a
          smoked panel over the top third of every picture in every row, so a
          page of cards read as a page of things partly covered up. The
          reference uses a plain light plate with dark type, and it is the
          right call for the same reason a caption under a picture is: the
          words stop competing with the image and simply sit beside it. */}
      <div
        className={cn(
          'absolute inset-x-3 top-3 rounded-xl bg-bone/95 px-4 py-3.5 backdrop-blur-sm sm:inset-x-4 sm:top-4',
          'shadow-[0_6px_20px_-10px_rgb(0_0_0/0.45)]',
          'transition-colors duration-500 ease-luxe group-hover:bg-bone',
        )}
      >
        <div className="flex items-start gap-3">
          <span className="min-w-0 flex-1">
            <h3 className="font-display text-xl leading-tight text-balance text-ink">{title}</h3>
            {meta && <p className="mt-1 text-[0.82rem] leading-snug text-muted-ink">{meta}</p>}
            {body && (
              <p className="mt-2 line-clamp-2 text-[0.85rem] leading-snug text-muted-ink">{body}</p>
            )}
          </span>

          <span
            aria-hidden="true"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/35 text-brand transition-colors duration-500 ease-luxe group-hover:bg-brand group-hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 rtl:-scale-x-100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      {badge && <div className="absolute start-4 bottom-4">{badge}</div>}
    </Link>
  )
}
