import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Kept as a no-op so the name stays resolvable.
 *
 * This is where the hotel photographs used to be seeded. It ran too early —
 * before the migrations that created `branches_rels` and `payload_stored_files`
 * — so on a fresh database every attachment failed and was quietly logged. The
 * work now lives in 20260727_080000_seed_photos, after all schema is in place.
 *
 * The file stays rather than being deleted because the live database has this
 * name recorded as applied, and an empty `up` is the honest way to say "this
 * step did nothing worth repeating".
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  payload.logger.info('Photos: seeding moved to 20260727_080000_seed_photos')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Photos: nothing to undo')
}
