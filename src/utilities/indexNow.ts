import type { Payload } from 'payload'

import { locales } from '@/i18n/config'
import { getServerSideURL } from './getURL'

/**
 * Telling Bing a page changed, instead of waiting to be crawled.
 *
 * WHY BING, FOR A HOTEL IN ERBIL. Not for Bing's own traffic, which here is
 * close to nothing. Assistants that search the live web draw a meaningful share
 * of their results from Bing's index, so a page Bing has not crawled is a page
 * an assistant cannot cite, whatever Google thinks of it. Bing re-crawls a
 * small site on its own schedule — weeks, sometimes — and IndexNow is the
 * published way to say "this URL changed" and have it looked at in hours. It is
 * also read by Yandex, Seznam and Naver, all of which cost nothing extra.
 *
 * WHAT IT SENDS. URLs, and nothing else. There is no content in an IndexNow
 * submission and no way to influence ranking with one; it is a notification
 * that an address is worth re-reading. Which means the worst case of a bug here
 * is a crawler arriving sooner than it would have.
 *
 * THREE THINGS IT DELIBERATELY DOES NOT DO, all three copied from the Google
 * push beside it, for the same reasons.
 *
 * It does not block. Callers fire and forget: a member of staff saving a room
 * must never wait on a search engine, and a search engine being down must never
 * be why a save fails.
 *
 * It does not retry in a loop. A failure is logged; the sitemap still lists
 * every page, and the next edit sends the same URL again. Somewhere to fall
 * back to is worth more than a queue nobody is watching.
 *
 * And it does nothing at all until it is configured. Without INDEXNOW_KEY every
 * call here returns quietly, because the key has to exist at a public address
 * on this domain before a submission means anything — see below.
 *
 * HOW THE KEY WORKS. IndexNow proves you own the site by asking you to publish
 * the key as a text file on the domain being submitted. This site serves it at
 * /indexnow.txt and names that address in every submission with `keyLocation`,
 * which the specification allows — the alternative is a file named after the
 * key itself, which would mean a route whose path changes with an environment
 * variable. Set INDEXNOW_KEY to any 8-to-128-character hexadecimal string,
 * keep it the same, and the file appears on its own.
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow'

/** Where this site publishes its key. Referenced by the route that serves it. */
export const KEY_PATH = '/indexnow.txt'

/**
 * The key, if it is set and plausible.
 *
 * The shape is checked rather than trusted. IndexNow requires hexadecimal
 * between 8 and 128 characters; a key with a space or a quotation mark in it —
 * which is what happens when somebody pastes one out of a chat window — is
 * rejected by the endpoint with an error nobody will ever read, and the site
 * would go on submitting for months. Better to refuse it here and say why.
 */
export const indexNowKey = (): string | null => {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key) return null
  return /^[0-9a-fA-F]{8,128}$/.test(key) ? key : null
}

/** Whether a key is set but unusable — worth saying out loud at boot. */
export const indexNowKeyIsMalformed = (): boolean =>
  Boolean(process.env.INDEXNOW_KEY?.trim()) && indexNowKey() === null

/**
 * Submits a set of paths, in every language the site publishes.
 *
 * Paths are given below the language — `/branches/my-flower-3` — and each
 * becomes three URLs, because the three translations are three addresses and a
 * crawler told about only the English one will re-read only that.
 *
 * Deduplicated and capped. IndexNow accepts up to ten thousand URLs in one
 * submission and this site has nowhere near that, but a caller that loops is
 * the way a limit gets found in production rather than here.
 */
