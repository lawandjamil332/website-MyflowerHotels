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
   */
  const entry = (path: string, priority: number, lastModified?: string | null): Entry[] =>
    locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified: lastModified ? new Date(lastModified) : new Date(),
      changeFrequency: 'weekly' as const,
      priority,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])),
      },
    }))

  return [
    ...entry('', 1),
    ...entry('/rooms', 0.8),
    ...entry('/about', 0.5),
    ...entry('/contact', 0.6),
    // The hotels are what somebody is actually searching for by name.
    ...branches.flatMap((b) => entry(`/branches/${b.slug}`, 0.9, b.updatedAt)),
    ...rooms.flatMap((r) => entry(`/rooms/${r.slug}`, 0.7, r.updatedAt)),
  ]
}
