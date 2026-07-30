import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Breakfast, which the hotels serve and the website could not say.
 *
 * The amenity list was written from a template — gym, pool, airport shuttle —
 * and missed the one thing every guest checks before booking a room in this
 * city. My Flower 3's own Google listing advertises an open buffet; the site
 * had no box to tick for it, so the hotel page, the questions on it and the
 * markup Google reads were all silent about the best thing on offer.
 *
 * Postgres will not drop a value from an enum, so `down` leaves the type
 * alone and only clears the rows using it. Losing which hotels serve
 * breakfast is recoverable by ticking a box; a failed rollback is not.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "enum_branches_amenities" ADD VALUE IF NOT EXISTS 'breakfast';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "branches_amenities" WHERE "value" = 'breakfast';
  `)
}
