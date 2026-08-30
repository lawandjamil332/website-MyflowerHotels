import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { dbPool as pool } from '@/utilities/db'

/**
 * What is missing from the site, counted from the site.
 *
 * Every item here was, at some point, written down in a message to the owner
 * as "you should fill this in" — and a list in a message is read once and then
 * is gone. These are the same facts, recomputed every time he opens the admin
 * panel, so a gap closes itself off the list the moment it is filled and a new
 * hotel arrives on it without anybody remembering to say so.
 *
 * Only things a person has to supply. Nothing here can be fixed by code: they
 * are addresses, landmarks, photographs and IDs that only the hotel knows, and
 * that is exactly why they need somewhere to be visible.
 */

export type Check = {
  /** What is missing, and how many. */
  title: string
  /** What it costs to leave it — the reason to bother, in the owner's terms. */
  why: string
  /** Which hotels or rooms, where naming them helps. */
  detail?: string
  /** Roughly how much it is worth doing. */
  weight: 'high' | 'medium'
  /** Where in the admin panel to go. */
  href?: string
}

const MIN_PHOTO_WIDTH = 2000

export const runChecks = async (): Promise<Check[] | null> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const checks: Check[] = []

    const [branches, rooms, settings] = await Promise.all([
      payload.find({ collection: 'branches', limit: 50, depth: 0, locale: 'en' }),
      payload.find({ collection: 'rooms', limit: 200, depth: 0, locale: 'en' }),
      payload.findGlobal({ slug: 'settings' }).catch(() => null),
    ])

    const hotels = branches.docs
    const names = (list: { name?: string | null }[]) =>
      list.map((h) => h.name).filter(Boolean).join(', ')

    // An open hotel with no address is the worst state on this list: it is
    // findable in search and cannot tell anybody where it is.
    const noAddress = hotels.filter(
      (h) => h.status !== 'openingSoon' && !h.neighbourhood && !h.address,
    )
    if (noAddress.length) {
      checks.push({
        title: `${noAddress.length} open hotel${noAddress.length > 1 ? 's have' : ' has'} no address`,
        why: 'Guests can find the page in search and it cannot tell them where to go.',
        detail: names(noAddress),
        weight: 'high',
        href: '/admin/collections/branches',
      })
    }

    /**
     * A hotel with no pin on the map.
     *
     * This began as a missing map on the branch page, which is bad enough. It
     * became the first thing on this list to block money: Google Hotel Center
     * matches a property to a real building by its coordinates, and a hotel
     * without them cannot be sent at all. Two of the four are in that state
     * right now, which means two of the four can never appear beside
     * Booking.com in the box on their own Google listing, however good the
     * rest of the site gets.
     *
     * Paste the hotel's Google Maps link into the hotel and the pin is read
     * out of it — there is nothing to look up by hand.
     */
    const noPin = hotels.filter(
      (h) => h.status !== 'openingSoon' && (h.latitude == null || h.longitude == null),
    )
    if (noPin.length) {
      checks.push({
        title: `${noPin.length} hotel${noPin.length > 1 ? 's have' : ' has'} no map pin`,
        why: 'No map on the page, and Google cannot be sent the prices for a hotel it cannot place.',
        detail: names(noPin),
        weight: 'high',
        href: '/admin/collections/branches',
      })
    }

    // "Hotel near the Citadel" is one of the commonest shapes this question
    // takes, and no street name answers it.
    const noNearby = hotels.filter((h) => !h.nearby)
    if (noNearby.length) {
      checks.push({
        title: `${noNearby.length} hotel${noNearby.length > 1 ? 's have' : ' has'} no landmarks`,
        why: 'People search "hotel near the Citadel", not by street. One line each answers it.',
        detail: names(noNearby),
        weight: 'high',
        href: '/admin/collections/branches',
      })
    }

    // The reviews that put stars beside a Google result have to be on this
    // site. Booking.com's belong to Booking.com.
    let noReviews: typeof hotels = []
    try {
      const { rows } = await pool(payload).query(
        `SELECT branch_id, COUNT(*)::int AS n
           FROM reviews WHERE approved IS TRUE GROUP BY branch_id`,
      )
      const counted = new Map(rows.map((r: Record<string, unknown>) => [Number(r.branch_id), Number(r.n)]))
      noReviews = hotels.filter((h) => !counted.get(h.id))
    } catch {
      // The reviews table is not readable here; say nothing rather than
      // reporting every hotel as having none.
      noReviews = []
    }
    if (noReviews.length) {
      checks.push({
        title: `${noReviews.length} hotel${noReviews.length > 1 ? 's have' : ' has'} no reviews on this site`,
        why: 'Stars only appear beside your Google result if the reviews are on your own page. Ask departing guests.',
        detail: names(noReviews),
        weight: 'high',
        href: '/admin/collections/reviews',
      })
    }

    // Photographs too small for the sizes the site generates.
    try {
      const { rows } = await pool(payload).query(
        `SELECT COUNT(*)::int AS n FROM media WHERE width IS NOT NULL AND width < $1`,
        [MIN_PHOTO_WIDTH],
      )
      const small = Number(rows[0]?.n ?? 0)
      if (small > 0) {
        checks.push({
          title: `${small} photograph${small > 1 ? 's are' : ' is'} smaller than ${MIN_PHOTO_WIDTH}px`,
          why: 'The site makes 1400 and 1920 wide versions for big screens. Below that it cannot, so they look soft on a laptop.',
          weight: 'medium',
          href: '/admin/collections/media',
        })
      }
    } catch {
      // Not fatal; the rest of the list is still worth showing.
    }

    const noPlaceId = hotels.filter((h) => !h.googlePlaceId)
    if (noPlaceId.length) {
      checks.push({
        title: `${noPlaceId.length} hotel${noPlaceId.length > 1 ? 's have' : ' has'} no Google Place ID`,
        why: 'It tells Google this page and your verified Business Profile are the same place.',
        detail: names(noPlaceId),
        weight: 'high',
        href: '/admin/collections/branches',
      })
    }

    const noTripadvisor = hotels.filter((h) => !h.tripadvisorUrl)
    if (noTripadvisor.length) {
      checks.push({
        title: `${noTripadvisor.length} hotel${noTripadvisor.length > 1 ? 's have' : ' has'} no TripAdvisor link`,
        why: 'If the hotel is on TripAdvisor, linking it ties another listing back here. If it is not, ignore this.',
        detail: names(noTripadvisor),
        weight: 'medium',
        href: '/admin/collections/branches',
      })
    }

    /**
     * Only asked of hotels that are actually on Booking.com.
     *
     * This first flagged every hotel without a score, which was wrong the
     * moment the owner said My Flower 2 and 4 have listings he has
     * deliberately closed. A checklist that nags about a decision somebody
     * made on purpose is worse than one that stays quiet: it is wrong, it
     * cannot be cleared, and after a week of ignoring one line a person stops
     * reading the others too.
     *
     * So the listing URL is the signal of intent. A hotel with one is being
     * sold there and should carry its score; a hotel without one is either not
     * listed or listed on purpose without being advertised here, and either
     * way this has nothing to say about it.
     */
    const noScore = hotels.filter(
      (h) =>
        h.status !== 'openingSoon' &&
        h.bookingComUrl &&
        typeof h.bookingComScore !== 'number',
    )
    if (noScore.length) {
      checks.push({
        title: `${noScore.length} hotel${noScore.length > 1 ? 's are' : ' is'} on Booking.com with no score shown`,
        why: 'The listing is linked but the score is not copied across, so the page shows no proof.',
        detail: names(noScore),
        weight: 'medium',
        href: '/admin/collections/branches',
      })
    }

    const noRoomText = rooms.docs.filter((r) => !r.description)
    if (noRoomText.length) {
      checks.push({
        title: `${noRoomText.length} room${noRoomText.length > 1 ? 's have' : ' has'} no description`,
        why: 'The site writes one from the size and bed, which is a floor. Two honest sentences beat it.',
        weight: 'medium',
        href: '/admin/collections/rooms',
      })
    }

    // Set-and-forgotten is the likely failure here, so a past date is called
    // out rather than treated as filled in.
    const until = settings?.ratesValidUntil ? new Date(settings.ratesValidUntil) : null
    if (until && !Number.isNaN(until.getTime()) && until.getTime() < Date.now()) {
      checks.push({
        title: 'The "rates valid until" date has passed',
        why: 'It is being left out of the markup rather than published stale. Update it when you reprice.',
        weight: 'medium',
        href: '/admin/globals/settings',
      })
    }

    const order = { high: 0, medium: 1 }
    return checks.sort((a, b) => order[a.weight] - order[b.weight])
  } catch {
    // The panel must open even when this cannot run.
    return null
  }
}
