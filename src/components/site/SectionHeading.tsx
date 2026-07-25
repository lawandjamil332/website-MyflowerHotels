import { cn } from '@/utilities/ui'
import { Reveal } from './Reveal'

/**
 * Eyebrow, headline, lead — the same three-part opening for every section, so
 * the page reads as one document rather than a stack of unrelated modules.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = 'ink',
  className,
  as: Tag = 'h2',
}: {
  eyebrow?: string
  title: string
  lead?: string
  tone?: 'ink' | 'light'
  className?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <Reveal className={cn('max-w-2xl', className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag
        className={cn(
          'font-display mt-5 text-4xl leading-[1.08] text-balance sm:text-5xl lg:text-6xl',
          tone === 'light' ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </Tag>
      {lead && (
        <p
          className={cn(
            'mt-6 max-w-xl text-base leading-relaxed sm:text-lg',
            tone === 'light' ? 'text-white/70' : 'text-muted-ink',
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  )
}
