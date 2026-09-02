'use client'

import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/utilities/ui'

/**
 * A photograph, or a composed stand-in for one.
 *
 * Two jobs. Before a hotel's pictures are uploaded, every image slot would be
 * an empty grey rectangle — which reads as broken rather than unfinished — so
 * this fills the space with a monogram inside a hairline frame instead.
 *
 * And when a picture that *should* exist fails to load, it does the same. That
 * case is real rather than theoretical: uploads made before the storage bucket
 * was connected were written to the server's own disk and erased on the next
 * deploy, leaving the database pointing at files that were no longer there.
 * The pages then showed a grid of broken-image icons. A site should degrade to
 * looking unfinished, never to looking broken.
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
  fallbackSrc,
}: {
  src?: string
  alt: string
  sizes: string
  monogram: string
  priority?: boolean
  tone?: 'sand' | 'ink'
  className?: string
  imageClassName?: string
  /** A picture shipped with the site, used if the uploaded one cannot load. */
  fallbackSrc?: string
}) {
  const [failed, setFailed] = useState(false)
  const showing = failed ? fallbackSrc : src || fallbackSrc

  if (showing) {
    return (
      <Image
        // Re-mounts on fallback, so the browser actually re-requests.
        key={showing}
        src={showing}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
        className={cn('object-cover', imageClassName, className)}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 flex items-center justify-center',
        tone === 'ink' ? 'bg-bark' : 'bg-sand',
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

