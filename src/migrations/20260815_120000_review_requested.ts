import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * When the guest was asked to review their stay.
 *
 * The site has a review form, a verification path that will only accept a
 * review from a real finished booking, an approval queue, and star-rating
 * markup wired into every hotel page and into Google's results. All of it
 * works. It has produced nothing, because there are zero reviews, because
 * nobody has ever been asked for one.
 *
 * This column is what stops the asking happening twice. Staff mark a booking
 * "Stayed" and the request goes out; if somebody edits that booking a week
 * later, or unmarks and re-marks it, the stamp is already set and no second
 * email is sent. A guest who is asked twice for a review does not leave two.
 *
 * Nullable and never back-filled: every booking that already exists reads as
 * "not asked", which is exactly what it is.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "review_requested_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "review_requested_at";
  `)
}
