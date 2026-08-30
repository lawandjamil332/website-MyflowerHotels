import type { Payload } from 'payload'

import { dbPool } from './db'

/**
 * The two documents Google needs before a My Flower price can appear beside
 * Booking.com's and Agoda's.
 *
 * The box on a hotel's Google listing that reads "Booking.com — IQD 72,421" is
 * not fed by the website and not by the structured data on it. It is Google
 * Hotel Center, and the only thing it reads is a machine-readable feed: a list
 * of the properties, and a price and a yes-or-no for every room on every date.
 * The OTAs are in that box because they send those two things every day. Adding
 * more pages, more markup or better copy to this site could never have put it
 * there.
 *
 * Both documents are built here, from the same rooms, rates and bookings the
 * website sells from. That is the point rather than a convenience: Google
 * price-checks the feed against the page a guest lands on and removes a
 * property whose numbers disagree, so the feed must not have its own idea of
 * what a night costs. It asks `availableRoomsAcross`-shaped questions of the
 * same tables the booking engine locks against.
 *
 * The XML is Google's, not invented here — `<listings>` with `<listing>`
 * children for the property list, and `<Transaction>` carrying `<Result>`
 * elements for the rates, each with Property, RoomID, Checkin, Nights and
 * either a Baserate or `<Unavailable><NoVacancy/></Unavailable>`. Checked
 * against Google's own reference rather than written from memory, because a
 * feed that is nearly right is a feed Google rejects.
 *
 * What is deliberately NOT here: sending it. Google is told where to fetch the
 * property list, and the rates go to its endpoint under credentials issued
 * with a Hotel Center account. Until that account exists there is nothing to
 * send to, so this builds the documents and serves them, and the owner and I
 * can both read exactly what Google would be told before anybody promises it
 * anything.
 */

/** Statuses that hold a room. Mirrors OCCUPYING in utilities/booking.ts. */
const OCCUPYING = ['held', 'confirmed', 'completed']

/** Rates are offered this far ahead. Google asks for a rolling window. */
export const FEED_DAYS = 90

const escape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** A tag, or nothing at all when there is no value — never an empty element. */
const tag = (name: string, value: unknown, attrs = ''): string =>
  value === null || value === undefined || value === ''
    ? ''
    : `<${name}${attrs}>${escape(String(value))}</${name}>`

const startOfDayUtc = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const iso = (date: Date) => date.toISOString().slice(0, 10)

/**
 * Whether the group has asked to be in Google's booking box at all.
 *
 * Off by default and off until somebody turns it on, the same way the
 * ownership claim on the About page waits for a date. A feed that appears the
 * moment the code is deployed would be this site volunteering four hotels'
 * prices to Google before anyone decided that was wanted.
 */
export const feedEnabled = async (payload: Payload): Promise<boolean> => {
  try {
    const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
    return Boolean((settings as { googleFeed?: boolean })?.googleFeed)
  } catch {
    return false
  }
}

// ---- The property list ----------------------------------------------------

type Listing = {
  id: number
  name: string | null
  address: string | null
  neighbourhood: string | null
  city: string | null
  postal_code: string | null
  latitude: string | null
  longitude: string | null
  phone: string | null
  status: string | null
}

/**
 * Every open hotel, with the address and pin Google matches against its own
 * record of the place.
 *
 * A hotel that has not opened is left out rather than sent with a note. Google
 * matches a listing to a real building and shows prices for it; a property
 * that cannot take a guest tonight has no business in that box.
 */
