import { createHmac, timingSafeEqual } from 'node:crypto'

import type {
  CallbackVerdict,
  PaymentProvider,
  StartPaymentInput,
  StartPaymentResult,
} from '../types'

/**
 * THE ADAPTER. This is the file the processor's integration call is about.
 *
 * Everything around it is finished and tested. What is here is the standard
 * hosted-redirect flow with the six things only the processor can tell us
 * marked ① to ⑥ below. Filling those in is the integration; nothing else in
 * this repository needs to change, and no page, route, database column or
 * email has to be touched again.
 *
 * ---------------------------------------------------------------------------
 * THE SIX ANSWERS TO GET ON THE CALL
 *
 *   ① The URL to ask for a payment, and how to authenticate to it.
 *      (Usually POST + a bearer token or an API key header.)
 *   ② The exact field names they want in that request.
 *   ③ Where the redirect URL is in their reply.
 *   ④ How they sign the webhook, and over what.
 *   ⑤ Which of their status words mean "the money is taken".
 *   ⑥ Whether IQD is sent as whole dinars or as fils — see money.ts. This one
 *      is worth a thousand times more than the other five put together.
 *
 * ---------------------------------------------------------------------------
 * WHAT NOT TO AGREE TO
 *
 * If they offer an integration where the card number is posted from this site
 * rather than typed on theirs, decline it. It puts the hotel inside the full
 * PCI audit for no benefit a guest can see. Hosted redirect, or their drop-in
 * iframe, keeps every card number off this server — which is why none of the
 * code here has anywhere to put one.
 */

const config = () => ({
  apiUrl: process.env.PAYMENT_API_URL?.trim(),
  apiKey: process.env.PAYMENT_API_KEY?.trim(),
  merchantId: process.env.PAYMENT_MERCHANT_ID?.trim(),
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET?.trim(),
  label: process.env.PAYMENT_PROVIDER_LABEL?.trim() || 'Card payment',
})

/** Reads a value out of a reply by a dotted path, e.g. "data.checkout.url". */
const at = (source: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined,
      source,
    )

/**
 * The first string found at any of these paths.
 *
 * Processors put the redirect in a different place each — `redirect_url`,
 * `data.url`, `checkout.redirectUrl` — so the common ones are tried in turn and
 * `PAYMENT_REDIRECT_PATH` overrides the lot. That way ③ is usually answered by
 * setting an environment variable rather than by editing this file.
 */
const REDIRECT_PATHS = [
  'redirect_url',
  'redirectUrl',
  'checkout_url',
  'checkoutUrl',
  'payment_url',
  'paymentUrl',
  'url',
  'data.redirect_url',
  'data.redirectUrl',
  'data.checkout_url',
  'data.url',
  'result.redirect_url',
]

const findRedirect = (body: unknown): string | undefined => {
  const configured = process.env.PAYMENT_REDIRECT_PATH?.trim()
  const paths = configured ? [configured, ...REDIRECT_PATHS] : REDIRECT_PATHS
  for (const path of paths) {
    const value = at(body, path)
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value
  }
  return undefined
}

/** Likewise for the gateway's own id for the attempt. */
const findProviderReference = (body: unknown): string | undefined => {
  for (const path of [
    process.env.PAYMENT_REFERENCE_PATH?.trim(),
    'id',
    'payment_id',
    'paymentId',
    'transaction_id',
    'transactionId',
    'data.id',
    'data.payment_id',
  ]) {
    if (!path) continue
    const value = at(body, path)
    if (typeof value === 'string' && value) return value
    if (typeof value === 'number') return String(value)
  }
  return undefined
}

/**
 * Which of the gateway's status words mean the money is taken.
 *
 * ⑤. The defaults are the words the common processors use; anything else goes
 * in PAYMENT_PAID_STATUSES as a comma-separated list. Deliberately a list of
 * successes rather than a list of failures: an unrecognised status must read as
 * "not paid", because the cost of treating a failure as a success is a room
 * given away for nothing.
 */
