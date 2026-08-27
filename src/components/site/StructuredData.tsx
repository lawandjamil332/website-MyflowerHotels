import type { Branch, Room } from '@/payload-types'
import { locales, type Locale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'
import { mediaUrl } from '@/utilities/media'
import { mapsPlaceUrl } from '@/utilities/mapsUrl'
import { nameVariants } from '@/utilities/nameVariants'

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
  reviews = [],
  amenityLabel,
}: {
  branch: Branch
  locale: Locale
  stars?: string | null
  /** Approved reviews only, and omitted entirely when there are none. */
  rating?: { average: number; count: number }
  /** Published rooms, for the price band and the room count. */
  rooms?: Room[]
  /**
   * The approved reviews this page prints, in the same order it prints them.
   * Google requires that every review in the markup be visible on the page
   * carrying it, so this must come from the same array the page renders and
   * never from a wider query.
   */
  reviews?: { guestName: string; rating: number; comment: string | null; createdAt: string }[]
  /** Turns "wifi" into "Wi-Fi" — see amenityFeature below. */
  amenityLabel?: (key: string) => string
}) {
  const base = getServerSideURL()

  /**
   * Several photographs, not one.
   *
   * Google asks for more than one image per place and prefers a choice of
   * shapes, because a result on a phone, a result in Maps and an image pack
   * all crop differently — handed a single picture it either crops badly or
   * shows nothing. This hotel already has a gallery of its own exterior,
   * lobby and rooms sitting one section down the page and none of it was
   * offered. The hero leads, because it is the one the owner chose.
   */
  const images = [branch.heroImage, ...(branch.gallery ?? [])]
    .flatMap((m) => {
      const url = mediaUrl(m, 'xlarge') || mediaUrl(m, 'large') || mediaUrl(m)
      const abs = absolute(url, base)
      return abs ? [abs] : []
    })
    // The same photograph used as both hero and first gallery entry is a
    // common way to fill a gallery, and repeating a URL here is the kind of
    // thing a validator flags.
    .filter((url, i, all) => all.indexOf(url) === i)
    .slice(0, 12)

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
      // A stable identity, and a declared parent. Without these, four hotel
      // pages are four unrelated hotels that happen to share a word in their
      // names — which is exactly how the rest of the internet reads them
      // today, and why nothing describes this as a group of four.
      '@id': `${base}/${locale}/branches/${branch.slug}#hotel`,
      parentOrganization: { '@id': `${base}/#organization` },
      name: branch.name,
      // The other spellings of this same name. Booking.com writes these hotels
      // as "MyFlower 1 Hotel"; the sign outside says "My Flower 1". Stating
      // both is what stops one brand being read as several properties.
      alternateName: nameVariants(branch.name),
      description: branch.tagline ?? undefined,
      url: `${base}/${locale}/branches/${branch.slug}`,
      image: images.length > 0 ? images : undefined,
      telephone: branch.phone ?? undefined,
      email: branch.email ?? undefined,
      address: clean({
        '@type': 'PostalAddress',
        streetAddress: branch.neighbourhood ?? branch.address ?? undefined,
        addressLocality: branch.city ?? 'Erbil',
        postalCode: branch.postalCode ?? undefined,
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
      // The individual reviews behind the average above.
      //
      // `aggregateRating` on its own tells Google there is a 4.6 without ever
      // showing it the reviews that make one — and Google's stated position is
      // that a rating it cannot see the basis for is a rating it need not
      // print. These are the same rows the page renders, in the same order,
      // which is both the requirement and the only version of this that is
      // honest. A review with nothing written in it is left out: a star with
      // no sentence is not a review anybody can read.
      review: reviews
        .filter((r) => r.comment && r.comment.trim())
        .slice(0, 10)
        .map((r) =>
          clean({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.guestName },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: r.comment ?? undefined,
            // Date only. The timestamp carries the hour a guest happened to
            // press send, which is nobody's business and not what the field
            // is asking for.
            datePublished: r.createdAt ? r.createdAt.slice(0, 10) : undefined,
          }),
        ),
      checkinTime: branch.checkInAnyTime ? '00:00' : (branch.checkInTime ?? undefined),
      checkoutTime: branch.checkOutTime ?? undefined,
      // Reception around the clock, stated where a machine reads it.
      //
      // "24-hour reception" is written on the page in three languages and was
      // nowhere in the markup, so the one operational fact that decides a late
      // arrival — and that a guest landing at Erbil airport at 2am is
      // explicitly searching for — could not be matched against the question.
      // Emitted only for hotels that actually say it about themselves.
      openingHoursSpecification: branch.checkInAnyTime
        ? {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ],
            opens: '00:00',
            closes: '23:59',
          }
        : undefined,
      priceRange,
      numberOfRooms: roomCount > 0 ? roomCount : undefined,
      // True of every hotel here and the reason a guest picks this site over a
      // listing one, so it is worth stating where a machine can read it.
      paymentAccepted: 'Cash, Card at the hotel',
      currenciesAccepted: 'IQD, USD',
      // The canonical address of this hotel's verified Google Business
      // Profile where there is one, falling back to whatever link the owner
      // pasted. A Place ID URL names one business exactly; a share link is a
      // redirect that has to be followed and trusted.
      hasMap: mapsPlaceUrl(branch.googlePlaceId) ?? branch.googleMapsUrl ?? undefined,
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
      // Every other record of this same building, named in the one field whose
      // job is to say they are the same building.
      //
      // The Booking.com listing carries reviews and an address this page
      // cannot claim; the Google Maps pin is the entity a local search result
      // is actually assembled from, and it appeared only under `hasMap`, which
      // says "here is a map of this place" and not "this place and that place
      // are one". TripAdvisor is here for the same reason and is usually the
      // last of the four to be linked from anywhere.
      //
      // This is the whole fix for a group that reads as four unrelated hotels:
      // four pages, each naming its own listings, all pointing at one parent.
      sameAs: [
        branch.facebook,
        branch.instagram,
        branch.bookingComUrl,
        branch.tripadvisorUrl,
        // The verified profile, named by its Place ID rather than pointed at
        // through a redirect. This is the strongest single line in the whole
        // block: the Business Profile is the record a local result is built
        // from, and this is what ties it to the hotel on this page.
        mapsPlaceUrl(branch.googlePlaceId) ?? branch.googleMapsUrl,
      ].filter(Boolean) as string[],
    }),
  )
}

