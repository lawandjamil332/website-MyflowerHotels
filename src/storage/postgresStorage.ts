import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import { sql } from '@payloadcms/db-postgres'

/**
 * Keeps uploaded photographs in Postgres.
 *
 * The default is to write them onto the container's own filesystem, which the
 * host replaces on every deploy — so pictures uploaded on a Tuesday are gone
 * by Thursday, with the database still pointing at files that no longer exist.
 * That has already cost this owner an evening's work twice.
 *
 * A storage bucket is the textbook answer and remains the better one, but it
 * has to be created by hand in the hosting dashboard, and until somebody does
 * that every upload is quietly doomed. The database is already there, already
 * has a permanent disk, and is already backed up. Putting the bytes in it
 * makes uploads survive a deploy with no setup at all.
 *
 * The trade is honest: images are served by the application rather than a CDN,
 * and the database carries the weight. For a few hundred hotel photographs
 * that is nothing, and the long cache headers below mean a browser fetches
 * each file once. If a bucket is configured later the site uses it instead,
 * automatically — see src/plugins/index.ts.
 */

// Filenames are unique per upload, so a file at a given name never changes.
const IMMUTABLE = 'public, max-age=31536000, immutable'

type Row = { data: Buffer; mime_type: string | null; filesize: number | null }

export const postgresStorage = (): Adapter => {
  return ({ collection }): GeneratedAdapter => {
    const table = 'payload_stored_files'

    return {
      name: 'postgres',

      async handleUpload({ file, req }) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = (req.payload.db as any).drizzle
        const buffer = file.buffer
        await db.execute(sql`
          INSERT INTO ${sql.identifier(table)}
            ("collection", "filename", "mime_type", "filesize", "data", "created_at")
          VALUES (
            ${collection.slug}, ${file.filename}, ${file.mimeType},
            ${buffer.length}, ${buffer}, NOW()
          )
          ON CONFLICT ("collection", "filename") DO UPDATE SET
            "mime_type" = EXCLUDED."mime_type",
            "filesize"  = EXCLUDED."filesize",
            "data"      = EXCLUDED."data",
            "created_at" = NOW()
        `)
      },

      async handleDelete({ filename, req }) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = (req.payload.db as any).drizzle
        await db.execute(sql`
          DELETE FROM ${sql.identifier(table)}
           WHERE "collection" = ${collection.slug} AND "filename" = ${filename}
        `)
      },

      // Payload's own media route serves the bytes back through staticHandler.
      generateURL: ({ filename }) => `/api/${collection.slug}/file/${encodeURIComponent(filename)}`,

      async staticHandler(req, { params }) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = (req.payload.db as any).drizzle
          const filename = decodeURIComponent(params.filename)

          const result = await db.execute(sql`
            SELECT "data", "mime_type", "filesize"
              FROM ${sql.identifier(table)}
             WHERE "collection" = ${collection.slug} AND "filename" = ${filename}
             LIMIT 1
          `)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = ((result as any)?.rows ?? [])[0] as Row | undefined

          if (!row?.data) {
            return new Response('Not found', { status: 404 })
          }

          const body = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data)

          return new Response(new Uint8Array(body), {
            status: 200,
            headers: new Headers({
              'Content-Type': row.mime_type || 'application/octet-stream',
              'Content-Length': String(row.filesize ?? body.length),
              'Cache-Control': IMMUTABLE,
            }),
          })
        } catch (err) {
          req.payload.logger.error(`Postgres storage: could not read file — ${String(err)}`)
          return new Response('Not found', { status: 404 })
        }
      },
    }
  }
}
