import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Turns each hotel's gallery and each room's photographs from a list of
 * one-photo rows into a single multi-select.
 *
 * As rows, adding ten pictures meant ten separate add-a-row-then-upload
 * cycles, which is exactly the wrong shape for the one job the owner has to
 * do most: putting a lot of photographs in quickly.
 *
 * Written by hand rather than generated. The generator wanted to answer
 * "created or renamed?" interactively and, either way, would have dropped the
 * old tables — taking any photographs already arranged with them. This moves
 * the rows across first and drops nothing until they are safely copied.
 *
 * Payload keeps a has-many upload in the collection's `_rels` table, one row
 * per picture, with `path` naming the field and `order` preserving the
 * sequence — so the cover photograph stays the cover.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "branches_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer,
      CONSTRAINT "branches_rels_parent_fk" FOREIGN KEY ("parent_id")
        REFERENCES "branches"("id") ON DELETE cascade,
      CONSTRAINT "branches_rels_media_fk" FOREIGN KEY ("media_id")
        REFERENCES "media"("id") ON DELETE cascade
    );

    CREATE TABLE IF NOT EXISTS "rooms_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer,
      CONSTRAINT "rooms_rels_parent_fk" FOREIGN KEY ("parent_id")
        REFERENCES "rooms"("id") ON DELETE cascade,
      CONSTRAINT "rooms_rels_media_fk" FOREIGN KEY ("media_id")
        REFERENCES "media"("id") ON DELETE cascade
    );

    CREATE INDEX IF NOT EXISTS "branches_rels_order_idx" ON "branches_rels" ("order");
    CREATE INDEX IF NOT EXISTS "branches_rels_parent_idx" ON "branches_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "branches_rels_path_idx" ON "branches_rels" ("path");
    CREATE INDEX IF NOT EXISTS "rooms_rels_order_idx" ON "rooms_rels" ("order");
    CREATE INDEX IF NOT EXISTS "rooms_rels_parent_idx" ON "rooms_rels" ("parent_id");
    CREATE INDEX IF NOT EXISTS "rooms_rels_path_idx" ON "rooms_rels" ("path");
  `)

  // Carry every existing photograph across, in the order it was arranged.
  await db.execute(sql`
    INSERT INTO "branches_rels" ("order", "parent_id", "path", "media_id")
    SELECT "_order", "_parent_id", 'gallery', "image_id"
      FROM "branches_gallery"
     WHERE EXISTS (SELECT 1 FROM information_schema.tables
                    WHERE table_name = 'branches_gallery')
     ORDER BY "_parent_id", "_order";
  `)

  await db.execute(sql`
    INSERT INTO "rooms_rels" ("order", "parent_id", "path", "media_id")
    SELECT "_order", "_parent_id", 'images', "image_id"
      FROM "rooms_images"
     WHERE EXISTS (SELECT 1 FROM information_schema.tables
                    WHERE table_name = 'rooms_images')
     ORDER BY "_parent_id", "_order";
  `)

  // Only now that the rows are safely across.
  await db.execute(sql`
    DROP TABLE IF EXISTS "branches_gallery";
    DROP TABLE IF EXISTS "rooms_images";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "branches_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer NOT NULL,
      CONSTRAINT "branches_gallery_parent_fk" FOREIGN KEY ("_parent_id")
        REFERENCES "branches"("id") ON DELETE cascade,
      CONSTRAINT "branches_gallery_image_fk" FOREIGN KEY ("image_id")
        REFERENCES "media"("id")
    );

    CREATE TABLE IF NOT EXISTS "rooms_images" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer NOT NULL,
      CONSTRAINT "rooms_images_parent_fk" FOREIGN KEY ("_parent_id")
        REFERENCES "rooms"("id") ON DELETE cascade,
      CONSTRAINT "rooms_images_image_fk" FOREIGN KEY ("image_id")
        REFERENCES "media"("id")
    );
  `)

  await db.execute(sql`
    INSERT INTO "branches_gallery" ("_order", "_parent_id", "id", "image_id")
    SELECT COALESCE("order", 1), "parent_id", gen_random_uuid()::varchar, "media_id"
      FROM "branches_rels"
     WHERE "path" = 'gallery' AND "media_id" IS NOT NULL;
  `)

  await db.execute(sql`
    INSERT INTO "rooms_images" ("_order", "_parent_id", "id", "image_id")
    SELECT COALESCE("order", 1), "parent_id", gen_random_uuid()::varchar, "media_id"
      FROM "rooms_rels"
     WHERE "path" = 'images' AND "media_id" IS NOT NULL;
  `)

  await db.execute(sql`
    DELETE FROM "branches_rels" WHERE "path" = 'gallery';
    DELETE FROM "rooms_rels" WHERE "path" = 'images';
  `)
}
