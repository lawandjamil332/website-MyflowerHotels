import Image from 'next/image'

import { cn } from '@/utilities/ui'

/**
 * A photograph, or a composed stand-in for one.
 *
 * Before a hotel's pictures are uploaded, every image slot on the site is an
 * empty grey rectangle — which reads as broken rather than unfinished. This
 * fills the same space with a monogram inside a hairline frame, so a site
 * with no photography still looks deliberate while the owner is gathering it.
 */
export function PhotoFrame({
  src,
  alt,
  sizes,
  monogram,
  priority = false,
  tone = 'sand',
  className,
  imageClassName,
}: {
  src?: string
  alt: string
  sizes: string
  monogram: string
  priority?: boolean
  tone?: 'sand' | 'ink'
  className?: string
  imageClassName?: string
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', imageClassName, className)}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        tone === 'ink' ? 'bg-ink' : 'bg-sand',
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-4 border sm:inset-6',
          tone === 'ink' ? 'border-white/12' : 'border-ink/10',
        )}
      />
      <span
        className={cn(
          'font-display relative text-3xl tracking-[0.34em] uppercase sm:text-4xl',
          tone === 'ink' ? 'text-white/25' : 'text-ink/20',
        )}
      >
        {monogram}
      </span>
    </div>
  )
}

/**
 * Initials for the frame above — "Myflower Citadel" becomes MC. Falls back to
 * the first two letters when there is only one word.
 */
export const monogramOf = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '—'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