export const hotelListFeed = async (payload: Payload): Promise<string> => {
  const { rows } = await dbPool(payload).query<Listing>(
    `SELECT b.id, bl.name, bl.address, bl.neighbourhood, bl.city, b.postal_code,
            b.latitude, b.longitude, b.phone, b.status
       FROM branches b
       LEFT JOIN branches_locales bl ON bl._parent_id = b.id AND bl._locale = 'en'
      WHERE b.status IS DISTINCT FROM 'openingSoon'
      ORDER BY b."order" NULLS LAST, b.id`,
  )

  const listings = rows
    // A listing without a pin cannot be matched to a building, and Google
    // requires both. Better to send three hotels than four with one adrift.
    .filter((row) => row.latitude !== null && row.longitude !== null && row.name)
    .map((row) => {
      const street = row.address || row.neighbourhood

      return [
        '  <listing>',
        `    ${tag('id', row.id)}`,
        `    ${tag('name', row.name)}`,
        '    <address format="simple">',
        street ? `      <component name="addr1">${escape(street)}</component>` : '',
        `      <component name="city">${escape(row.city || 'Erbil')}</component>`,
        '      <component name="province">Erbil Governorate</component>',
        row.postal_code
          ? `      <component name="postal_code">${escape(row.postal_code)}</component>`
          : '',
        '    </address>',
        // The hotels are in Erbil, Kurdistan Region, Iraq. The country here is
        // geography — where the building is — and is not the same statement as
        // who owns it, which is said in words on the site and is Kurdish.
        '    <country>IQ</country>',
        `    ${tag('latitude', row.latitude)}`,
        `    ${tag('longitude', row.longitude)}`,
        row.phone ? `    <phone type="main">${escape(row.phone)}</phone>` : '',
        '    <category>hotel</category>',
        '  </listing>',
      ]
        .filter(Boolean)
        .join('\n')
    })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<listings>',
    '  <language>en</language>',
    // The coordinate system the latitudes and longitudes are in. Everything
    // that produced them — Google Maps links, the map on the branch page — is
    // WGS84, which is also what Google expects.
    '  <datum>WGS84</datum>',
    ...listings,
    '</listings>',
    '',
  ].join('\n')
}

// ---- Prices and availability ----------------------------------------------

type RoomRow = {
  id: number
  branch_id: number
  name: string | null
  max_guests: string | null
  quantity: string
  is_available: boolean | null
  price_from: string | null
  currency: string | null
}

export type FeedNight = {
  roomId: number
  branchId: number
  date: string
  /** Null when nothing can be sold that night. */
  price: number | null
  currency: string
}

/**
 * One night at a time, for every room, for the window ahead.
 *
 * Length of stay is one night throughout. Google will ask for longer stays and
 * work them out from these; sending every length from one to thirty would be
 * thirty times the document for arithmetic Google already does.
 *
 * A night is unavailable when the room is switched off, when the calendar
 * closes it, when the rooms-to-sell for that night are already taken, or when
 * there is no price to quote. All four are the same answer to a guest — you
 * cannot have it — and Google is told the same thing in each case.
 */
export const feedNights = async (
  payload: Payload,
  options: { days?: number; from?: Date; roomIds?: number[] } = {},
): Promise<FeedNight[]> => {
  const pool = dbPool(payload)
  const days = options.days ?? FEED_DAYS
  const from = startOfDayUtc(options.from ?? new Date())
  const to = new Date(from.getTime() + days * 86_400_000)
  // Narrowed when only a few rooms changed, so telling Google about one edited
  // night does not mean rebuilding ninety days for fifty-seven rooms.
  const only = options.roomIds?.length ? options.roomIds : null

  const [rooms, rates, stays] = await Promise.all([
    pool.query<RoomRow>(
      `SELECT r.id, r.branch_id, rl.name, r.max_guests, r.quantity, r.is_available,
              r.price_from, r.currency
         FROM rooms r
         LEFT JOIN rooms_locales rl ON rl._parent_id = r.id AND rl._locale = 'en'
         LEFT JOIN branches b       ON b.id = r.branch_id
        WHERE b.status IS DISTINCT FROM 'openingSoon'
          AND ($1::int[] IS NULL OR r.id = ANY($1::int[]))
        ORDER BY r.branch_id, r.id`,
      [only],
    ),
    pool.query<{
      room_id: number
      date: Date
      price: string | null
      rooms_to_sell: string | null
      closed: boolean | null
    }>(
      `SELECT room_id, date, price, rooms_to_sell, closed
         FROM room_rates
        WHERE date >= $1 AND date < $2
          AND ($3::int[] IS NULL OR room_id = ANY($3::int[]))`,
      [from, to, only],
    ),
    pool.query<{ room_id: number | null; check_in: Date; check_out: Date }>(
      `SELECT room_id, check_in, check_out FROM bookings
        WHERE status = ANY($3) AND check_in < $2 AND check_out > $1
          AND ($4::int[] IS NULL OR room_id = ANY($4::int[]))`,
      [from, to, OCCUPYING, only],
    ),
  ])

  const key = (roomId: number, index: number) => `${roomId}:${index}`

  const overrides = new Map<string, { price: number | null; sell: number | null; shut: boolean }>()
  for (const rate of rates.rows) {
    const index = Math.round((new Date(rate.date).getTime() - from.getTime()) / 86_400_000)
    if (index < 0 || index >= days) continue
    overrides.set(key(rate.room_id, index), {
      price: rate.price === null ? null : Number(rate.price),
      sell: rate.rooms_to_sell === null ? null : Number(rate.rooms_to_sell),
      shut: rate.closed === true,
    })
  }

  const taken = new Map<string, number>()
  for (const stay of stays.rows) {
    if (stay.room_id === null) continue
    const checkIn = new Date(stay.check_in).getTime()
    const checkOut = new Date(stay.check_out).getTime()
    for (let i = 0; i < days; i++) {
      const night = from.getTime() + i * 86_400_000
      if (checkIn <= night && checkOut > night) {
        const at = key(stay.room_id, i)
        taken.set(at, (taken.get(at) ?? 0) + 1)
      }
    }
  }

  const out: FeedNight[] = []
  for (const room of rooms.rows) {
    const quantity = Number(room.quantity) || 0
    const base = room.price_from === null ? null : Number(room.price_from)

    for (let i = 0; i < days; i++) {
      const at = key(room.id, i)
      const own = overrides.get(at)
      const sell = own?.sell ?? quantity
      const free = sell - (taken.get(at) ?? 0)
      const price = own?.price ?? base
      const sellable = room.is_available !== false && !own?.shut && free > 0 && price !== null

      out.push({
        branchId: room.branch_id,
        currency: room.currency || 'IQD',
        date: iso(new Date(from.getTime() + i * 86_400_000)),
        price: sellable ? price : null,
        roomId: room.id,
      })
    }
  }

  return out
}

