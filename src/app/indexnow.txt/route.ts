import { indexNowKey } from '@/utilities/indexNow'

/**
 * The IndexNow key, published where IndexNow looks for it.
 *
 * This is how a search engine checks that whoever submitted a URL controls the
 * domain: the submission names this address, the engine fetches it, and the
 * file has to contain exactly the key and nothing else. No key set, no file —
 * 404 rather than an empty page, because an empty key file that returns 200 is
 * read as a key that does not match, and the refusal that follows is harder to
 * diagnose than a plain absence.
 *
 * Served as a route rather than as a file in `public/` for the same reason
 * robots.txt is: it reads the environment it is actually running in, so the
 * same deployment works with a key in Railway and without one locally.
 */

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const key = indexNowKey()
  if (!key) return new Response('Not found', { status: 404 })

  // Exactly the key. No trailing newline — the specification says the file
  // contains the key, and some verifiers compare the body byte for byte.
  return new Response(key, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      // Long-lived: the key does not change, and a verifier fetching it during
      // a submission should never wait on this site.
      'cache-control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
