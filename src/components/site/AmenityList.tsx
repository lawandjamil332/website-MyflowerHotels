import type { Dictionary } from '@/i18n/dictionaries'
import { cn } from '@/utilities/ui'

/**
 * Amenities as a hairline-ruled list rather than a row of icon tiles. The
 * brief rules out floating icon cards, and a hotel's facilities read faster
 * as a plain index anyway.
 */
export function AmenityList({
  amenities,
  t,
  className,
  columns = 3,
}: {
  amenities: string[]
  t: Dictionary
  className?: string
  columns?: 2 | 3
}) {
  if (amenities.length === 0) return null

  return (
    <ul
      className={cn(
        'grid gap-x-10 border-t border-line sm:grid-cols-2',
        columns === 3 && 'lg:grid-cols-3',
        className,
      )}
    >
      {amenities.map((amenity) => (
        <li
          key={amenity}
          className="flex items-center gap-3 border-b border-line py-4 text-sm text-ink-soft"
        >
          <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-brass" />
          {t.amenity[amenity] ?? amenity}
        </li>
      ))}
    </ul>
  )
}
