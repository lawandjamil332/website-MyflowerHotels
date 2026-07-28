import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * When the site starts telling a guest how few rooms are left.
 *
 * Above this number it says nothing, so "Only 2 left" appears when it is true
 * and is silent when it is not. The previous behaviour printed the count
 * always — "9 left" alongside every room — which is worse than both: it is
 * noise when the number is high and it trains a guest to ignore the line by
 * the time the number is low.
 *
 * Numbered 079950 so it runs before the photo seed, for the reason set out in
 * 20260727_079000_bookings.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "low_stock_at" numeric DEFAULT 3;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "low_stock_at";
  `)
}
