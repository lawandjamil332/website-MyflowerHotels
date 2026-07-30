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
export function Faq({ entries, title }: { entries: FaqEntry[]; title: string }) {
  if (entries.length === 0) return null

  return (
    <div>
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
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
    </div>
  )
}
