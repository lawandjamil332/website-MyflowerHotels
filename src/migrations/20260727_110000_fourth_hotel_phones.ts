import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Gives My Flower 4 the phone lines it shares with My Flower 3.
 *
 * The group's printed card carries two numbers for each of the first three
 * hotels, and those are already on the site. The fourth is not on the card at
 * all — it is the one still being fitted out — and the owner's instruction is
 * that it answers on the third hotel's lines.
 *
 * Copied from the third hotel's row rather than typed in again, so this cannot
 * quietly disagree with the numbers actually stored there. Only fills what is
 * empty: a number entered in the admin panel outranks one copied from a
 * sibling.
 *
 * Content, so it runs after every schema migration, and it never throws.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  try {
    const result = await db.execute(sql`
      UPDATE branches AS fourth
      SET phone = third.phone,
          phone_alt = third.phone_alt,
          whatsapp = third.whatsapp
      FROM branches AS third
      WHERE third.slug = 'my-flower-3'
        AND fourth.slug = 'my-flower-4'
        AND fourth.phone IS NULL
      RETURNING fourth.phone, fourth.phone_alt
    `)

    const row = result.rows?.[0] as { phone: string | null; phone_alt: string | null } | undefined

    if (row) {
      payload.logger.info(`Phones: my-flower-4 answers on ${row.phone} and ${row.phone_alt}`)
    } else {
      payload.logger.info('Phones: my-flower-4 already has a number of its own, left alone')
    }
  } catch (error) {
    payload.logger.error(`Phones: could not copy the third hotel's lines — ${error}`)
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE branches
      SET phone = NULL, phone_alt = NULL, whatsapp = NULL
      WHERE slug = 'my-flower-4'
    `)
  } catch (error) {
    payload.logger.error(`Phones: could not undo my-flower-4 — ${error}`)
  }
}
