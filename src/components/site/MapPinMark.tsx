/**
 * A map pin. Sits on the third button in the corner of a phone screen, beside
 * WhatsApp and Instagram, and opens the hotel on Google Maps.
 *
 * Filled rather than outlined, unlike the Instagram mark: those two sit at 16px
 * beside a hotel's name in the footer, where an outline is quiet enough not to
 * compete with the name. This one is only ever drawn at 24px on a coloured
 * circle, where an outline would look like a pin somebody forgot to finish.
 *
 * The dot is punched out of the pin rather than drawn over it, so the circle's
 * own colour shows through and the mark stays legible whatever it sits on.
 */
export function MapPinMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 1.75a7.75 7.75 0 0 0-7.75 7.75c0 5.06 6.02 11.4 7.19 12.58a.79.79 0 0 0 1.12 0c1.17-1.18 7.19-7.52 7.19-12.58A7.75 7.75 0 0 0 12 1.75Zm0 10.55a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z"
      />
    </svg>
  )
}
