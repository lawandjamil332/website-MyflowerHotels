import type { MetadataRoute } from 'next'

import { SITE_DESCRIPTION, SITE_NAME } from '@/utilities/site'

/**
 * Lets a guest keep the hotel on their phone's home screen.
 *
 * The icons were already in /public and nothing referenced them, so on a phone
 * "Add to Home Screen" produced a screenshot of the page with the browser's
 * own chrome around it. With this it saves as the hotel: its mark, its name,
 * opening on the site rather than in a tab.
 *
 * Worth more here than on most sites — a guest with a booking comes back to
 * check dates, find the address, or cancel, and an icon on the home screen is
 * a shorter path than remembering a domain.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'My Flower',
    description: SITE_DESCRIPTION,
    // The site is trilingual and two of the three read right to left; opening
    // on the English index and letting the header switch is the one behaviour
    // that is never wrong.
    start_url: '/en',
    scope: '/',
    display: 'standalone',
    background_color: '#f1ede4',
    theme_color: '#0f2f4a',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      // "maskable" lets Android crop it into whatever shape the launcher uses
      // instead of dropping the square onto a white tile.
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
