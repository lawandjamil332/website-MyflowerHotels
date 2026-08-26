import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * My Flower 4 is open.
 *
 * It was seeded as "opening soon" when the site was built, and the whole site
 * reads that one field: while it is set, the hotel is shown with its
 * photograph and a notice instead of its phone numbers, its rooms, its
 * gallery and its place in the booking form, and the homepage prints "three
 * open, one opening soon" under the count.
 *
 * The owner says it is now taking guests, so the field changes and every one
 * of those follows on its own, in all three languages.
 *
 * `openingNote` goes with it. It is only ever shown while a hotel is opening
 * soon, so leaving it behind would be a sentence about a future date sitting
 * in the database waiting to reappear if the status were ever flipped back.
 *
 * Guarded on the current value: if the owner has already changed it in the
 * admin panel, this reports that and touches nothing.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  try {
    const result = await db.execute(sql`
      UPDATE branches
      SET status = 'open',
          opening_note = NULL
      WHERE slug = 'my-flower-4' AND status = 'openingSoon'
      RETURNING id
    `)

    if (result.rows?.length) {
      payload.logger.info('My Flower 4 is now open — notice removed, rooms and contact shown')
    } else {
      payload.logger.info('My Flower 4 was already open, or is not in this database — nothing to do')
    }
  } catch (error) {
    // A content migration must never be able to take a deploy down.
    payload.logger.error(`Could not open My Flower 4, stepping over — ${error}`)
  }
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
