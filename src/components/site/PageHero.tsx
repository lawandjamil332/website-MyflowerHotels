import Image from 'next/image'

import { cn } from '@/utilities/ui'
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
  children,
}: {
  eyebrow?: string
  title: string
  lead?: string
  imageUrl?: string
  imageAlt?: string
  size?: 'compact' | 'tall'
  children?: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'relative flex items-end overflow-hidden bg-ink',
        size === 'tall' ? 'min-h-[68vh] sm:min-h-[78vh]' : 'min-h-[48vh] sm:min-h-[56vh]',
      )}
    >
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            sizes="100vw"
            priority
            className="ken-burns object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/45"
          />
        </>
      ) : null}

      <div className={cn(shell, 'relative pt-32 pb-14 sm:pb-20')}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display mt-5 max-w-4xl text-4xl leading-[1.06] text-balance text-white sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        {lead && <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{lead}</p>}
        {children}
      </div>
    </section>
  )
}
