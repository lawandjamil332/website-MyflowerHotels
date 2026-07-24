/**
 * The three locales, mirroring `localization` in payload.config.ts.
 * Keep the two in step: this list drives the URL prefixes and text direction,
 * that one drives which translations Payload stores.
 */
export const locales = ['en', 'ku', 'ar'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/** Locales written right-to-left. */
export const rtlLocales: Locale[] = ['ku', 'ar']

export const isRtl = (locale: Locale): boolean => rtlLocales.includes(locale)

export const dir = (locale: Locale): 'rtl' | 'ltr' => (isRtl(locale) ? 'rtl' : 'ltr')

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value)

/** Shown in the language switcher, each in its own script. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  ku: 'کوردی',
  ar: 'العربية',
}
