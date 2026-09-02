import { cn } from '@/utilities/ui'

/**
 * The group's classification, set small.
 *
 * A star rating is the one piece of shorthand a traveller in this market reads
 * before anything else, so it earns a place near the name — but drawn at
 * caption size, not as a row of badges.
 *
 * Bronze on a light ground and brass over a photograph. A star rating wants to
 * be metallic — a grey one reads as a bullet and a gold one reads as a rating
 * without anybody being told. Bronze rather than brass on ivory because brass
 * on ivory is 2.8:1, which is fine for a hairline and not for a shape somebody
 * is meant to count.
 */
export function Stars({
  count,
  className,
  tone = 'brand',
}: {
  count?: string | number | null
  className?: string
  tone?: 'brand' | 'light'
}) {
  const n = Number(count)
  if (!Number.isFinite(n) || n < 1) return null

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-label={`${n}-star hotel`}
    >
      {Array.from({ length: Math.min(n, 5) }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn(
            'h-2.5 w-2.5 fill-current',
            tone === 'light' ? 'text-brass' : 'text-bronze',
          )}
        >
          <path d="M12 1.6l3.09 6.26 6.91 1.01-5 4.87 1.18 6.88L12 17.37l-6.18 3.25L7 13.74l-5-4.87 6.91-1.01z" />
        </svg>
      ))}
    </span>
  )
}
