import type { Locale } from '@/i18n/config'

/**
 * The contract between this site and whichever company processes the cards.
 *
 * WHY THERE IS A SEAM HERE AT ALL. The gateway has not been chosen yet — the
 * processor is going to make contact and hand over endpoints and credentials.
 * Everything that does not depend on which company that is has been built:
 * the database fields, the booking states, the page a guest lands back on, the
 * endpoint their server calls, the signature check, the protection against
 * being paid twice. What remains is one file (providers/gateway.ts) with six
 * marked places in it. That is the whole integration.
 *
 * WHAT SHAPE THIS ASSUMES. The hosted redirect, which is what almost every
 * processor sells and what a hotel should want:
 *
 *   1. The guest presses Pay. This site, on its own server, asks the gateway to
 *      open a payment for a given amount and order reference.
 *   2. The gateway answers with a URL. The guest is sent there.
 *   3. The guest types their card on the gateway's page, not on ours.
 *   4. The gateway sends the guest back to us, and separately its own server
 *      tells our server what happened.
 *   5. We believe the second of those and not the first.
 *
 * Step 3 is the reason to prefer this over taking card numbers on our own form:
 * no card number ever touches this site, this server or this database, which
 * keeps the hotel out of the expensive end of PCI compliance entirely. If the
 * processor offers a "direct API" where we post the card ourselves, the answer
 * is no — it is more work, more risk and more audit, for no gain to a guest.
 *
 * Step 5 is the rule that stops the commonest fraud against a site like this.
 * The guest's browser is sent back to us with "success" in the address, and a
 * guest can type that address themselves. The redirect moves the *person*; only
 * the server-to-server call moves the *money*, and only that call is believed.
 */

/** What a guest is being asked to pay, and what for. */
export type StartPaymentInput = {
  /**
   * The booking reference — MF-XXXXXX. Given to the gateway as the order id, so
   * their dashboard, their webhook and the hotel's admin panel all name the
   * same thing when somebody has to reconcile a disputed charge at the desk.
   */
  reference: string
  /** Amount in the currency's smallest unit — see money.ts, and read it. */
  minorAmount: number
  /** ISO 4217, upper case: IQD or USD. */
  currency: string
  /** For the gateway's own receipt and its fraud checks. */
  guestName: string
  guestEmail?: string | null
  guestPhone?: string | null
  /** So the gateway shows its payment page in the guest's own language. */
  locale: Locale
  /** One line, shown on the gateway's page and usually on the card statement. */
  description: string
  /** Where to send the guest's browser when they finish, or give up. */
  returnUrl: string
  cancelUrl: string
  /** Where the gateway's own server should report the outcome. */
  webhookUrl: string
}

export type StartPaymentResult =
  | {
      ok: true
      /** Where to send the guest's browser. */
      redirectUrl: string
      /** The gateway's id for this attempt, stored so support can trace it. */
      providerReference?: string
    }
  | { ok: false; why: string }

/**
 * What the gateway's server told us, once we have checked it really was them.
 *
 * `paid` is deliberately a plain boolean rather than the gateway's own status
 * word. Every processor spells success differently — CAPTURED, SUCCESS,
 * completed, 00 — and the place to translate that is inside the adapter, once,
 * rather than in the route that touches the database.
 */
export type CallbackVerdict =
  | {
      ok: true
      /** Our booking reference, read back out of their message. */
      reference: string
      paid: boolean
      /**
       * Whether this is a final answer at all.
       *
       * False means the gateway is reporting a step rather than an outcome —
       * authorized, processing, or a word nobody here recognises. The caller
       * must not write such a message down as a failure: a guest told their
       * payment failed while it is still running will pay again, and then both
       * of them settle.
       */
      settled: boolean
      /**
       * Whether this site classifies the gateway's word at all.
       *
       * A recognised in-flight status is routine. An unrecognised one is a word
       * the processor uses that nobody here has sorted into paid or failed, and
       * it is the only case worth putting in the log.
       */
      recognised: boolean
      providerReference?: string
      /** What they say was actually taken, for checking against what we asked. */
      minorAmount?: number
      currency?: string
      /** Their own word for the outcome, stored as-is for support. */
      rawStatus?: string
    }
  | { ok: false; why: string }

export type PaymentProvider = {
  /** Stored on the booking, so a row can always be traced to who took it. */
  id: string
  /** What the admin panel and the boot report call it. */
  label: string
  /** False while the credentials are missing — the site then behaves as before. */
  configured: () => boolean
  start: (input: StartPaymentInput) => Promise<StartPaymentResult>
  /**
   * Checks the message really came from the gateway, then reads it.
   *
   * Takes the raw body as text, never a parsed object: a signature is over the
   * exact bytes sent, and JSON.parse followed by JSON.stringify does not give
   * back the same bytes. Parsing before verifying is the single commonest way
   * this check is written so that it always passes.
   */
  verifyCallback: (headers: Headers, rawBody: string) => Promise<CallbackVerdict>
}
