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
    },
  ],
  siteName: SITE_NAME,
  title: SITE_NAME,
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
