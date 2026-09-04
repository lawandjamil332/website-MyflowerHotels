import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Every booking and enquiry from the website goes to one inbox.
 *
 * Reservations are taken centrally and passed to the branch by hand, so the
 * four hotels do not each want their own address — they want the same one, and
 * the owner named it: hotelmyflower@gmail.com.
 *
 * It is set here rather than typed into the admin panel because until it is
 * set, the site has nowhere to send a booking. `sendBookingEmails` looks for a
 * hotel's own address, then this one, then `ENQUIRY_NOTIFY_EMAIL`; with all
 * three empty it writes the booking into the log and moves on. The booking is
 * still made and still in the admin panel, but nobody is told about it — which
 * is exactly the state the site was in, and the reason the owner had not seen
 * a single one.
 *
 * The address is stored lower-cased. Mail is case-insensitive to the right of
 * the @ and every provider in practice treats the left as insensitive too, but
 * it is compared as a string in a few places here, and one of them comparing
 * "Hotelmyflower" against "hotelmyflower" is a bug that would take an afternoon
 * to find.
 *
 * The branches are cleared rather than each given the same address. Four copies
 * of one value is four places to edit the day it changes and three of them to
 * forget; with the field empty, every hotel falls through to this one. A hotel
 * that should genuinely take its own bookings gets its own address back in the
 * panel, and that is then the only one that differs — which is the state the
 * field's own description now describes.
 *
 * Written so it can run on a database where the global has never been saved:
 * Payload creates that row on first save, so a plain UPDATE would silently do
 * nothing on a fresh install.
 */
const ADDRESS = 'hotelmyflower@gmail.com'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "settings" ("id", "email", "updated_at", "created_at")
    SELECT 1, ${ADDRESS}, NOW(), NOW()
     WHERE NOT EXISTS (SELECT 1 FROM "settings");
  `)

  // Only where nothing is set. If somebody has entered a reservations address
  // between this being written and it being run, theirs is the deliberate one.
  await db.execute(sql`
    UPDATE "settings" SET "email" = ${ADDRESS}
     WHERE "email" IS NULL OR "email" = '';
  `)

  await db.execute(sql`
    UPDATE "branches" SET "email" = NULL
     WHERE "email" IS NOT NULL AND LOWER("email") = ${ADDRESS};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Only takes back the address this migration put there. An address entered
  // by hand since is not this migration's to remove.
  await db.execute(sql`
    UPDATE "settings" SET "email" = NULL WHERE LOWER("email") = ${ADDRESS};
  `)
}