export function RoomSchema({
  room,
  branch,
  locale,
  ratesValidUntil,
}: {
  room: Room
  branch: Branch | null
  locale: Locale
  /**
   * The date the owner has said these rates hold until, from Site settings.
   *
   * Not the thing that puts a price into a Google result — that is Google
   * Hotels, fed from Hotel Center, and no amount of markup on a hotel page
   * substitutes for it. What schema.org pricing on a hotel page is actually
   * read for is checking such a feed against the site, so this is a
   * prerequisite rather than a lever: it makes the offer complete and correct
   * for the day the group connects one.
   *
   * Passed in rather than computed because it is not a computable fact. Only
   * the hotel knows when it next intends to reprice, and a date generated here
   * would be a promise the hotel never made.
   */
  ratesValidUntil?: string | null
}) {
  const base = getServerSideURL()
  const url = `${base}/${locale}/rooms/${room.slug}`
  const image = absolute(mediaUrl(room.images?.[0], 'og') || mediaUrl(room.images?.[0]), base)

  /**
   * The date, but only while it is still in the future.
   *
   * A `priceValidUntil` in the past is worse than none at all: it states that
   * this rate expired, which is a false claim about a live price rather than
   * merely an incomplete one — and a date set last year and forgotten looks,
   * in the admin panel, exactly like a date that is working. Checked on every
   * request, because the passage of time is not something a stored value can
   * notice about itself.
   */
  const priceValidUntil = (() => {
    if (!ratesValidUntil) return undefined
    const until = new Date(ratesValidUntil)
    if (Number.isNaN(until.getTime()) || until.getTime() < Date.now()) return undefined
    // Date only. The hour a date-picker happened to store is not part of the
    // statement being made.
    return until.toISOString().slice(0, 10)
  })()

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
              postalCode: branch.postalCode ?? undefined,
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
              priceValidUntil,
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
  description,
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
  /** What this company is, in one sentence, in the reader's language. */
  description?: string
}) {
  const base = getServerSideURL()

  return json(
    clean({
      '@context': 'https://schema.org',
      '@type': 'HotelGroup',
      // The identity every hotel page points its parentOrganization at. One
      // company stated once, in a place four pages can all refer to, is the
      // difference between a group and four hotels with a word in common.
      '@id': `${base}/#organization`,
      name: siteName,
      // Both spellings, because the Booking.com listing and the sign outside
      // do not agree with each other and a search engine has no way to know
      // they are the same company unless it is told.
      alternateName: ['MyFlower Hotels', 'My Flower Hotel', 'MyFlower'],
      // The one sentence worth quoting about this company, in the field made
      // for it. The group had no description at all, so anything summarising
      // it had a name, a phone number and nothing to say.
      description,
      // Where the company itself started, which is not the same statement as
      // where its hotels happen to be.
      foundingLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Erbil',
          addressRegion: 'Kurdistan Region',
          addressCountry: 'IQ',
        },
      },
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
      // How many hotels this actually is, stated as a number rather than left
      // to be counted off a list.
      numberOfLocations: branches.length,
      subOrganization: branches.map((b) =>
        clean({
          '@type': 'Hotel',
          '@id': `${base}/${locale}/branches/${b.slug}#hotel`,
          name: b.name,
          url: `${base}/${locale}/branches/${b.slug}`,
          telephone: b.phone ?? undefined,
          address: clean({
            '@type': 'PostalAddress',
            streetAddress: b.neighbourhood ?? b.address ?? undefined,
            addressLocality: b.city ?? 'Erbil',
            postalCode: b.postalCode ?? undefined,
            addressRegion: 'Kurdistan Region',
            addressCountry: 'IQ',
          }),
        }),
      ),
    }),
  )
}

