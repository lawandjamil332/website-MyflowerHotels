import type { Branch, Room } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'
import { mediaUrl } from '@/utilities/media'

/**
 * schema.org markup, so a search result for one of these hotels can carry its
 * address, phone number, star rating and price band rather than a bare link.
 *
 * The brief is right that a Google Business Profile will bring more enquiries
 * than the website — this is the part of the website that feeds the same
 * machinery, and it costs nothing to keep accurate because it is generated
 * from whatever is in the admin panel.
 *
 * Only fields that actually hold a value are emitted. Structured data
 * asserting a rating or a price the group never entered is worse than none.
 */
const json = (data: unknown) => (
  <script
    type="application/ld+json"
    // The payload is built here from typed documents, not from user input.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
)

const clean = <T extends Record<string, unknown>>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
    ),
  ) as T

/**
 * Media paths come back from Payload as "/api/media/file/…", which is correct
 * in an <img> and wrong here: structured data is read away from the page that
 * carried it, with no origin to resolve against, so a relative image is an
 * image Google cannot fetch. Every picture in every block below went out this
 * way, which is the quiet kind of fault — the markup validates, the photograph
 * simply never appears beside the result.
 */
const absolute = (path: string, base: string): string | undefined => {
  if (!path) return undefined
  return /^https?:\/\//.test(path) ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

export function HotelSchema({
  branch,
  locale,
  stars,
  rating,
  rooms = [],
  amenityLabel,
}: {
  branch: Branch
  locale: Locale
  stars?: string | null
  /** Approved reviews only, and omitted entirely when there are none. */
  rating?: { average: number; count: number }
  /** Published rooms, for the price band and the room count. */
  rooms?: Room[]
  /** Turns "wifi" into "Wi-Fi" — see amenityFeature below. */
  amenityLabel?: (key: string) => string
}) {
  const base = getServerSideURL()
  const image = absolute(mediaUrl(branch.heroImage, 'og') || mediaUrl(branch.heroImage), base)

  // The band a hotel result carries beside its stars. Written from the rooms
  // actually published, so it cannot drift from the prices on the page, and
  // omitted rather than guessed when nothing is priced.
  const prices = rooms
    .map((r) => r.priceFrom)
    .filter((p): p is number => typeof p === 'number' && p > 0)
  const currency = rooms.find((r) => r.currency)?.currency || 'IQD'
  const priceRange =
    prices.length > 0
      ? (() => {
          const low = Math.min(...prices)
          const high = Math.max(...prices)
          return low === high
            ? `${currency} ${low.toLocaleString('en-US')}`
            : `${currency} ${low.toLocaleString('en-US')}–${high.toLocaleString('en-US')}`
        })()
      : undefined

  const roomCount = rooms.reduce((sum, r) => sum + (r.quantity ?? 0), 0)

  return json(
    clean({
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      name: branch.name,
      description: branch.tagline ?? undefined,
      url: `${base}/${locale}/branches/${branch.slug}`,
      image: image || undefined,
      telephone: branch.phone ?? undefined,
      email: branch.email ?? undefined,
      address: clean({
        '@type': 'PostalAddress',
        streetAddress: branch.neighbourhood ?? branch.address ?? undefined,
        addressLocality: branch.city ?? 'Erbil',
        addressRegion: 'Kurdistan Region',
        addressCountry: 'IQ',
      }),
      geo:
        typeof branch.latitude === 'number' && typeof branch.longitude === 'number'
          ? {
              '@type': 'GeoCoordinates',
              latitude: branch.latitude,
              longitude: branch.longitude,
            }
          : undefined,
      starRating: stars ? { '@type': 'Rating', ratingValue: Number(stars) } : undefined,
      // What puts ★ 4.6 (12) beside this hotel in a Google result. Google
      // requires the reviews producing it to be visible on the same page, so
      // this is emitted only from the same numbers the page prints, and never
      // at all when nothing has been approved yet — a fabricated rating here
      // is the kind of thing that costs a site its rich results permanently.
      aggregateRating:
        rating && rating.count > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: rating.average,
              reviewCount: rating.count,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
      checkinTime: branch.checkInAnyTime ? '00:00' : (branch.checkInTime ?? undefined),
      checkoutTime: branch.checkOutTime ?? undefined,
      priceRange,
      numberOfRooms: roomCount > 0 ? roomCount : undefined,
      // True of every hotel here and the reason a guest picks this site over a
      // listing one, so it is worth stating where a machine can read it.
      paymentAccepted: 'Cash, Card at the hotel',
      currenciesAccepted: 'IQD, USD',
      // The owner's own map pin. Coordinates would be better and are emitted
      // above the moment latitude and longitude are filled in; until then this
      // is the only location a machine can follow.
      hasMap: branch.googleMapsUrl ?? undefined,
      amenityFeature: branch.amenities?.length
        ? branch.amenities.map((a) => ({
            '@type': 'LocationFeatureSpecification',
            // "wifi" and "air_conditioning" are this codebase's storage keys,
            // not the names of anything. Emitted raw they told Google nothing
            // it could match against a search for air conditioning.
            name: amenityLabel?.(a) || a.replace(/_/g, ' '),
            value: true,
          }))
        : undefined,
      sameAs: [branch.facebook, branch.instagram].filter(Boolean) as string[],
    }),
  )
}

export function RoomSchema({
  room,
  branch,
  locale,
}: {
  room: Room
  branch: Branch | null
  locale: Locale
}) {
  const base = getServerSideURL()
  const url = `${base}/${locale}/rooms/${room.slug}`
  const image = absolute(mediaUrl(room.images?.[0], 'og') || mediaUrl(room.images?.[0]), base)

  return json(
    clean({
      '@context': 'https://schema.org',
      '@type': 'HotelRoom',
      name: room.name,
      url,
      image,
      bed: room.bedType ?? undefined,
      occupancy: room.maxGuests
        ? { '@type': 'QuantitativeValue', maxValue: room.maxGuests }
        : undefined,
      floorSize: room.sizeSqm
        ? { '@type': 'QuantitativeValue', value: room.sizeSqm, unitCode: 'MTK' }
        : undefined,
      // Named and linked rather than named alone, so the room and the hotel
      // are understood as the same two things the breadcrumb describes.
      containedInPlace: branch
        ? clean({
            '@type': 'Hotel',
            name: branch.name,
            url: `${base}/${locale}/branches/${branch.slug}`,
            address: clean({
              '@type': 'PostalAddress',
              streetAddress: branch.neighbourhood ?? branch.address ?? undefined,
              addressLocality: branch.city ?? 'Erbil',
              addressRegion: 'Kurdistan Region',
              addressCountry: 'IQ',
            }),
          })
        : undefined,
      offers:
        typeof room.priceFrom === 'number'
          ? {
              '@type': 'Offer',
              price: room.priceFrom,
              priceCurrency: room.currency || 'IQD',
              // Google matches these against the schema.org vocabulary by
              // full URL; the bare word was not recognised, so every room
              // read as availability unknown.
              availability:
                room.isAvailable === false
                  ? 'https://schema.org/SoldOut'
                  : 'https://schema.org/InStock',
              url,
            }
          : undefined,
    }),
  )
}

export function GroupSchema({
  siteName,
  locale,
  branches,
  phone,
  email,
  establishedYear,
  logoUrl,
  imageUrl,
  social = [],
}: {
  siteName: string
  locale: Locale
  branches: Branch[]
  phone?: string | null
  email?: string | null
  establishedYear?: number | null
  logoUrl?: string
  imageUrl?: string
  /** Instagram, Facebook and the rest — how Google ties the site to the profiles. */
  social?: (string | null | undefined)[]
}) {
  const base = getServerSideURL()

  return json(
    clean({
      '@context': 'https://schema.org',
      '@type': 'HotelGroup',
      name: siteName,
      url: `${base}/${locale}`,
      // Without these the group had no picture and no logo of its own, so the
      // one entry meant to represent the whole business was the thinnest
      // thing on the site.
      logo: absolute(logoUrl ?? '', base),
      image: absolute(imageUrl ?? '', base),
      telephone: phone ?? undefined,
      email: email ?? undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Erbil',
        addressRegion: 'Kurdistan Region',
        addressCountry: 'IQ',
      },
      foundingDate: establishedYear ? String(establishedYear) : undefined,
      areaServed: 'Erbil, Kurdistan Region, Iraq',
      sameAs: social.filter(Boolean) as string[],
      // Each hotel with its own address, so this one block establishes four
      // places rather than four names.
      subOrganization: branches.map((b) =>
        clean({
          '@type': 'Hotel',
          name: b.name,
          url: `${base}/${locale}/branches/${b.slug}`,
          telephone: b.phone ?? undefined,
          address: clean({
            '@type': 'PostalAddress',
            streetAddress: b.neighbourhood ?? b.address ?? undefined,
            addressLocality: b.city ?? 'Erbil',
            addressRegion: 'Kurdistan Region',
            addressCountry: 'IQ',
          }),
        }),
      ),
    }),
  )
}

