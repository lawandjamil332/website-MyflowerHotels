import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
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
 * ---
 *
 * This seed used to sit at 20260725_221500, in the middle of the run, and on
 * every fresh database all three photographs failed to attach. The failures
 * were logged and stepped over — which is right for a content seed, it must
 * not take a deploy down — so nothing was obviously broken. The site simply
 * came up with no pictures, and only a migration run watched line by line
 * showed why.
 *
 * The cause is that a seed calls Payload, and Payload builds its queries from
 * the collection config *as it stands today*, not as it stood at this point in
 * history. Two later migrations had moved the ground under it: one put the
 * galleries in a `branches_rels` table, the other put uploaded bytes in
 * `payload_stored_files`. Reading a hotel, and saving a picture, each asked
 * for a table that did not exist yet.
 *
 * Hence two rules, and this file follows both:
 *
 *  - A seed that calls Payload runs *after* every schema migration, never
 *    among them. That is the only ordering under which the config it is
 *    compiled against and the database it is pointed at agree.
 *  - Anything that can be done in SQL is done in SQL, pinned to columns that
 *    exist here. Only the upload itself goes through Payload, because that is
 *    what resizes each image and what writes it to wherever files are kept.
 *
 * On a database that already has these photographs — the live one — every
 * hotel is found to have a hero image already and is left alone.
 */
const photos = [
  { slug: 'my-flower-1', file: 'my-flower-1.jpg', alt: 'My Flower 1 hotel on 100m Street, Erbil' },
  { slug: 'my-flower-2', file: 'my-flower-2.jpg', alt: 'My Flower 2 hotel on 100m Street, Erbil' },
  { slug: 'my-flower-3', file: 'my-flower-3.jpg', alt: 'My Flower 3 hotel on Kirkuk Street, Erbil' },
]

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  for (const photo of photos) {
    try {
      const found = await db.execute(sql`
        SELECT "id", "hero_image_id" FROM "branches" WHERE "slug" = ${photo.slug} LIMIT 1
      `)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const branch = (found as any)?.rows?.[0]
      if (!branch) continue

      // Never replace a photograph somebody has already uploaded.
      if (branch.hero_image_id) {
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

      await db.execute(sql`
        UPDATE "branches"
           SET "hero_image_id" = ${media.id}, "updated_at" = NOW()
         WHERE "id" = ${branch.id}
      `)
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
