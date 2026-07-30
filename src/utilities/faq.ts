import type { Branch, Room } from '@/payload-types'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'
import { formatPrice } from './format'

export type FaqEntry = { q: string; a: string }

/**
 * The questions a guest actually asks the front desk, answered from what this
 * hotel has already been told about itself.
 *
 * Two things at once, and it only earns its place by doing both. For a guest
 * it is the page finally answering what they came to find out — check-in time,
 * whether a card is needed, whether the power stays on — instead of making
 * them ring to ask. For search it is the only honest way to give a hotel page
 * enough substance to compete: these pages measured 175 to 210 words, and a
 * page that thin does not outrank a listing site no matter how good its title
 * is.
 *
 * Generated, never invented. Every answer here is assembled from a field the
 * owner filled in, so a question is asked only when this hotel can truthfully
 * answer it — a hotel with no generator is never made to claim one, and a
 * hotel with no rooms entered is not asked what its rooms cost.
 */
export const buildFaq = (
  branch: Branch,
  rooms: Room[],
  t: Dictionary,
  locale: Locale,
  opts: { pointsEnabled?: boolean } = {},
): FaqEntry[] => {
  const entries: FaqEntry[] = []
  const name = branch.name
  // Typed to the amenity list itself, so a question can never be written
  // against an amenity that does not exist — a typo here would silently mean
  // the question simply never appears, which is the hardest kind to notice.
  type Amenity = NonNullable<Branch['amenities']>[number]
  const has = (a: Amenity) => branch.amenities?.includes(a)

  // Arrival and departure — the two most asked, and the two this site knows
  // for certain.
  if (branch.checkInAnyTime || branch.checkInTime) {
    entries.push({
      q: t.faq.checkInQ.replace('{hotel}', name),
      a: branch.checkInAnyTime
        ? t.faq.checkInAnyA.replace('{hotel}', name)
        : t.faq.checkInAtA.replace('{hotel}', name).replace('{time}', branch.checkInTime ?? ''),
    })
  }
  if (branch.checkOutTime) {
    entries.push({
      q: t.faq.checkOutQ,
      a: t.faq.checkOutA.replace('{time}', branch.checkOutTime),
    })
  }

  // The single most common hesitation on a direct booking, and the site's
  // biggest advantage over the listing sites: no card, nothing taken up front.
  entries.push({ q: t.faq.payQ, a: t.faq.payA })
  entries.push({ q: t.faq.cancelQ, a: t.faq.cancelA })

  // Where it is, in words rather than only on a map — a map pin is not text
  // and cannot be read by anybody searching for the street by name.
  const where = branch.neighbourhood || branch.address
  if (where) {
    entries.push({
      q: t.faq.whereQ.replace('{hotel}', name),
      a: t.faq.whereA
        .replace('{hotel}', name)
        .replace('{where}', where)
        .replace('{city}', t.seo.locality),
    })
  }

  // What a night costs, from the cheapest room actually published. Skipped
  // entirely when no room carries a price, rather than answered with a blank.
  const priced = rooms
    .map((r) => r.priceFrom)
    .filter((p): p is number => typeof p === 'number' && p > 0)
  if (priced.length > 0) {
    const from = formatPrice(Math.min(...priced), rooms[0]?.currency ?? 'IQD', locale)
    if (from) {
      entries.push({
        q: t.faq.priceQ.replace('{hotel}', name),
        a: t.faq.priceA.replace('{hotel}', name).replace('{price}', from),
      })
    }
  }

  // Families and longer stays: only asked where an apartment-style unit is
  // actually entered, since that is what the question is really about.
  const apartments = rooms.filter((r) => (r.bedrooms ?? 0) > 1 || (r.livingRooms ?? 0) > 0)
  if (apartments.length > 0) {
    entries.push({
      q: t.faq.familyQ.replace('{hotel}', name),
      a: t.faq.familyA.replace('{hotel}', name),
    })
  }

  // The amenity questions worth asking here rather than in a list — power and
  // internet are what a traveller to this city actually worries about.
  if (has('generator')) entries.push({ q: t.faq.powerQ, a: t.faq.powerA.replace('{hotel}', name) })
  if (has('wifi')) entries.push({ q: t.faq.wifiQ, a: t.faq.wifiA.replace('{hotel}', name) })
  if (has('parking'))
    entries.push({ q: t.faq.parkingQ, a: t.faq.parkingA.replace('{hotel}', name) })

  if (branch.phone) {
    entries.push({
      q: t.faq.contactQ.replace('{hotel}', name),
      a: t.faq.contactA.replace('{hotel}', name).replace('{phone}', branch.phone),
    })
  }

  if (opts.pointsEnabled) entries.push({ q: t.faq.pointsQ, a: t.faq.pointsA })

  return entries
}
