import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Somewhere to name each hotel's verified Google Business Profile exactly.
 *
 * The site already stores a Google Maps link per hotel, and every one of them
 * is a maps.app.goo.gl share link — which works in a browser and, to anything
 * reading the page, is an opaque redirect. A Place ID is the opposite: it
 * names one verified business on Google and never moves.
 *
 * All four hotels have a verified profile, so the site can now say outright
 * that the hotel on a page and the profile with that ID are the same business.
 * For a group whose hotels have been read as four unrelated companies, that is
 * the statement that stops it.
 *
 * Nothing is seeded. The IDs are the owner's to paste in, and a guessed one
 * would point the markup at somebody else's hotel — which is worse than the
 * gap it filled and harder to notice.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS google_place_id varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE branches DROP COLUMN IF EXISTS google_place_id;
  `)
}
