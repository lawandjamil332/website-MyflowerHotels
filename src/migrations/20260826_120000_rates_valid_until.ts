import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Somewhere to say how long the published room rates hold.
 *
 * Google will not print a price in a search result unless the structured data
 * says when that price stops being valid — so every room on this site carried
 * a rate on the page that no result was permitted to show. There was no field
 * to answer it with, and the answer is not computable: only the owner knows
 * when he next intends to reprice.
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
