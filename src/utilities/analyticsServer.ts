import type { Payload } from 'payload'

/**
 * Reports a booking to Google Analytics from the server, where the booking
 * actually happened.
 *
 * The browser already sends the steps a guest takes — searching, opening the
 * form, pressing WhatsApp — because those are things that happen in a browser
 * and nowhere else. A booking is different. A booking is a fact about the
 * business, and it exists in the database whether or not the guest's phone was
 * willing to tell Google about it.
 *
 * That distinction is the whole point of this file. A large share of mobile
 * traffic blocks Google's script outright — content blockers, private
 * browsers, Brave, phones set to block trackers. Reported from the browser
 * alone, every one of those bookings is invisible. The visits still count,
 * because a blocked script also blocks nothing else this site cares about, but
 * the bookings do not. So the reports show a healthy stream of visitors and
 * far too few bookings, and the site looks to be failing at exactly the thing
 * it is succeeding at. Worse, the error is not random: it lands hardest on the
 * guests most careful about their phones, so no amount of averaging removes
 * it.
 *
 * Sent here instead, over Google's Measurement Protocol — a plain HTTPS
 * request from this server to Google, with nothing in the guest's browser able
 * to stop it.
 *
 * THE CLIENT ID IS WHAT MAKES IT ONE STORY. Google identifies a browser by a
 * client id it puts in a cookie. A server event sent without one arrives as a
 * booking by a person who never visited the site — a phantom user, unattached
 * to the search and the form-fill that led to it, and the funnel breaks in
 * half. So the booking form reads that id out of the browser and posts it
 * along with the booking, and it is passed through here. Where it is missing —
 * the guest blocked the script entirely, so there is no id to read — the
 * booking is still reported, standing alone rather than not at all.
 *
 * Nothing here can affect a booking. Every failure is swallowed and logged;
 * the booking was committed long before this runs.
 */

type BookingEventParams = {
  hotel?: string | null
  room?: string | null
  nights?: number | null
  guests?: number | null
  value?: number | null
  currency?: string | null
  locale?: string | null
}

/** Google's collection endpoint for the Measurement Protocol. */
const ENDPOINT = 'https://www.google-analytics.com/mp/collect'

/**
 * A client id for an event with no browser behind it.
 *
 * Google requires the field, so a booking taken with the script blocked still
 * needs one. It is deliberately random per event rather than a fixed string:
 * one shared id would file every such booking under a single user who books
 * thirty times a month, which is worse than thirty separate strangers because
 * it also corrupts the user counts around it.
 */
const anonymousClientId = (): string =>
  `${Math.floor(Math.random() * 1_000_000_000)}.${Math.floor(Date.now() / 1000)}`

export const reportBookingEvent = async (
  payload: Payload,
  event: 'booking_confirmed' | 'booking_cancelled',
  clientId: string | null | undefined,
  params: BookingEventParams,
): Promise<void> => {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  const apiSecret = process.env.GA_API_SECRET?.trim()

  // Not configured is the ordinary state on a developer's machine and in the
  // test suite, and it is silent on purpose — start-up already says once
  // whether analytics is on, and repeating it per booking would bury the log.
  if (!measurementId || !apiSecret) return

  // Undefined and empty values are dropped rather than sent, so a report does
  // not fill with rows reading "undefined" that look like data.
  const clean: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') clean[key] = value
  }

  try {
    const response = await fetch(
      `${ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId || anonymousClientId(),
          // Marks the event as having happened without the guest present, so
          // Google does not treat it as a sign of life and extend a session
          // that ended when they closed the page.
          non_personalized_ads: true,
          events: [{ name: event, params: clean }],
        }),
        // A booking must never wait on Google. This is already called without
        // being awaited; the timeout is the second guarantee, for the case
        // where the request hangs rather than fails.
        signal: AbortSignal.timeout(5_000),
      },
    )

    // Google answers 204 on success and, unhelpfully, 2xx for most malformed
    // payloads too — the validation endpoint is a separate address. So this
    // catches transport failures, not bad data.
    if (!response.ok) {
      payload.logger.warn(
        `Analytics: ${event} was refused by Google with HTTP ${response.status}. ` +
          `The booking is unaffected; only the reporting of it is.`,
      )
    }
  } catch (error) {
    payload.logger.warn(
      `Analytics: ${event} could not be reported — ${error}. The booking is unaffected.`,
    )
  }
}
