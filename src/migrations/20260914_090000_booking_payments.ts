import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Where a card payment against a booking is recorded.
 *
 * Added ahead of the processor's integration call so that nothing about the
 * database is on the critical path that day: the columns, the index and the
 * constraint are already live, and the only thing left is credentials.
 *
 * WHY `payment_status` IS SEPARATE FROM `status`. A booking's status is what
 * the front desk cares about — is the room held, did they turn up. Whether the
 * money arrived is a different question with a different life: a confirmed
 * booking can be unpaid, a cancelled one can have been paid and be owed a
 * refund, and a stay can complete with a deposit taken and the balance settled
 * in cash at the desk. Folding the two into one column means a state that
 * cannot be written down the first time a guest cancels after paying.
 *
 * THE UNIQUE INDEX IS THE POINT. `payment_reference` is the gateway's own id
 * for a transaction, and gateways retry their webhooks — on a timeout, on a
 * non-200, sometimes just twice. Without a unique index the second delivery is
 * a second payment: the row is written again, and anything counting money by
 * row counts it twice. With it, the retry loses a race it was never meant to
 * win. It is partial so that the many bookings with no payment at all do not
 * collide on NULL.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_bookings_payment_status" AS ENUM (
        'unpaid', 'pending', 'paid', 'failed', 'refunded'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "payment_status" "enum_bookings_payment_status"
        NOT NULL DEFAULT 'unpaid',
      ADD COLUMN IF NOT EXISTS "payment_provider"  varchar,
      ADD COLUMN IF NOT EXISTS "payment_reference" varchar,
      ADD COLUMN IF NOT EXISTS "payment_amount"    numeric,
      ADD COLUMN IF NOT EXISTS "payment_currency"  varchar,
      ADD COLUMN IF NOT EXISTS "payment_status_raw" varchar,
      ADD COLUMN IF NOT EXISTS "paid_at" timestamp(3) with time zone;
  `)

  // One gateway transaction can only ever be recorded once. See above.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "bookings_payment_reference_idx"
      ON "bookings" ("payment_reference")
      WHERE "payment_reference" IS NOT NULL;
  `)

  // The admin panel's payments view and the reconciliation query both filter on
  // status and order by when the money landed.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "bookings_payment_status_paid_at_idx"
      ON "bookings" ("payment_status", "paid_at");
  `)

  /**
   * The owner's own switch, in Site settings.
   *
   * Two switches guard card payments and they are deliberately different kinds
   * of thing. The credentials live in environment variables because they are a
   * deployment secret; this one lives in the database because it is a decision
   * the hotel makes — on the morning the processor finally goes live, or on the
   * afternoon something looks wrong — and neither of those should wait for a
   * developer or a redeploy.
   *
   * Defaults to 'off', which is the behaviour the site has always had: a guest
   * books with a name and a telephone number and pays on arrival.
   */
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_settings_online_payments_mode" AS ENUM ('off', 'optional');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "settings"
      ADD COLUMN IF NOT EXISTS "online_payments_mode"
        "enum_settings_online_payments_mode" DEFAULT 'off',
      ADD COLUMN IF NOT EXISTS "online_payments_deposit_percent" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings"
      DROP COLUMN IF EXISTS "online_payments_deposit_percent",
      DROP COLUMN IF EXISTS "online_payments_mode";
  `)
  await db.execute(sql`DROP TYPE IF EXISTS "enum_settings_online_payments_mode";`)
  await db.execute(sql`DROP INDEX IF EXISTS "bookings_payment_status_paid_at_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "bookings_payment_reference_idx";`)
  await db.execute(sql`
    ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "paid_at",
      DROP COLUMN IF EXISTS "payment_status_raw",
      DROP COLUMN IF EXISTS "payment_currency",
      DROP COLUMN IF EXISTS "payment_amount",
      DROP COLUMN IF EXISTS "payment_reference",
      DROP COLUMN IF EXISTS "payment_provider",
      DROP COLUMN IF EXISTS "payment_status";
  `)
  await db.execute(sql`DROP TYPE IF EXISTS "enum_bookings_payment_status";`)
}