const words = (value: string | undefined, fallback: string): string[] =>
  (value?.trim() || fallback)
    .split(',')
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean)

const paidStatuses = (): string[] =>
  words(
    process.env.PAYMENT_PAID_STATUSES,
    'paid,captured,success,successful,completed,approved,settled',
  )

/**
 * Words that mean "not finished yet", which is not the same as "no".
 *
 * Gateways report a lifecycle, and the middle of one arriving before the end of
 * it is ordinary. Every non-success used to be written down as a failure, and
 * that is how a guest gets charged twice: an "authorized" event lands, the site
 * tells them the payment failed and re-offers the button, they pay again, and
 * then both captures settle. A payment still in flight has to read as in
 * flight — the guest is told to wait and the button stays away.
 */
const pendingStatuses = (): string[] =>
  words(
    process.env.PAYMENT_PENDING_STATUSES,
    'pending,processing,authorized,authorised,initiated,created,in_progress,inprogress,started,awaiting,requires_action,requires_capture',
  )

/**
 * And the words that really do mean no.
 *
 * Named explicitly rather than inferred from "not success", because the cost of
 * the two mistakes is not symmetrical. Calling a live payment failed invites a
 * second charge; calling a dead one pending leaves a guest to ring the hotel,
 * which is recoverable and visible in the admin panel. So anything unrecognised
 * is treated as still in flight and logged loudly, and this list is what the
 * processor's own vocabulary gets added to.
 */
const failedStatuses = (): string[] =>
  words(
    process.env.PAYMENT_FAILED_STATUSES,
    'failed,failure,declined,denied,rejected,cancelled,canceled,expired,error,voided,void,reversed,chargeback,timeout',
  )

const STATUS_PATHS = ['status', 'state', 'payment_status', 'paymentStatus', 'data.status', 'result']
const REFERENCE_PATHS = [
  'order_id',
  'orderId',
  'reference',
  'merchant_reference',
  'merchantReference',
  'invoice_id',
  'data.order_id',
  'data.reference',
]

