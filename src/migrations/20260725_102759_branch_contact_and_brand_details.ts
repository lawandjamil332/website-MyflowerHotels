import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_settings_stars" AS ENUM('3', '4', '5');
  ALTER TABLE "branches" ADD COLUMN "phone_alt" varchar;
  ALTER TABLE "branches" ADD COLUMN "facebook" varchar;
  ALTER TABLE "branches" ADD COLUMN "instagram" varchar;
  ALTER TABLE "branches_locales" ADD COLUMN "neighbourhood" varchar;
  ALTER TABLE "settings" ADD COLUMN "established_year" numeric;
  ALTER TABLE "settings" ADD COLUMN "stars" "enum_settings_stars";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "branches" DROP COLUMN "phone_alt";
  ALTER TABLE "branches" DROP COLUMN "facebook";
  ALTER TABLE "branches" DROP COLUMN "instagram";
  ALTER TABLE "branches_locales" DROP COLUMN "neighbourhood";
  ALTER TABLE "settings" DROP COLUMN "established_year";
  ALTER TABLE "settings" DROP COLUMN "stars";
  DROP TYPE "public"."enum_settings_stars";`)
}
