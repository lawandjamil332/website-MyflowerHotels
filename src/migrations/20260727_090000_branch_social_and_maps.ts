import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { coordsFromMapsUrl, isShortMapsLink, resolveShortMapsLink } from '../utilities/mapsUrl'

/**
 * Puts each hotel's own Instagram account and Google Maps link on it.
 *
 * Both came from the owner. The Instagram handles matter twice over: the
 * original seed gave My Flower 1 and 2 the *third* hotel's account, because
 * only one handle was known when it was written, so this is a correction as
 * much as an addition.
 *
 * The map is the reason this exists. Two things on the site draw a map, and
 * they want different inputs:
 *
 *  - "Get directions" uses the link as-is, so it starts working the moment
 *    this runs, wherever it runs.
 *  - The embedded map on the contact page and each hotel page is drawn from
 *    latitude and longitude, and a maps.app.goo.gl link carries neither. The
 *    numbers are behind Google's redirect.
 *
 * So this follows each short link far enough to read the coordinates out of
 * where it lands — the same thing the Branches beforeChange hook does when the
 * owner pastes a link in the admin panel, done here because a migration writes
 * SQL and never passes through that hook.
 *
 * That step needs the network. It has it on Railway and does not in a
 * sandbox, so a failure to resolve is expected rather than exceptional: the
 * link is still stored, "Get directions" still works, and the coordinates can
 * be filled later by opening the hotel in the admin panel and pressing save,
 * which runs the hook. Nothing here throws — a content migration must never be
 * able to take a deploy down.
 *
 * Coordinates already present are left alone, on the same reasoning as the
 * hook: a number somebody entered deliberately outranks one read off a link.
 */

type BranchLinks = {
  slug: string
  instagram: string
  googleMapsUrl: string
}

const branches: BranchLinks[] = [
  {
    slug: 'my-flower-1',
    instagram: 'https://instagram.com/myflower.hotel',
    googleMapsUrl: 'https://maps.app.goo.gl/JmMHpAdgeqG7UKcY8',
  },
  {
    slug: 'my-flower-2',
    instagram: 'https://instagram.com/myflower2.hotel',
    googleMapsUrl: 'https://maps.app.goo.gl/XNo4tf3JvG1WDdk37',
  },
  {
    slug: 'my-flower-3',
    instagram: 'https://instagram.com/myflower3.hotel',
    googleMapsUrl: 'https://maps.app.goo.gl/uFPgbkZTEvAAbBKe8',
  },
  {
    slug: 'my-flower-4',
    instagram: 'https://instagram.com/myflower4.hotel',
    googleMapsUrl: 'https://maps.app.goo.gl/Cazd7CTLMFcW6Nrq9',
  },
]

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  for (const branch of branches) {
    try {
      const updated = await db.execute(sql`
        UPDATE branches
        SET instagram = ${branch.instagram},
            google_maps_url = ${branch.googleMapsUrl}
        WHERE slug = ${branch.slug}
        RETURNING id, latitude, longitude
      `)

      const row = updated.rows?.[0] as
        { id: number; latitude: number | null; longitude: number | null } | undefined

      if (!row) {
        payload.logger.info(`Links: no hotel with slug ${branch.slug}, skipped`)
        continue
      }

      payload.logger.info(`Links: set Instagram and map link on ${branch.slug}`)

      if (typeof row.latitude === 'number' && typeof row.longitude === 'number') {
        payload.logger.info(`Links: ${branch.slug} already has coordinates, left as they are`)
        continue
      }

      const coords =
        coordsFromMapsUrl(branch.googleMapsUrl) ??
        (isShortMapsLink(branch.googleMapsUrl)
          ? await resolveShortMapsLink(branch.googleMapsUrl)
          : null)

      if (!coords) {
        payload.logger.info(
          `Links: could not read coordinates for ${branch.slug} — the link is stored and ` +
            `directions work; open the hotel in the admin panel and press save to fill them in`,
        )
        continue
      }

      await db.execute(sql`
        UPDATE branches
        SET latitude = ${coords.latitude},
            longitude = ${coords.longitude}
        WHERE slug = ${branch.slug}
      `)
      payload.logger.info(`Links: ${branch.slug} pinned at ${coords.latitude}, ${coords.longitude}`)
    } catch (error) {
      payload.logger.error(`Links: ${branch.slug} failed, stepping over — ${error}`)
    }
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  // Clears only what this added. The coordinates go too: they were derived
  // from these links, so leaving them behind would outlive their source.
  for (const branch of branches) {
    try {
      await db.execute(sql`
        UPDATE branches
        SET instagram = NULL,
            google_maps_url = NULL,
            latitude = NULL,
            longitude = NULL
        WHERE slug = ${branch.slug}
      `)
    } catch (error) {
      payload.logger.error(`Links: could not undo ${branch.slug} — ${error}`)
    }
  }
}
