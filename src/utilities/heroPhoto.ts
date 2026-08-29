import type { Branch, Room } from '@/payload-types'
import { mediaUrl } from './media'

type MediaLike = Parameters<typeof mediaUrl>[0]

/**
 * A different photograph on every page, from the photographs there already are.
 *
 * The homepage, the rooms browser, the hotels index and the contact page all
 * reached for `branches[0].heroImage`, so all four opened on the same picture
 * of the same building. Clicking through the site felt like reloading one page,
 * and the group looked like one grey block rather than four hotels — which is
 * the opposite of the thing this site exists to say.
 *
 * Nobody has to choose these. Every hero photograph, every gallery picture and
 * every room photograph in the group goes into one pool, and each page takes a
 * different position in it. Add a photograph anywhere and the pages redistribute
 * themselves; add none and this changes nothing.
 *
 * Deduplicated by id, because the same file is often both a hotel's hero and
 * the first picture in its gallery, and two pages landing on it would put us
 * back where we started.
 */
export const photoPool = (branches: Branch[], rooms: Room[] = []): MediaLike[] => {
  const seen = new Set<number>()
  const pool: MediaLike[] = []

  const add = (media: MediaLike) => {
    if (!media || typeof media === 'number') return
    if (!mediaUrl(media)) return
    if (seen.has(media.id)) return
    seen.add(media.id)
    pool.push(media)
  }

  // Hotel heroes first: they are the pictures somebody chose deliberately, so
  // they are the ones worth landing on.
  for (const b of branches) add(b.heroImage)
  for (const r of rooms) for (const image of r.images ?? []) add(image)
  for (const b of branches) for (const g of b.gallery ?? []) add(g)

  return pool
}

/**
 * The photograph for one page.
 *
 * `offset` is that page's place in the queue — 0 for the homepage, 1 for the
 * next page, and so on. It wraps, so a group with two photographs still works;
 * it just repeats sooner, which is the honest outcome of having two
 * photographs.
 */
export const heroFor = (pool: MediaLike[], offset: number): MediaLike =>
  pool.length === 0 ? undefined : pool[offset % pool.length]