/**
 * The site itself, as a thing with a name and a language.
 *
 * Every other block here describes the company or a hotel. None of them said
 * anything about the website, which is what a search engine is actually
 * looking at — so there was no statement anywhere that this site is published
 * in three languages, and no way for it to offer the search box that appears
 * under a well-understood site's result.
 *
 * `SearchAction` points at the rooms browser, because that is the only page
 * here that takes a query and answers it. Pointing it at a page that ignores
 * the parameter is worse than omitting it: Google tests the URL.
 */
export function WebSiteSchema({
  siteName,
  locale,
  description,
}: {
  siteName: string
  locale: Locale
  description?: string
}) {
  const base = getServerSideURL()

  return json(
    clean({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      name: siteName,
      url: `${base}/${locale}`,
      description,
      // Stated rather than guessed from the URL. Three languages is a fact
      // about this site and one of the few things that distinguishes it from
      // every English-only listing page competing for the same searches.
      inLanguage: locales.map((l) => l),
      publisher: { '@id': `${base}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${base}/${locale}/rooms?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
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
          hasMap: mapsPlaceUrl(b.googlePlaceId) ?? b.googleMapsUrl ?? undefined,
          address: clean({
            '@type': 'PostalAddress',
            streetAddress: b.neighbourhood ?? b.address ?? undefined,
            addressLocality: b.city ?? 'Erbil',
            postalCode: b.postalCode ?? undefined,
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
 * Every hotel in the group, as one ordered list of places.
 *
 * The group's own markup lives on the homepage, and each hotel's lives on its
 * own page, so nothing on this site ever presented the hotels the way somebody
 * actually asks about them: as a set, at one address, countable. This is the
 * page that answers "how many are there and where", and `numberOfItems` beside
 * `itemListElement` is that answer in the one form a machine reads without
 * having to crawl four more URLs first.
 *
 * Each entry is a real Hotel with its own `@id`, not a bare link, so this list
 * and the four hotel pages resolve to the same four things rather than to eight.
 */
export function HotelListSchema({
  branches,
  locale,
  name,
}: {
  branches: Branch[]
  locale: Locale
  name: string
}) {
  if (branches.length === 0) return null
  const base = getServerSideURL()

  return json({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: branches.length,
    itemListElement: branches.map((branch, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: clean({
        '@type': 'Hotel',
        '@id': `${base}/${locale}/branches/${branch.slug}#hotel`,
        name: branch.name,
        url: `${base}/${locale}/branches/${branch.slug}`,
        telephone: branch.phone ?? undefined,
        parentOrganization: { '@id': `${base}/#organization` },
        address: clean({
          '@type': 'PostalAddress',
          streetAddress: branch.neighbourhood ?? branch.address ?? undefined,
          addressLocality: branch.city ?? 'Erbil',
          postalCode: branch.postalCode ?? undefined,
          addressRegion: 'Kurdistan Region',
          addressCountry: 'IQ',
        }),
      }),
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
