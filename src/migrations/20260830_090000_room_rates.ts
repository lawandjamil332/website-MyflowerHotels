import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * A price and a room count per night, instead of one of each per room type.
 *
 * A room carried a single price and a single quantity, which is what a
 * brochure carries. A hotel does not sell that way. Eid weekend is not
 * Tuesday's price, the night before a conference is not the night after it,
 * and "keep two back for walk-ins" is a real thing a manager does on a real
 * date. Booking.com's extranet is built around exactly this table, which is
 * why its calendar has a price in every cell and this one had a number that
 * could only be read.
 *
 * Every column is an override and every one may be empty. A night with no row
 * costs the room's own price and sells the room's own quantity, so four hotels
 * with 57 rooms and no special dates store nothing here at all, and nothing
 * changes about the site until somebody types a number into the calendar.
 * That is deliberate: this cannot break a hotel that never uses it.
 *
 * The shape is not invented. It is what Payload's own schema push produces for
 * the `room-rates` collection, read back out of a scratch database with `\d`
 * and written down here — including the `room_rates_id` column on
 * payload_locked_documents_rels, which Payload adds for every collection and
 * which the panel's edit lock needs in order to work at all. Guessing at that
 * is how a migration passes and the admin screen then fails on save.
 *
 * `date` is a timestamptz holding midnight UTC, the same as check_in and
 * check_out on bookings. A night is a calendar day everywhere in this codebase
 * and comparing two things stored the same way is how it stays that way.
 *
 * The unique index is the part Payload would not have added and the part that
 * matters most: one row per room per night, so the calendar can upsert with
 * ON CONFLICT and two people editing September at once cannot leave two
 * different prices for the 14th.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS room_rates (
      id            serial PRIMARY KEY,
      room_id       integer NOT NULL,
      "date"        timestamp(3) with time zone NOT NULL,
      price         numeric,
      rooms_to_sell numeric,
      closed        boolean DEFAULT false,
      updated_at    timestamp(3) with time zone NOT NULL DEFAULT now(),
      created_at    timestamp(3) with time zone NOT NULL DEFAULT now()
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE room_rates
        ADD CONSTRAINT room_rates_room_id_rooms_id_fk
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS room_rates_room_idx       ON room_rates (room_id);
    CREATE INDEX IF NOT EXISTS room_rates_date_idx       ON room_rates ("date");
    CREATE INDEX IF NOT EXISTS room_rates_updated_at_idx ON room_rates (updated_at);
    CREATE INDEX IF NOT EXISTS room_rates_created_at_idx ON room_rates (created_at);
  `)

  // One row per room per night. Everything that writes here upserts against
  // this, so a second edit of the 14th replaces the first rather than joining
  // it.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS room_rates_room_date_key
      ON room_rates (room_id, "date");
  `)

  // Payload keeps a row here while a document is open in the panel, with one
  // nullable column per collection. Without it, opening a rate for editing
  // fails on a column that does not exist.
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels
      ADD COLUMN IF NOT EXISTS room_rates_id integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE payload_locked_documents_rels
        ADD CONSTRAINT payload_locked_documents_rels_room_rates_fk
        FOREIGN KEY (room_rates_id) REFERENCES room_rates(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_room_rates_id_idx
      ON payload_locked_documents_rels (room_rates_id);
  `)

  payload.logger.info('Rates & availability: room_rates ready — nights priced one at a time')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels
      DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_room_rates_fk;
  `)
  await db.execute(sql`
    ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS room_rates_id;
  `)
  await db.execute(sql`DROP TABLE IF EXISTS room_rates;`)
}
