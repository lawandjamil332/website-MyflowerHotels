import { cn } from '@/utilities/ui'
import { Reveal } from './Reveal'

/**
 * Eyebrow, headline, lead — the same three-part opening for every section, so
 * the page reads as one document rather than a stack of unrelated modules.
 *
 * `index` adds a chapter numeral on a hairline. Used down the homepage, where
 * numbering the sections is what makes a long scroll feel edited rather than
 * merely long.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  index,
  tone = 'ink',
  className,
  as: Tag = 'h2',
}: {
  eyebrow?: string
  title: string
  lead?: string
  index?: number
  tone?: 'ink' | 'light'
  className?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <Reveal className={cn('max-w-3xl xl:max-w-5xl', className)}>
      <div className="flex items-center gap-4">
        {typeof index === 'number' && (
          <>
            <span
              className={cn(
                'text-xs tracking-[0.2em] tabular-nums',
                tone === 'light' ? 'text-white/50' : 'text-muted-ink/60',
              )}
            >
              {String(index).padStart(2, '0')}
            </span>
            <span
              aria-hidden="true"
              className={cn('h-px w-8', tone === 'light' ? 'bg-white/25' : 'bg-line')}
            />
          </>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      </div>

      <Tag
        className={cn(
          'font-display display-xl mt-6 text-balance',
          tone === 'light' ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </Tag>

      {lead && (
        <p
          className={cn(
            'mt-6 max-w-xl text-base leading-relaxed sm:text-lg xl:max-w-2xl xl:text-xl',
            tone === 'light' ? 'text-white/70' : 'text-muted-ink',
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  )
}
