import { headers } from 'next/headers'

import { locales, defaultLocale, type Locale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Canonical and hreflang, for every page on the site.
 *
 * Without these the same hotel exists at three addresses — /en/..., /ku/... and
 * /ar/... — and Google has no way to know they are one hotel described three
 * times. Left alone it picks one and treats the other two as competing pages of
 * thin content, which is the worst possible outcome: the group ends up
 * competing against itself for its own name.
 *
 * Declared here rather than page by page. Every page would otherwise have to
 * remember, and the one that forgot would be the one that mattered.
 *
 * The tags are rendered as ordinary elements — React hoists <link> into the
 * head — so this works from a layout, which is the only place that sees every
 * page.
 */
export async function Hreflang({ locale }: { locale: Locale }) {
  const head = await headers()
  const pathname = head.get('x-pathname') || `/${locale}`

  // The path with its language stripped off: /ku/rooms/x → /rooms/x
  const bare = pathname.replace(new RegExp(`^/(${locales.join('|')})`), '') || ''
  const base = getServerSideURL().replace(/\/$/, '')
  const href = (l: string) => `${base}/${l}${bare}`

  return (
    <>
      <link rel="canonical" href={href(locale)} />
      {locales.map((l) => (
        <link key={l} rel="alternate" hrefLang={l} href={href(l)} />
      ))}
      {/* Somebody in a language we do not publish gets the English one, rather
          than whichever Google happened to pick. */}
      <link rel="alternate" hrefLang="x-default" href={href(defaultLocale)} />
    </>
  )
}
