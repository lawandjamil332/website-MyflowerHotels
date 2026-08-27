import type { Branch, Room } from '@/payload-types'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'
import { formatNumber, formatPrice } from './format'
import { layoutLine } from './layout'

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

  // The amenity questions worth asking here rather than in a list. Breakfast
  // first: it is the one every guest checks, and the one the amenity list had
  // no box for until a hotel's own Google listing turned out to advertise a
  // buffet the website could not mention.
  if (has('breakfast'))
    entries.push({ q: t.faq.breakfastQ, a: t.faq.breakfastA.replace('{hotel}', name) })
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

/**
 * The questions asked before a hotel has been chosen.
 *
 * The About page had 138 words on it: two paragraphs about the family and a
 * row of photographs. That is the page somebody lands on when they have heard
 * the name and want to know what it is — and it did not tell them how many
 * hotels there are, where they are, or how booking works.
 *
 * Built from the branches themselves, so it stays right when a fifth opens.
 */
export const buildGroupFaq = (
  branches: Branch[],
  t: Dictionary,
  locale: Locale,
  opts: { pointsEnabled?: boolean; phone?: string | null } = {},
): FaqEntry[] => {
  const entries: FaqEntry[] = []
  if (branches.length === 0) return entries

  // "My Flower 1 (100m Street), My Flower 3 (Kirkuk Street), My Flower 4
  // (opening soon)" — a hotel with no address entered yet is named without
  // one rather than given empty brackets.
  const list = branches
    .map((b) => {
      const note =
        b.status === 'openingSoon'
          ? t.branch.openingSoon.toLowerCase()
          : b.neighbourhood || b.address?.split('\n')[0]
      return note ? `${b.name} (${note})` : b.name
    })
    // Arabic and Kurdish separate a list with ، not , — a Latin comma in
    // right-to-left prose is the same kind of small wrongness as a Latin
    // hotel name, and this sentence is now otherwise entirely in-language.
    .join(locale === 'en' ? ', ' : '، ')

  entries.push({
    q: t.faq.countQ.replace('{count}', formatNumber(branches.length, locale)),
    a: t.faq.countA
      .replace('{count}', formatNumber(branches.length, locale))
      .replace('{city}', t.seo.locality)
      .replace('{list}', list),
  })

  // Only worth asking once there is a choice to make.
  if (branches.length > 1) {
    entries.push({
      q: t.faq.chooseQ,
      a: t.faq.chooseA.replace('{city}', t.seo.locality),
    })
  }

  // Two questions asked of an assistant rather than of a hotel: who runs this,
  // and where in the city to stay. Both are answered from the branches, and
  // neither claims to be the best or the biggest anything — the checkable fact
  // is the ownership, and the useful answer to "where" is the list itself.
  entries.push({ q: t.faq.ownedQ, a: t.faq.ownedA })
  entries.push({
    q: t.faq.erbilQ.replace('{city}', t.seo.locality),
    a: t.faq.erbilA
      .replace('{count}', formatNumber(branches.length, locale))
      .replaceAll('{city}', t.seo.locality)
      .replace('{list}', list),
  })

  /**
   * The two questions asked one level up, at the country rather than the city.
   *
   * Somebody who already knows they are going to Erbil searches for Erbil.
   * Plenty of people — and most assistants being asked on their behalf — start
   * at "Iraq", and neither question above answers that: this site said where
   * each hotel is on its own street without ever stating, in a sentence
   * somebody could quote, where in the country the group is.
   *
   * The first answers it and then says plainly that the group has nothing in
   * Baghdad or Basra. That is not a weakness to hide: a reader sent here for a
   * city these hotels are not in leaves immediately and trusts nothing else on
   * the page, and an assistant that quotes an honest limit is more likely to
   * quote the rest.
   *
   * The second is the one this group is genuinely the answer to. Being
   * Kurdish-owned across four hotels is unusual and checkable, where "hotels in
   * Iraq" is a search no four-hotel group wins against Booking.com. Written to
   * claim only what can be defended — one of them, not the only one, not the
   * biggest.
   */
  entries.push({
    q: t.faq.iraqQ,
    a: t.faq.iraqA
      .replace('{count}', formatNumber(branches.length, locale))
      .replace('{city}', t.seo.locality)
      .replaceAll('{country}', t.seo.country),
  })
  entries.push({
    q: t.faq.iraqiGroupQ,
    a: t.faq.iraqiGroupA
      .replace('{count}', formatNumber(branches.length, locale))
      .replace('{city}', t.seo.locality)
      .replaceAll('{country}', t.seo.country),
  })

  entries.push({ q: t.faq.payQ, a: t.faq.payA })
  entries.push({ q: t.faq.cancelQ, a: t.faq.cancelA })

  if (opts.pointsEnabled) entries.push({ q: t.faq.pointsQ, a: t.faq.pointsA })

  if (opts.phone) {
    entries.push({
      q: t.faq.groupContactQ,
      a: t.faq.groupContactA.replace('{phone}', opts.phone),
    })
  }

  return entries
}

