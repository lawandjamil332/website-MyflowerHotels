import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * One switch: whether Google may have these hotels' prices.
 *
 * The box on a Google listing showing Booking.com and Agoda is Google Hotel
 * Center, and it reads a machine-readable feed. A website cannot appear in it
 * by being good; it appears by sending that feed. This column is what decides
 * whether the site is willing to serve one.
 *
 * Default false, and it stays false until a person ticks it. A site that
 * started offering four hotels' prices to Google the moment it deployed would
 * be making a commercial decision on the owner's behalf.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_feed boolean DEFAULT false;
  `)
  payload.logger.info('Google feed: switch added, off — turn it on in Site settings')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE settings DROP COLUMN IF EXISTS google_feed;`)
}
