/**
 * The Instagram glyph. Drawn rather than labelled because it sits beside a
 * hotel's name in the footer, where the name is the link people read and the
 * mark only has to say where the second link goes. Outlined to sit quietly on
 * the navy ground — a filled logo at this size reads as a button.
 */
export function InstagramMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.25" />
      <circle cx="12" cy="12" r="4.15" />
      <circle cx="17.3" cy="6.7" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}
