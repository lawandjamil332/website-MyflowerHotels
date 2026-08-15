import type { MetadataRoute } from 'next'

import { defaultLocale, locales, type Locale } from '@/i18n/config'
import { getBranches, getAllRooms } from '@/utilities/branches'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * The site's own sitemap, built from the database.
 *
 * What was here before was next-sitemap writing a static file at build time
 * with `exclude: ['/*']` in its config — which excluded every page — leaving an
 * index that pointed at two empty blog sitemaps and, because the deploy has no
 * NEXT_PUBLIC_SERVER_URL, pointed at them on localhost. Google was being handed
 * a map of nothing, at an address that does not exist.
 *
 * Generated rather than listed, so a hotel or a room type added in the admin
 * panel is in the sitemap the moment it is saved and nobody has to remember.
 *
 * Every URL carries its two translations as alternates. Google treats that as
 * equivalent to hreflang tags, and it is the thing that stops the English,
 * Kurdish and Arabic versions of one hotel being read as three competing pages.
 */

export const dynamic = 'force-dynamic'

type Entry = MetadataRoute.Sitemap[number]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerSideURL().replace(/\/$/, '')

  // Read once in the default language. Only the paths matter here, and slugs
  // are not translated — asking three times would be three times the queries
  // for the same list.
  const [branches, rooms] = await Promise.all([
    getBranches(defaultLocale as Locale),
    getAllRooms(defaultLocale as Locale),
  ])

  /**
   * One entry per language, each naming all three. `priority` says which pages
   * matter most when a crawler has limited patience: the homepage, then the
   * hotels themselves, then the rooms, then the rest.
   *
   * `lastModified` is omitted rather than invented when nothing is known. It
   * used to fall back to `new Date()`, so the homepage, the rooms index, About
   * and Contact each told Google they had changed at the exact moment Google
   * asked — a different answer on every crawl, for pages that had not changed
   * at all. Google's documented response to a lastmod it cannot trust is to
   * stop believing the whole file, which costs the pages that were reporting
   * theirs honestly.
   */
  const entry = (path: string, priority: number, lastModified?: string | Date | null): Entry[] =>
    locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
      changeFrequency: 'weekly' as const,
      priority,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])),
      },
    }))

  // The pages that are assembled from other records have no updatedAt of their
  // own, so they borrow the most recent one they are built from: the homepage
  // and About list the hotels, the rooms index lists the rooms. True, and it
  // moves only when something on the page really has.
  const newest = (rows: { updatedAt?: string | null }[]): Date | null => {
    const times = rows
      .map((r) => (r.updatedAt ? new Date(r.updatedAt).getTime() : NaN))
      .filter((t) => Number.isFinite(t))
    return times.length > 0 ? new Date(Math.max(...times)) : null
  }
  const branchesTouched = newest(branches)
  const roomsTouched = newest(rooms)
  const anythingTouched = newest([...branches, ...rooms])

  return [
    ...entry('', 1, anythingTouched),
    // The list of every hotel. Ranked with the rooms index rather than below
    // it: this is the page that answers what the company actually is.
    ...entry('/branches', 0.8, branchesTouched),
    ...entry('/rooms', 0.8, roomsTouched),
    ...entry('/about', 0.5, branchesTouched),
    ...entry('/contact', 0.6, branchesTouched),
    // The hotels are what somebody is actually searching for by name.
    ...branches.flatMap((b) => entry(`/branches/${b.slug}`, 0.9, b.updatedAt)),
    ...rooms.flatMap((r) => entry(`/rooms/${r.slug}`, 0.7, r.updatedAt)),
  ]
}
