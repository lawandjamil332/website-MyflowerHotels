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
      gtag('get', measurementId, 'client_id', (value) => {
        window.clearTimeout(timer)
        finish(value ?? null)
      })
    } catch {
      window.clearTimeout(timer)
      finish(null)
    }
  })
