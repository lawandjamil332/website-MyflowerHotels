import type { Metadata } from 'next'

import { getServerSideURL } from './getURL'

/** The size Payload crops the `og` variant to, and the size /api/og draws. */
const OG_WIDTH = 1200
const OG_HEIGHT = 630

type OgImage = NonNullable<Metadata['openGraph']>['images']

/**
 * The image that appears when a link is shared.
 *
 * A real photograph wins when one exists; otherwise the site draws a branded
 * card rather than falling back to a stock picture that is not of these
 * hotels.
 *
 * Returned as a described image rather than a bare URL, and that is the whole
 * point of this file existing. A share target that is handed only a URL has to
 * fetch the image before it knows what shape it is, and WhatsApp — which is
 * where the great majority of links to this site are actually sent — will draw
 * a small square thumbnail rather than the large card while it does not know.
 * Stating 1200×630 up front is the difference between a hotel link that
 * arrives as a photograph with a headline under it and one that arrives as a
 * grey box beside two lines of text.
 *
 * The alt text is for the people reading the preview with a screen reader, who
 * otherwise get the file name.
 */
export const shareImage = (photoUrl: string, title: string, eyebrow?: string): OgImage => {
  const url = photoUrl || (() => {
    const params = new URLSearchParams({ title })
    if (eyebrow) params.set('eyebrow', eyebrow)
    return `${getServerSideURL()}/api/og?${params.toString()}`
  })()

  return [
    {
      url,
      width: OG_WIDTH,
      height: OG_HEIGHT,
      alt: eyebrow ? `${title} — ${eyebrow}` : title,
    },
  ]
}
