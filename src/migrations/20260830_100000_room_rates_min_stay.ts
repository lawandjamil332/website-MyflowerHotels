import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The third thing a hotel sets on a date, after the price and how many rooms.
 *
 * "Two nights minimum over Newroz" is not a preference, it is how a hotel
 * stops a long weekend being eaten by one-night stays that leave the middle
 * night unsellable. Booking.com's calendar has a Minimum stay row under the
 * price for exactly this, and without it the calendar here could set what a
 * night costs but not what it is worth taking.
 *
 * It hangs off room_rates because it is the same shape of fact as the other
 * two: a value for one room on one night, absent almost everywhere, and
 * meaning "no minimum" when it is absent. Nothing changes for a hotel that
 * never sets one.
 *
 * A minimum is read from the night a guest arrives, not from every night of
 * the stay. That is the convention every booking site uses and the only one
 * that makes sense: a three-night minimum on Friday should stop a Friday
 * one-nighter, not stop somebody who arrived on Wednesday from staying
 * through it.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE room_rates ADD COLUMN IF NOT EXISTS min_stay numeric;
  `)
  payload.logger.info('Rates & availability: nights can now carry a minimum stay')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE room_rates DROP COLUMN IF EXISTS min_stay;
  `)
}
