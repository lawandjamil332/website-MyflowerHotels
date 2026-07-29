import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Guest reviews.
 *
 * `approved` defaults to false, so a row existing is never enough to put it on
 * the page — the site filters on it and so does the average. There is no state
 * in which something unread by the owner is quoted under his hotel's name.
 *
 * The partial unique index is what stops one stay being reviewed twice. It is
 * partial because most reviews have no booking at all: the ones the owner types
 * in himself from Google or from the guest book have nothing to point at, and
 * a plain unique index would allow exactly one of those in total.
 *
 * Runs after the seeds rather than before them. Every earlier migration had to
 * come first because the seeds call Payload and Payload compiles against
 * today's config; this one adds a table nothing seeded touches, so it belongs
 * at the end where new work goes.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "reviews" (
      "id"         serial PRIMARY KEY NOT NULL,
      "guest_name" varchar NOT NULL,
      "rating"     numeric NOT NULL,
      "comment"    varchar,
      "branch_id"  integer,
      "approved"   boolean DEFAULT false,
      "verified"   boolean DEFAULT false,
      "stayed_on"  timestamp(3) with time zone,
      "booking_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT NOW() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT NOW() NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_branch_id_branches_id_fk"
        FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk"
        FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "reviews_branch_idx"     ON "reviews" ("branch_id");
    CREATE INDEX IF NOT EXISTS "reviews_created_at_idx" ON "reviews" ("created_at");
    CREATE INDEX IF NOT EXISTS "reviews_updated_at_idx" ON "reviews" ("updated_at");
    -- The index the page and the average both read through.
    CREATE INDEX IF NOT EXISTS "reviews_approved_idx"   ON "reviews" ("approved", "branch_id");

    -- One review per stay, enforced here rather than by remembering to check.
    CREATE UNIQUE INDEX IF NOT EXISTS "reviews_one_per_booking"
      ON "reviews" ("booking_id") WHERE "booking_id" IS NOT NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "reviews_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk"
        FOREIGN KEY ("reviews_id") REFERENCES "reviews"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reviews_id_idx"
      ON "payload_locked_documents_rels" ("reviews_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reviews_id";
    DROP TABLE IF EXISTS "reviews";
  `)
}
