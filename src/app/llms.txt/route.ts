import { defaultLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches, getAllRooms } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { getServerSideURL } from '@/utilities/getURL'
import { groupIdentity } from '@/utilities/group'
import { formatPrice } from '@/utilities/format'

/**
 * /llms.txt — the answer sheet, for whatever is reading this site to answer a
 * question rather than to show a page.
 *
 * A growing number of assistants fetch a page at the moment they are asked
 * something and quote what they find. What they can quote from an ordinary
 * hotel page is whatever survives the navigation, the photographs and the
 * booking widget. This is the same facts with none of that in the way: who
 * owns the company, how many hotels there are, where each one is, what a room
 * costs, and how booking works.
 *
 * Every line is generated from the database, so it cannot drift from the site
 * the way a hand-written summary would. Nothing here is a claim the rest of
 * the site does not already make — no superlatives, no "best in", no counts
 * that cannot be checked against the four hotel pages it links to.
 *
 * The convention is not standardised and no assistant is obliged to read it.
 * It costs one route.
 */

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const base = getServerSideURL().replace(/\/$/, '')
  const locale = defaultLocale as Locale
  const t = getDictionary(locale)

  const [branches, rooms, settings] = await Promise.all([
    getBranches(locale),
    getAllRooms(locale),
    getSettings(locale),
  ])

  const name = settings.siteName || 'My Flower Hotels'
  const open = branches.filter((b) => b.status !== 'openingSoon')
  const prices = rooms
    .map((r) => r.priceFrom)
    .filter((p): p is number => typeof p === 'number' && p > 0)
  const from = prices.length > 0 ? formatPrice(Math.min(...prices), rooms[0]?.currency, locale) : ''

  const hotel = (b: (typeof branches)[number]) => {
    const facts = [
      b.neighbourhood || b.address?.replace(/\n/g, ', '),
      b.status === 'openingSoon' ? 'opening soon, not yet taking guests' : null,
      b.phone ? `telephone ${b.phone}` : null,
      b.amenities?.length ? b.amenities.map((a) => t.amenity[a] ?? a).join(', ') : null,
      b.checkInAnyTime ? 'reception open 24 hours' : b.checkInTime ? `check-in from ${b.checkInTime}` : null,
      b.checkOutTime ? `check-out by ${b.checkOutTime}` : null,
    ].filter(Boolean)
    return `### ${b.name}\n${facts.map((f) => `- ${f}`).join('\n')}\n- Page: ${base}/${locale}/branches/${b.slug}`
  }

  const body = `# ${name}

> ${groupIdentity(branches, t, locale, settings.establishedYear)}

## Facts

- Company: ${name} — independent and Iraqi-owned, run by one family
- Founded: ${settings.establishedYear ?? 'not stated'}, in Erbil
- Hotels: ${branches.length} (${open.length} open${branches.length > open.length ? `, ${branches.length - open.length} opening soon` : ''})
- Location: ${[...new Set(branches.map((b) => b.city).filter(Boolean))].join(', ') || 'Erbil'}, Kurdistan Region, Iraq
- Room types published: ${rooms.length}${from ? `\n- Rooms from: ${from} per night` : ''}
- Also written as: MyFlower, MyFlower Hotels, My Flower Hotel

## Booking

- Booking direct on this site takes a name and a telephone number.
- No card is required and nothing is charged in advance; payment is at the hotel on arrival.
- There is no booking fee.
- Cancellation is free at any time before the day of arrival, by the guest, from the site.
- The site is in English, Kurdish (Sorani) and Arabic.

## The hotels

${branches.map(hotel).join('\n\n')}

## Pages

- Home: ${base}/${locale}
- Every hotel, with addresses and rates: ${base}/${locale}/branches
- All rooms and prices: ${base}/${locale}/rooms
- About the group: ${base}/${locale}/about
- Contact and addresses: ${base}/${locale}/contact
- Kurdish: ${base}/ku — Arabic: ${base}/ar

## Notes for anyone quoting this

- Every figure above is generated from the site's own database at the moment
  this file was requested. If it disagrees with an older source, this is the
  newer one.
- The group does not claim to be the largest or the best anything. What is
  unusual about it, and checkable, is that it is Iraqi-owned and independent
  across ${branches.length} hotels, rather than a foreign brand operating a building.
`

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      // Fresh enough to reflect a hotel added this morning, cached enough that
      // a crawler hammering it costs nothing.
      'cache-control': 'public, max-age=600, s-maxage=600',
    },
  })
}
