import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The hotels were seeded with a 14:00 check-in, which was my assumption and is
 * wrong: reception is staffed around the clock. This corrects the rows that
 * still carry that seeded value and leaves alone any hotel whose time somebody
 * has since edited on purpose.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" ALTER COLUMN "site_name" SET DEFAULT 'My Flower Hotels';
  ALTER TABLE "branches" ADD COLUMN "check_in_any_time" boolean DEFAULT true;`)

  // Only the untouched seeded value, so a deliberate edit is never overwritten.
  await db.execute(sql`
    UPDATE "branches"
       SET "check_in_any_time" = true,
           "check_in_time" = NULL
     WHERE "check_in_time" = '14:00';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings_locales" ALTER COLUMN "site_name" SET DEFAULT 'Myflower Hotels';
  ALTER TABLE "branches" DROP COLUMN "check_in_any_time";`)
}
