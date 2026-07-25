/**
 * Pulls latitude and longitude out of a Google Maps link.
 *
 * The branch page draws its map from two numbers, but nobody copies numbers —
 * they press Share in Google Maps and paste whatever it gives them. This reads
 * the coordinates out of that paste so the map appears on its own, and the
 * owner never has to know the map wanted something else.
 */
export type Coords = { latitude: number; longitude: number }

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
export const coordsFromMapsUrl = (url?: string | null): Coords | null => {
  if (!url) return null

  const patterns: RegExp[] = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|ll|sll|daddr|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const lat = Number(match[1])
      const lng = Number(match[2])
      if (valid(lat, lng)) return { latitude: lat, longitude: lng }
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
export const resolveShortMapsLink = async (url: string): Promise<Coords | null> => {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0' },
    })
    clearTimeout(timer)

    const fromUrl = coordsFromMapsUrl(response.url)
    if (fromUrl) return fromUrl

    // Some short links land on a page that only carries the coordinates in
    // its body, so fall back to reading the first pair out of the HTML.
    const body = await response.text()
    return coordsFromMapsUrl(body)
  } catch {
    return null
  }
}
