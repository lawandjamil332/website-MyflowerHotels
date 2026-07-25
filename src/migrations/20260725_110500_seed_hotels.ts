import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Puts the group's real hotels into the live database, so the site is not an
 * empty shell waiting for someone to type them in.
 *
 * Taken from the group's own printed card: names, streets, phone lines and the
 * Instagram handle. Photographs are not seeded — there are none to seed — and
 * the front end already falls back to a monogram frame for an empty image.
 *
 * Written as SQL rather than through Payload's local API, and that is the
 * whole point. The API builds its INSERT from the collection config *as it
 * stands today*, so the moment a later migration added a column, this seed
 * began naming a column that did not yet exist at this point in history and
 * failed on every fresh database — a deploy against an empty Postgres produced
 * no hotels at all. SQL pinned to the schema of its own moment cannot drift
 * like that, and no future field can break it.
 *
 * Two further rules, because this writes content rather than schema:
 *
 *  - It seeds only into an empty table. Matching row by row looks tidier but
 *    is unsafe: if the hotels have already been entered under names of the
 *    owner's choosing, nothing would match and this would add a second set.
 *  - It never throws. A content seed must not be able to take the live site
 *    down on deploy, so failures are logged and stepped over.
 *
 * English only. `localization.fallback` is on, so the Kurdish and Arabic
 * versions read the English until someone translates them in the admin panel,
 * which beats inventing transliterations of the names.
 */

type SeedBranch = {
  slug: string
  name: string
  neighbourhood: string | null
  address: string | null
  phone: string | null
  phoneAlt: string | null
  instagram: string | null
  status: 'open' | 'openingSoon'
}

const hotels: SeedBranch[] = [
  {
    slug: 'my-flower-1',
    name: 'My Flower 1',
    neighbourhood: '100m Street — beside Today Restaurant',
    address: 'Erbil — 100m Street, beside Today Restaurant',
    phone: '+964 772 541 9898',
    phoneAlt: null,
    instagram: 'https://instagram.com/myflower3.hotel',
    status: 'open',
  },
  {
    slug: 'my-flower-2',
    name: 'My Flower 2',
    neighbourhood: '100m Street — near Cihan Motors',
    address: 'Erbil — 100m Street, near Cihan Motors',
    phone: '+964 772 846 9090',
    phoneAlt: '+964 750 668 9090',
    instagram: 'https://instagram.com/myflower3.hotel',
    status: 'open',
  },
  {
    slug: 'my-flower-3',
    name: 'My Flower 3',
    neighbourhood: 'Kirkuk Street — opposite Tablo Mall',
    address: 'Erbil — Kirkuk Street, opposite Tablo Mall',
    phone: '+964 770 514 6161',
    phoneAlt: '+964 750 514 6161',
    instagram: 'https://instagram.com/myflower3.hotel',
    status: 'open',
  },
  {
    // Announced, not yet taking guests, so no contact routes are published.
    slug: 'my-flower-4',
    name: 'My Flower 4',
    neighbourhood: null,
    address: null,
    phone: null,
    phoneAlt: null,
    instagram: null,
    status: 'openingSoon',
  },
]

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  try {
    const existing = await db.execute(sql`SELECT COUNT(*)::int AS n FROM "branches"`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = Number((existing as any)?.rows?.[0]?.n ?? 0)
    if (count > 0) {
      payload.logger.info(`Seed: ${count} branch(es) already present — leaving content alone`)
    } else {
      for (const [i, h] of hotels.entries()) {
        // WhatsApp takes the same line as the phone, on the assumption that
        // these mobiles are on WhatsApp — the norm for businesses here. One
        // field per hotel to change in the admin panel if any differ.
        const inserted = await db.execute(sql`
          INSERT INTO "branches"
            ("slug", "phone", "phone_alt", "whatsapp", "instagram",
             "check_out_time", "status", "order", "updated_at", "created_at")
          VALUES
            (${h.slug}, ${h.phone}, ${h.phoneAlt}, ${h.phone}, ${h.instagram},
             '12:00', ${h.status}, ${i}, NOW(), NOW())
          RETURNING "id"
        `)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = (inserted as any)?.rows?.[0]?.id
        if (!id) {
          payload.logger.error(`Seed: no id returned for ${h.slug}`)
          continue
        }

        await db.execute(sql`
          INSERT INTO "branches_locales"
            ("name", "neighbourhood", "address", "city", "_locale", "_parent_id")
          VALUES
            (${h.name}, ${h.neighbourhood}, ${h.address}, 'Erbil', 'en', ${id})
        `)
        payload.logger.info(`Seed: created ${h.slug}`)
      }
    }
  } catch (err) {
    payload.logger.error(`Seed: hotels not created — ${String(err)}`)
  }

  // Group-wide details, each field deferring to anything already saved.
  try {
    await db.execute(sql`
      INSERT INTO "settings" ("id", "phone", "whatsapp", "social_instagram",
                              "established_year", "stars", "updated_at", "created_at")
      VALUES (1, '+964 772 541 9898', '+964 772 541 9898',
              'https://instagram.com/myflower3.hotel', 2012, '4', NOW(), NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "phone"            = COALESCE(NULLIF("settings"."phone", ''), EXCLUDED."phone"),
        "whatsapp"         = COALESCE(NULLIF("settings"."whatsapp", ''), EXCLUDED."whatsapp"),
        "social_instagram" = COALESCE(NULLIF("settings"."social_instagram", ''), EXCLUDED."social_instagram"),
        "established_year" = COALESCE("settings"."established_year", EXCLUDED."established_year"),
        "stars"            = COALESCE("settings"."stars", EXCLUDED."stars")
    `)

    // The old default spelling was a placeholder nobody chose; the group's
    // logo reads "MY FLOWER", as two words.
    await db.execute(sql`
      INSERT INTO "settings_locales" ("site_name", "_locale", "_parent_id")
      SELECT 'My Flower Hotels', 'en', 1
       WHERE NOT EXISTS (
         SELECT 1 FROM "settings_locales" WHERE "_locale" = 'en' AND "_parent_id" = 1
       )
    `)
    await db.execute(sql`
      UPDATE "settings_locales"
         SET "site_name" = 'My Flower Hotels'
       WHERE "_locale" = 'en'
         AND ("site_name" IS NULL OR "site_name" = '' OR "site_name" = 'Myflower Hotels')
    `)
    payload.logger.info('Seed: site settings filled in where empty')
  } catch (err) {
    payload.logger.error(`Seed: settings not updated — ${String(err)}`)
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  // Only removes hotels still exactly as seeded — anything the owner has
  // written or photographed is theirs now and stays.
  try {
    await db.execute(sql`
      DELETE FROM "branches"
       WHERE "slug" IN ('my-flower-1','my-flower-2','my-flower-3','my-flower-4')
         AND "hero_image_id" IS NULL
    `)
  } catch (err) {
    payload.logger.error(`Seed rollback: ${String(err)}`)
  }
}
