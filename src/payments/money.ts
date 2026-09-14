/**
 * Turning a room rate into the number the gateway is sent.
 *
 * THIS IS THE FILE TO READ BEFORE THE FIRST LIVE PAYMENT. Everything else in
 * this folder can be wrong and be noticed. This one can be wrong and take a
 * thousand times too much money from a guest's card.
 *
 * Gateways do not take "250,000 dinars". They take an integer in the currency's
 * smallest unit, and the number of decimal places that implies is the
 * "exponent". For dollars the exponent is 2 and nobody argues: $80.00 is sent
 * as 8000. For the Iraqi dinar there is a genuine disagreement, and it is not
 * academic:
 *
 *   - ISO 4217 assigns IQD an exponent of 3, because one dinar is a thousand
 *     fils. By that reading a 250,000 dinar room is sent as 250000000.
 *   - Fils have not circulated in Iraq for decades. Nothing is priced in them,
 *     no note or coin exists, and many processors operating here therefore
 *     treat IQD as a whole-unit currency with an exponent of 0 — the same room
 *     is sent as 250000.
 *
 * Both are defensible and only the processor knows which they mean. Guess
 * wrong upward and a guest is charged 250 million dinars for one night; guess
 * wrong downward and the hotel is paid 250. There is no reading of this file
 * that makes the guess safe.
 *
 * So it does not guess. Until `PAYMENT_CURRENCY_EXPONENT_IQD` is set — by a
 * person who has asked the processor and been told — this site refuses to
 * start an IQD payment at all, and says why. A hotel that cannot take a card
 * today has lost nothing. A hotel that overcharges a guest by a factor of a
 * thousand on its first live transaction has lost the guest, the chargeback
 * and the merchant account.
 *
 * USD defaults to 2 because there is nothing to ask: every processor on earth
 * takes dollars in cents.
 */

/** Exponents that are not in dispute anywhere. */
const SETTLED: Record<string, number> = { USD: 2, EUR: 2, GBP: 2 }

/** The environment variable a person sets once, after asking. */
const envKey = (currency: string) => `PAYMENT_CURRENCY_EXPONENT_${currency.toUpperCase()}`

export type ExponentResult =
  | { ok: true; exponent: number }
  | { ok: false; why: string }

/**
 * How many decimal places this currency's smallest unit implies.
 *
 * An explicitly set environment variable always wins, including for dollars —
 * if a processor wants whole dollars for some reason, that is settable without
 * touching code.
 */
export const currencyExponent = (currency: string): ExponentResult => {
  const code = (currency || '').toUpperCase()
  if (!code) return { ok: false, why: 'No currency given.' }

  const set = process.env[envKey(code)]?.trim()
  if (set) {
    const exponent = Number(set)
    if (!Number.isInteger(exponent) || exponent < 0 || exponent > 4) {
      return {
        ok: false,
        why: `${envKey(code)} is "${set}", which is not a whole number of decimal places between 0 and 4.`,
      }
    }
    return { ok: true, exponent }
  }

  if (code in SETTLED) return { ok: true, exponent: SETTLED[code] }

  return {
    ok: false,
    why:
      `${envKey(code)} is not set, so this site does not know whether your processor wants ` +
      `${code} as whole units or as its subunit. Ask them: "do I send 250,000 ${code} as ` +
      `250000 or as 250000000?" Set 0 for the first answer and 3 for the second. Until then ` +
      `no ${code} payment is started, deliberately — guessing this wrong charges a guest a ` +
      `thousand times too much.`,
  }
}

/**
 * A price as the site stores it, turned into the integer a gateway takes.
 *
 * Rounds half up to the smallest unit, which is what a till does. A deposit of
 * a third of 250,000 dinars is 83,333 and not 83,333.33, and the third of a
 * dinar is the hotel's to lose rather than something to invent a fraction for.
 */
export const toMinorUnits = (
  amount: number,
  currency: string,
): { ok: true; minor: number; exponent: number } | { ok: false; why: string } => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, why: `${amount} is not an amount that can be charged.` }
  }

  const exponent = currencyExponent(currency)
  if (!exponent.ok) return exponent

  const factor = 10 ** exponent.exponent
  const minor = Math.round(amount * factor)

  if (!Number.isSafeInteger(minor)) {
    return { ok: false, why: `${amount} ${currency} does not fit in a whole number of units.` }
  }
  if (minor <= 0) {
    return { ok: false, why: `${amount} ${currency} rounds to nothing chargeable.` }
  }

  return { ok: true, minor, exponent: exponent.exponent }
}

/** The other direction, for showing back what a gateway says it took. */
export const fromMinorUnits = (minor: number, currency: string): number | null => {
  const exponent = currencyExponent(currency)
  if (!exponent.ok || !Number.isFinite(minor)) return null
  return minor / 10 ** exponent.exponent
}

/**
 * What to actually charge: the whole stay, or a deposit against it.
 *
 * A deposit is a percentage of the total, rounded up to the smallest unit the
 * currency has, so the hotel is never a unit short. Zero or a hundred both mean
 * the full amount, because "0% deposit" in a settings box means somebody has
 * not chosen deposits rather than that the guest owes nothing.
 */
export const amountToCharge = (
  total: number,
  depositPercent?: number | null,
  currency?: string,
): number => {
  const percent = Number(depositPercent)
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return total

  /**
   * Rounded up to a whole unit of the currency — a whole dinar, a whole dollar.
   *
   * Not to the smallest unit, which was the first attempt and only half worked.
   * The page tells the guest what they are about to pay and the gateway is sent
   * an integer, and those two have to be the same number. This site formats
   * every price to whole units, so a deposit of $26.40 was advertised as "$26"
   * while 2640 cents went to the processor — a gap of forty cents between what
   * a guest agreed to and what their statement says, which is a chargeback
   * waiting to be filed however small it is.
   *
   * Rounding the charge itself to a whole unit closes it at the source rather
   * than by teaching the formatter about decimals, which would change every
   * price on the site to fix one label. A deposit is an arbitrary fraction of a
   * stay anyway; a hotel asking for $27 rather than $26.40 is normal, and for
   * dinars — where there is no subunit in circulation — it changes nothing at
   * all.
   *
   * Up rather than down, so the hotel is never short, and never more than a
   * unit over.
   *
   * `currency` is unused now and kept so callers need not change; a currency
   * whose subunit genuinely matters can be special-cased here later.
   */
  void currency
  return Math.ceil((total * percent) / 100)
}
