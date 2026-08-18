import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'
import { SITE_DESCRIPTION, SITE_NAME } from './site'

/**
 * What is shown when a page is shared and has said nothing of its own.
 *
 * This carried the starter template's name and blurb — so a hotel page pasted
 * into WhatsApp announced "Payload Website Template: an open-source website
 * built with Payload and Next.js". It is the first thing a guest sees of the
 * group, on the surface where most links in this region are actually sent.
 */
const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: SITE_DESCRIPTION,
  images: [
    {
      url: `${getServerSideURL()}/api/og`,
      width: 1200,
      height: 630,
      alt: SITE_NAME,
    },
  ],
  siteName: SITE_NAME,
  title: SITE_NAME,
}

/**
 * Open Graph writes a locale as language_TERRITORY, not as the two letters
 * this site routes on. Kurdish is `ckb`, Central Kurdish, which is the code
 * for the Sorani actually spoken in Erbil — `ku` is the macrolanguage and
 * would be a different claim.
 */
const OG_LOCALE = { en: 'en_GB', ar: 'ar_IQ', ku: 'ckb_IQ' } as const

export const mergeOpenGraph = (
  og?: Metadata['openGraph'],
  /** The language the page being shared is written in. */
  locale?: keyof typeof OG_LOCALE,
): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
    // Named so a share card is read in the language it was written in, and so
    // the other two are declared as the translations they are rather than as
    // competing pages.
    ...(locale
      ? {
          locale: OG_LOCALE[locale],
          alternateLocale: Object.entries(OG_LOCALE)
            .filter(([k]) => k !== locale)
            .map(([, v]) => v),
        }
      : {}),
  }
}
