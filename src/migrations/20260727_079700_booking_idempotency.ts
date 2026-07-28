import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * One press, one booking.
 *
 * A guest pressing confirm twice — a slow connection, an impatient thumb, a
 * double-tap — produced two reservations. The button disables itself while the
 * first is in flight, which is not a guarantee: it is client-side, and a second
 * request can already be on the wire before React has re-rendered anything.
 *
 * So each rendering of the form carries a key of its own, and the database
 * holds it unique. The second press arrives with the same key, is refused by
 * the index, and the guest is shown the booking the first press made — which is
 * what they wanted, and what they think happened.
 *
 * Partial, because a booking entered by staff in the admin panel has no key and
 * they must not all collide on null.
 *
 * Numbered 079700 to run after the bookings table and before the photo seed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar;

    CREATE UNIQUE INDEX IF NOT EXISTS "bookings_idempotency_key_idx"
      ON "bookings" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "bookings_idempotency_key_idx";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "idempotency_key";
  `)
}
