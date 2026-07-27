import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { bucketConfigured, missingBucketParts } from '@/utilities/storageEnv'

/**
 * A plain-language status page for the running deployment, at /api/health.
 *
 * The owner cannot read Railway's logs to me and I cannot log into Railway, so
 * without this the live site is a black box: "it looks the same" is all either
 * of us has to go on. This answers the questions that actually matter — which
 * commit is serving, whether the database is reachable, whether the migrations
 * ran, and whether uploaded photographs are going somewhere that survives a
 * redeploy.
 *
 * It reports presence and counts only. No connection strings, no keys.
 *
 * Always answers 200 while the process is alive: Railway's health check should
 * pass whenever the app is serving HTTP, and a brief database wobble must not
 * roll back an otherwise good deploy. Read `ok` in the body for the verdict.
 */
export const dynamic = 'force-dynamic'

type Check = { ok: boolean; detail: string }

export async function GET() {
  const checks: Record<string, Check> = {}

  // Which commit is actually serving. Railway sets this; if it disagrees with
  // the newest commit on main, the deploy never happened.
  const commit =
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.SOURCE_COMMIT ||
    ''

  checks.database = { ok: false, detail: 'not checked' }
  checks.migrations = { ok: false, detail: 'not checked' }
  checks.content = { ok: false, detail: 'not checked' }

  try {
    const payload = await getPayload({ config: configPromise })

    const [branches, rooms, media] = await Promise.all([
      payload.count({ collection: 'branches' }),
      payload.count({ collection: 'rooms' }),
      payload.count({ collection: 'media' }),
    ])

    checks.database = { ok: true, detail: 'connected' }
    checks.content = {
      ok: branches.totalDocs > 0,
      detail:
        branches.totalDocs > 0
          ? `${branches.totalDocs} hotel(s), ${rooms.totalDocs} room(s), ${media.totalDocs} photo(s)`
          : 'no hotels yet — add them in the admin panel',
    }

    // The migration table is the only honest answer to "did the new columns
    // actually reach production".
    try {
      const applied = await payload.db.drizzle.execute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'select name from payload_migrations order by id desc limit 1' as any,
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = ((applied as any)?.rows ?? []) as { name?: string }[]
      const latest = rows[0]?.name
      checks.migrations = latest
        ? { ok: true, detail: `latest applied: ${latest}` }
        : { ok: false, detail: 'no migrations recorded' }
    } catch (err) {
      checks.migrations = { ok: false, detail: `could not read: ${String(err).slice(0, 120)}` }
    }
  } catch (err) {
    checks.database = { ok: false, detail: String(err).slice(0, 200) }
  }

  // The quiet killer: without a bucket, uploads land on the container's disk
  // and Railway wipes that on every rebuild. Photographs would simply vanish,
  // with nothing in the interface to explain why.
  // Either route is permanent now; the bucket is simply the better of the two.
  const onBucket = bucketConfigured()
  checks.photoStorage = {
    ok: true,
    detail: onBucket
      ? 'storage bucket connected — photographs are kept in the bucket'
      : `photographs are kept in the database, which is permanent. To use the bucket instead, still missing: ${missingBucketParts().join(', ')}`,
  }

  checks.siteUrl = {
    ok: Boolean(process.env.NEXT_PUBLIC_SERVER_URL),
    detail: process.env.NEXT_PUBLIC_SERVER_URL
      ? 'set'
      : 'NEXT_PUBLIC_SERVER_URL is empty — share links and image URLs may be wrong',
  }

  const ok = Object.values(checks).every((c) => c.ok)

  return Response.json(
    {
      ok,
      commit: commit ? commit.slice(0, 7) : 'unknown',
      checkedAt: new Date().toISOString(),
      checks,
    },
    {
      status: 200,
      headers: { 'cache-control': 'no-store' },
    },
  )
}
