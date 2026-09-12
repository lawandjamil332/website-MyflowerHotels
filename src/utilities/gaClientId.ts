/**
 * Reads the id Google gave this browser, so a booking reported from the server
 * joins the visit that produced it.
 *
 * Without it the server's booking event arrives as a person who booked without
 * ever visiting the site: a phantom user with one event and no history. The
 * funnel then breaks exactly where it is most needed — searches and form-fills
 * under one user, the booking they led to under another — and the conversion
 * rate, the one number this whole exercise exists to produce, is nonsense.
 *
 * `gtag('get', ...)` answers through a callback rather than returning, because
 * the value may not exist yet when it is asked for. So this wraps it in a
 * promise with a deadline: a guest pressing Book must never wait on Google,
 * and a booking reported without an id is worth far more than a booking
 * delayed for one.
 *
 * Returns null when the script is blocked, which is common and is the case
 * this is all built around. The server handles that; see analyticsServer.ts.
 */

type Gtag = (
  command: 'get',
  target: string,
  field: string,
  callback: (value?: string) => void,
) => void

export const gaClientId = (measurementId: string, timeoutMs = 800): Promise<string | null> =>
  gaField(measurementId, 'client_id', timeoutMs)

/**
 * The id of the visit, as distinct from the browser.
 *
 * Without it a booking reported from the server belongs to the right person
 * and to no particular visit, and every session-scoped figure — "how many of
 * the people who searched went on to book" — reads zero while the bookings
 * themselves are counted correctly. That is the most misleading of the two
 * failures, because nothing looks broken.
 */
export const gaSessionId = (measurementId: string, timeoutMs = 800): Promise<string | null> =>
  gaField(measurementId, 'session_id', timeoutMs)

const gaField = (measurementId: string, field: string, timeoutMs: number): Promise<string | null> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null)

    const gtag = (window as unknown as { gtag?: Gtag }).gtag
    if (typeof gtag !== 'function') return resolve(null)

    // Whichever happens first wins, and `settled` is what stops the late one
    // resolving a promise that already answered.
    let settled = false
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const timer = window.setTimeout(() => finish(null), timeoutMs)

    try {
      gtag('get', measurementId, field, (value) => {
        window.clearTimeout(timer)
        finish(value ?? null)
      })
    } catch {
      window.clearTimeout(timer)
      finish(null)
    }
  })
