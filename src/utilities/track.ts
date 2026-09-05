/**
 * Sends one named event to Google Analytics, and nothing at all when there is
 * no Google Analytics.
 *
 * Analytics on its own answers "how many people came". It cannot answer the
 * question that decides whether this website is worth anything — how many of
 * them booked — because a booking here finishes on a page like any other, with
 * no payment page and no redirect back from a card processor to give the game
 * away. So the site has to say so itself, and this is how it says it.
 *
 * Every call is safe. If the measurement ID is not set, or the script is
 * blocked, or the guest's browser refuses it, `gtag` is simply not there and
 * this returns without doing anything. Nothing on this site may ever fail
 * because a measurement did.
 *
 * WHAT IS DELIBERATELY NOT SENT: the guest's name, telephone number, email
 * address, or booking reference. Google's own terms forbid sending it
 * personally identifiable information, and beyond the rule it is simply not
 * ours to hand over — a guest gave those to a hotel in Erbil, not to an
 * advertising company. What goes is the shape of the booking: which hotel, how
 * many nights, how many guests, what it came to. That is everything needed to
 * read the business and nothing that names a person.
 */

type Params = Record<string, string | number | boolean | undefined | null>

type Gtag = (command: string, eventName: string, params?: Record<string, unknown>) => void

export const track = (event: string, params: Params = {}): void => {
  if (typeof window === 'undefined') return

  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  if (typeof gtag !== 'function') return

  // Undefined values are dropped rather than sent as the string "undefined",
  // which is what they become inside Google's reports otherwise — a column of
  // rows reading "undefined" that looks like data and is not.
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') clean[key] = value
  }

  try {
    gtag('event', event, clean)
  } catch {
    // A measurement is never worth an error in front of a guest.
  }
}

/**
 * The events this site sends, named in one place.
 *
 * Written down as constants rather than typed as strings at each call site
 * because Google treats a misspelling as a new kind of event rather than an
 * error: `booking_confirmd` would quietly become its own row in the reports,
 * and the real one would appear to have stopped happening.
 */
export const EVENTS = {
  /** The availability form was submitted — somebody looked for a room. */
  search: 'availability_search',
  /** A room was chosen and the details form submitted. */
  bookingStarted: 'booking_started',
  /** The booking exists. This is the one that matters. */
  bookingConfirmed: 'booking_confirmed',
  /** The enquiry form was sent. */
  enquiry: 'enquiry_sent',
  /** A WhatsApp button was pressed, anywhere on the site. */
  whatsapp: 'whatsapp_click',
  /** A telephone number was pressed. */
  phone: 'phone_click',
} as const
