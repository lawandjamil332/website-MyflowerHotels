import type { Locale } from '@/i18n/config'

/**
 * How far each hotel is from the places guests actually search for.
 *
 * "Hotel near Erbil airport" and "hotel near the Citadel" are among the
 * commonest ways anybody looks for a room in this city, and this site could
 * not answer either. It had a `nearby` field for it — a sentence the owner
 * writes by hand, per hotel, in three languages — and a field nobody fills is
 * a feature nobody has. Meanwhile every hotel already carried the one thing
 * needed to answer it properly: its own coordinates, entered so the map pin
 * would land in the right place.
 *
 * So the answer is computed rather than typed. It cannot go stale, it cannot
 * be forgotten for the fourth hotel, and it is right in all three languages
 * the day a fifth opens.
 *
 * WHAT THIS IS HONEST ABOUT. These are straight-line distances — the distance
 * a bird flies, not a taxi. A real drive is longer and the difference is not a
 * fixed ratio: it depends on the road. Every place this is shown says so, and
 * puts a link to Google Maps beside it for the route a guest would actually
 * take. A made-up "fifteen minutes by car" would read better and would be a
 * number invented by a website, which is precisely the kind of thing a guest
 * discovers at two in the morning with luggage.
 *
 * Ranking, though, survives the approximation: the hotel nearest the airport
 * in a straight line is the nearest one by road here too, because Erbil's
 * roads run out from the centre in rings and the four hotels sit within a few
 * kilometres of each other.
 */

export type Landmark = {
  id: string
  latitude: number
  longitude: number
  /** Its name in each language the site is published in. */
  name: Record<Locale, string>
}

/**
 * Kept deliberately short.
 *
 * Every entry is somewhere a guest plausibly types into a search box, and
 * whose position is not in doubt. A list of twenty would make the block on the
 * hotel page unreadable and would start including places whose coordinates are
 * a guess — and one wrong distance discredits the other nineteen.
 */
export const ERBIL_LANDMARKS: Landmark[] = [
  {
    id: 'airport',
    latitude: 36.2376,
    longitude: 43.9632,
    name: {
      en: 'Erbil International Airport',
      ku: 'فڕۆکەخانەی نێودەوڵەتی هەولێر',
      ar: 'مطار أربيل الدولي',
    },
  },
  {
    id: 'citadel',
    latitude: 36.1911,
    longitude: 44.0092,
    name: {
      en: 'Erbil Citadel',
      ku: 'قەڵای هەولێر',
      ar: 'قلعة أربيل',
    },
  },
]

/**
 * Straight-line distance in kilometres.
 *
 * The proper haversine rather than flat trigonometry. At these distances the
 * two agree to within a few metres and the flat version is shorter to write —
 * but it is wrong in a way that grows silently with distance, and this file
 * will outlive the assumption that everything in it is within ten kilometres
 * of everything else.
 */
export const distanceKm = (
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371 // the Earth's mean radius in kilometres
  const dLat = toRad(toLat - fromLat)
  const dLon = toRad(toLon - fromLon)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export type LandmarkDistance = { id: string; name: string; km: number }

/**
 * Every landmark, with its distance from one hotel, nearest first.
 *
 * Returns nothing at all when the hotel has no coordinates — which is the
 * honest answer, and is why this is worth calling on every hotel page rather
 * than being guarded at each call site.
 */
export const landmarksFrom = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  locale: Locale,
): LandmarkDistance[] => {
  const lat = Number(latitude)
  const lon = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return []

  return ERBIL_LANDMARKS.map((landmark) => ({
    id: landmark.id,
    name: landmark.name[locale] ?? landmark.name.en,
    km: distanceKm(lat, lon, landmark.latitude, landmark.longitude),
  })).sort((a, b) => a.km - b.km)
}

/**
 * The distance as a guest would say it.
 *
 * One decimal below ten kilometres and none above, because "10.4 km" and
 * "10 km" mean the same thing to somebody deciding on a hotel, while "2 km"
 * and "2.4 km" do not. Under a kilometre it switches to metres: "0.4 km" is a
 * number nobody says out loud.
 *
 * Western digits in every language. The rest of this site writes numbers the
 * way each language does, and these sit beside a Google Maps link where the
 * route will be labelled in Western digits regardless — a guest comparing the
 * two should not have to convert.
 */
export const formatKm = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}
