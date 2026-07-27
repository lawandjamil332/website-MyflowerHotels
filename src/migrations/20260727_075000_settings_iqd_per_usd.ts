import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The dinars-per-dollar rate, so the site can offer prices in either.
 *
 * Rooms are priced in dinars, which is right for the guests who live here and
 * unhelpful for the ones flying in — a number in the hundreds of thousands
 * reads as expensive until you divide it. One rate the owner keeps roughly
 * current is enough for a room rate; nobody is settling an account against it.
 *
 * Nullable on purpose. Empty means no rate has been entered, and the front end
 * hides the switch entirely rather than converting against a guess.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "iqd_per_usd" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "iqd_per_usd";
  `)
}
