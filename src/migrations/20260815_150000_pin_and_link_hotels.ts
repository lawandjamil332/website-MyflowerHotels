import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Where two of these hotels actually are, and where the rest of the internet
 * already knows them.
 *
 * Both facts were sitting on Booking.com the whole time and neither was on
 * this site. Looked up against Booking.com's own inventory:
 *
 *   MyFlower 1 Hotel  — 36.161517, 44.030840 — 62 reviews, 7.3
 *   MyFlower 3 Hotel  — 36.171558, 44.014391 — 1,558 reviews, 7.3
 *
 * The coordinates matter because a hotel with no `geo` is a hotel that cannot
 * be returned for "near me", cannot be placed on a map by anything that did
 * not already know the address, and has to be geocoded from a street name
 * written in three languages. These are the pins Booking.com uses, which is
 * also where most of the traffic already looks.
 *
 * The listing URLs matter more. They go into `sameAs`, which is the property
 * that tells a search engine two records are one place — and on the other end
 * of that link is 1,620 reviews of reputation this website could not point at.
 * Without it "MyFlower 3 Hotel" on Booking.com and "My Flower 3" here are two
 * unrelated buildings that happen to share a word, which is exactly how they
 * have been read until now, and exactly why nothing describes this as a group.
 *
 * Note the names differ from this site's: Booking.com has "MyFlower 1 Hotel"
 * and "MyFlower 3 Hotel", one word, "Hotel" on the end. That mismatch is worth
 * fixing at the Booking.com end rather than here — the sign outside says My
 * Flower — but until it is, `sameAs` is what bridges it.
 *
 * My Flower 2 is not on Booking.com at all, and My Flower 4 is not open, so
 * neither gets a URL. Nothing is invented for them.
 *
 * Tracking parameters are stripped. The stored link is the canonical listing.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "branches" SET
      "latitude" = 36.161517,
      "longitude" = 44.030840,
      "booking_com_url" = 'https://www.booking.com/hotel/iq/myflower-1.html'
    WHERE "slug" = 'my-flower-1';

    UPDATE "branches" SET
      "latitude" = 36.171558,
      "longitude" = 44.014391,
      "booking_com_url" = 'https://www.booking.com/hotel/iq/my-flower.html'
    WHERE "slug" = 'my-flower-3';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "branches" SET "latitude" = NULL, "longitude" = NULL, "booking_com_url" = NULL
    WHERE "slug" IN ('my-flower-1', 'my-flower-3');
  `)
}
