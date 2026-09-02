import Link from 'next/link'

import { cn } from '@/utilities/ui'
import { Reveal } from './Reveal'
import { btnPrimary } from './ui'

/**
 * Headline, lead, and the action that follows from them — centred.
 *
 * This used to open every section with a chapter numeral on a hairline and a
 * line of letterspaced capitals, which is how a magazine signals that a long
 * scroll has been edited. It is not how a hotel group signals anything. The
 * numerals told a guest which section they were in, a fact of no use to
 * anybody trying to find a room, and the 11px capitals above every heading
 * cost a moment's reading each time for decoration.
 *
 * So: one large serif line, one paragraph at a size adults actually read, and
 * a button. Centred, because a centred heading over a full-width band reads as
 * a section of a site, while a left-aligned one over the same band reads as a
 * column of an article.
 */
export function SectionHeading({
  title,
  lead,
  tone = 'ink',
  align = 'center',
  action,
  className,
  immediate = false,
  as: Tag = 'h2',
}: {
  title: string
  lead?: string
  tone?: 'ink' | 'light'
  align?: 'center' | 'start'
  /** The pill that follows the lead, the way every band on the reference ends. */
  action?: { href: string; label: string; external?: boolean }
  className?: string
  /** Paint at once rather than fading in — for headings above the fold. */
  immediate?: boolean
  as?: 'h1' | 'h2'
}) {
  const centred = align === 'center'

  return (
    <Reveal
      immediate={immediate}
      className={cn(
        centred ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl',
        className,
      )}
    >
      <Tag
        className={cn(
          'font-display display-lg text-balance',
          tone === 'light' ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </Tag>

      {lead && (
        <p
          className={cn(
            'mt-4 text-[1.05rem] leading-[1.6] sm:text-[1.1rem]',
            centred && 'mx-auto max-w-2xl',
            tone === 'light' ? 'text-white/80' : 'text-muted-ink',
          )}
        >
          {lead}
        </p>
      )}

      {/* mt-7, not mt-8, and the lead above it lost a step too. These are the
          same trim as sectionY and for the same reason: the heading block is
          repeated six times down the homepage, so every step of padding in it
          is spent six times over. */}
      {action &&
        (action.external ? (
          <a
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(btnPrimary, 'mt-7')}
          >
            {action.label}
          </a>
        ) : (
          <Link href={action.href} className={cn(btnPrimary, 'mt-7')}>
            {action.label}
          </Link>
        ))}
    </Reveal>
  )
}

/**
 * A small centred heading with a rule running out either side — the treatment
 * the reference uses to separate a list of logos or links from the band above
 * it, where a full-size heading would be too much weight.
 */
export function RuledHeading({
  title,
  tone = 'ink',
  className,
}: {
  title: string
  tone?: 'ink' | 'light'
  className?: string
}) {
  const rule = tone === 'light' ? 'bg-white/25' : 'bg-line'
  return (
    <div className={cn('flex items-center gap-5', className)}>
      <span aria-hidden="true" className={cn('h-px flex-1', rule)} />
      <h2
        className={cn(
          'font-display text-center text-2xl sm:text-3xl',
          tone === 'light' ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>
      <span aria-hidden="true" className={cn('h-px flex-1', rule)} />
    </div>
  )
}
