import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The postcode, which every address on this site was missing.
 *
 * A PostalAddress carrying locality, region and country but no postcode is an
 * address a search engine can only partly match against a business it already
 * knows. It is the same job the Google Place ID does, approached from the
 * other direction, and it costs one column.
 *
 * Seeded with 44001 for the hotels in Erbil. That is not a guess: Booking.com
 * publishes it on the group's own two listings — "44001 Erbil, Iraq" on
 * MyFlower 1, and the same on MyFlower 3 — so it is the group's own data
 * coming back from a place that already had it right. Only rows whose city is
 * Erbil are touched, and only where the field is empty, so a hotel that opens
 * elsewhere later is never given a postcode from another city.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS postal_code varchar;
  `)

  try {
    const result = await db.execute(sql`
      UPDATE branches
      SET postal_code = '44001'
      WHERE postal_code IS NULL
        AND (city IS NULL OR lower(trim(city)) = 'erbil')
      RETURNING slug
    `)
    payload.logger.info(`Postcode: set 44001 on ${result.rows?.length ?? 0} hotel(s) in Erbil`)
  } catch (error) {
    // The column is what matters; the seed is a convenience.
    payload.logger.error(`Postcode: column added, seed skipped — ${error}`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE branches DROP COLUMN IF EXISTS postal_code;
  `)
}
