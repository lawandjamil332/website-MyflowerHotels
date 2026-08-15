import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * What each hotel is near, in the guest's own language.
 *
 * "Hotel near the Citadel", "hotel close to the airport", "somewhere near
 * Family Mall" is how people actually look for a room — it is one of the most
 * common shapes of the question, whether it is typed into Google or asked of
 * an assistant. This site could not answer any of it. A hotel had a street and
 * a map pin and nothing that said what was around it, so a page about a hotel
 * ten minutes from the Citadel contained neither the word Citadel nor the ten
 * minutes, and could not be the answer to a question it is genuinely the
 * answer to.
 *
 * Localised, because "ten minutes from the bazaar" is a sentence and the whole
 * value of it is that a guest reads it. Free text rather than a list of
 * landmarks with distances: nobody at this hotel is going to maintain a
 * distance matrix, and a paragraph somebody actually writes beats a structured
 * field left empty.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "branches_locales" ADD COLUMN IF NOT EXISTS "nearby" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "branches_locales" DROP COLUMN IF EXISTS "nearby";
  `)
}
