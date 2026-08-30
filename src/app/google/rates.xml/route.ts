import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { FEED_DAYS, feedEnabled, ratesFeed } from '@/utilities/googleFeed'

/**
 * Prices and availability, as the Transaction message Google's ARI endpoint
 * takes.
 *
 * Served rather than sent. Google receives this by being pushed to, under
 * credentials that come with a Hotel Center account — so until that account
 * exists there is nowhere to push it, and what matters meanwhile is that the
 * document is right and can be read. The owner can open it, I can test it, and
 * the day the account exists the only new thing needed is a scheduled POST.
 *
 * `?days=` shortens the window for reading it by eye; ninety days is what would
 * actually be sent.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  if (!(await feedEnabled(payload))) {
    return new Response('Not found', { status: 404 })
  }

  const asked = Number(new URL(request.url).searchParams.get('days'))
  const days = Number.isFinite(asked) && asked > 0 ? Math.min(asked, FEED_DAYS) : FEED_DAYS

  return new Response(await ratesFeed(payload, days), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
