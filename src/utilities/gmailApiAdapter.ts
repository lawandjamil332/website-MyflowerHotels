import type { EmailAdapter } from 'payload'

/**
 * Sends mail as a real Gmail account, over the ordinary web — not the
 * old-fashioned mail-server connection Railway blocks outbound.
 *
 * Gmail can be reached two ways: the classic way (SMTP, a direct connection to
 * smtp.gmail.com) and Google's own web API for it. Both end up sending from the
 * same inbox. Only the first is blocked here — Railway's network refused every
 * SMTP port tried, with the identical failure on each, which is what a
 * firewall dropping a connection looks like, not what Gmail rejecting one
 * looks like. The API is an ordinary HTTPS request, the same kind of traffic
 * every other part of this site already makes without being blocked.
 *
 * What it needs, once, from Google Cloud: a client id and secret for the
 * project, and a refresh token obtained by signing in as the Gmail account
 * being sent from. The refresh token does not expire on its own — Google
 * revokes it only if the owner removes the app's access, or leaves it
 * completely unused for six months — and it is what lets this run
 * unattended: every actual send exchanges it for a short-lived access token,
 * cached here for the hour it is valid so most sends cost no extra request.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

export type GmailApiAdapterArgs = {
  clientId: string
  clientSecret: string
  refreshToken: string
  defaultFromAddress: string
  defaultFromName: string
}

/**
 * Base64url — the alphabet Gmail's API requires (`-`/`_` in place of the
 * ordinary `+`/`/`, and the padding dropped), not the ordinary base64 that
 * Buffer produces by default.
 */
const base64url = (input: string): string =>
  Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/**
 * A subject line survives non-ASCII (Arabic, Kurdish) only if it is encoded
 * per RFC 2047; left plain, a mail client is free to mangle anything outside
 * ASCII. Plain ASCII is sent as-is — encoding a subject that does not need it
 * is one more way to typo an email header by hand.
 */
const encodeSubject = (subject: string): string =>
  /^[\x20-\x7E]*$/.test(subject)
    ? subject
    : `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`

const buildRawMessage = (args: {
  from: string
  fromName: string
  to: string
  subject: string
  text: string
}): string => {
  const message =
    `From: ${args.fromName} <${args.from}>\r\n` +
    `To: ${args.to}\r\n` +
    `Subject: ${encodeSubject(args.subject)}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n` +
    `Content-Transfer-Encoding: 7bit\r\n\r\n` +
    args.text
  return base64url(message)
}

/**
 * The access token Gmail's send endpoint actually accepts, refreshed only
 * when the cached one is missing or about to expire. Module-level, not
 * per-request: this process runs continuously (`next start`, not a
 * serverless function that restarts cold on every request), so a token good
 * for the next fifty minutes should not be re-requested on the next booking
 * that happens to arrive thirty seconds later.
 *
 * Keyed by which credentials asked for it, not a single shared slot — one
 * account's token must never be handed back for a different account's
 * request, which a single slot would risk the moment this adapter is ever
 * configured more than once (as it is, deliberately, in the tests for this
 * file, and would be for real if a second Gmail account were ever added).
 */
const tokenCache = new Map<string, { value: string; expiresAt: number }>()

const getAccessToken = async (args: GmailApiAdapterArgs): Promise<string> => {
  const cacheKey = `${args.clientId}:${args.refreshToken}`
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.value
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: args.clientId,
      client_secret: args.clientSecret,
      refresh_token: args.refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    // Thrown, not swallowed: every caller of sendEmail already catches and
    // logs whatever this raises, with the booking or enquiry it belongs to
    // attached — this only needs to say clearly what went wrong.
    throw new Error(`Gmail token refresh failed (${response.status}): ${body.slice(0, 300)}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  const entry = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  tokenCache.set(cacheKey, entry)
  return entry.value
}

/** The one shape every call in this codebase actually uses: to, subject, text. */
const asRecipientString = (to: unknown): string => {
  if (typeof to === 'string') return to
  if (Array.isArray(to)) {
    return to
      .map((t) => (typeof t === 'string' ? t : (t as { address: string }).address))
      .join(', ')
  }
  if (to && typeof to === 'object' && 'address' in to) return (to as { address: string }).address
  return ''
}

export const gmailApiAdapter = (args: GmailApiAdapterArgs): EmailAdapter => {
  return () => ({
    name: 'gmail-api',
    defaultFromAddress: args.defaultFromAddress,
    defaultFromName: args.defaultFromName,
    sendEmail: async (message) => {
      const accessToken = await getAccessToken(args)

      const raw = buildRawMessage({
        from: args.defaultFromAddress,
        fromName: args.defaultFromName,
        to: asRecipientString(message.to),
        subject: message.subject ?? '',
        text: typeof message.text === 'string' ? message.text : '',
      })

      const response = await fetch(SEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Gmail send failed (${response.status}): ${body.slice(0, 300)}`)
      }

      return response.json()
    },
  })
}
