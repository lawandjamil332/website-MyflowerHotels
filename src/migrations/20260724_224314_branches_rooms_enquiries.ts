import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_branches_amenities" AS ENUM('wifi', 'parking', 'restaurant', 'gym', 'pool', 'airport_shuttle', 'family_rooms', 'generator');
  CREATE TYPE "public"."enum_rooms_amenities" AS ENUM('air_conditioning', 'private_bathroom', 'wifi', 'tv', 'minibar', 'safe', 'kettle', 'desk', 'balcony', 'city_view', 'bathtub', 'room_service');
  CREATE TYPE "public"."enum_rooms_currency" AS ENUM('IQD', 'USD');
  CREATE TYPE "public"."enum_rooms_bed_type" AS ENUM('single', 'double', 'twin', 'king', 'suite');
  CREATE TYPE "public"."enum_enquiries_status" AS ENUM('new', 'contacted', 'closed');
  CREATE TABLE "branches_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "branches_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_branches_amenities",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "branches" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"hero_image_id" integer NOT NULL,
  	"latitude" numeric,
  	"longitude" numeric,
  	"google_maps_url" varchar,
  	"phone" varchar,
  	"whatsapp" varchar,
  	"email" varchar,
  	"check_in_time" varchar,
  	"check_out_time" varchar,
  	"booking_com_url" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "branches_locales" (
  	"name" varchar NOT NULL,
  	"tagline" varchar,
  	"description" jsonb,
  	"address" varchar,
  	"city" varchar DEFAULT 'Erbil',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "rooms_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "rooms_amenities" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_rooms_amenities",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "rooms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"branch_id" integer NOT NULL,
  	"price_from" numeric,
  	"currency" "enum_rooms_currency" DEFAULT 'IQD',
  	"max_guests" numeric,
  	"bed_type" "enum_rooms_bed_type",
  	"size_sqm" numeric,
  	"is_available" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rooms_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"branch_id" integer,
  	"room_id" integer,
  	"check_in" timestamp(3) with time zone,
  	"check_out" timestamp(3) with time zone,
  	"guests" numeric,
  	"message" varchar,
  	"status" "enum_enquiries_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "branches_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rooms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "enquiries_id" integer;
  ALTER TABLE "branches_gallery" ADD CONSTRAINT "branches_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "branches_gallery" ADD CONSTRAINT "branches_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "branches_amenities" ADD CONSTRAINT "branches_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "branches" ADD CONSTRAINT "branches_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "branches_locales" ADD CONSTRAINT "branches_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rooms_images" ADD CONSTRAINT "rooms_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rooms_images" ADD CONSTRAINT "rooms_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rooms_amenities" ADD CONSTRAINT "rooms_amenities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rooms" ADD CONSTRAINT "rooms_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rooms_locales" ADD CONSTRAINT "rooms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "branches_gallery_order_idx" ON "branches_gallery" USING btree ("_order");
  CREATE INDEX "branches_gallery_parent_id_idx" ON "branches_gallery" USING btree ("_parent_id");
  CREATE INDEX "branches_gallery_image_idx" ON "branches_gallery" USING btree ("image_id");
  CREATE INDEX "branches_amenities_order_idx" ON "branches_amenities" USING btree ("order");
  CREATE INDEX "branches_amenities_parent_idx" ON "branches_amenities" USING btree ("parent_id");
  CREATE UNIQUE INDEX "branches_slug_idx" ON "branches" USING btree ("slug");
  CREATE INDEX "branches_hero_image_idx" ON "branches" USING btree ("hero_image_id");
  CREATE INDEX "branches_updated_at_idx" ON "branches" USING btree ("updated_at");
  CREATE INDEX "branches_created_at_idx" ON "branches" USING btree ("created_at");
  CREATE UNIQUE INDEX "branches_locales_locale_parent_id_unique" ON "branches_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "rooms_images_order_idx" ON "rooms_images" USING btree ("_order");
  CREATE INDEX "rooms_images_parent_id_idx" ON "rooms_images" USING btree ("_parent_id");
  CREATE INDEX "rooms_images_image_idx" ON "rooms_images" USING btree ("image_id");
  CREATE INDEX "rooms_amenities_order_idx" ON "rooms_amenities" USING btree ("order");
  CREATE INDEX "rooms_amenities_parent_idx" ON "rooms_amenities" USING btree ("parent_id");
  CREATE UNIQUE INDEX "rooms_slug_idx" ON "rooms" USING btree ("slug");
  CREATE INDEX "rooms_branch_idx" ON "rooms" USING btree ("branch_id");
  CREATE INDEX "rooms_updated_at_idx" ON "rooms" USING btree ("updated_at");
  CREATE INDEX "rooms_created_at_idx" ON "rooms" USING btree ("created_at");
  CREATE UNIQUE INDEX "rooms_locales_locale_parent_id_unique" ON "rooms_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "enquiries_branch_idx" ON "enquiries" USING btree ("branch_id");
  CREATE INDEX "enquiries_room_idx" ON "enquiries" USING btree ("room_id");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_branches_fk" FOREIGN KEY ("branches_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rooms_fk" FOREIGN KEY ("rooms_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_branches_id_idx" ON "payload_locked_documents_rels" USING btree ("branches_id");
  CREATE INDEX "payload_locked_documents_rels_rooms_id_idx" ON "payload_locked_documents_rels" USING btree ("rooms_id");
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiries_id");
  ALTER TABLE "media" DROP COLUMN "alt";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "branches_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "branches_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "branches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "branches_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rooms_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rooms_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rooms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rooms_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "enquiries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "branches_gallery" CASCADE;
  DROP TABLE "branches_amenities" CASCADE;
  DROP TABLE "branches" CASCADE;
  DROP TABLE "branches_locales" CASCADE;
  DROP TABLE "rooms_images" CASCADE;
  DROP TABLE "rooms_amenities" CASCADE;
  DROP TABLE "rooms" CASCADE;
  DROP TABLE "rooms_locales" CASCADE;
  DROP TABLE "enquiries" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_branches_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rooms_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_enquiries_fk";
  
  DROP INDEX "payload_locked_documents_rels_branches_id_idx";
  DROP INDEX "payload_locked_documents_rels_rooms_id_idx";
  DROP INDEX "payload_locked_documents_rels_enquiries_id_idx";
  ALTER TABLE "media" ADD COLUMN "alt" varchar;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "branches_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rooms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "enquiries_id";
  DROP TYPE "public"."enum_branches_amenities";
  DROP TYPE "public"."enum_rooms_amenities";
  DROP TYPE "public"."enum_rooms_currency";
  DROP TYPE "public"."enum_rooms_bed_type";
  DROP TYPE "public"."enum_enquiries_status";`)
}
