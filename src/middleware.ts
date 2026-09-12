import { NextRequest, NextResponse } from 'next/server'
import { defaultLocale, locales } from './i18n/config'
import { SITE_URL } from './utilities/site'

/**
 * Every guest-facing URL carries its language: /en/..., /ku/..., /ar/...
 * A request without one is sent to the default locale, so /branches/grand
 * still lands somewhere sensible rather than 404ing.
 *
 * The admin panel, the API and Next's own assets are left alone — they are
 * not translated pages.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /**
   * www.myflowerhotels.com → myflowerhotels.com.
   *
   * The site answers on the bare name and, until this was written, on nothing
   * else: typing the www form gave "the server can't be found", because no
   * such record existed. Plenty of guests still type www out of habit, and the
   * largest single source of visitors here is people entering the name
   * directly — so every one of them who did that reached an error page and had
   * every reason to conclude the hotel has no website.
   *
   * Fixing it properly takes two halves and this is only one. The other is a
   * DNS record pointing www at the deployment, which lives with the domain
   * registrar, not in this repository. Until that exists this code never runs,
   * because nothing reaches the server. Once it does, this is what stops the
   * site answering on two addresses at once — which would split its search
   * ranking between them and let Google pick whichever it liked.
   *
   * The direction matters and is deliberately the way round it is. The bare
   * name is what SITE_URL says, what every canonical tag and sitemap entry
   * points at, and what already works. Redirecting the other way would have
   * made all of those wrong at once, and if the host were ever configured to
   * redirect bare → www as well, the two would bounce off each other until the
   * browser gave up. Which is why this was not written until the www form was
   * confirmed dead.
   *
   * 308 rather than 302: permanent, and it preserves the method, so a form
   * posted to the www address still arrives as a POST.
   */
  const host = (request.headers.get('host') ?? '').toLowerCase()
  const canonicalHost = new URL(SITE_URL).host

  // Compared against the site's own address rather than stripped from the
  // header, and this is the whole of the difference between a redirect and a
  // hole. `Host` is supplied by whoever is asking: given
  // www.somewhere-else.example, stripping four characters would have this
  // server issue a redirect to somewhere-else.example — our domain sending
  // visitors to theirs, over a link that looks like ours. Anything that is not
  // exactly `www.` in front of the real host is left alone to 404 as it should.
  if (host === `www.${canonicalHost}`) {
    const url = request.nextUrl.clone()
    url.host = canonicalHost
    url.protocol = 'https:'
    // Cleared so the address is built from `host` alone. Left set, the port of
    // the incoming request rides along and a guest is sent to
    // myflowerhotels.com:3000.
    url.port = ''
    return NextResponse.redirect(url, 308)
  }

  const alreadyLocalized = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )

  if (alreadyLocalized) {
    // Passed through so the layout can name the page it is rendering. A layout
    // has no access to the path, and without it there is nowhere to put the
    // canonical URL or the three hreflang tags that tell Google the English,
    // Kurdish and Arabic pages are one page in three languages rather than
    // three pages saying the same thing.
    const headers = new Headers(request.headers)
    headers.set('x-pathname', pathname)
    return NextResponse.next({ request: { headers } })
  }

  /**
   * A path with no language on it gets the default one.
   *
   * Deliberately a 307 and not a 308, which looks like an oversight and is not.
   *
   * The case for a permanent redirect is that it is the stronger signal to
   * Google that `/en` is the real homepage. That signal is already being sent,
   * twice: `/en` carries its own `rel=canonical`, and every page on the site
   * declares `hreflang="x-default"` pointing at the English one. There is
   * nothing left for a 308 to say.
   *
   * The case against is that browsers cache a permanent redirect hard, and
   * sometimes indefinitely. The day this site starts reading a visitor's
   * language and sending an Arabic browser to `/ar` — which is the obvious next
   * thing to want — every returning visitor who ever hit `/` would keep going
   * to `/en` from their own cache, with no request reaching this code to say
   * otherwise. That is a bug that cannot be deployed away.
   *
   * A signal worth nothing against a trap worth a lot. It stays temporary.
   */
  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - admin        the Payload admin panel
     *  - api          Payload's REST and GraphQL endpoints
     *  - next         preview/exit-preview/seed route handlers
     *  - _next        the framework's own build output
     *  - *-sitemap.xml, sitemap.xml, robots.txt, favicons and other static files
     */
    '/((?!admin|api|next|_next|.*\\..*).*)',
  ],
}
