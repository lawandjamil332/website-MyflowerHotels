import { headers } from 'next/headers'

/**
 * A cheap brake on forms that anyone can post at.
 *
 * Sign-in does not need this — Payload locks a guest account after ten wrong
 * passwords. The booking lookup does, and for the opposite reason: there is no
 * account to lock. It is a reference and a phone number, and someone who has
 * one of the two can sit there grinding at the other. Six characters is a large
 * space to search, but "large" is only a defence if each guess costs something.
 *
 * Kept in memory on purpose. A shared store would be strictly better and is
 * worth having if the site ever runs on more than one machine, but a limiter
 * that needs Redis to exist is a limiter that is switched off the day Redis is
 * unreachable. This one has no dependencies, so it cannot be the reason
 * anything is down, and it holds for exactly as long as the process does.
 */

type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()

// Bounded so a stream of one-shot keys — a different IP each time — cannot
// grow this without limit. Old entries are already dead weight by then.
const MAX_KEYS = 20_000

const sweep = (now: number): void => {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

/**
 * Counts one attempt against `key`. Returns false when the caller has had its
 * allowance for this window, which the caller should treat as a refusal rather
 * than as an error — telling somebody they are being throttled tells them their
 * guesses are landing somewhere.
 */
export const allow = (key: string, limit: number, windowMs: number): boolean => {
  const now = Date.now()
  if (windows.size > MAX_KEYS) sweep(now)

  const existing = windows.get(key)
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  existing.count += 1
  return existing.count <= limit
}

/**
 * Whoever is asking, as well as it can be known.
 *
 * Behind a proxy the socket address is the proxy's, so the forwarded header is
 * what there is. It can be forged — which matters less than it sounds, since
 * forging it costs an attacker nothing but also buys them nothing beyond what a
 * pool of real addresses already would.
 */
export const callerKey = async (prefix: string): Promise<string> => {
  try {
    const head = await headers()
    const forwarded = head.get('x-forwarded-for')?.split(',')[0]?.trim()
    const ip = forwarded || head.get('x-real-ip') || 'unknown'
    return `${prefix}:${ip}`
  } catch {
    return `${prefix}:unknown`
  }
}
