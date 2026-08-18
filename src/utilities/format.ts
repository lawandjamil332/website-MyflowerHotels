import type { Locale } from '@/i18n/config'

/**
 * Numbers, prices and dates, written the same way everywhere.
 *
 * These used to be handed to Intl with the locale — `ckb-IQ` for Kurdish,
 * `ar-IQ` for Arabic — which is the obvious thing to do and was quietly
 * breaking the Kurdish site on every page.
 *
 * Node ships the full ICU database and knows Central Kurdish. The browsers do
 * not: Chromium has no `ckb` data at all, so the same call that returns
 * "٢٠٢٦ ئەیلوول ٠٥, شەممە" on the server returns "Saturday, September 05,
 * 2026" in the browser. React renders the server's answer, hydrates, gets a
 * different answer, and throws a hydration mismatch — error #418 on every
 * Kurdish page on this site. Worse than the error: React keeps the client's
 * version, so a guest reading the Kurdish site saw English dates and "IQD"
 * where the price should say د.ع.
 *
 * English was quietly wrong too, in a smaller way. Node's `en-GB` puts a comma
 * after the weekday and Chromium's does not, so any long date rendered inside
 * a client component mismatched there as well.
 *
 * So none of this asks the runtime what a language looks like. The names are
 * written down here, the grouping uses `en-GB` — which every engine agrees on
 * and which is what all three locales already produced, because the site
 * forces Western digits anyway — and the answer is identical on both sides of
 * the wire, in every browser, forever.
 */

/** Grouping only, and every engine formats this identically. */
const grouped = (value: number): string => new Intl.NumberFormat('en-GB').format(value)

/**
 * What a currency looks like in each language.
 *
 * The dinar is written د.ع. after the number in Arabic and Kurdish, and the
 * code in front of it in English, which is how prices are quoted in both.
 * Anything not listed falls back to "CODE 1,234" — correct, if plain, and
 * better than a symbol invented for a currency this hotel does not take.
 */
const CURRENCY: Record<string, Partial<Record<Locale, (n: string) => string>>> = {
  IQD: {
    en: (n) => `IQD ${n}`,
    ar: (n) => `${n} د.ع.`,
    ku: (n) => `${n} د.ع.`,
  },
  USD: {
    en: (n) => `$${n}`,
    ar: (n) => `${n} $`,
    ku: (n) => `${n} $`,
  },
}

export const formatPrice = (
  amount?: number | null,
  currency?: string | null,
  locale: Locale = 'en',
): string => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return ''
  const code = (currency || 'IQD').toUpperCase()
  const n = grouped(Math.round(amount))
  return CURRENCY[code]?.[locale]?.(n) ?? `${code} ${n}`
}

export const formatNumber = (value?: number | null, _locale: Locale = 'en'): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return grouped(value)
}

/**
 * The months, in the names actually used in Iraq.
 *
 * Not the Gulf transliterations — يناير, فبراير — but the Levantine/Iraqi
 * names a guest in Erbil reads on everything else: كانون الثاني, شباط, آذار.
 * These are the same names Node's ICU produced for both languages, so the
 * dates on already-sent confirmations do not change.
 */
const MONTHS: Record<Locale, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  ar: [
    'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
    'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
  ],
  ku: [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم',
  ],
}

/** Sunday first, matching JavaScript's getUTCDay(). */
const WEEKDAYS: Record<Locale, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  ku: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'],
}

/** The comma between the weekday and the date. Arabic and Kurdish use ،. */
const COMMA: Record<Locale, string> = { en: ',', ar: '،', ku: '،' }

/**
 * The comma this language writes, for anywhere else that joins two things.
 *
 * Page titles and share descriptions were building "ماي فلاور 3, فندق في
 * أربيل" with a Latin comma — the sentence Google prints under an Arabic
 * result and the one WhatsApp shows under a shared hotel link, punctuated in
 * the wrong alphabet.
 */
export const comma = (locale: Locale = 'en'): string => COMMA[locale] ?? ','

/**
 * "Saturday, 05 September 2026" — a date written out for somebody to read.
 *
 * Confirmation emails used "2026-08-01", which is unambiguous to a machine and
 * to nobody else: a guest checking whether they booked the right night should
 * not have to count months. The weekday is there because it is the first thing
 * anybody actually checks about a hotel date.
 *
 * Read in UTC. Every date on this site is a calendar day — a night booked, not
 * a moment — and reading it in the viewer's zone is how a guest west of here
 * sees their arrival move to the day before.
 */
export const formatDateLong = (value?: string | Date | null, locale: Locale = 'en'): string => {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const weekday = WEEKDAYS[locale]?.[date.getUTCDay()] ?? WEEKDAYS.en[date.getUTCDay()]
  const month = MONTHS[locale]?.[date.getUTCMonth()] ?? MONTHS.en[date.getUTCMonth()]
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${weekday}${COMMA[locale] ?? ','} ${day} ${month} ${date.getUTCFullYear()}`
}
