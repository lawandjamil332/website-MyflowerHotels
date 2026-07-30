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
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as T

export function HotelSchema({
  branch,
  locale,
  stars,
  rating,
}: {
  branch: Branch
  locale: Locale
  stars?: string | null
  /** Approved reviews only, and omitted entirely when there are none. */
  rating?: { average: number; count: number }
}) {
  const base = getServerSideURL()
  const image = mediaUrl(branch.heroImage, 'og') || mediaUrl(branch.heroImage)

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
      amenityFeature: branch.amenities?.length
        ? branch.amenities.map((a) => ({
            '@type': 'LocationFeatureSpecification',
            name: a.replace(/_/g, ' '),
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
  const image = mediaUrl(room.images?.[0], 'og') || mediaUrl(room.images?.[0])

  return json(
    clean({
      '@context': 'https://schema.org',
      '@type': 'HotelRoom',
      name: room.name,
      url: `${base}/${locale}/rooms/${room.slug}`,
      image: image || undefined,
      bed: room.bedType ?? undefined,
      occupancy: room.maxGuests
        ? { '@type': 'QuantitativeValue', maxValue: room.maxGuests }
        : undefined,
      floorSize: room.sizeSqm
        ? { '@type': 'QuantitativeValue', value: room.sizeSqm, unitCode: 'MTK' }
        : undefined,
      containedInPlace: branch ? { '@type': 'Hotel', name: branch.name } : undefined,
      offers:
        typeof room.priceFrom === 'number'
          ? {
              '@type': 'Offer',
              price: room.priceFrom,
              priceCurrency: room.currency || 'IQD',
              availability: room.isAvailable === false ? 'SoldOut' : 'InStock',
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
  establishedYear,
}: {
  siteName: string
  locale: Locale
  branches: Branch[]
  phone?: string | null
  establishedYear?: number | null
}) {
  const base = getServerSideURL()

  return json(
    clean({
      '@context': 'https://schema.org',
      '@type': 'HotelGroup',
      name: siteName,
      url: `${base}/${locale}`,
      telephone: phone ?? undefined,
      foundingDate: establishedYear ? String(establishedYear) : undefined,
      areaServed: 'Erbil, Kurdistan Region, Iraq',
      subOrganization: branches.map((b) => ({
        '@type': 'Hotel',
        name: b.name,
        url: `${base}/${locale}/branches/${b.slug}`,
      })),
    }),
  )
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