export const submitToIndexNow = async (
  payload: Payload,
  paths: string[],
): Promise<{ sent: number; why?: string }> => {
  const key = indexNowKey()
  if (!key) return { sent: 0, why: 'INDEXNOW_KEY is not set, so nothing is submitted.' }

  const base = getServerSideURL().replace(/\/$/, '')

  // Never submit from a development machine. IndexNow keys are per-host, and a
  // submission naming a laptop is either rejected or — worse, if somebody has a
  // tunnel open — tells Bing to go and crawl it.
  let host: string
  try {
    host = new URL(base).host
  } catch {
    return { sent: 0, why: `Cannot read a host out of ${base}.` }
  }
  // A dot is not enough on its own: 127.0.0.1 and 192.168.1.5 both have three
  // of them and are both a development machine. Anything that is an IP address
  // rather than a name is refused alongside localhost.
  const hostname = host.split(':')[0]
  const isIpLiteral = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')
  if (!hostname.includes('.') || hostname === 'localhost' || isIpLiteral) {
    return { sent: 0, why: `${host} is not a public host, so nothing is submitted.` }
  }

  const urlList = [
    ...new Set(
      paths.flatMap((path) => {
        // The homepage is passed as an empty path, and `/${''}` is a trailing
        // slash — so every submission was naming `/en/`, which is not the URL
        // this site canonicalises to and which answers with a redirect rather
        // than a page. A crawler handed a redirect learns nothing and may drop
        // the submission entirely.
        const tail = path === '' || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`
        return locales.map((locale) => `${base}/${locale}${tail}`)
      }),
    ),
  ].slice(0, 10000)

  if (urlList.length === 0) return { sent: 0, why: 'No paths given.' }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${base}${KEY_PATH}`,
        urlList,
      }),
      // A search engine that has not answered in ten seconds is not going to.
      signal: AbortSignal.timeout(10_000),
    })

    // 200 and 202 both mean accepted; 202 means the key is still being checked,
    // which is the normal answer for the first submission from a new domain.
    if (response.status === 200 || response.status === 202) {
      payload.logger.info(`IndexNow: submitted ${urlList.length} URLs (${response.status}).`)
      return { sent: urlList.length }
    }

    // 403 is the one worth naming. It means the key file could not be read at
    // keyLocation, which is a fixable configuration problem and not a transient
    // failure — and it will otherwise recur silently on every single save.
    const why =
      response.status === 403
        ? `IndexNow refused the key: it could not read ${base}${KEY_PATH}. Check that address opens in a browser and contains exactly the key.`
        : `IndexNow answered ${response.status}.`
    payload.logger.warn(why)
    return { sent: 0, why }
  } catch (error) {
    const why = `IndexNow could not be reached: ${
      error instanceof Error ? error.message : 'unknown error'
    }`
    payload.logger.warn(why)
    return { sent: 0, why }
  }
}

/**
 * Fire and forget.
 *
 * The shape every hook uses: the save has already happened, this is only how
 * fast a search engine hears about it, and nothing about it may be allowed to
 * fail a write or make somebody wait.
 */
export const pingIndexNow = (payload: Payload, paths: string[]): void => {
  void submitToIndexNow(payload, paths).catch(() => undefined)
}

/**
 * The pages that change when a hotel does.
 *
 * A hotel's own page, obviously — but also every page assembled from the list
 * of hotels, which is most of the site. The three guide pages are here because
 * their addresses, room counts and distances are read from the hotel records at
 * render time, so editing a hotel really does change what those pages say.
 */
export const pathsForBranch = (slug?: string | null): string[] => [
  '',
  '/branches',
  '/about',
  '/contact',
  '/about/kurdish-owned-hotel-group-erbil',
  '/guides/hotel-groups-in-iraq',
  '/erbil/where-to-stay',
  ...(slug ? [`/branches/${slug}`] : []),
]

/** The pages that change when a room does. */
export const pathsForRoom = (slug?: string | null, branchSlug?: string | null): string[] => [
  '',
  '/rooms',
  ...(slug ? [`/rooms/${slug}`] : []),
  // Both of these open by stating how many rooms the group has, summed from the
  // rooms on sale — so adding or withdrawing a room type changes their first
  // paragraph, which is the part a search engine quotes.
  '/about/kurdish-owned-hotel-group-erbil',
  '/guides/hotel-groups-in-iraq',
  ...(branchSlug ? [`/branches/${branchSlug}`] : []),
]
