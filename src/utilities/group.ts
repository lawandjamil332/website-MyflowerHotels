import type { Branch } from '@/payload-types'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'
import { countWord } from '@/i18n/count'

/**
 * Who this company is, in one sentence, written from where its hotels are.
 *
 * The sentence used to be typed out and said "all in the same city". That is
 * true today and will stop being true the day a hotel opens somewhere else,
 * and nobody edits a paragraph they wrote two years ago. Worse, the version
 * asked for — "four branches across Iraq" — is the opposite mistake: every one
 * of these hotels is in Erbil, so "across Iraq" claims a spread that is not
 * there, and a reader who checks four addresses in one city stops believing
 * the rest of the page.
 *
 * So the clause is counted rather than claimed. One city and it names the city
 * and the country. More than one and it says across Iraq, because by then it
 * is simply a fact, and lists them. The day a hotel opens in Baghdad the
 * website says so on its own, in three languages, without anybody remembering
 * this file exists.
 */
export const groupIdentity = (
  branches: Branch[],
  t: Dictionary,
  locale: Locale,
  establishedYear?: number | null,
): string => {
  if (branches.length === 0) return t.about.identityLead

  // Deduplicated in the order the hotels are published, so the first city is
  // the one the group started in rather than whichever sorts first.
  //
  // City is a translatable field and only the English has been filled in, so
  // the Arabic page was reading "جميعها في Erbil" — Arabic prose with a Latin
  // city dropped into it. The one city this site actually knows how to say in
  // all three languages is its own, so that translation is used when the
  // stored value is it. Anywhere else falls back to what was typed, which is
  // the best that can be done until somebody translates it.
  const cities: string[] = []
  for (const branch of branches) {
    const stored = branch.city?.trim()
    if (!stored) continue
    const city = stored.toLowerCase() === 'erbil' ? t.seo.locality : stored
    if (!cities.includes(city)) cities.push(city)
  }
  if (cities.length === 0) return t.about.identityLead

  // Lower-cased, because every place it lands here is mid-sentence and
  // countWord returns it capitalised for use at the start of one — "the same
  // standard, Four addresses" is a capital letter in the middle of a clause.
  // Arabic and Kurdish have no case, so this changes nothing in either.
  const count = countWord(branches.length, locale).toLocaleLowerCase(
    locale === 'en' ? 'en' : undefined,
  )
  const spread =
    cities.length === 1
      ? t.about.identityOneCity
          .replaceAll('{count}', count)
          .replaceAll('{city}', cities[0])
          .replaceAll('{country}', t.seo.country)
      : t.about.identityManyCities
          .replaceAll('{count}', count)
          .replaceAll('{country}', t.seo.country)
          .replaceAll('{cities}', cities.join('، ').replace(/، /g, locale === 'en' ? ', ' : '، '))

  const opened = establishedYear
    ? t.about.identityOpened.replaceAll('{city}', cities[0]).replaceAll('{year}', String(establishedYear))
    : ''

  return [t.about.identityLead, opened, spread].filter(Boolean).join(' ')
}
