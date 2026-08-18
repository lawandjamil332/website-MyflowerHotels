import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The rooms, named in Kurdish and Arabic.
 *
 * The last two migrations named the hotels and wrote their addresses in both
 * languages. The rooms were still English everywhere: an Arabic guest reading
 * an Arabic page about ماي فلاور 1 was offered "Superior Double — My Flower 1"
 * to book, and the printed confirmation they hand to a front desk said the
 * same. Eighteen rooms, on the pages where a booking is actually made.
 *
 * These are standard hospitality terms with settled names in both languages,
 * not marketing copy — a twin room is غرفة بسريرين and a family room is غرفة
 * عائلية, in Erbil as anywhere else. That is why these are translated here
 * where taglines and descriptions were deliberately left alone: those say
 * something particular about a place and want the words its owner would use.
 *
 * The hotel each room belongs to is named the way the hotels themselves now
 * are, so a room reads as belonging to the hotel above it rather than to a
 * differently-spelled one.
 *
 * All editable in the admin panel. If a room is called something else on the
 * door, the door wins.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "rooms_locales" ("_locale", "_parent_id", "name")
    VALUES
      ('ar', 1, 'غرفة ديلوكس مزدوجة — ماي فلاور 1'),
      ('ar', 2, 'غرفة كينج تنفيذية — ماي فلاور 1'),
      ('ar', 3, 'غرفة بسريرين — ماي فلاور 1'),
      ('ar', 4, 'جناح الحديقة — ماي فلاور 1'),
      ('ar', 5, 'غرفة عائلية — ماي فلاور 1'),
      ('ar', 6, 'غرفة سوبيريور مزدوجة — ماي فلاور 1'),
      ('ar', 7, 'غرفة ديلوكس مزدوجة — ماي فلاور 2'),
      ('ar', 8, 'غرفة كينج تنفيذية — ماي فلاور 2'),
      ('ar', 9, 'غرفة بسريرين — ماي فلاور 2'),
      ('ar', 10, 'جناح الحديقة — ماي فلاور 2'),
      ('ar', 11, 'غرفة عائلية — ماي فلاور 2'),
      ('ar', 12, 'غرفة سوبيريور مزدوجة — ماي فلاور 2'),
      ('ar', 13, 'غرفة ديلوكس مزدوجة — ماي فلاور 3'),
      ('ar', 14, 'غرفة كينج تنفيذية — ماي فلاور 3'),
      ('ar', 15, 'غرفة بسريرين — ماي فلاور 3'),
      ('ar', 16, 'جناح الحديقة — ماي فلاور 3'),
      ('ar', 17, 'غرفة عائلية — ماي فلاور 3'),
      ('ar', 18, 'غرفة سوبيريور مزدوجة — ماي فلاور 3'),
      ('ku', 1, 'ژووری دیلۆکسی دووکەسی — ماي فلاوەر 1'),
      ('ku', 2, 'ژووری کینگی تایبەت — ماي فلاوەر 1'),
      ('ku', 3, 'ژووری دوو جێخەوی — ماي فلاوەر 1'),
      ('ku', 4, 'سوێتی باخچە — ماي فلاوەر 1'),
      ('ku', 5, 'ژووری خێزانی — ماي فلاوەر 1'),
      ('ku', 6, 'ژووری سوپیریۆری دووکەسی — ماي فلاوەر 1'),
      ('ku', 7, 'ژووری دیلۆکسی دووکەسی — ماي فلاوەر 2'),
      ('ku', 8, 'ژووری کینگی تایبەت — ماي فلاوەر 2'),
      ('ku', 9, 'ژووری دوو جێخەوی — ماي فلاوەر 2'),
      ('ku', 10, 'سوێتی باخچە — ماي فلاوەر 2'),
      ('ku', 11, 'ژووری خێزانی — ماي فلاوەر 2'),
      ('ku', 12, 'ژووری سوپیریۆری دووکەسی — ماي فلاوەر 2'),
      ('ku', 13, 'ژووری دیلۆکسی دووکەسی — ماي فلاوەر 3'),
      ('ku', 14, 'ژووری کینگی تایبەت — ماي فلاوەر 3'),
      ('ku', 15, 'ژووری دوو جێخەوی — ماي فلاوەر 3'),
      ('ku', 16, 'سوێتی باخچە — ماي فلاوەر 3'),
      ('ku', 17, 'ژووری خێزانی — ماي فلاوەر 3'),
      ('ku', 18, 'ژووری سوپیریۆری دووکەسی — ماي فلاوەر 3')
    ON CONFLICT ("_locale", "_parent_id") DO NOTHING;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "rooms_locales" WHERE "_locale" IN ('ar', 'ku');
  `)
}
