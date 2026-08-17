import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The hotels, named in Kurdish and Arabic.
 *
 * There were no Kurdish or Arabic rows for any branch at all — only English —
 * so every field on both of those sites fell back to it. The Arabic page for
 * this group has been answering "أين أقيم في أربيل؟" with:
 *
 *   لدينا 4 فنادق في أربيل — My Flower 1 (100m Street — beside Today
 *   Restaurant), My Flower 2 (100m Street — near Cihan Motors)…
 *
 * Arabic prose with Latin names and English street directions dropped into the
 * middle of it, right-to-left text wrapping around left-to-right runs. It is
 * the least competitive and most winnable market this hotel has — an Arabic
 * or Kurdish speaker searching for a hotel in Erbil is not competing with the
 * whole English-language internet — and it was the worst-looking version of
 * the site.
 *
 * The brand name is not invented here. This site's own copy already says
 * "فنادق ماي فلاور" and "هۆتێلەکانی ماي فلاوەر" throughout; these rows just
 * make the hotels agree with the sentences already printed around them.
 *
 * Street names are translated, not transliterated where translation is the
 * right answer: Kirkuk Street is شارع كركوك because Kirkuk is an Iraqi city
 * with an Arabic name. Business names — Today Restaurant, Tablo Mall, Cihan
 * Motors — are transliterated, because that is what they are called.
 *
 * Western digits throughout, matching the rest of the site: prices, counts and
 * telephone numbers are all forced to Latin numerals under Intl, and a hotel
 * called ماي فلاور ١ beside a price written 100,000 would be inconsistent.
 *
 * Only `name`, `city` and `neighbourhood`. Tagline, address and description
 * are left unset so they keep falling back to English — a machine translation
 * of marketing copy reads worse than the English it replaced, and those want a
 * person. Everything here is editable in the admin panel; it is a starting
 * point that is right, not a decision that is final.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "branches_locales" ("_locale", "_parent_id", "name", "city", "neighbourhood")
    VALUES
      ('ar', 1, 'ماي فلاور 1', 'أربيل', 'شارع 100 متر — بجانب مطعم توداي'),
      ('ar', 2, 'ماي فلاور 2', 'أربيل', 'شارع 100 متر — قرب جيهان موتورز'),
      ('ar', 3, 'ماي فلاور 3', 'أربيل', 'شارع كركوك — مقابل تابلو مول'),
      ('ar', 4, 'ماي فلاور 4', 'أربيل', NULL),
      ('ku', 1, 'ماي فلاوەر 1', 'هەولێر', 'شەقامی 100 مەتری — تەنیشت چێشتخانەی توودەی'),
      ('ku', 2, 'ماي فلاوەر 2', 'هەولێر', 'شەقامی 100 مەتری — نزیک جیهان مۆتۆرز'),
      ('ku', 3, 'ماي فلاوەر 3', 'هەولێر', 'شەقامی کەرکووک — بەرامبەر تابلۆ مۆڵ'),
      ('ku', 4, 'ماي فلاوەر 4', 'هەولێر', NULL)
    ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "branches_locales" WHERE "_locale" IN ('ar', 'ku');
  `)
}
