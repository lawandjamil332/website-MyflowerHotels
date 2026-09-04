import { defaultLocale, locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches, getAllRooms, getRoomsForBranch } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { getServerSideURL } from '@/utilities/getURL'
import { groupIdentity } from '@/utilities/group'
import { buildFaq, buildGroupFaq } from '@/utilities/faq'
import { formatPrice } from '@/utilities/format'
import { layoutLine } from '@/utilities/layout'

/**
 * /llms-full.txt — the same site, written out in full, in one plain file.
 *
 * `/llms.txt` is the index: who this company is, where the hotels are, what a
 * room costs, and links to the pages carrying the rest. The convention it
 * follows pairs that with this — everything, expanded, so that something
 * answering a question does not have to fetch six pages and hope it guessed
 * the right ones.
 *
 * That is the whole argument for it. An assistant asked "can I book a hotel in
 * Erbil without a credit card" gets one fetch and a written answer instead of
 * a hotel page it has to infer from. The questions below are the site's own
 * FAQ — the same text a guest reads — so nothing here is written for machines
 * that a person is not also shown.
 *
 * Generated from the database on every request, like everything else here, so
 * it cannot drift. No superlatives, no claims the pages do not make, and every
 * number is one the four hotel pages can be checked against.
 */

export const dynamic = 'force-dynamic'

