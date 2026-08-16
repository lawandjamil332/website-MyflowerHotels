import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The reputation this group already has, said out loud on its own site.
 *
 * Every hotel page has a reviews section and every one of them is empty: no
 * guest has left a review here, so the site makes no claim about whether these
 * hotels are any good. Meanwhile Booking.com holds 1,558 reviews for one of
 * them and 62 for another. A guest deciding between this site and a listing
 * site sees nothing here and a score there, and books there — at fifteen per
 * cent. "Is this hotel any good" is also one of the questions most often asked
 * of an assistant, and nothing on this domain could answer it.
 *
 * Stored as three plain fields rather than fetched: a score read live from
 * somebody else's site is a dependency that can fail, rate-limit, or change
 * shape, on a page that must render. Three numbers typed in occasionally are
 * enough, and the date is what keeps them honest — the page says when they
 * were last checked, so a stale figure is visibly stale rather than quietly
 * wrong.
 *
 * Deliberately NOT wired into aggregateRating markup. Google requires that the
 * reviews behind a rating be visible on the page carrying it, and these are
 * somebody else's reviews on somebody else's site. Emitting them as this
 * site's own rating is exactly the kind of thing that costs a domain its rich
 * results permanently. It is shown as an attributed sentence with a link — a
 * fact about where the reviews are, not a claim to hold them.
 *
 * Figures as recorded from Booking.com's inventory on 15 August 2026.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "branches"
      ADD COLUMN IF NOT EXISTS "booking_com_score" numeric,
      ADD COLUMN IF NOT EXISTS "booking_com_reviews" numeric,
      ADD COLUMN IF NOT EXISTS "booking_com_checked" timestamp(3) with time zone;

    UPDATE "branches" SET
      "booking_com_score" = 7.3,
      "booking_com_reviews" = 62,
      "booking_com_checked" = '2026-08-15T00:00:00.000Z'
    WHERE "slug" = 'my-flower-1';

    UPDATE "branches" SET
      "booking_com_score" = 7.3,
      "booking_com_reviews" = 1558,
      "booking_com_checked" = '2026-08-15T00:00:00.000Z'
    WHERE "slug" = 'my-flower-3';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "branches"
      DROP COLUMN IF EXISTS "booking_com_score",
      DROP COLUMN IF EXISTS "booking_com_reviews",
      DROP COLUMN IF EXISTS "booking_com_checked";
  `)
}
