import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Somewhere permanent for uploaded files to live.
 *
 * Without this they are written to the container's filesystem, which the host
 * replaces on every deploy — so the pictures disappear a day or two after
 * being uploaded and the database is left pointing at nothing.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload_stored_files" (
      "collection" varchar NOT NULL,
      "filename"   varchar NOT NULL,
      "mime_type"  varchar,
      "filesize"   integer,
      "data"       bytea NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT NOW(),
      PRIMARY KEY ("collection", "filename")
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "payload_stored_files";`)
}
