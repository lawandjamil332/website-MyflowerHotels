import { cn } from '@/utilities/ui'
import { PhotoFrame } from './PhotoFrame'
import { monogramOf } from '@/utilities/monogram'
import { shell } from './ui'

/**
 * The opening band of every page that is not the homepage.
 *
 * It is always dark — either a photograph or flat ink — because the header
 * floats over it in its transparent state. A page that started on a light
 * background would put white navigation on white.
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
        size === 'tall' ? 'min-h-[72vh] sm:min-h-[82vh]' : 'min-h-[52vh] sm:min-h-[60vh]',
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
        imageClassName="ken-burns object-[center_26%]"
      />
      {imageUrl ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/45 to-black/60"
        />
      ) : null}

      <div className={cn(shell, 'relative pt-36 pb-16 sm:pb-20')}>
        {eyebrow && (
          <p className="eyebrow rise" style={{ animationDelay: '0.15s' }}>
            {eyebrow}
          </p>
        )}
        <h1
          className="font-display display-xl rise mt-6 max-w-4xl text-balance text-white"
          style={{ animationDelay: '0.28s' }}
        >
          {title}
        </h1>
        {lead && (
          <p
            className="rise mt-7 max-w-xl text-lg leading-relaxed text-white/75 xl:max-w-2xl xl:text-xl"
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