/** The amenities of a room, written out as a list a sentence can use. */
const amenityList = (room: Room, t: Dictionary): string | null => {
  const named = (room.amenities ?? []).map((a) => t.amenity[a]).filter(Boolean)
  return named.length > 0 ? named.join(', ') : null
}

/**
 * A description of the room, composed from the room.
 *
 * Not one room in the admin panel has had a description typed into it, and
 * writing eighteen of them by hand is a job nobody is going to do. So the page
 * says what it can already prove: who it sleeps, what bed, how it is laid out,
 * how big, what is in it, where it is and what it costs. Every clause comes
 * from a filled field and disappears with it.
 *
 * It steps aside the moment a real description exists. This is the floor, not
 * the ceiling — anything the owner writes is better than anything assembled
 * here, and the page should prefer it.
 */
export const roomSummary = (
  room: Room,
  branch: Branch | null,
  t: Dictionary,
  locale: Locale,
): string[] => {
  const sentences: string[] = []
  const name = room.name

  if (room.maxGuests) {
    const guests = formatNumber(room.maxGuests, locale)
    // "in a Suite bed" is not a sentence anybody would write — a suite is the
    // room, not the bed. The clause is only added for beds that are beds.
    const bed = room.bedType && room.bedType !== 'suite' ? t.bed[room.bedType] : null
    sentences.push(
      bed
        ? t.room.summarySleepsBed
            .replace('{room}', name)
            .replace('{guests}', guests)
            .replace('{bed}', bed.toLowerCase())
        : t.room.summarySleeps.replace('{room}', name).replace('{guests}', guests),
    )
  }

  const layout = layoutLine(room, t, locale)
  if (layout) sentences.push(t.room.summaryLayout.replace('{layout}', layout))

  if (room.sizeSqm)
    sentences.push(t.room.summarySize.replace('{size}', formatNumber(room.sizeSqm, locale)))

  // No amenity sentence here on purpose. The amenity list is rendered
  // directly beneath this paragraph, so naming them in prose first printed
  // "Wi-Fi, Air conditioning, Flat-screen TV" twice within a few centimetres.
  // The question below asks it once more, but that one is folded shut and
  // only opens for somebody who asked.

  // Nothing at all was filled in. Better an empty column than a paragraph
  // made of the room's name repeated back at the reader.
  if (sentences.length === 0) return []

  const second: string[] = []
  const where = branch ? branch.neighbourhood || branch.address : null
  if (branch && where) {
    second.push(
      t.room.summaryWhere
        .replace('{hotel}', branch.name)
        .replace('{where}', where)
        .replace('{city}', t.seo.locality),
    )
  }
  const price = formatPrice(room.priceFrom, room.currency, locale)
  second.push(price ? t.room.summaryPrice.replace('{price}', price) : t.room.summaryPay)

  return [sentences.join(' '), second.join(' ')]
}

/**
 * The room's own questions.
 *
 * Deliberately shorter than the hotel's, and deliberately not the same six
 * answers again. Everything about the building — the power, the Wi-Fi, the
 * parking, where it is — is answered in full one click away on the hotel page,
 * and repeating it on all eighteen room pages would make eighteen pages that
 * are mostly each other. What stays here is what changes from room to room,
 * plus the two that decide a booking: what it costs to hold, and whether it
 * can be undone.
 */
export const buildRoomFaq = (
  room: Room,
  branch: Branch | null,
  t: Dictionary,
  locale: Locale,
): FaqEntry[] => {
  const entries: FaqEntry[] = []
  const name = room.name

  if (room.maxGuests) {
    const guests = formatNumber(room.maxGuests, locale)
    const layout = layoutLine(room, t, locale)
    entries.push({
      q: t.faq.roomSleepsQ.replace('{room}', name),
      a: layout
        ? t.faq.roomSleepsLayoutA
            .replace('{room}', name)
            .replace('{guests}', guests)
            .replace('{layout}', layout)
        : t.faq.roomSleepsA.replace('{room}', name).replace('{guests}', guests),
    })
  }

  const amenities = amenityList(room, t)
  if (amenities) {
    entries.push({
      q: t.faq.roomIncludesQ.replace('{room}', name),
      a: t.faq.roomIncludesA.replace('{list}', amenities),
    })
  }

  const price = formatPrice(room.priceFrom, room.currency, locale)
  if (price) {
    entries.push({
      q: t.faq.roomPriceQ.replace('{room}', name),
      a: t.faq.roomPriceA.replace('{room}', name).replace('{price}', price),
    })
  }

  entries.push({ q: t.faq.payQ, a: t.faq.payA })
  entries.push({ q: t.faq.cancelQ, a: t.faq.cancelA })

  entries.push({
    q: t.faq.roomBookQ.replace('{room}', name),
    a: branch?.phone
      ? t.faq.roomBookPhoneA.replace('{phone}', branch.phone)
      : t.faq.roomBookA,
  })

  return entries
}
