/**
 * Who gets told, when several places could each hold an address.
 *
 * A hotel's own email, the site-wide one, and ENQUIRY_NOTIFY_EMAIL used to be
 * tried in order and only the first non-empty one used — so an address typed
 * into any earlier field silently stopped the others from ever being reached,
 * with nothing on screen to say so. The owner setting ENQUIRY_NOTIFY_EMAIL
 * specifically because nothing was arriving would still get nothing, for a
 * reason invisible from the admin panel.
 *
 * Every address that is actually set now gets a copy. Nothing is silently
 * suppressed by an earlier field, whether or not anybody remembers it is there.
 */
export const notifyRecipients = (...addresses: (string | null | undefined)[]): string | null => {
  const unique = Array.from(
    new Set(addresses.map((a) => a?.trim()).filter((a): a is string => Boolean(a))),
  )
  return unique.length > 0 ? unique.join(', ') : null
}