export const gatewayProvider: PaymentProvider = {
  id: 'gateway',
  get label() {
    return config().label
  },

  /**
   * All three, or none.
   *
   * The webhook secret belongs in this check even though nothing in `start`
   * uses it. Without it every callback is refused — so a deployment holding
   * only the URL and the key would show a pay button, send guests to a real
   * card form, take real money, and then be unable to record a single payment
   * of it. Refusing to look configured is the only safe reading of a
   * half-filled set of credentials.
   */
  configured: () => {
    const { apiUrl, apiKey, webhookSecret } = config()
    return Boolean(apiUrl && apiKey && webhookSecret)
  },

  async start(input: StartPaymentInput): Promise<StartPaymentResult> {
    const { apiUrl, apiKey, merchantId } = config()
    if (!apiUrl || !apiKey) {
      return { ok: false, why: 'PAYMENT_API_URL and PAYMENT_API_KEY are not set.' }
    }

    /**
     * ② The request body.
     *
     * These are the field names most processors in this region use. When
     * theirs differ, rename them here — it is the only place they appear.
     * `amount` is already an integer in the smallest unit; see money.ts.
     */
    const body: Record<string, unknown> = {
      amount: input.minorAmount,
      currency: input.currency,
      // Our booking reference doubles as their order id, so a disputed charge
      // can be traced from their dashboard to the hotel's admin panel by one
      // string that a guest can also read off their confirmation.
      order_id: input.reference,
      description: input.description,
      customer_name: input.guestName,
      customer_email: input.guestEmail || undefined,
      customer_phone: input.guestPhone || undefined,
      language: input.locale,
      redirect_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      // Where their server reports the outcome. Sent per payment rather than
      // configured in their dashboard where the processor supports it, because
      // a value in the request is one a developer can see and change.
      callback_url: input.webhookUrl,
      ...(merchantId ? { merchant_id: merchantId } : {}),
    }

    try {
      /** ① The call itself, and how it is authenticated. */
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        // A gateway that has not answered in twenty seconds has not answered.
        // The guest is standing at a spinner for every one of them.
        signal: AbortSignal.timeout(20_000),
      })

      const text = await response.text()
      let parsed: unknown = undefined
      try {
        parsed = JSON.parse(text)
      } catch {
        // Left undefined; the error below carries the raw reply instead.
      }

      if (!response.ok) {
        return {
          ok: false,
          why: `The gateway answered ${response.status}: ${text.slice(0, 300)}`,
        }
      }

      /** ③ Where the redirect URL lives in their reply. */
      const redirectUrl = findRedirect(parsed)
      if (!redirectUrl) {
        return {
          ok: false,
          why:
            'The gateway accepted the payment but this site could not find a redirect URL in ' +
            `its reply. Set PAYMENT_REDIRECT_PATH to where it is. Reply was: ${text.slice(0, 300)}`,
        }
      }

      return { ok: true, redirectUrl, providerReference: findProviderReference(parsed) }
    } catch (error) {
      return {
        ok: false,
        why: `The gateway could not be reached: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      }
    }
  },

  async verifyCallback(headers: Headers, rawBody: string): Promise<CallbackVerdict> {
    const { webhookSecret } = config()

    /**
     * ④ The signature.
     *
     * Unsigned means unbelievable. Anybody who learns the address of our
     * webhook can otherwise post "MF-ABC123 is paid" to it and be given a room,
     * and that address ends up in logs, proxies and support tickets. So a
     * missing secret refuses every message rather than trusting them all.
     *
     * The default is HMAC-SHA256 over the exact bytes received, hex-encoded,
     * which is what most processors do. If theirs differs — a different digest,
     * base64 instead of hex, a signature over "id.amount.status" rather than
     * over the body — change it here.
     */
    if (!webhookSecret) {
      return { ok: false, why: 'PAYMENT_WEBHOOK_SECRET is not set, so no callback is trusted.' }
    }

    const headerName = process.env.PAYMENT_SIGNATURE_HEADER?.trim() || 'x-signature'
    const given = (headers.get(headerName) || '').trim().replace(/^sha256=/i, '')
    if (!given) {
      return { ok: false, why: `The callback carried no ${headerName} header.` }
    }

    /**
     * Hex or base64, because processors are split roughly evenly between them
     * and being wrong about it fails every callback identically to being wrong
     * about the secret — with no way to tell the two apart from the outside.
     *
     * Accepting both weakens nothing: each is the same HMAC of the same bytes
     * under the same secret, just written differently, and an attacker still
     * needs the secret to produce either. PAYMENT_SIGNATURE_ENCODING pins it to
     * one once the processor has said which.
     */
    const digest = createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest()
    const pinned = process.env.PAYMENT_SIGNATURE_ENCODING?.trim().toLowerCase()
    const candidates =
      pinned === 'hex'
        ? [digest.toString('hex')]
        : pinned === 'base64'
          ? [digest.toString('base64')]
          : [digest.toString('hex'), digest.toString('base64')]

    // Constant time, and length-checked first because timingSafeEqual throws on
    // a mismatch. A plain === here would leak the signature a character at a
    // time to anybody willing to measure the refusals. Hex is compared
    // lower-cased; base64 is case-sensitive and must not be.
    const matches = candidates.some((expected) => {
      const isHex = /^[0-9a-f]+$/i.test(expected)
      const a = Buffer.from(expected, 'utf8')
      const b = Buffer.from(isHex ? given.toLowerCase() : given, 'utf8')
      return a.length === b.length && timingSafeEqual(a, b)
    })

    if (!matches) {
      return { ok: false, why: 'The callback signature did not match.' }
    }

    /**
     * JSON, or a form post.
     *
     * This read JSON only, and that would have failed on the first live
     * callback from any processor that posts a form — which a great many in
     * this region do. The failure would have been quiet and expensive: every
     * callback refused with a 401, the gateway retrying forever, and not one
     * payment recorded on a site that was cheerfully charging cards.
     *
     * The content type decides, and a body that does not parse as one is tried
     * as the other before giving up, because a processor sending JSON under the
     * wrong content type is commoner than either.
     */
    const contentType = (headers.get('content-type') || '').toLowerCase()
    const asForm = (text: string): Record<string, string> =>
      Object.fromEntries(new URLSearchParams(text))

    let parsed: unknown
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = asForm(rawBody)
      // And JSON under a form content type, which happens as often as the
      // reverse. Without this the body parses to a single nonsense key and
      // every callback is refused — the fallback has to work both ways round
      // or it is not a fallback.
      parsed =
        Object.keys(form).length > 1 || rawBody.includes('=')
          ? form
          : (() => {
              try {
                return JSON.parse(rawBody)
              } catch {
                return form
              }
            })()
    } else {
      try {
        parsed = JSON.parse(rawBody)
      } catch {
        const form = asForm(rawBody)
        if (Object.keys(form).length === 0) {
          return { ok: false, why: 'The callback body was neither JSON nor a form post.' }
        }
        parsed = form
      }
    }

    const reference = (() => {
      for (const path of [process.env.PAYMENT_CALLBACK_REFERENCE_PATH?.trim(), ...REFERENCE_PATHS]) {
        if (!path) continue
        const value = at(parsed, path)
        if (typeof value === 'string' && value) return value
      }
      return undefined
    })()

    if (!reference) {
      return { ok: false, why: 'The callback did not name a booking reference.' }
    }

    const rawStatus = (() => {
      for (const path of [process.env.PAYMENT_CALLBACK_STATUS_PATH?.trim(), ...STATUS_PATHS]) {
        if (!path) continue
        const value = at(parsed, path)
        if (typeof value === 'string' && value) return value
        if (typeof value === 'boolean') return value ? 'true' : 'false'
        // Numbers too. Plenty of processors answer with a code rather than a
        // word — 0 or 1, or an ISO-8583 style "00" — and reading only strings
        // meant a captured payment came back as "no status", which is filed as
        // not paid. Another way to lose money to a type check.
        if (typeof value === 'number' && Number.isFinite(value)) return String(value)
      }
      return undefined
    })()

    /**
     * ⑤ Three outcomes, not two.
     *
     * Success is a named list. Failure is a named list. Anything else — an
     * unrecognised word, or a lifecycle event that is neither — is reported as
     * still in flight, which is the reading that cannot cause a second charge.
     */
    const lower = rawStatus?.toLowerCase() ?? ''
    const paid = Boolean(lower && paidStatuses().includes(lower))
    const failed = Boolean(lower && failedStatuses().includes(lower))
    const settled = paid || failed
    // Whether this site has an opinion about the word at all. A recognised
    // in-flight status is ordinary and says nothing; an unrecognised one is
    // worth a line in the log, because it is a word the processor uses and
    // nobody here has classified. Without the distinction the log warned on
    // every normal authorization, which is the fastest way to make a warning
    // worth ignoring.
    const recognised = settled || Boolean(lower && pendingStatuses().includes(lower))

    const minorAmount = (() => {
      for (const path of ['amount', 'paid_amount', 'data.amount']) {
        const value = at(parsed, path)
        if (typeof value === 'number' && Number.isFinite(value)) return value
        if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
          return Number(value)
        }
      }
      return undefined
    })()

    const currency = (() => {
      for (const path of ['currency', 'data.currency']) {
        const value = at(parsed, path)
        if (typeof value === 'string' && value) return value.toUpperCase()
      }
      return undefined
    })()

    return {
      ok: true,
      reference: reference.toUpperCase(),
      paid,
      settled,
      recognised,
      providerReference: findProviderReference(parsed),
      minorAmount,
      currency,
      rawStatus,
    }
  },
}
