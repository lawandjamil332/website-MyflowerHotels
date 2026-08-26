import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Somewhere to put each hotel's TripAdvisor page.
 *
 * The site already names each hotel's Instagram, its Facebook page, its
 * Booking.com listing and its Google Maps pin, and hands all of them to a
 * search engine as `sameAs` — the field whose only job is to say "this record
 * and that record are the same thing". TripAdvisor was missing from that list
 * for no better reason than that there was no column for it, and TripAdvisor
 * is where a good part of the world looks a hotel up.
 *
 * Nothing is seeded. The URLs are the owner's to paste in, and a guessed one
 * pointing at the wrong hotel would be worse than the gap it filled.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS tripadvisor_url varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE branches DROP COLUMN IF EXISTS tripadvisor_url;
  `)
}
