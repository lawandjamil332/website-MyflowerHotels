import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * My Flower 4 has no street on it, in any language.
 *
 * It shows up in the Google hotel feed as a listing with a city, a province
 * and a postcode and no `addr1` — the only one of the four like that. An
 * address is one of the few things Google has to decide that the hotel in a
 * feed and a business it already knows are the same place, and a guest reading
 * the page gets nothing to navigate by either.
 *
 * The street comes from the hotel's own Google Business Profile, which the
 * owner has claimed and which reads "Kirkuk Road, Erbil, Erbil Governorate,
 * 44001" — the same road the map pin landed on. Written in the pattern the
 * other three already use, and in all three languages, taken word for word
 * from My Flower 3's entries so the two read as one group rather than two
 * translations by different hands.
 *
 * Deliberately without a landmark. Every other hotel here names one — beside
 * Today Restaurant, opposite Tablo Mall — because the hotels are numbered and
 * a landmark is what a guest actually chooses between. My Flower 4 needs one
 * more than any of them, since it is on the same street as My Flower 3, and
 * nobody here knows the neighbourhood well enough to pick it. Inventing one
 * would be worse than leaving the sentence short. The owner adds it in the
 * panel in twenty seconds.
 */
const ADDRESS: Record<string, string> = {
  ar: 'أربيل — شارع كركوك',
  en: 'Erbil — Kirkuk Street',
  ku: 'هەولێر — شەقامی کەرکووک',
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [locale, address] of Object.entries(ADDRESS)) {
    // Only where nothing has been written. If somebody typed a better address
    // between this being written and it being run, theirs is the right one.
    await db.execute(sql`
      UPDATE "branches_locales" SET "address" = ${address}
       WHERE "_locale" = ${locale}
         AND "_parent_id" = (SELECT "id" FROM "branches" WHERE "slug" = 'my-flower-4')
         AND ("address" IS NULL OR "address" = '');
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [locale, address] of Object.entries(ADDRESS)) {
    await db.execute(sql`
      UPDATE "branches_locales" SET "address" = NULL
       WHERE "_locale" = ${locale}
         AND "_parent_id" = (SELECT "id" FROM "branches" WHERE "slug" = 'my-flower-4')
         AND "address" = ${address};
    `)
  }
}
