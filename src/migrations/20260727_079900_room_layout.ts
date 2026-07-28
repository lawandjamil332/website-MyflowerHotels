import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * What a room actually consists of.
 *
 * Some of these hotels let apartments — two bedrooms and a hall — and the room
 * record had nowhere to say so. "Max guests 6, bed: suite" describes a
 * two-bedroom apartment no better than it describes one large room with six
 * beds in it, and that difference is the entire reason a family picks one over
 * the other.
 *
 * Nullable with no default rather than defaulting to 1. A blank means "an
 * ordinary room, nothing worth listing", which is the common case and must stay
 * silent on the page; defaulting to 1 would print "1 bedroom · 1 bathroom"
 * against every single room in the group whether or not anybody had checked.
 *
 * Numbered 079900 so it runs before the photo seed, for the reason set out in
 * 20260727_079000_bookings.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "bedrooms"     numeric;
    ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "living_rooms" numeric;
    ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "bathrooms"    numeric;
    ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "has_kitchen"  boolean;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rooms" DROP COLUMN IF EXISTS "has_kitchen";
    ALTER TABLE "rooms" DROP COLUMN IF EXISTS "bathrooms";
    ALTER TABLE "rooms" DROP COLUMN IF EXISTS "living_rooms";
    ALTER TABLE "rooms" DROP COLUMN IF EXISTS "bedrooms";
  `)
}
