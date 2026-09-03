import Link from 'next/link'

import { cn } from '@/utilities/ui'
import { Reveal } from './Reveal'
import { btnOnDark, btnOutline, btnSmall } from './ui'

/**
 * The opening of a section: a small label, a headline, a sentence, and the way
 * on — set to the leading edge, with the action across from it.
 *
 * It used to be centred, all of it, in every band down the page. That was the
 * single loudest thing making this site look like a template. Centred type is
 * what a page does when it has nothing to organise: every line finds its own
 * middle, nothing lines up with anything, and the eye has to re-find the start
 * of each line. A guest scanning six bands for the one they want reads six
 * different starting points.
 *
 * Ranged left, every heading, every sentence and every row of cards beneath
 * them starts on one line down the whole page. That is what the reference does,
 * and it is why its page reads as organised rather than as a stack of
 * announcements.
 *
 * The way on sits under the sentence, not across from it. It used to go to the
 * opposite margin, which is right when a row of cards runs under the heading
 * and holds that margin down — and every heading that had cards under it has
 * since had its button moved into the row of arrows, where the two ends of the
 * row both mean something. What was left was one band with no cards, on a shell
 * that keeps widening past the laptop sizes: a lone pill six hundred pixels
 * from the last word, with nothing in between. Under the sentence it belongs to
 * the sentence.
 *
 * `align="center"` survives for the two places a centred block is still right —
 * a short closing line over a photograph, where there is no column to belong to.
 */
export function SectionHeading({
  title,
  lead,
  eyebrow,
  tone = 'ink',
  align = 'start',
  action,
  className,
  immediate = false,
  as: Tag = 'h2',
}: {
  title: string
  lead?: string
  /** Small label above the headline — what kind of thing this section is. */
  eyebrow?: string
  tone?: 'ink' | 'light'
  align?: 'center' | 'start'
  /** The way out of the section, set under the sentence. */
  action?: { href: string; label: string; external?: boolean }
  className?: string
  /** Paint at once rather than fading in — for headings above the fold. */
  immediate?: boolean
  as?: 'h1' | 'h2'
}) {
  const centred = align === 'center'

  const link =
    action &&
    (action.external ? (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(tone === 'light' ? btnOnDark : btnOutline, btnSmall, 'shrink-0')}
      >
        {action.label}
      </a>
    ) : (
      <Link
        href={action.href}
        className={cn(tone === 'light' ? btnOnDark : btnOutline, btnSmall, 'shrink-0')}
      >
        {action.label}
      </Link>
    ))

  return (
    <Reveal
      immediate={immediate}
      className={cn(centred && 'mx-auto max-w-3xl text-center', className)}
    >
      <div className={cn(!centred && 'max-w-2xl')}>
        {eyebrow && (
          <p className={cn('eyebrow mb-3.5', tone === 'light' && 'text-brass')}>{eyebrow}</p>
        )}

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

        {link && <div className="mt-7">{link}</div>}
      </div>
    </Reveal>
  )
}

/**
 * A small heading with a rule running out past it, for separating a list from
 * the band above where a full-size heading would be too much weight.
 *
 * The rule used to run out on both sides with the heading floating in the
 * middle of it. That is a centred treatment, and it went with the rest of them
 * — a heading suspended between two hairlines lines up with nothing on the
 * page. It starts on the leading edge now and the rule runs out from it.
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
      <h2
        className={cn(
          'font-display text-2xl sm:text-[1.7rem]',
          tone === 'light' ? 'text-white' : 'text-ink',
        )}
      >
        {title}
      </h2>
      <span aria-hidden="true" className={cn('h-px flex-1', rule)} />
    </div>
  )
}
