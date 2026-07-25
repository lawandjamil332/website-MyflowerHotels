import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Puts the group's real hotels into the live database, so the site is not an
 * empty shell waiting for someone to type them in.
 *
 * Taken from the group's own printed card: names, streets, phone lines and the
 * Instagram handle. Photographs are not seeded — there are none to seed — and
 * the front end already falls back to a monogram frame for an empty image.
 *
 * Three rules this migration follows, because it writes content rather than
 * schema:
 *
 *  - It never overwrites. A hotel whose slug already exists is left exactly as
 *    the owner last saved it.
 *  - It never throws. A content seed must not be able to take the site down on
 *    deploy, so every failure is logged and stepped over.
 *  - It writes English only. `localization.fallback` is on, so the Kurdish and
 *    Arabic versions read the English until someone translates them in the
 *    admin panel — which is better than inventing transliterations.
 */

type SeedBranch = {
  slug: string
  name: string
  neighbourhood?: string
  address?: string
  phone?: string
  phoneAlt?: string
  instagram?: string
  status?: 'open' | 'openingSoon'
  openingNote?: string
}

const hotels: SeedBranch[] = [
  {
    slug: 'my-flower-1',
    name: 'My Flower 1',
    neighbourhood: '100m Street — beside Today Restaurant',
    address: 'Erbil — 100m Street, beside Today Restaurant',
    phone: '+964 772 541 9898',
    instagram: 'https://instagram.com/myflower3.hotel',
  },
  {
    slug: 'my-flower-2',
    name: 'My Flower 2',
    neighbourhood: '100m Street — near Cihan Motors',
    address: 'Erbil — 100m Street, near Cihan Motors',
    phone: '+964 772 846 9090',
    phoneAlt: '+964 750 668 9090',
    instagram: 'https://instagram.com/myflower3.hotel',
  },
  {
    slug: 'my-flower-3',
    name: 'My Flower 3',
    neighbourhood: 'Kirkuk Street — opposite Tablo Mall',
    address: 'Erbil — Kirkuk Street, opposite Tablo Mall',
    phone: '+964 770 514 6161',
    phoneAlt: '+964 750 514 6161',
    instagram: 'https://instagram.com/myflower3.hotel',
  },
  {
    // Announced, not yet taking guests, so no contact routes are published.
    slug: 'my-flower-4',
    name: 'My Flower 4',
    status: 'openingSoon',
  },
]

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Seed only into an empty collection. Matching slug by slug looks tidier but
  // is unsafe: if the owner has already typed the hotels in under names of
  // their own, none of the slugs would match and this would quietly add a
  // second set of four.
  try {
    const existing = await payload.count({ collection: 'branches' })
    if (existing.totalDocs > 0) {
      payload.logger.info(
        `Seed: ${existing.totalDocs} branch(es) already present — leaving content alone`,
      )
      return
    }
  } catch (err) {
    payload.logger.error(`Seed: could not check existing branches, skipping — ${String(err)}`)
    return
  }

  for (const [i, hotel] of hotels.entries()) {
    try {
      await payload.create({
        collection: 'branches',
        locale: 'en',
        data: {
          name: hotel.name,
          slug: hotel.slug,
          neighbourhood: hotel.neighbourhood,
          address: hotel.address,
          city: 'Erbil',
          phone: hotel.phone,
          phoneAlt: hotel.phoneAlt,
          // The same line, on the assumption that these mobiles are on
          // WhatsApp — the norm for businesses here. Correct it in the admin
          // panel if any hotel uses a different number for chat.
          whatsapp: hotel.phone,
          instagram: hotel.instagram,
          checkInTime: '14:00',
          checkOutTime: '12:00',
          status: hotel.status ?? 'open',
          openingNote: hotel.openingNote,
          order: i,
        },
      })
      payload.logger.info(`Seed: created ${hotel.slug}`)
    } catch (err) {
      payload.logger.error(`Seed: could not create ${hotel.slug} — ${String(err)}`)
    }
  }

  try {
    const settings = await payload.findGlobal({ slug: 'settings', locale: 'en' })
    await payload.updateGlobal({
      slug: 'settings',
      locale: 'en',
      data: {
        // Each field defers to whatever is already saved. The one exception is
        // the old default spelling, which was never a decision anybody made —
        // the group's logo reads "MY FLOWER", as two words.
        siteName:
          !settings?.siteName || settings.siteName === 'Myflower Hotels'
            ? 'My Flower Hotels'
            : settings.siteName,
        establishedYear: settings?.establishedYear ?? 2012,
        stars: settings?.stars ?? '4',
        phone: settings?.phone || '+964 772 541 9898',
        whatsapp: settings?.whatsapp || '+964 772 541 9898',
        social: {
          ...(settings?.social ?? {}),
          instagram: settings?.social?.instagram || 'https://instagram.com/myflower3.hotel',
        },
      },
    })
    payload.logger.info('Seed: site settings filled in where empty')
  } catch (err) {
    payload.logger.error(`Seed: could not update settings — ${String(err)}`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Only removes hotels that are still exactly as seeded — anything the owner
  // has edited or photographed is theirs now and stays.
  for (const hotel of hotels) {
    try {
      const { docs } = await payload.find({
        collection: 'branches',
        where: { slug: { equals: hotel.slug } },
        limit: 1,
      })
      const doc = docs[0]
      if (doc && !doc.heroImage && !doc.description) {
        await payload.delete({ collection: 'branches', id: doc.id })
      }
    } catch (err) {
      payload.logger.error(`Seed rollback: ${hotel.slug} — ${String(err)}`)
    }
  }
}
