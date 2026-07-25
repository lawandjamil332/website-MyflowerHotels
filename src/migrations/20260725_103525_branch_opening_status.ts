import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_branches_status" AS ENUM('open', 'openingSoon');
  ALTER TABLE "branches" ALTER COLUMN "hero_image_id" DROP NOT NULL;
  ALTER TABLE "branches" ADD COLUMN "status" "enum_branches_status" DEFAULT 'open';
  ALTER TABLE "branches_locales" ADD COLUMN "opening_note" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "branches" ALTER COLUMN "hero_image_id" SET NOT NULL;
  ALTER TABLE "branches" DROP COLUMN "status";
  ALTER TABLE "branches_locales" DROP COLUMN "opening_note";
  DROP TYPE "public"."enum_branches_status";`)
}