/**
 * The contact page, as the place a machine looks up where this business is.
 *
 * It carried no structured data at all, which for the one page on the site
 * that is nothing but four addresses and four phone numbers is the largest
 * single gap in the markup. Local results are assembled from exactly this.
 */
export function ContactSchema({
  siteName,
  locale,
  branches,
  phone,
  email,
}: {
  siteName: string
  locale: Locale
  branches: Branch[]
  phone?: string | null
  email?: string | null
}) {
  const base = getServerSideURL()

  return json({
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: siteName,
    url: `${base}/${locale}/contact`,
    mainEntity: clean({
      '@type': 'HotelGroup',
      name: siteName,
      telephone: phone ?? undefined,
      email: email ?? undefined,
      subOrganization: branches.map((b) =>
        clean({
          '@type': 'Hotel',
          name: b.name,
          url: `${base}/${locale}/branches/${b.slug}`,
          telephone: b.phone ?? undefined,
          email: b.email ?? undefined,
          hasMap: b.googleMapsUrl ?? undefined,
          address: clean({
            '@type': 'PostalAddress',
            streetAddress: b.neighbourhood ?? b.address ?? undefined,
            addressLocality: b.city ?? 'Erbil',
            addressRegion: 'Kurdistan Region',
            addressCountry: 'IQ',
          }),
        }),
      ),
    }),
  })
}

