import { getServerSideURL } from '@/utilities/getURL'

/**
 * robots.txt, written out here rather than through Next's metadata helper.
 *
 * It began as a static file that next-sitemap wrote at build time and which,
 * because the deploy has no NEXT_PUBLIC_SERVER_URL, told every crawler this
 * site lives at http://localhost:3000. A route fixed that: it reads the URL it
 * is actually being served from, so it is right on whatever domain it lands on.
 *
 * It is now a plain text route rather than a `robots.ts` metadata export for
 * one reason: Next's serialiser emits only `rules`, `host` and `sitemap`, and
 * silently drops anything else. The two `Llms:` lines below are the only place
 * a crawler is ever told the answer sheets exist, so they have to actually be
 * in the file — and through the helper they would not have been.
 *
 * The admin panel and the API are closed. So are the pages belonging to one
 * guest — an account, a booking lookup — which are noindex in their own
 * metadata as well; saying it twice costs nothing and the two mechanisms fail
 * in different ways.
 */

// Rendered per request rather than frozen at build time. A file baked during
// the deploy is exactly how the old one ended up permanently announcing
// localhost.
export const dynamic = 'force-dynamic'

const CLOSED = ['/admin', '/api', '/next', '/*/account', '/*/booking']

/**
 * The assistants, named rather than left to the wildcard.
 *
 * They are already allowed by the rule above them — this changes nothing
 * technically. It is here so that the next person to edit this file has to
 * decide about them deliberately: a hotel that wants to be the answer when
 * somebody asks an assistant where to stay in Erbil cannot afford to block the
 * things doing the answering, and that is exactly the kind of line that gets
 * added by accident.
 */
const ASSISTANTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
]

const block = (agents: string[]): string =>
  [
    ...agents.map((a) => `User-Agent: ${a}`),
    'Allow: /',
    ...CLOSED.map((path) => `Disallow: ${path}`),
    '',
  ].join('\n')

export async function GET(): Promise<Response> {
  const base = getServerSideURL().replace(/\/$/, '')

  const body = [
    block(['*']),
    block(ASSISTANTS),
    `Host: ${base}`,
    `Sitemap: ${base}/sitemap.xml`,
    // The two plain-text answer sheets, announced where a crawler will see
    // them. Nothing on the site links to either, so without these lines the
    // files are addresses nobody knows — and a well-written answer sheet at an
    // address nobody knows does nothing at all. Unknown directives in
    // robots.txt are ignored rather than treated as errors, so this is free.
    `Llms: ${base}/llms.txt`,
    `Llms-full: ${base}/llms-full.txt`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
