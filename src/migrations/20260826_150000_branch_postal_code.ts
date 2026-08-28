import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The postcode, which every address on this site was missing.
 *
 * A PostalAddress carrying locality, region and country but no postcode is an
 * address a search engine can only partly match against a business it already
 * knows. It is the same job the Google Place ID does, approached from the
 * other direction, and it costs one column.
 *
 * Seeded with 44001 for the hotels in Erbil. That is not a guess: Booking.com
 * publishes it on the group's own two listings — "44001 Erbil, Iraq" on
 * MyFlower 1, and the same on MyFlower 3 — so it is the group's own data
 * coming back from a place that already had it right.
 *
 * `city` is a localized field, so it lives on `branches_locales` and not on
 * `branches`. Written the obvious way this failed, and the try/catch around it
 * was worse than useless: a statement that errors inside a Postgres
 * transaction poisons the whole transaction, so the catch printed a calm
 * message while every later statement — including Payload's own record that
 * the migration ran — failed with "current transaction is aborted". A caught
 * error here is still a broken deploy. Found by running it, not by reading it.
 *
 * So the city is read from the right table, and the statement is written so it
 * cannot fail: a hotel is given the postcode only when nothing on record puts
 * it in another city, so one opening in Baghdad later is never handed Erbil's.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS postal_code varchar;
  `)

  const result = await db.execute(sql`
    UPDATE branches b
       SET postal_code = '44001'
     WHERE b.postal_code IS NULL
       AND NOT EXISTS (
             SELECT 1
               FROM branches_locales l
              WHERE l._parent_id = b.id
                -- English only. The city is translated, so the other two rows
                -- hold هەولێر and أربيل — the same city in another script.
                -- Compared against 'erbil' they both look like somewhere else,
                -- which made this match nothing at all and report success
                -- while doing it. A guard that silently protects everything is
                -- worse than one that fails: it looks like it ran.
                AND l._locale = 'en'
                AND l.city IS NOT NULL
                AND lower(trim(l.city)) <> 'erbil'
           )
    RETURNING slug
  `)
  payload.logger.info(`Postcode: set 44001 on ${result.rows?.length ?? 0} hotel(s) in Erbil`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE branches DROP COLUMN IF EXISTS postal_code;
  `)
}
