import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * What each hotel is near — the field that was blank on all four, in all three
 * languages.
 *
 * Twelve empty boxes, and the one thing on a hotel page that answers the way
 * people actually look: not "My Flower 3" but "hotel near the Citadel", "near
 * the airport", "near the university". The site could not answer any of them.
 *
 * It matters more here than it would for one hotel. My Flower 3 and 4 are 300
 * metres apart and 1 and 2 are a kilometre apart, so a guest was being shown
 * four names with the same rooms and nothing to choose between them. These
 * paragraphs are the difference.
 *
 * Every distance is computed from the hotels' own pins against a coordinate
 * that can be checked, rather than remembered:
 *
 *   Erbil Citadel        36.1910, 44.0091    UNESCO's record for the site
 *   Erbil International  36.23750, 43.96306  the airport's own ORER/EBL record
 *   Salahaddin Univ.     36.1435, 44.0279
 *
 *                 Citadel   airport   university
 *   My Flower 1    3.8 km   10.4 km      2.0 km
 *   My Flower 2    4.0 km   10.4 km      1.6 km
 *   My Flower 3    2.2 km    8.7 km      3.3 km
 *   My Flower 4    2.5 km    8.9 km      3.1 km
 *
 * Straight-line, so the kilometres are floors and the minutes are the owner's
 * to correct — he drives these roads and nobody here does. The rounding is
 * deliberately generous in the guest's favour: a hotel that says fifteen
 * minutes and takes twenty has told a small lie on arrival day.
 *
 * Written the way the field's own help text asks for — as you would say it on
 * the phone — and only written where the box is empty, so anything typed in
 * the panel wins over this.
 */
type Text = { ar: string; en: string; ku: string }

