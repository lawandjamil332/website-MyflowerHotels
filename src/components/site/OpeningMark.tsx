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
        'inline-block border px-3 py-1.5 text-[0.6rem] tracking-[0.2em] uppercase rtl:tracking-normal',
        tone === 'light' ? 'border-white/40 text-white' : 'border-brand/60 text-brand',
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
