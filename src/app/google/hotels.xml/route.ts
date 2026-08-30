import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { feedEnabled, hotelListFeed } from '@/utilities/googleFeed'

/**
 * The property list Google Hotel Center fetches.
 *
 * Public, because Google fetches it as an anonymous crawler and there is
 * nothing private in it — four hotel names, addresses and map pins, all of
 * which are already on the website and on Google Maps.
 *
 * 404 until somebody switches the feed on in Site settings. The alternative is
 * a site that starts offering four hotels to Google the moment it deploys,
 * which is not a decision code should make.
 */
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  if (!(await feedEnabled(payload))) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(await hotelListFeed(payload), {
    headers: {
      // Google re-fetches on its own schedule; a cached copy would go stale
      // against a hotel that opened or moved.
      'Cache-Control': 'no-store',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
