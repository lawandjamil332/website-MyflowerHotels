import { cn } from '@/utilities/ui'
import { PhotoFrame } from './PhotoFrame'
import { monogramOf } from '@/utilities/monogram'
import { shell } from './ui'

/**
 * The opening band of every page that is not the homepage.
 *
 * Kept short on purpose. An interior page is somewhere a guest has already
 * chosen to go, so the picture is a label for it rather than a view to stop
 * and take in — and every pixel it occupies is a pixel of the room rates
 * pushed below the fold. Capped in rem as well as vh so a tall monitor gets a
 * band rather than a wall.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  imageUrl,
  imageAlt,
  size = 'compact',
  fallbackSrc,
  children,
}: {
  eyebrow?: string
  title: string
  lead?: string
  imageUrl?: string
  imageAlt?: string
  size?: 'compact' | 'tall'
  fallbackSrc?: string
  children?: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'relative flex items-end overflow-hidden bg-ink',
        size === 'tall'
          ? 'h-[52svh] max-h-[28rem] min-h-[19rem]'
          : 'h-[38svh] max-h-[22rem] min-h-[15rem]',
      )}
    >
      <PhotoFrame
        src={imageUrl}
        alt={imageAlt || title}
        sizes="100vw"
        monogram={monogramOf(title)}
        fallbackSrc={fallbackSrc}
        priority
        tone="ink"
        imageClassName="object-[center_26%]"
      />
      {imageUrl ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/45 to-black/60"
        />
      ) : null}

      <div
        className={cn(
          shell,
          // The header's own measured height plus a gap, rather than a fixed
          // pt-24 that was written when the bar was one row tall.
          'relative pt-[calc(var(--site-header-h,4.5rem)+1.5rem)] pb-10 sm:pb-12',
        )}
      >
        {/* The eyebrow is brand blue by default, which is a mid tone and
            illegible over a photograph — on dark it goes white. */}
        {eyebrow && (
          <p className="eyebrow rise text-white" style={{ animationDelay: '0.15s' }}>
            {eyebrow}
          </p>
        )}
        <h1
          className="font-display display-xl rise mt-3 max-w-4xl text-balance text-white"
          style={{ animationDelay: '0.28s' }}
        >
          {title}
        </h1>
        {lead && (
          <p
            className="rise mt-3 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
            style={{ animationDelay: '0.42s' }}
          >
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
