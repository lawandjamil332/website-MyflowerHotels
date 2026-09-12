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
 * The search engines, named rather than left to the wildcard.
 *
 * Same rules as everybody else. Named because a robots.txt that mentions the
 * assistants by name and not the two search engines that still send most of
 * the traffic reads like somebody was experimenting, and because a crawler
 * that finds its own name follows that group and stops reading — so if a
 * future edit ever narrows the wildcard group, these two keep working.
 */
const SEARCH = ['Googlebot', 'Googlebot-Image', 'Bingbot']

/**
 * The assistants, named rather than left to the wildcard.
 *
 * They are already allowed by the rule above them — this changes nothing
 * technically. It is here so that the next person to edit this file has to
 * decide about them deliberately: a hotel that wants to be the answer when
 * somebody asks an assistant where to stay in Erbil cannot afford to block the
 * things doing the answering, and that is exactly the kind of line that gets
 * added by accident.
 *
 * Two kinds are listed together, and the difference is worth knowing. Most of
 * these fetch a page *because a person just asked a question* — Claude-User,
 * ChatGPT-User, Perplexity-User — so blocking one does not remove this hotel
 * from a training set, it removes it from the answer a guest is reading right
 * now. The rest are the crawlers that build the index those answers are drawn
 * from. Both have to be open for the site to be quotable.
 *
 * CCBot is Common Crawl. It is not an assistant at all; it is the public
 * archive that a great many of them are built from, which makes it the one
 * name here that reaches models nobody has heard of yet.
 */
const ASSISTANTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Amazonbot',
  'meta-externalagent',
  'CCBot',
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
    block(SEARCH),
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
