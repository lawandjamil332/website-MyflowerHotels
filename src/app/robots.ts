import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'

/**
 * robots.txt, generated rather than shipped as a file.
 *
 * The shipped one was written at build time by next-sitemap and, because the
 * deploy has no NEXT_PUBLIC_SERVER_URL set, it told every crawler that this
 * site lives at http://localhost:3000 and that its sitemap is there too. A file
 * cannot notice it is wrong; a route reads the URL it is actually being served
 * from, so this is right on whatever domain it ends up on.
 *
 * The admin panel and the API are closed. So are the pages that belong to one
 * guest — an account, a booking lookup — which are noindex in their own
 * metadata as well; saying it twice costs nothing and the two mechanisms fail
 * in different ways.
 */

// Rendered per request rather than frozen at build time. A file baked during
// the deploy is exactly how the old one ended up permanently announcing
// localhost — this one reads the address it is actually being served from.
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const base = getServerSideURL().replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/next', '/*/account', '/*/booking'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
