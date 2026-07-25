import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import path from 'node:path'
import { existsSync } from 'node:fs'

/**
 * Gives each hotel a photograph of itself.
 *
 * The group's printed card carries a good exterior shot of My Flower 1, 2 and
 * 3, and those three pictures were the only real photography anywhere in this
 * project. A site of empty frames reads as broken however carefully it is
 * built, so they go in — cropped off the card, enlarged as far as they will
 * bear, and used at sizes that flatter them.
 *
 * They are a floor, not a finish. The moment proper photographs are uploaded
 * in the admin panel they replace these, and nothing here runs again.
 *
 * Uploads must go through Payload rather than SQL: it is what resizes each
 * image and, when the bucket is configured, what puts it in the bucket. That
 * makes this migration sensitive to changes in the Media collection in a way
 * the hotel seed no longer is — so it is wrapped tightly and can only ever
 * log and step aside.
 */
const photos = [
  { slug: 'my-flower-1', file: 'my-flower-1.jpg', alt: 'My Flower 1 hotel on 100m Street, Erbil' },
  { slug: 'my-flower-2', file: 'my-flower-2.jpg', alt: 'My Flower 2 hotel on 100m Street, Erbil' },
  { slug: 'my-flower-3', file: 'my-flower-3.jpg', alt: 'My Flower 3 hotel on Kirkuk Street, Erbil' },
]

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  for (const photo of photos) {
    try {
      const { docs } = await payload.find({
        collection: 'branches',
        where: { slug: { equals: photo.slug } },
        limit: 1,
        depth: 0,
      })
      const branch = docs[0]
      if (!branch) continue

      // Never replace a photograph somebody has already uploaded.
      if (branch.heroImage) {
        payload.logger.info(`Photos: ${photo.slug} already has a hero image, left alone`)
        continue
      }

      const filePath = path.join(process.cwd(), 'seed-photos', photo.file)
      if (!existsSync(filePath)) {
        payload.logger.error(`Photos: ${photo.file} missing from the build`)
        continue
      }

      const media = await payload.create({
        collection: 'media',
        locale: 'en',
        data: { alt: photo.alt },
        filePath,
      })

      await payload.update({
        collection: 'branches',
        id: branch.id,
        locale: 'en',
        data: { heroImage: media.id },
      })
      payload.logger.info(`Photos: attached ${photo.file} to ${photo.slug}`)
    } catch (err) {
      payload.logger.error(`Photos: could not attach ${photo.file} — ${String(err)}`)
    }
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Leaves the images in place: by the time anyone rolls back, the owner may
  // have used them on other pages, and an orphaned photograph is harmless.
  payload.logger.info('Photos: nothing to undo')
}
