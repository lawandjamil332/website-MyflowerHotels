import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * A link that opens one booking and no other.
 *
 * The manage-booking form asks for a reference and the phone number it was
 * made with, which is right for somebody typing at a keyboard: references are
 * short enough to read down a telephone, therefore short enough to guess, so
 * one alone must never be enough.
 *
 * A link out of the confirmation email is a different situation. Whoever
 * opens it already has the email, so they already have everything the form
 * would ask for — making them retype it is a checkpoint that stops nobody and
 * annoys the person it was written for. This signs the reference instead: the
 * link carries proof it was issued by this site, and a reference typed into
 * the address bar by hand opens nothing.
 *
 * Signed with PAYLOAD_SECRET, which is already the thing every session on this
 * site is trusted against, and truncated to 16 hex characters — 64 bits, far
 * past guessing, and short enough not to wrap into two lines in an email.
 */
const secret = () => process.env.PAYLOAD_SECRET || ''

export const signReference = (reference: string): string =>
  createHmac('sha256', secret()).update(`booking:${reference.toUpperCase()}`).digest('hex').slice(0, 16)

/**
 * Compared in constant time. A plain `===` on a signature leaks how much of a
 * guess was right through how long the comparison took, which is the whole
 * attack against this kind of check.
 */
export const verifyReference = (reference: string, token: string): boolean => {
  if (!secret() || !reference || !token) return false
  const expected = signReference(reference)
  if (expected.length !== token.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}
