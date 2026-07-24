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

  const alreadyLocalized = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )

  if (alreadyLocalized) return NextResponse.next()

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
