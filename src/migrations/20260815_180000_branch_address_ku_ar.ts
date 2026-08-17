import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The addresses, in Kurdish and Arabic.
 *
 * The last migration named the hotels in both languages and deliberately left
 * `address` falling back to English, on the reasoning that prose wants a
 * person. That was right about taglines and descriptions and wrong about this
 * one: an address is not prose, it is the same three facts as `neighbourhood`
 * with the city in front, and it is printed on the confirmation a guest hands
 * to a front desk. So the Arabic confirmation carried a line reading
 * "Erbil — 100m Street, beside Today Restaurant" in the middle of an otherwise
 * entirely Arabic document — the one page where being half-English is least
 * excusable, because somebody is holding it at a counter.
 *
 * Built from the same words as the neighbourhoods already translated, with the
 * city in front, matching the English rows exactly in shape.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "branches_locales" SET "address" = 'أربيل — شارع 100 متر، بجانب مطعم توداي'
      WHERE "_locale" = 'ar' AND "_parent_id" = 1;
    UPDATE "branches_locales" SET "address" = 'أربيل — شارع 100 متر، قرب جيهان موتورز'
      WHERE "_locale" = 'ar' AND "_parent_id" = 2;
    UPDATE "branches_locales" SET "address" = 'أربيل — شارع كركوك، مقابل تابلو مول'
      WHERE "_locale" = 'ar' AND "_parent_id" = 3;

    UPDATE "branches_locales" SET "address" = 'هەولێر — شەقامی 100 مەتری، تەنیشت چێشتخانەی توودەی'
      WHERE "_locale" = 'ku' AND "_parent_id" = 1;
    UPDATE "branches_locales" SET "address" = 'هەولێر — شەقامی 100 مەتری، نزیک جیهان مۆتۆرز'
      WHERE "_locale" = 'ku' AND "_parent_id" = 2;
    UPDATE "branches_locales" SET "address" = 'هەولێر — شەقامی کەرکووک، بەرامبەر تابلۆ مۆڵ'
      WHERE "_locale" = 'ku' AND "_parent_id" = 3;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "branches_locales" SET "address" = NULL WHERE "_locale" IN ('ar', 'ku');
  `)
}
