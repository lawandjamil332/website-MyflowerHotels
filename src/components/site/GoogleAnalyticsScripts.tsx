import Script from 'next/script'

import { GoogleAnalyticsPageViews } from './GoogleAnalytics'
import { TapTracking } from './TapTracking'

/**
 * Google Analytics, and nothing at all when it is not configured.
 *
 * The measurement ID is an environment variable rather than a constant,
 * because it must be absent on a developer's machine and in the test suite.
 * Hard-coded, every page opened while working on this site — and every one of
 * the twenty-five test suites, which open hundreds — would be counted as a
 * guest, and the first month of figures would be mostly us.
 *
 * `afterInteractive` deliberately, not `beforeInteractive`. Nothing on this
 * site needs Google's script to work, and a measurement tool that delays the
 * first paint of a hotel page has cost more than it measures.
 *
 * A note on what this means legally, because it is a real obligation and not a
 * footnote: this sets cookies in the guest's browser. A hotel in Erbil takes
 * European guests, and European law wants their agreement before analytics
 * cookies are set. Nothing here asks for it yet. The consent banner is a
 * visible change to every page on the site, so it is a decision to make
 * deliberately rather than something to add quietly alongside this.
 */
export const GoogleAnalyticsScripts: React.FC = () => {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
      <GoogleAnalyticsPageViews measurementId={measurementId} />
      {/* Inside this guard deliberately: with no measurement ID there is
          nothing to send taps to, so the listener would be a document-wide
          click handler on every page doing nothing at all. */}
      <TapTracking />
    </>
  )
}
