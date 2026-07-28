import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Guest accounts, and the points ledger.
 *
 * The guests table mirrors `users` exactly, because both are Payload auth
 * collections and Payload expects the same columns of each — email, salt, hash,
 * the reset-token pair, and the two that lock an account after repeated failed
 * logins. Copied from the live shape of `users` rather than from memory.
 *
 * Points are a ledger, not a balance. Nothing here stores how many points
 * anybody has: the balance is the sum of the rows, which is the only version
 * that cannot drift away from what was actually earned.
 *
 * Bookings gain a nullable guest. Nullable because a booking made without an
 * account is the normal case and must stay first-class — the account is offered
 * after the room is held, and attaching one later is an update to this column,
 * not a different kind of booking.
 *
 * Numbered 079500 so it runs after the bookings tables and before the photo
 * seed, for the reason set out in 20260727_079000_bookings.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "guests" (
      "id"                        serial PRIMARY KEY NOT NULL,
      "name"                      varchar NOT NULL,
      "phone"                     varchar,
      "updated_at"                timestamp(3) with time zone DEFAULT NOW() NOT NULL,
      "created_at"                timestamp(3) with time zone DEFAULT NOW() NOT NULL,
      "email"                     varchar NOT NULL,
      "reset_password_token"      varchar,
      "reset_password_expiration" timestamp(3) with time zone,
      "salt"                      varchar,
      "hash"                      varchar,
      "login_attempts"            numeric DEFAULT 0,
      "lock_until"                timestamp(3) with time zone
    );

    -- Payload keeps a row per signed-in session for an auth collection, and
    -- refuses to read the collection at all without it. Mirrored from
    -- users_sessions, which is the same table for staff.
    CREATE TABLE IF NOT EXISTS "guests_sessions" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone,
      "expires_at" timestamp(3) with time zone NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "point_entries" (
      "id"         serial PRIMARY KEY NOT NULL,
      "guest_id"   integer,
      "points"     numeric NOT NULL,
      "reason"     varchar NOT NULL,
      "booking_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT NOW() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT NOW() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "guests_email_idx" ON "guests" ("email");
    CREATE INDEX IF NOT EXISTS "guests_sessions_order_idx" ON "guests_sessions" ("_order");
    CREATE INDEX IF NOT EXISTS "guests_sessions_parent_id_idx" ON "guests_sessions" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "guests_created_at_idx" ON "guests" ("created_at");
    CREATE INDEX IF NOT EXISTS "guests_updated_at_idx" ON "guests" ("updated_at");
    CREATE INDEX IF NOT EXISTS "point_entries_guest_idx" ON "point_entries" ("guest_id");
    CREATE INDEX IF NOT EXISTS "point_entries_booking_idx" ON "point_entries" ("booking_id");
    CREATE INDEX IF NOT EXISTS "point_entries_created_at_idx" ON "point_entries" ("created_at");
    CREATE INDEX IF NOT EXISTS "point_entries_updated_at_idx" ON "point_entries" ("updated_at");
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "guests_sessions" ADD CONSTRAINT "guests_sessions_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "guests"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "point_entries" ADD CONSTRAINT "point_entries_guest_id_guests_id_fk"
        FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "point_entries" ADD CONSTRAINT "point_entries_booking_id_bookings_id_fk"
        FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "guest_id" integer;

    DO $$ BEGIN
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_guests_id_fk"
        FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "bookings_guest_idx" ON "bookings" ("guest_id");

    -- One award per stay. The points hook is idempotent because of this, not
    -- because of anything it remembers: run it twice and the second insert is
    -- refused by the database.
    CREATE UNIQUE INDEX IF NOT EXISTS "point_entries_one_award_per_booking"
      ON "point_entries" ("booking_id") WHERE "booking_id" IS NOT NULL AND "points" > 0;
  `)

  // How many points a stay earns, and what they are worth back. Settings so the
  // owner can change the rate without anybody touching code.
  await db.execute(sql`
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "points_per1000_iqd" numeric DEFAULT 1;
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "points_enabled" boolean DEFAULT true;
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "guests_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "point_entries_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guests_fk"
        FOREIGN KEY ("guests_id") REFERENCES "guests"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_point_entries_fk"
        FOREIGN KEY ("point_entries_id") REFERENCES "point_entries"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_guests_id_idx"
      ON "payload_locked_documents_rels" ("guests_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_point_entries_id_idx"
      ON "payload_locked_documents_rels" ("point_entries_id");
  `)

  // Payload keeps admin-panel preferences per authenticated user, and the
  // relationship table needs a column for each auth collection.
  await db.execute(sql`
    ALTER TABLE "payload_preferences_rels" ADD COLUMN IF NOT EXISTS "guests_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_guests_fk"
        FOREIGN KEY ("guests_id") REFERENCES "guests"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_guests_id_idx"
      ON "payload_preferences_rels" ("guests_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "guests_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "point_entries_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "guests_id";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "points_enabled";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "points_per1000_iqd";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "guest_id";
    DROP TABLE IF EXISTS "point_entries";
    DROP TABLE IF EXISTS "guests_sessions";
    DROP TABLE IF EXISTS "guests";
  `)
}
