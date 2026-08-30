import type { Payload } from 'payload'

import { feedEnabled, feedNights, resultFor, transaction } from './googleFeed'

/**
 * Telling Google the moment a price changes, rather than waiting to be asked.
 *
 * There was never a second price list — /google/rates.xml has always been built
 * from the same calendar the website sells from. What was missing is the timing.
 * A feed you serve is a feed Google collects when Google feels like it, which
 * for a hotel is the wrong way round: the whole value of setting Friday to
 * 180,000 at nine in the morning is that Friday costs 180,000 from nine in the
 * morning. Google's ARI endpoint is built to be pushed to for exactly this
 * reason.
 *
 * So every write to the calendar sends the nights it touched, and nothing else.
 * Editing one cell posts one Result; a booking that fills the last room posts
 * that room's nights. Small messages, immediately, rather than ninety days of
 * everything on a timer.
 *
 * Three things this deliberately does not do.
 *
 * It does not block. A push is fired and forgotten by its callers, because a
 * member of staff typing a price should never wait on Google, and Google being
 * slow or down must never be the reason a price fails to save. The price is in
 * the database either way; the push is how fast Google hears about it, not
 * whether it is true.
 *
 * It does not retry in a loop. A failure is logged and the next edit will carry
 * the same nights again, and /google/rates.xml still serves the whole ninety
 * days for Google to re-read. Somewhere to fall back to is worth more than a
 * queue nobody is watching.
 *
 * And it does nothing at all until it is configured. No endpoint, no
 * credentials, or the switch in Site settings off, and every call here returns
 * quietly. Until a Hotel Center account exists there is nowhere to push to, and
 * a site that tried anyway would fill its log with failures on every keystroke.
 */

export type Target = { roomId: number; date: string }

const config = () => ({
  endpoint: process.env.GOOGLE_ARI_ENDPOINT,
  password: process.env.GOOGLE_ARI_PASSWORD,
  username: process.env.GOOGLE_ARI_USERNAME,
})

/** Google's ARI endpoint takes HTTP Basic, with credentials from Hotel Center. */
const authorisation = (username: string, password: string) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`

const iso = (date: Date) => date.toISOString().slice(0, 10)

/**
 * Sends the nights somebody just changed.
 *
 * The window is worked out from the targets themselves — earliest to latest —
 * so a single edited cell reads one day of one room out of the database rather
 * than rebuilding the quarter.
 */
export const pushNights = async (payload: Payload, targets: Target[]): Promise<void> => {
  const { endpoint, password, username } = config()
  if (!endpoint || !username || !password) return
  if (targets.length === 0) return
  if (!(await feedEnabled(payload))) return

  const wanted = new Set(targets.map((target) => `${target.roomId}:${target.date}`))
  const roomIds = [...new Set(targets.map((target) => target.roomId))]
  const times = targets.map((target) => new Date(`${target.date}T00:00:00.000Z`).getTime())
  const from = new Date(Math.min(...times))
  const days = Math.round((Math.max(...times) - Math.min(...times)) / 86_400_000) + 1

  // Google is told about the future. A price set on a night that has already
  // passed is a correction to the books, not something anybody can still book,
  // and sending it would be asking Google to sell yesterday.
  const today = iso(new Date())

  const nights = (await feedNights(payload, { days, from, roomIds })).filter(
    (night) => wanted.has(`${night.roomId}:${night.date}`) && night.date >= today,
  )

  if (nights.length === 0) return

  await send(payload, transaction(nights.map(resultFor)), nights.length)
}

/**
 * Everything for the whole window.
 *
 * For the first upload after an account is connected, and for a scheduled
 * catch-up: a push that failed is a night Google still has the old price for,
 * and a nightly full send puts a floor under how wrong it can get.
 */
export const pushEverything = async (payload: Payload): Promise<void> => {
  const { endpoint, password, username } = config()
  if (!endpoint || !username || !password) return
  if (!(await feedEnabled(payload))) return

  const nights = await feedNights(payload)
  if (nights.length === 0) return

  await send(payload, transaction(nights.map(resultFor)), nights.length)
}

const send = async (payload: Payload, body: string, count: number): Promise<void> => {
  const { endpoint, password, username } = config()
  if (!endpoint || !username || !password) return

  try {
    const response = await fetch(endpoint, {
      body,
      headers: {
        Authorization: authorisation(username, password),
        'Content-Type': 'application/xml; charset=utf-8',
      },
      method: 'POST',
      // A hotel's price is not worth a hung request. Ten seconds is far longer
      // than this ever takes and short enough that a dead endpoint does not
      // pile up connections.
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      payload.logger.warn(
        `Google feed: ${count} night(s) refused — HTTP ${response.status}. ` +
          'The prices are correct on the site and in /google/rates.xml; Google has the old ones.',
      )
      return
    }

    payload.logger.info(`Google feed: sent ${count} night(s)`)
  } catch (error) {
    payload.logger.warn(
      `Google feed: ${count} night(s) could not be sent — ${
        error instanceof Error ? error.message : 'unknown error'
      }. The site is unaffected; Google has the old prices until the next change.`,
    )
  }
}

/**
 * Every night of a stay, as targets — for when a booking changes what is left.
 *
 * A booking is the other thing that moves availability, and the more urgent
 * one: a room sold on the website that Google still thinks is free is how a
 * hotel ends up with two guests for it.
 */
export const nightsOfStay = (roomId: number, checkIn: Date, checkOut: Date): Target[] => {
  const out: Target[] = []
  const start = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate())
  const end = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate())

  for (let time = start; time < end; time += 86_400_000) {
    out.push({ date: iso(new Date(time)), roomId })
    // A stay longer than a season is a data error, not a booking; stopping is
    // better than generating a thousand targets from one bad row.
    if (out.length > 120) break
  }

  return out
}
