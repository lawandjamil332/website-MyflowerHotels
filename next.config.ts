import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

const nextConfig: NextConfig = {
  // Nothing gains from advertising which framework serves this.
  poweredByHeader: false,

  /**
   * The site was sending no security headers at all.
   *
   * None of these change what a guest sees. What they change is what a page
   * on somebody else's domain is allowed to do with this one — and this site
   * takes names, telephone numbers and stay dates through forms, which is
   * exactly what a framed copy of it would be after.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Stops the site being loaded inside a frame on another domain,
          // which is how a convincing fake booking form gets built out of a
          // real one.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Stops a browser second-guessing a declared content type — the
          // trick that turns an uploaded file into a script.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // A guest arriving from a booking confirmation should not hand the
          // next site the full URL they came from; a reference is in it.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // This site asks for none of these, so nothing embedded in it
          // should be able to either.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
        ],
      },
    ]
  },
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        // The brand artwork shipped in /public — the logo in both surface
        // variants and the flower on its own. Without this, next/image
        // refuses to serve them and every page throws at runtime, which the
        // production build does not catch because the check happens per
        // request.
        pathname: '/*.png',
      },
      {
        // The hotel photographs shipped with the site, used whenever an
        // uploaded one cannot load.
        pathname: '/hotels/**',
      },
    ],
    /**
     * No request for a width that does not exist.
     *
     * next/image's default ladder tops out at 3840, and every full-width
     * picture on this site asks for `100vw`, so a laptop was fetching
     * `/_next/image?...&w=3840`. Nothing here is 3840 wide: the largest size
     * Payload generates is `xlarge` at 1920, and the photographs actually
     * uploaded are 1100. Next does not upscale, so the bytes were never wrong
     * — what was wrong is everything around them. Each fictional width is its
     * own cache entry, so the same hero was stored and re-optimised under
     * several names; and the URL itself tells anyone reading the HTML that
     * this site ships 4K photographs, which is the sort of thing a page-speed
     * report repeats back.
     *
     * Capped at 1920, which is the widest image that exists, with the rungs
     * below it kept close together so a phone is not handed a tablet's file.
     */
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920],
    // 82, not 100. Quality 100 WebP is around 40% heavier than 82 for a
    // difference nobody can see, and it is spent on photographs cropped from a
    // printed flyer — so the extra bytes were preserving the print's own
    // artefacts at full price. 75 stays allowed because it is next/image's
    // default and any component that does not ask for a quality gets it.
    qualities: [75, 82],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
