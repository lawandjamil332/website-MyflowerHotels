'use client'

/**
 * "Save as PDF", on the one page that was built to become one.
 *
 * The confirmation page has had a print stylesheet since it was written — it
 * drops the navigation, the buttons and the site furniture and leaves a clean
 * sheet. What it never had was anything telling a guest that, or any way to do
 * it that was not the browser's own menu, three taps deep on a phone. So
 * guests screenshot the page and send the picture to the front desk, which is
 * exactly what the page exists to prevent.
 *
 * window.print() is the whole implementation, and that is deliberate. Every
 * browser's print dialog offers "Save as PDF" — it is the default destination
 * on desktop Chrome and a share-sheet option on iOS and Android — so this
 * produces a real PDF file the guest can forward or show at the desk.
 *
 * It also produces a *correct* one, which is the part that matters here. This
 * site takes bookings in Arabic and Kurdish, and the browser is the only thing
 * in the stack that does right-to-left shaping and bidi properly. A PDF built
 * on the server with an ordinary PDF library would render Arabic as
 * disconnected letters in the wrong order — worse than no PDF at all.
 */
export function PrintButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  )
}
