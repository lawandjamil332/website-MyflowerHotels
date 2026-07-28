import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Lets a photo be saved without a description typed by hand.
 *
 * Alt text was required, which sounds like the accessible choice and is the
 * opposite of one. Forcing it on somebody uploading two hundred hotel
 * photographs produces two hundred descriptions reading "1", "photo", "aaa" —
 * and a screen reader announcing "photo, photo, photo" down a gallery is worse
 * than one that has something sensible to fall back on.
 *
 * Every place on this site that renders an image already falls back to the
 * hotel's name, the room's name, or the site's name when the description is
 * empty, so nothing here ships an image with no description at all. It simply
 * stops demanding a worse one than the fallback.
 *
 * Numbered 079800 so it runs after the booking tables and before the photo
 * seed, for the reason set out in 20260727_079000_bookings.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media_locales" ALTER COLUMN "alt" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Anything saved without a description since would block the constraint
  // coming back, so they are filled with a blank rather than left to fail.
  await db.execute(sql`
    UPDATE "media_locales" SET "alt" = '' WHERE "alt" IS NULL;
    ALTER TABLE "media_locales" ALTER COLUMN "alt" SET NOT NULL;
  `)
}