/** One night, as Google's Result element: a price, or a refusal. */
export const resultFor = (night: FeedNight): string =>
  [
    '  <Result>',
    `    <Property>${night.branchId}</Property>`,
    `    <RoomID>${night.roomId}</RoomID>`,
    `    <Checkin>${night.date}</Checkin>`,
    '    <Nights>1</Nights>',
    night.price === null
      ? '    <Unavailable><NoVacancy/></Unavailable>'
      : [
          `    <Baserate currency="${escape(night.currency)}">${night.price}</Baserate>`,
          `    <Tax currency="${escape(night.currency)}">0</Tax>`,
          `    <OtherFees currency="${escape(night.currency)}">0</OtherFees>`,
        ].join('\n'),
    '  </Result>',
  ].join('\n')

/** Wraps Results in the envelope Google's endpoint expects. */
export const transaction = (results: string[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<Transaction timestamp="${new Date().toISOString()}" id="${Date.now()}">`,
    ...results,
    '</Transaction>',
    '',
  ].join('\n')

/**
 * The rates document, as Google's Transaction message.
 *
 * `<PropertyDataSet>` names the rooms once; `<Result>` then carries one night
 * each. Taxes and fees are sent as zero because this group quotes a room rate
 * with nothing added at the desk — which is worth saying explicitly rather
 * than leaving out, since an omitted tax is the commonest reason a feed's
 * price and a landing page's price disagree.
 */
export const ratesFeed = async (payload: Payload, days = FEED_DAYS): Promise<string> => {
  const pool = dbPool(payload)

  const [rooms, nights] = await Promise.all([
    pool.query<RoomRow>(
      `SELECT r.id, r.branch_id, rl.name, r.max_guests, r.quantity, r.is_available,
              r.price_from, r.currency
         FROM rooms r
         LEFT JOIN rooms_locales rl ON rl._parent_id = r.id AND rl._locale = 'en'
         LEFT JOIN branches b       ON b.id = r.branch_id
        WHERE b.status IS DISTINCT FROM 'openingSoon'
        ORDER BY r.branch_id, r.id`,
    ),
    feedNights(payload, { days }),
  ])

  const properties = rooms.rows.map((room) =>
    [
      '  <PropertyDataSet>',
      `    ${tag('Property', room.branch_id)}`,
      '    <RoomData>',
      `      ${tag('RoomID', room.id)}`,
      `      ${tag('Name', room.name)}`,
      room.max_guests ? `      <Capacity>${Number(room.max_guests)}</Capacity>` : '',
      '    </RoomData>',
      '  </PropertyDataSet>',
    ]
      .filter(Boolean)
      .join('\n'),
  )

  const results = nights.map(resultFor)

  const now = new Date().toISOString()

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<Transaction timestamp="${now}" id="${Date.now()}">`,
    ...properties,
    ...results,
    '</Transaction>',
    '',
  ].join('\n')
}