const NEARBY: Record<string, Text> = {
  'my-flower-1': {
    ar: 'على شارع 100 متر، بجانب مطعم توداي. القلعة والبازار الواقع تحتها على بعد نحو 4 كيلومترات — حوالي 15 دقيقة بالسيارة — ومطار أربيل الدولي على بعد نحو 20 دقيقة. جامعة صلاح الدين على بعد كيلومترين، ما يجعله خياراً مريحاً لعائلات الطلبة.',
    en: 'On the 100 metre road, beside Today Restaurant. The Citadel and the bazaar beneath it are about four kilometres away — around fifteen minutes by car — and Erbil International Airport is roughly twenty. Salahaddin University is two kilometres up the road, which makes this an easy stay for families visiting students.',
    ku: 'لەسەر شەقامی 100 مەتری، تەنیشت چێشتخانەی توودەی. قەڵا و بازاڕەکەی ژێری نزیکەی 4 کیلۆمەتر دوورن — نزیکەی 15 خولەک بە ئۆتۆمبێل — و فڕۆکەخانەی نێودەوڵەتیی هەولێریش نزیکەی 20 خولەک. زانکۆی سەڵاحەدین 2 کیلۆمەتر دوورە، بۆیە شوێنێکی گونجاوە بۆ خێزانەکانی خوێندکاران.',
  },
  'my-flower-2': {
    ar: 'على شارع بيشه‌وا قاضي قرب سيهان موتورز، في الحي الذي تقع فيه المحكمة والمكتبة المركزية. جامعة صلاح الدين على بعد كيلومتر ونصف، والقلعة وبازارها على بعد نحو 4 كيلومترات — 15 دقيقة بالسيارة — والمطار نحو 20 دقيقة. ماي فلاور 1 على بعد كيلومتر واحد، فيمكن للفندقين معاً استيعاب مجموعة كبيرة.',
    en: 'On Peshawa Qazi near Cihan Motors, in the quarter that holds the courthouse and the central library. Salahaddin University is a kilometre and a half away, the Citadel and its bazaar about four kilometres — fifteen minutes by car — and Erbil International Airport around twenty. My Flower 1 is a kilometre from here, so the two together can take a group that will not fit in one.',
    ku: 'لەسەر شەقامی پێشەوا قازی، نزیک سیهان مۆتۆرز، لەو ناوچەیەی دادگا و کتێبخانەی ناوەندی تێدایە. زانکۆی سەڵاحەدین 1.5 کیلۆمەتر دوورە، قەڵا و بازاڕەکەی نزیکەی 4 کیلۆمەتر — 15 خولەک بە ئۆتۆمبێل — و فڕۆکەخانەش نزیکەی 20 خولەک. مای فڵاوەری 1 تەنها 1 کیلۆمەتر لێرەوە دوورە، بۆیە هەردووکیان پێکەوە دەتوانن گرووپێکی گەورە لەخۆ بگرن.',
  },
  'my-flower-3': {
    ar: 'مقابل تابلو مول مباشرة على شارع كركوك. القلعة والبازار الواقع تحتها على بعد كيلومترين — نحو 10 دقائق بالسيارة — ومطار أربيل الدولي على بعد أقل من 9 كيلومترات، أي نحو 20 دقيقة. وهو أقرب الفنادق الأربعة إلى المدينة القديمة.',
    en: 'Directly opposite Tablo Mall on Kirkuk Road. The Citadel and the bazaar at its foot are two kilometres away — about ten minutes by car — and Erbil International Airport is under nine kilometres, roughly twenty minutes in ordinary traffic. It is the closest of the four hotels to the old city.',
    ku: 'ڕاست بەرامبەر تابلۆ مۆڵ لەسەر شەقامی کەرکووک. قەڵا و بازاڕی ژێری تەنها 2 کیلۆمەتر دوورن — نزیکەی 10 خولەک بە ئۆتۆمبێل — و فڕۆکەخانەی نێودەوڵەتیی هەولێر کەمتر لە 9 کیلۆمەتر، واتە نزیکەی 20 خولەک. لە هەر چوار هۆتێلەکە، ئەمە نزیکترینە لە شاری کۆن.',
  },
  'my-flower-4': {
    ar: 'على شارع كركوك، على بعد دقائق سيراً من تابلو مول و300 متر من ماي فلاور 3. القلعة والبازار على بعد كيلومترين ونصف — نحو 10 دقائق بالسيارة — ومطار أربيل الدولي على بعد نحو 20 دقيقة.',
    en: "On Kirkuk Road, a few minutes' walk from Tablo Mall and three hundred metres from My Flower 3. The Citadel and the bazaar are two and a half kilometres — about ten minutes by car — and Erbil International Airport is around twenty minutes.",
    ku: 'لەسەر شەقامی کەرکووک، چەند خولەکێک بە پێ لە تابلۆ مۆڵ و 300 مەتر لە مای فڵاوەری 3. قەڵا و بازاڕ 2.5 کیلۆمەتر دوورن — نزیکەی 10 خولەک بە ئۆتۆمبێل — و فڕۆکەخانەی نێودەوڵەتیی هەولێر نزیکەی 20 خولەک.',
  },
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [slug, text] of Object.entries(NEARBY)) {
    for (const [locale, nearby] of Object.entries(text)) {
      await db.execute(sql`
        UPDATE "branches_locales" SET "nearby" = ${nearby}
         WHERE "_locale" = ${locale}
           AND "_parent_id" = (SELECT "id" FROM "branches" WHERE "slug" = ${slug})
           AND ("nearby" IS NULL OR "nearby" = '');
      `)
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [slug, text] of Object.entries(NEARBY)) {
    for (const [locale, nearby] of Object.entries(text)) {
      await db.execute(sql`
        UPDATE "branches_locales" SET "nearby" = NULL
         WHERE "_locale" = ${locale}
           AND "_parent_id" = (SELECT "id" FROM "branches" WHERE "slug" = ${slug})
           AND "nearby" = ${nearby};
      `)
    }
  }
}
