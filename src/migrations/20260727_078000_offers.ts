import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Somewhere to keep deals and packages.
 *
 * Written by hand rather than generated. Payload's generator compares the
 * config against a schema it infers, and on this project it opens by asking
 * whether `branches_rels` is a new table or a rename of `branches_gallery` —
 * a question it gets wrong at least as often as right, and getting it wrong
 * drops a table of photographs. The earlier multi-select migration was written
 * out for the same reason. Two tables of plain columns are not worth that risk.
 *
 * Mirrors the shape Payload expects of a localised collection: the row itself
 * carries what is the same in every language, `offers_locales` carries the
 * title and summary per language, and the locked-documents join gets a column
 * so the admin panel can hold an edit lock on an offer like anything else.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "offers" (
      "id"            serial PRIMARY KEY NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug"          varchar NOT NULL,
      "image_id"      integer,
      "branch_id"     integer,
      "is_active"     boolean DEFAULT true,
      "ends_on"       timestamp(3) with time zone,
      "order"         numeric DEFAULT 0,
      "updated_at"    timestamp(3) with time zone DEFAULT NOW() NOT NULL,
      "created_at"    timestamp(3) with time zone DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "offers_locales" (
      "id"         serial PRIMARY KEY NOT NULL,
      "title"      varchar NOT NULL,
      "summary"    varchar,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `)

  // Separate statements: a constraint that already exists must not take the
  // table creation down with it on a re-run.
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "offers" ADD CONSTRAINT "offers_image_id_media_id_fk"
        FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "offers" ADD CONSTRAINT "offers_branch_id_branches_id_fk"
        FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "offers_locales" ADD CONSTRAINT "offers_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "offers"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "offers_slug_idx" ON "offers" ("slug");
    CREATE INDEX IF NOT EXISTS "offers_image_idx" ON "offers" ("image_id");
    CREATE INDEX IF NOT EXISTS "offers_branch_idx" ON "offers" ("branch_id");
    CREATE INDEX IF NOT EXISTS "offers_updated_at_idx" ON "offers" ("updated_at");
    CREATE INDEX IF NOT EXISTS "offers_created_at_idx" ON "offers" ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "offers_locales_locale_parent_id_unique"
      ON "offers_locales" ("_locale", "_parent_id");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "offers_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offers_fk"
        FOREIGN KEY ("offers_id") REFERENCES "offers"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_offers_id_idx"
      ON "payload_locked_documents_rels" ("offers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "offers_id";
    DROP TABLE IF EXISTS "offers_locales";
    DROP TABLE IF EXISTS "offers";
  `)
}
