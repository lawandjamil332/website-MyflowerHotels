import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * My Flower 4 is open.
 *
 * It was seeded as "opening soon" when the site was built, and the whole site
 * reads that one field: while it is set, the hotel is shown with its
 * photograph and a notice instead of its phone numbers, its rooms, its gallery
 * and its place in the booking form, and the homepage prints "three open, one
 * opening soon" under the count.
 *
 * The owner says it is now taking guests, so the field changes and every one
 * of those follows on its own, in all three languages.
 *
 * `openingNote` goes with it. It is only ever shown while a hotel is opening
 * soon, so leaving it behind would be a sentence about a future date sitting
 * in the database waiting to reappear.
 *
 * Two things this got wrong the first time, both found by running it against a
 * real database rather than reading it:
 *
 *  - `openingNote` is localized, so it lives on `branches_locales` keyed by
 *    parent id, not on `branches`. Written against `branches` the statement
 *    failed outright.
 *  - The failure was wrapped in a try/catch on the reasoning that a content
 *    migration must never take a deploy down. That reasoning is right and the
 *    mechanism was useless: a statement that errors inside a Postgres
 *    transaction poisons the whole transaction, so catching it changes
 *    nothing — every later statement, including Payload's own write to
 *    `payload_migrations`, fails with "current transaction is aborted". The
 *    catch turned a broken statement into a broken deploy while printing a
 *    reassuring message.
 *
 * So there is no catch now. Both statements are written so they cannot fail:
 * they name columns that exist, and they match zero rows rather than erroring
 * when the hotel is already open or absent.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const opened = await db.execute(sql`
    UPDATE branches
       SET status = 'open'
     WHERE slug = 'my-flower-4'
       AND status = 'openingSoon'
    RETURNING id
  `)

  const row = opened.rows?.[0] as { id: number } | undefined

  if (!row) {
    payload.logger.info('My Flower 4 was already open, or is not in this database — nothing to do')
    return
  }

  // Every language's copy of the notice, cleared together.
  await db.execute(sql`
    UPDATE branches_locales
       SET opening_note = NULL
     WHERE _parent_id = ${row.id}
  `)

  payload.logger.info('My Flower 4 is now open — notice removed, rooms and contact shown')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Deliberately does nothing.
  //
  // Every other migration here undoes what it did, because what they did was
  // add a column or write a value that only made sense alongside code being
  // rolled back. This one records something that happened in the world: the
  // hotel opened. Rolling the code back does not close it, and a `down` that
  // put the notice back would tell guests a hotel taking bookings is not yet
  // taking them — while hiding the phone number they would have used to find
  // out otherwise. If it ever needs to say "opening soon" again, that is one
  // field in the admin panel.
  payload.logger.info('Leaving My Flower 4 open — a hotel that has opened does not un-open')
}
