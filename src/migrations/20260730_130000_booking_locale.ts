import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Which language the guest booked in.
 *
 * Without it, every confirmation went out in English — including to the guest
 * who had just filled the form in Kurdish or Arabic, on a site that offers all
 * three. The site knows the language at the moment the form is submitted; it
 * simply had nowhere to write it down.
 *
 * Nullable on purpose: bookings made before this column existed genuinely do
 * not know, and English is the right thing to fall back to rather than a guess.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "locale" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "locale";`)
}