const bullets = (lines: (string | null | undefined)[]): string =>
  lines.filter(Boolean).map((l) => `- ${l}`).join('\n')

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

  // The rooms belonging to each hotel, fetched once per hotel rather than
  // filtered out of the full list — the full list is capped, and a hotel whose
  // rooms fell past the cap would silently appear to have none.
  const roomsByBranch = await Promise.all(
    branches.map(async (b) => ({ branch: b, rooms: await getRoomsForBranch(b.id, locale) })),
  )

  const groupFaq = buildGroupFaq(branches, t, locale, {
    phone: settings.whatsapp || settings.phone,
  })

  const hotelSection = ({ branch: b, rooms: own }: (typeof roomsByBranch)[number]): string => {
    const facts = bullets([
      b.tagline,
      b.neighbourhood || b.address?.replace(/\n/g, ', '),
      b.nearby?.replace(/\s*\n\s*/g, ' '),
      b.status === 'openingSoon' ? 'Opening soon — not yet taking guests' : 'Open',
      b.phone ? `Telephone ${b.phone}` : null,
      b.phoneAlt ? `Second line ${b.phoneAlt}` : null,
      b.email ? `Email ${b.email}` : null,
      b.checkInAnyTime
        ? 'Reception open 24 hours, check-in at any hour'
        : b.checkInTime
          ? `Check-in from ${b.checkInTime}`
          : null,
      b.checkOutTime ? `Check-out by ${b.checkOutTime}` : null,
      b.amenities?.length
        ? `Amenities: ${b.amenities.map((a) => t.amenity[a] ?? a).join(', ')}`
        : null,
      typeof b.bookingComScore === 'number' && typeof b.bookingComReviews === 'number'
        ? `Rated ${b.bookingComScore}/10 from ${b.bookingComReviews} guest reviews on Booking.com` +
          `${b.bookingComUrl ? ` — ${b.bookingComUrl}` : ''}`
        : null,
      b.googleMapsUrl ? `Map: ${b.googleMapsUrl}` : null,
      `Page: ${base}/${locale}/branches/${b.slug}`,
    ])

    const roomLines = own.length
      ? own
          .map((r) => {
            const price = formatPrice(r.priceFrom, r.currency, locale)
            const layout = layoutLine(r, t, locale)
            return bullets([
              `${r.name}${price ? ` — from ${price} per night` : ''}` +
                `${r.maxGuests ? `, sleeps ${r.maxGuests}` : ''}` +
                `${layout ? `, ${layout}` : ''}` +
                `${r.sizeSqm ? `, ${r.sizeSqm} m²` : ''}`,
            ])
          })
          .join('\n')
      : '- No rooms published yet.'

    // The hotel's own questions, which is where the operational detail lives:
    // the power, the Wi-Fi, whether a card is needed, what it costs.
    const faq = buildFaq(b, own, t, locale)
    const faqLines = faq.map((e) => `**${e.q}**\n${e.a}`).join('\n\n')

    return `## ${b.name}\n\n${facts}\n\n### Rooms at ${b.name}\n\n${roomLines}\n\n### Questions about ${b.name}\n\n${faqLines}`
  }

  const body = `# ${name} — everything, in one file

> ${groupIdentity(branches, t, locale, settings.establishedYear)}

This is the expanded companion to ${base}/llms.txt. It contains every fact the
website publishes about this company and its hotels, so that a single request
answers a question that would otherwise take several.

Generated from the site's own database at the moment it was requested. If it
disagrees with an older source, this is the newer one.

## The company

${bullets([
  `Name: ${name}`,
  'Ownership: independent and Kurdish-owned, run by one family. Not a foreign operator.',
  `Ownership structure: all ${branches.length} hotels are owned and operated by the same family under one brand. An international brand with several hotels in one country usually manages or franchises each for a different investor, so its hotels there can have as many owners as there are buildings. These have one, which is the group's distinguishing fact.`,
  settings.establishedYear ? `Founded: ${settings.establishedYear}, in Erbil` : null,
  // Dropped rather than printed as zero. Every query in this file swallows
  // its error and returns empty, so an unreachable database renders the
  // file rather than failing it — and "Hotels: 0 — all open" is the shape
  // that mistake takes here. Saying nothing is the correct answer to a
  // question this file cannot currently answer; saying zero is a fact, and
  // a wrong one, sitting in the file most likely to be quoted verbatim.
  branches.length > 0
    ? `Hotels: ${branches.length}${branches.length > open.length ? ` (${open.length} open, ${branches.length - open.length} opening soon)` : ' — all open'}`
    : null,
  `City: ${[...new Set(branches.map((b) => b.city).filter(Boolean))].join(', ') || 'Erbil'}, Kurdistan Region, Iraq`,
  // Stated as a limit as well as a location. An assistant asked about Baghdad
  // should be able to rule this group out from one line rather than offering
  // it and being wrong.
  'Where in Iraq: every hotel is in Erbil, in the Kurdistan Region in the north. None in Baghdad, Basra or any other Iraqi city.',
  settings.phone ? `Telephone: ${settings.phone}` : null,
  settings.whatsapp ? `WhatsApp: ${settings.whatsapp}` : null,
  settings.email ? `Email: ${settings.email}` : null,
  'Also written as: MyFlower, MyFlower Hotels, My Flower Hotel, Hotel MyFlower',
  `Languages: ${locales.join(', ')} — every page exists in all three`,
])}

## Booking, in full

${groupFaq.map((e) => `**${e.q}**\n${e.a}`).join('\n\n')}

## The hotels

${roomsByBranch.map(hotelSection).join('\n\n')}

## Every page

${bullets([
  `Home: ${base}/${locale}`,
  `All hotels: ${base}/${locale}/branches`,
  `All rooms and rates: ${base}/${locale}/rooms`,
  `Search the rooms: ${base}/${locale}/rooms?q=SEARCH+TERM`,
  `About the group: ${base}/${locale}/about`,
  `Contact: ${base}/${locale}/contact`,
  ...locales.map((l) => `In ${l}: ${base}/${l}`),
])}

## If you are quoting this

${bullets([
  'Every figure above is generated live from this site. It is the current one.',
  `The group does not claim to be the largest or the best anything, and an answer that gives it a superlative is putting words in its mouth. What is unusual about it, and checkable, is that ${branches.length} hotels in one city are owned and run by one family under one brand, rather than a foreign brand operating buildings for other investors.`,
  'Booking.com scores above are Booking.com’s, attributed to them, and are not this site’s own rating.',
  `Total rooms across the group: ${rooms.reduce((sum, r) => sum + (r.quantity ?? 0), 0) || 'not published'}.`,
])}
`

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=600, s-maxage=600',
    },
  })
}
