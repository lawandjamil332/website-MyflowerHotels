import { NextRequest, NextResponse } from 'next/server'
import { defaultLocale, locales } from './i18n/config'

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
  const host = request.headers.get('host') ?? ''
  if (host.toLowerCase().startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.host = host.slice(4)
    // Cleared so Next builds the address from `host` alone. Left set, the port
    // of the incoming request is carried onto the redirect and a guest is sent
    // to myflowerhotels.com:3000.
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
