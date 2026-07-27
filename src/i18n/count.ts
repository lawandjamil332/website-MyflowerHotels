import type { Locale } from './config'

/**
 * The group had three hotels when this site was written and now has four. Any
 * sentence that spells the number out has to come from the number of branches
 * actually published, or the copy quietly goes wrong the next time one opens.
 *
 * Strings carrying `{count}` are filled through `fillCount`.
 */
const words: Record<Locale, string[]> = {
  en: ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'],
  ku: ['', 'یەک', 'دوو', 'سێ', 'چوار', 'پێنج', 'شەش', 'حەوت', 'هەشت', 'نۆ', 'دە'],
  ar: [
    '',
    'واحد',
    'اثنان',
    'ثلاثة',
    'أربعة',
    'خمسة',
    'ستة',
    'سبعة',
    'ثمانية',
    'تسعة',
    'عشرة',
  ],
}

/**
 * Spelled-out number, falling back to the digit past ten.
 *
 * `||` rather than `??` on purpose. Index 0 holds an empty string, which is
 * not nullish, so `??` handed that empty string straight through — and zero is
 * exactly what this returns when the database is briefly unreachable and the
 * branch query comes back empty. The homepage then rendered a blank number
 * over its label and a hero reading " hotels, one standard of hospitality".
 */
export const countWord = (n: number, locale: Locale): string =>
  words[locale]?.[n] || String(n)

export const fillCount = (template: string, n: number, locale: Locale): string =>
  template.replace('{count}', countWord(n, locale))
