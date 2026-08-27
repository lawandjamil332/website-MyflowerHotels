/**
 * Pulls latitude and longitude out of a Google Maps link.
 *
 * The branch page draws its map from two numbers, but nobody copies numbers —
 * they press Share in Google Maps and paste whatever it gives them. This reads
 * the coordinates out of that paste so the map appears on its own, and the
 * owner never has to know the map wanted something else.
 */
export type Coords = { latitude: number; longitude: number }

/** A box a coordinate has to fall inside to be believed. */
export type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number }

/**
 * Greater Erbil, generously drawn.
 *
 * Every hotel in this group is in one city, so a coordinate outside this box
 * is not a hotel however confidently it was parsed — it is a number scraped
 * off the wrong page. Reading a stray pair out of a Google consent screen once
 * put a pin in another country, and a map that is confidently wrong is worse
 * than no map: it sends a guest to the wrong address. Out of the box, nothing
 * is stored and the map simply does not appear.
 */
export const ERBIL: Bounds = { minLat: 35.9, maxLat: 36.5, minLng: 43.7, maxLng: 44.4 }

const within = (lat: number, lng: number, bounds?: Bounds): boolean =>
  !bounds ||
  (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng)

const valid = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180 &&
  // 0,0 is in the Atlantic and is what a failed parse looks like.
  !(lat === 0 && lng === 0)

/**
 * Handles the shapes Google actually produces:
 *   .../@36.1911,44.0092,17z          the address bar while looking at a place
 *   ...!3d36.1911!4d44.0092           the place URL's own encoding
 *   ...?q=36.1911,44.0092             a pin shared by coordinates
 *   ...?ll=36.1911,44.0092            older links
 *   ...?destination=36.1911,44.0092   a directions link
 */
export const coordsFromMapsUrl = (url?: string | null, bounds?: Bounds): Coords | null => {
  if (!url) return null

  // Order matters, and getting it wrong put a hotel in the wrong place.
  //
  // A Google place URL carries two different pairs. `!3d!4d` is the place
  // itself — the pin. `@` is only where the map happened to be centred, which
  // is the same thing when the link is fresh and something else entirely when
  // the person sharing it had panned away first. The pin is asked for first
  // and the viewport is a fallback, never the other way round.
  const patterns: RegExp[] = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|ll|sll|daddr|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const lat = Number(match[1])
      const lng = Number(match[2])
      if (valid(lat, lng) && within(lat, lng, bounds)) return { latitude: lat, longitude: lng }
    }
  }

  return null
}

/** Google's Share button hands out these; the coordinates are behind a redirect. */
export const isShortMapsLink = (url?: string | null): boolean =>
  Boolean(url && /(?:maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(url))

/**
 * Follows a short link far enough to read the coordinates out of where it
 * lands. Deliberately forgiving: this runs while the owner is saving a hotel,
 * and a slow or unreachable Google must never hold up or fail that save.
 */
export const resolveShortMapsLink = async (
  url: string,
  bounds?: Bounds,
): Promise<Coords | null> => {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0' },
    })
    clearTimeout(timer)

    // Where the redirect landed is the trustworthy answer.
    const fromUrl = coordsFromMapsUrl(response.url, bounds)
    if (fromUrl) return fromUrl

    // Some short links land on a page that only carries the coordinates in
    // its body. This is the loosest reading available — it is one regex over
    // whatever HTML came back, and if Google served a consent or error page
    // instead it will happily match something unrelated. It stays because
    // some links need it, but only ever inside the bounds.
    const body = await response.text()
    return coordsFromMapsUrl(body, bounds)
  } catch {
    return null
  }
}

/**
 * The Place ID of a hotel's Google Business Profile.
 *
 * A `maps.app.goo.gl/XNo4tf3` link is a share link: it works in a browser, and
 * to anything reading the page it is an opaque redirect that could point
 * anywhere. A Place ID is the opposite — it names one verified business on
 * Google, exactly, and never moves. That distinction is the whole game for a
 * group whose four hotels read as four unrelated businesses: the strongest
 * statement this site can make is "the hotel on this page and the verified
 * profile with this ID are the same place", and it cannot make it with a
 * redirect.
 *
 * Accepts whatever Google handed over. The owner may paste the bare ID from
 * the Place ID finder, or a whole URL with it buried in a query parameter —
 * both are the same fact, and asking him to know which is which is asking him
 * to care about a distinction that is our problem, not his.
 */
export const placeIdFrom = (input?: string | null): string | null => {
  const raw = (input ?? '').trim()
  if (!raw) return null

  // Inside a URL, under either of the two names Google uses.
  const inUrl = raw.match(/(?:place_id[:=]|query_place_id=)([A-Za-z0-9_-]+)/)
  if (inUrl) return inUrl[1]

  // A bare ID. Google's are opaque and have grown longer over the years, so
  // this checks the alphabet and a plausible length rather than a prefix —
  // matching on "ChIJ" would reject the other shapes Google issues.
  if (/^[A-Za-z0-9_-]{15,}$/.test(raw) && !raw.includes('://')) return raw

  return null
}

/**
 * The canonical Google Maps URL for a Place ID.
 *
 * This is the form Google documents for linking to a specific place, and it is
 * what belongs in `sameAs` — a stable address for one business rather than a
 * link that happens to render a map.
 */
export const mapsPlaceUrl = (placeId?: string | null): string | null =>
  placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : null