/**
 * The rooms index, as a list rather than a wall.
 *
 * This page carries more links than any other on the site and had no markup
 * on it at all, so nothing said that the thirty-odd links below are one set of
 * comparable things. Positions are what make it a list and not a pile.
 */
export function RoomListSchema({
  rooms,
  locale,
  name,
}: {
  rooms: Room[]
  locale: Locale
  name: string
}) {
  if (rooms.length === 0) return null
  const base = getServerSideURL()

  return json({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: rooms.length,
    itemListElement: rooms.map((room, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${base}/${locale}/rooms/${room.slug}`,
      name: room.name,
    })),
  })
}

/**
 * The trail from the homepage down to this page.
 *
 * Google prints it in place of the bare URL under a result — "myflowerhotels
 * .com › Hotels › My Flower 1" reads as a place in a structured site, where a
 * raw address reads as a page somebody happened to leave lying about. It costs
 * nothing and it is one of the few rich results a small site reliably gets.
 *
 * Positions are 1-based and must be contiguous, which is why the trail is
 * built from an ordered list here rather than assembled by each caller.
 */
export function BreadcrumbSchema({
  locale,
  trail,
}: {
  locale: Locale
  /** Ancestors then self, without the homepage — that is added here. */
  trail: { name: string; path?: string }[]
}) {
  const base = getServerSideURL()
  const items = [{ name: 'My Flower Hotels', path: '' }, ...trail]

  return json({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      // The last crumb is the page being looked at, and Google asks that it
      // carry no item of its own.
      ...(index < items.length - 1 ? { item: `${base}/${locale}${entry.path ?? ''}` } : {}),
    })),
  })
}

/**
 * The same questions, told to Google.
 *
 * Earns the expandable question rows that appear under a result and take up
 * several times the height of an ordinary listing. Google requires that every
 * question and answer here also be visible on the page itself, which is why
 * this is only ever rendered from the same array the page prints — a schema
 * describing answers a visitor cannot find is the kind of thing that costs a
 * site its rich results for good.
 */
export function FaqSchema({ entries }: { entries: { q: string; a: string }[] }) {
  if (entries.length === 0) return null
  return json({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: { '@type': 'Answer', text: entry.a },
    })),
  })
}
