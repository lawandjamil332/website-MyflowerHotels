import { cn } from '@/utilities/ui'

/**
 * Marks a hotel that is announced but not yet taking guests.
 *
 * An outline rather than a filled badge: this is a statement of fact, not a
 * promotion, and a coloured chip would shout louder than the hotels that are
 * actually open.
 */
export function OpeningMark({
  label,
  tone = 'ink',
  className,
}: {
  label: string
  tone?: 'ink' | 'light'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.14em] uppercase rtl:tracking-normal',
        tone === 'light'
          ? 'border-white/50 bg-bark/55 text-white backdrop-blur-sm'
          : 'border-brand/50 text-brand',
        className,
      )}
    >
      {label}
    </span>
  )
}

/** The hotel's own wording when set, otherwise the standard notice. */
export const openingLabel = (
  branch: { status?: string | null; openingNote?: string | null },
  fallback: string,
): string => branch.openingNote?.trim() || fallback

export const isOpeningSoon = (branch: { status?: string | null }): boolean =>
  branch.status === 'openingSoon'
