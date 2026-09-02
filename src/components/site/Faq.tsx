import type { FaqEntry } from '@/utilities/faq'
import { cn } from '@/utilities/ui'

/**
 * The questions, as a list that opens.
 *
 * Built on <details> rather than JavaScript, for the same reason the rest of
 * this site is: it works before any script has run, it works if none ever
 * does, and a search engine reads the answers whether or not it opens them.
 * A scripted accordion that hides its content behind a click is content
 * Google may decide not to count.
 *
 * The first one starts open. Somebody who has scrolled this far has a
 * question, and a wall of identical closed rows is a wall.
 */
export function Faq({
  entries,
  title,
  eyebrow,
  lead,
}: {
  entries: FaqEntry[]
  title: string
  /** Small label above the heading, when the block is a section of a page. */
  eyebrow?: string
  /** One sentence beside the heading in the two-column layout. */
  lead?: string
}) {
  if (entries.length === 0) return null

  const list = (
    <div className="divide-y divide-line border-y border-line">
      {entries.map((entry, i) => (
        <details key={entry.q} open={i === 0} className="group flow-root">
          <summary
            className={cn(
              'tap-safe flex cursor-pointer list-none items-center justify-between gap-6 py-5',
              'text-[1.02rem] font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden',
            )}
          >
            {entry.q}
            {/* Rotates to a minus when open. Drawn rather than a character so
                  it cannot be mirrored oddly in the right-to-left languages. */}
            <span
              aria-hidden="true"
              className="relative h-4 w-4 shrink-0 text-brand transition-transform duration-300 group-open:rotate-45"
            >
              <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
              <span className="absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-current" />
            </span>
          </summary>
          <p className="pb-6 text-[1rem] leading-relaxed text-ink-soft">{entry.a}</p>
        </details>
      ))}
    </div>
  )

  // Heading on the leading edge, questions across from it.
  //
  // The block used to be one centred column in the middle of the band, which
  // left both margins empty and put its heading on a different axis to every
  // other heading on the page. Facing the two halves off fills the band, keeps
  // the heading on the same line as the rest of the site, and gives the
  // questions a narrower measure — which is what a list of one-line questions
  // wants anyway. It stacks on a phone, where there are no two halves.
  return (
    <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
      <div className="lg:sticky lg:top-[calc(var(--site-header-h,4.5rem)+5rem)] lg:self-start">
        {eyebrow && <p className="eyebrow mb-3.5">{eyebrow}</p>}
        <h2 className="font-display display-lg text-balance text-ink">{title}</h2>
        {lead && (
          <p className="mt-4 max-w-sm text-[1.05rem] leading-[1.6] text-muted-ink">{lead}</p>
        )}
      </div>
      {list}
    </div>
  )
}
