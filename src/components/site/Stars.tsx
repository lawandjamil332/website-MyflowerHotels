import { cn } from '@/utilities/ui'

/**
 * The group's classification, set small.
 *
 * A star rating is the one piece of shorthand a traveller in this market reads
 * before anything else, so it earns a place near the name — but drawn at
 * caption size, not as a row of badges.
 *
 * Two greys: the readable one on a light ground, the pale one over a
 * photograph. It was drawn in brass and bronze when the palette had a metal in
 * it; with no colour on the page a gold star would be the one coloured thing on
 * it besides the logo, which is the opposite of what the palette is for. The
 * darker grey on light rather than the pale one because the pale one is 2.3:1
 * there — fine for a hairline, not for a shape somebody is meant to count.
 */
export function Stars({
  count,
  label,
  className,
  tone = 'brand',
}: {
  count?: string | number | null
  /**
   * What a screen reader says instead of counting shapes — "Star rating", in
   * the language of the page. It was the English phrase "4-star hotel"
   * written into the markup, which nobody could see was wrong because nobody
   * looking at the page ever sees it.
   */
  label: string
  className?: string
  tone?: 'brand' | 'light'
}) {
  const n = Number(count)
  if (!Number.isFinite(n) || n < 1) return null

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-label={`${label}: ${n}`}
    >
      {Array.from({ length: Math.min(n, 5) }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn(
            'h-2.5 w-2.5 fill-current',
            tone === 'light' ? 'text-mist' : 'text-slate',
          )}
        >
          <path d="M12 1.6l3.09 6.26 6.91 1.01-5 4.87 1.18 6.88L12 17.37l-6.18 3.25L7 13.74l-5-4.87 6.91-1.01z" />
        </svg>
      ))}
    </span>
  )
}
