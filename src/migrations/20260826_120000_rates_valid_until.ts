import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Somewhere to say how long the published room rates hold.
 *
 * A hotel's prices reach Google through Google Hotels, not through the markup
 * on its own pages; what schema.org pricing on a hotel page is read for is
 * checking such a feed against the site. So this is a prerequisite rather than
 * a lever — it completes the room markup for the day the group connects one.
 * The answer is not computable either way: only the owner knows when he next
 * intends to reprice.
 *
 * Nothing is seeded. Empty means nothing is claimed, and the site behaves
 * exactly as it did before this ran.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS rates_valid_until timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE settings DROP COLUMN IF EXISTS rates_valid_until;
  `)
}
