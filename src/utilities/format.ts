import type { Locale } from '@/i18n/config'

/**
 * Locale-aware number formatting, but always with Western digits.
 *
 * Arabic and Kurdish default to Eastern Arabic numerals (٤٥٠) under
 * Intl, and hotel prices in this market are read in Western digits — the
 * `-u-nu-latn` extension keeps them that way while still using the right
 * grouping separators.
 */
const numberLocale = (locale: Locale): string =>
  ({ en: 'en-GB', ku: 'ckb-IQ-u-nu-latn', ar: 'ar-IQ-u-nu-latn' })[locale] ?? 'en-GB'

export const formatPrice = (
  amount?: number | null,
  currency?: string | null,
  locale: Locale = 'en',
): string => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return ''

  try {
    return new Intl.NumberFormat(numberLocale(locale), {
      style: 'currency',
      currency: currency || 'IQD',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    // Unknown currency codes make Intl throw; showing the number is better
    // than showing nothing.
    return `${amount.toLocaleString('en-GB')} ${currency ?? ''}`.trim()
  }
}

export const formatNumber = (value?: number | null, locale: Locale = 'en'): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return new Intl.NumberFormat(numberLocale(locale)).format(value)
}
