import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Somewhere to keep reservations, and a count of how many rooms exist.
 *
 * Written by hand, like the offers migration and for the same reason: the
 * generator opens by asking whether `branches_rels` is a rename of
 * `branches_gallery`, and getting that wrong drops a table of photographs.
 *
 * ---
 *
 * It carries a 079000 timestamp although it was written after the 09/10/11/12
 * migrations of the same day, and that is deliberate. Migrations run in the
 * order of the array in `index.ts`, and this one has to run *before*
 * 20260727_080000_seed_photos — which calls Payload, and therefore compiles
 * against the collection config as it stands today, bookings and all. On a
 * fresh database a seed that reaches for a table a later migration has not
 * created yet fails silently and the site comes up with no photographs. The
 * name is kept in step with the run order so the two never have to be
 * reconciled by hand.
 *
 * The later content migrations are safe after the seed because they are plain
 * SQL against columns that already exist; they never ask Payload for anything.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_bookings_status" AS ENUM ('held','confirmed','cancelled','completed','noShow');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "enum_bookings_currency" AS ENUM ('IQD','USD');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "bookings" (
      "id"           serial PRIMARY KEY NOT NULL,
      "reference"    varchar NOT NULL,
      "guest_name"   varchar NOT NULL,
      "guest_phone"  varchar NOT NULL,
      "guest_email"  varchar,
      "branch_id"    integer,
      "room_id"      integer,
      "check_in"     timestamp(3) with time zone NOT NULL,
      "check_out"    timestamp(3) with time zone NOT NULL,
      "guests"       numeric,
      "nights"       numeric,
      "total_amount" numeric,
      "currency"     "enum_bookings_currency" DEFAULT 'IQD',
      "status"       "enum_bookings_status" DEFAULT 'confirmed' NOT NULL,
      "notes"        varchar,
      "updated_at"   timestamp(3) with time zone DEFAULT NOW() NOT NULL,
      "created_at"   timestamp(3) with time zone DEFAULT NOW() NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_branch_id_branches_id_fk"
        FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk"
        FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    -- A stay must end after it starts. Cheap to state here, and it means no
    -- amount of bad input from anywhere can put a negative night in the table.
    DO $$ BEGIN
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dates_ordered"
        CHECK ("check_out" > "check_in");
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "bookings_reference_idx" ON "bookings" ("reference");
    CREATE INDEX IF NOT EXISTS "bookings_branch_idx" ON "bookings" ("branch_id");
    CREATE INDEX IF NOT EXISTS "bookings_room_idx" ON "bookings" ("room_id");
    CREATE INDEX IF NOT EXISTS "bookings_created_at_idx" ON "bookings" ("created_at");
    CREATE INDEX IF NOT EXISTS "bookings_updated_at_idx" ON "bookings" ("updated_at");
    -- The index availability is counted through: every lookup is "this room
    -- type, these statuses, overlapping these dates".
    CREATE INDEX IF NOT EXISTS "bookings_room_dates_idx"
      ON "bookings" ("room_id", "status", "check_in", "check_out");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bookings_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk"
        FOREIGN KEY ("bookings_id") REFERENCES "bookings"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bookings_id_idx"
      ON "payload_locked_documents_rels" ("bookings_id");
  `)

  // How many rooms of each type the hotel has. One, until somebody says
  // otherwise — a hotel with one of everything is wrong, but it is safely
  // wrong: it under-sells rather than over-sells.
  await db.execute(sql`
    ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "quantity" numeric DEFAULT 1 NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rooms" DROP COLUMN IF EXISTS "quantity";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "bookings_id";
    DROP TABLE IF EXISTS "bookings";
    DROP TYPE IF EXISTS "enum_bookings_status";
    DROP TYPE IF EXISTS "enum_bookings_currency";
  `)
}
