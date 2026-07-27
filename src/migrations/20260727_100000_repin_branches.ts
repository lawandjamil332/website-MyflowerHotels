import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import {
  ERBIL,
  coordsFromMapsUrl,
  isShortMapsLink,
  resolveShortMapsLink,
} from '../utilities/mapsUrl'

/**
 * Throws away the coordinates the previous migration worked out, and has
 * another go under the rules that migration was missing.
 *
 * It put every hotel somewhere it is not — the owner's word was "completely
 * different place". Two faults behind it, both now fixed in mapsUrl:
 *
 *  - A Google place URL carries the pin as `!3d!4d` and the map's viewport as
 *    `@`, and the viewport was being read first.
 *  - Nothing checked the answer. When the fetch landed on a consent or error
 *    page instead of the place, one regex over that HTML matched whatever
 *    numbers it found and they were stored as a hotel.
 *
 * So the old numbers are cleared unconditionally rather than corrected: they
 * came from a reader that cannot be trusted, and there is no way from here to
 * tell a wrong one from a right one. Every hotel is then re-read with the
 * fixed parser, bounded to Erbil.
 *
 * The outcome is deliberately asymmetric. A coordinate inside Erbil is stored
 * and the map appears. Anything else stores nothing, and the map is absent
 * until somebody enters the numbers by hand. An absent map costs a guest a
 * moment; a confident wrong one sends them across the city.
 *
 * As ever: content, so it runs after every schema migration, and it never
 * throws.
 */

const links: { slug: string; googleMapsUrl: string }[] = [
  { slug: 'my-flower-1', googleMapsUrl: 'https://maps.app.goo.gl/JmMHpAdgeqG7UKcY8' },
  { slug: 'my-flower-2', googleMapsUrl: 'https://maps.app.goo.gl/XNo4tf3JvG1WDdk37' },
  { slug: 'my-flower-3', googleMapsUrl: 'https://maps.app.goo.gl/uFPgbkZTEvAAbBKe8' },
  { slug: 'my-flower-4', googleMapsUrl: 'https://maps.app.goo.gl/Cazd7CTLMFcW6Nrq9' },
]

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE branches
      SET latitude = NULL, longitude = NULL
      WHERE slug IN ('my-flower-1', 'my-flower-2', 'my-flower-3', 'my-flower-4')
    `)
    payload.logger.info('Pins: cleared the coordinates read by the previous migration')
  } catch (error) {
    payload.logger.error(`Pins: could not clear the old coordinates — ${error}`)
    return
  }

  for (const link of links) {
    try {
      const coords =
        coordsFromMapsUrl(link.googleMapsUrl, ERBIL) ??
        (isShortMapsLink(link.googleMapsUrl)
          ? await resolveShortMapsLink(link.googleMapsUrl, ERBIL)
          : null)

      if (!coords) {
        payload.logger.info(
          `Pins: no trustworthy coordinate for ${link.slug} — its map stays off until the ` +
            `numbers are entered on the hotel in the admin panel. Directions still work.`,
        )
        continue
      }

      await db.execute(sql`
        UPDATE branches
        SET latitude = ${coords.latitude}, longitude = ${coords.longitude}
        WHERE slug = ${link.slug}
      `)
      payload.logger.info(`Pins: ${link.slug} pinned at ${coords.latitude}, ${coords.longitude}`)
    } catch (error) {
      payload.logger.error(`Pins: ${link.slug} failed, stepping over — ${error}`)
    }
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE branches
      SET latitude = NULL, longitude = NULL
      WHERE slug IN ('my-flower-1', 'my-flower-2', 'my-flower-3', 'my-flower-4')
    `)
  } catch (error) {
    payload.logger.error(`Pins: could not undo — ${error}`)
  }
}
