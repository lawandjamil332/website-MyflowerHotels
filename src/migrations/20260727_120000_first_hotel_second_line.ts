import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Gives My Flower 1 its second line.
 *
 * The printed card lists two numbers for this hotel and prints the same one
 * twice, so the site only ever had one. The owner supplied the real second
 * line as 0750 541 9898; it is stored in the international form the other
 * hotels already use, because that is what a `tel:` link needs to work for
 * somebody dialling from outside Iraq — the local trunk 0 is meaningless to a
 * foreign network, and a guest calling from abroad is exactly who cannot ask
 * the front desk to repeat it.
 *
 * It follows the pattern of the other hotels, where the pair shares its last
 * digits and differs in the carrier prefix: 772 541 9898 and 750 541 9898.
 *
 * Only fills an empty field, so a number entered in the admin panel is never
 * overwritten. Content, so it runs last, and it never throws.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  try {
    const result = await db.execute(sql`
      UPDATE branches
      SET phone_alt = '+964 750 541 9898'
      WHERE slug = 'my-flower-1'
        AND phone_alt IS NULL
      RETURNING phone, phone_alt
    `)

    const row = result.rows?.[0] as { phone: string; phone_alt: string } | undefined

    if (row) {
      payload.logger.info(`Phones: my-flower-1 answers on ${row.phone} and ${row.phone_alt}`)
    } else {
      payload.logger.info('Phones: my-flower-1 already has a second line, left alone')
    }
  } catch (error) {
    payload.logger.error(`Phones: could not set the first hotel's second line — ${error}`)
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE branches
      SET phone_alt = NULL
      WHERE slug = 'my-flower-1' AND phone_alt = '+964 750 541 9898'
    `)
  } catch (error) {
    payload.logger.error(`Phones: could not undo my-flower-1 — ${error}`)
  }
}
