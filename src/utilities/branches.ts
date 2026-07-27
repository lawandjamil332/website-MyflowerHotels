import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Locale } from '@/i18n/config'
import type { Branch, Offer, Room } from '@/payload-types'

/**
 * All queries here swallow database errors and return empty results.
 * The deploy build has no database, and a hotel site that 500s because a
 * query failed is worse than one that renders without a section.
 */

export const getBranches = async (locale: Locale): Promise<Branch[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'branches',
      locale,
      depth: 2,
      limit: 50,
      sort: 'order',
      overrideAccess: false,
    })
    return docs
  } catch {
    return []
  }
}

export const getBranchBySlug = async (slug: string, locale: Locale): Promise<Branch | null> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'branches',
      locale,
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
      overrideAccess: false,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}

export const getRoomsForBranch = async (branchId: number, locale: Locale): Promise<Room[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'rooms',
      locale,
      depth: 2,
      limit: 50,
      where: {
        and: [{ branch: { equals: branchId } }, { isAvailable: { not_equals: false } }],
      },
      overrideAccess: false,
    })
    return docs
  } catch {
    return []
  }
}

export const getFeaturedRooms = async (locale: Locale, limit = 6): Promise<Room[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'rooms',
      locale,
      depth: 2,
      limit,
      where: { isAvailable: { not_equals: false } },
      overrideAccess: false,
    })
    return docs
  } catch {
    return []
  }
}

/** Every available room across all hotels, for the rooms browser. */
export const getAllRooms = async (locale: Locale): Promise<Room[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'rooms',
      locale,
      depth: 2,
      limit: 200,
      sort: 'priceFrom',
      where: { isAvailable: { not_equals: false } },
      overrideAccess: false,
    })
    return docs
  } catch {
    return []
  }
}

export const getRoomBySlug = async (slug: string, locale: Locale): Promise<Room | null> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'rooms',
      locale,
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
      overrideAccess: false,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}

/**
 * Live offers, newest rules first.
 *
 * An expired offer left on the page is worse than no offer at all: a guest who
 * asks for it and is told it has finished has been misled by the site. So the
 * end date is filtered in the query rather than trusted to be tidied by hand,
 * and an offer with no end date simply never expires.
 */
export const getOffers = async (locale: Locale): Promise<Offer[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'offers',
      locale,
      depth: 2,
      limit: 24,
      sort: 'order',
      where: {
        and: [
          { isActive: { not_equals: false } },
          {
            or: [
              { endsOn: { exists: false } },
              { endsOn: { greater_than_equal: new Date().toISOString() } },
            ],
          },
        ],
      },
      overrideAccess: false,
    })
    return docs
  } catch {
    return []
  }
}
