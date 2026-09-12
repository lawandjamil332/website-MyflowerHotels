import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * "Besides salahadin university" → "Beside Salahaddin University".
 *
 * Three faults in four words, and only the third of them is cosmetic.
 *
 * "Besides" means "as well as". "Beside" means "next to". The sentence as
 * written says the opposite kind of thing from the one intended, and it is on
 * the one hotel of the four that has no other landmark to go by.
 *
 * "salahadin" is not how the university spells itself. That matters more here
 * than ordinary spelling does: a search engine matching a hotel to a place it
 * already knows about is matching strings, and a misspelled landmark is a
 * landmark the machine has never heard of. "Hotel near Salahaddin University"
 * is among the likeliest searches anybody makes for a room on that road, and
 * the page could not be matched to it.
 *
 * The lower case is the small one, and is fixed with the others.
 *
 * WHAT THIS DOES NOT DO. It corrects the spelling of a sentence the owner
 * wrote; it does not write that sentence anywhere it is absent. My Flower 4's
 * landmark field is empty on some copies of this database, and the earlier
 * migration that filled in its street deliberately left the landmark out
 * because nobody here knows that neighbourhood well enough to choose one.
 *
 * There is also a question in this for the owner, which is his to answer and
 * not a migration's. Measured from the hotels' own map pins, My Flower 4 is
 * about 3.1 km from the university's main campus, while My Flower 1 is 2.0 km
 * and My Flower 2 is 1.6 km — so by the pins, the two hotels on the 100 metre
 * road are nearer to it than My Flower 4 is. Either the pin is off, or the
 * landmark meant is a different faculty, or the word wanted is "near" rather
 * than "beside". All three are things the person who drives those roads knows
 * and this file does not, so the wording is corrected and the claim is left
 * exactly as he made it.
 *
 * Written as a replacement inside whatever text is there rather than as an
 * overwrite, so a landmark that sits in the middle of a longer sentence is
 * corrected without the rest of the sentence being touched. English only: the
 * Kurdish and Arabic entries spell the university correctly already.
 */

/** Every misspelling seen, and the one spelling that is right. */
const FIXES: { wrong: string; right: string }[] = [
  { wrong: 'Besides salahadin university', right: 'Beside Salahaddin University' },
  { wrong: 'besides salahadin university', right: 'beside Salahaddin University' },
  { wrong: 'Besides Salahadin University', right: 'Beside Salahaddin University' },
  { wrong: 'besides Salahadin University', right: 'beside Salahaddin University' },
  // The university's name on its own, wherever it appears without the
  // preposition in front of it.
  { wrong: 'salahadin university', right: 'Salahaddin University' },
  { wrong: 'Salahadin University', right: 'Salahaddin University' },
  { wrong: 'Salahadin university', right: 'Salahaddin University' },
]

/** The text columns a landmark can plausibly have been typed into. */
const COLUMNS = ['neighbourhood', 'address', 'nearby'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const column of COLUMNS) {
    for (const { wrong, right } of FIXES) {
      // Longest first, so "Besides salahadin university" is corrected whole
      // rather than being half-fixed by the bare-name rule and left reading
      // "Besides Salahaddin University".
      await db.execute(sql`
        UPDATE "branches_locales"
           SET ${sql.raw(`"${column}"`)} = REPLACE(${sql.raw(`"${column}"`)}, ${wrong}, ${right})
         WHERE "_locale" = 'en'
           AND ${sql.raw(`"${column}"`)} LIKE ${`%${wrong}%`};
      `)
    }
  }
}

/**
 * Deliberately does nothing.
 *
 * Rolling this back would mean putting a misspelling of a real university back
 * into a hotel's address, and there is no version of that anybody wants. The
 * migration is also safe to run twice — the corrected text no longer matches
 * anything it looks for.
 */
export async function down(_args: MigrateDownArgs): Promise<void> {}
