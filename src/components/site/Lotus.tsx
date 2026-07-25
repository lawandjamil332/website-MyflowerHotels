import { cn } from '@/utilities/ui'

/**
 * The house mark: a five-petal lotus, drawn from the flower in the group's
 * logo and reduced to one colour so it sits inside the palette instead of
 * fighting it. Also the favicon.
 *
 * A stand-in until the real logo file is uploaded in Site settings, at which
 * point the header shows that instead.
 */
export function Lotus({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('fill-current', className)}
    >
      <path d="M 2.04 39.79 C 14.72 40.87 23.04 49.03 25.00 52.00 C 21.45 52.04 10.03 49.70 2.04 39.79 Z" />
      <path d="M 9.34 22.65 C 22.95 32.59 27.82 47.37 28.40 52.00 C 24.40 49.59 12.88 39.12 9.34 22.65 Z" />
      <path d="M 32.00 9.00 C 38.60 28.35 34.24 46.84 32.00 52.00 C 29.76 46.84 25.40 28.35 32.00 9.00 Z" />
      <path d="M 54.66 22.65 C 51.12 39.12 39.60 49.59 35.60 52.00 C 36.18 47.37 41.05 32.59 54.66 22.65 Z" />
      <path d="M 61.96 39.79 C 53.97 49.70 42.55 52.04 39.00 52.00 C 40.96 49.03 49.28 40.87 61.96 39.79 Z" />
    </svg>
  )
}
