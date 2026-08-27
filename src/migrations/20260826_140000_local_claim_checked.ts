import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * A date for the "no local group runs more hotels" line.
 *
 * The owner has asked several times for the site to say the group is the
 * biggest of its kind. The version that failed was "the biggest hotel chain in
 * Iraq" — Rotana has four properties there too and several times the rooms —
 * and that refutation is recorded in CLAUDE.md.
 *
 * This is a different claim. Rotana is Emirati, so it says nothing about which
 * *locally owned* group runs the most, and the local groups that surface at
 * all appear to run two apiece. Nothing found contradicts the owner.
 *
 * But nothing proves it either: there is no register of Kurdish-owned hotel
 * groups, and those with an English web presence are not all of them. So the
 * line is handled the way the Booking.com scores already are — worded as what
 * the group knows rather than as a fact about the world, and stamped with the
 * date it was last checked, so an old claim reads as old rather than as false.
 *
 * Nothing is seeded. Until the owner sets a date the line does not appear.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE settings ADD COLUMN IF NOT EXISTS local_claim_checked_on timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE settings DROP COLUMN IF EXISTS local_claim_checked_on;
  `)
}
