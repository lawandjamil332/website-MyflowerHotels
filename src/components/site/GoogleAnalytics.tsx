'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Counts a page view when the guest moves between pages without a reload.
 *
 * Google's own snippet counts one view when the document loads and then never
 * again, which is correct for an ordinary website and wrong for this one. Every
 * link here is a client-side navigation: a guest who lands on the homepage,
 * opens My Flower 3, reads the rooms and books is four pages to a person and
 * one page to Google. The reports would say every visitor read exactly one
 * page and left — the shape that looks like a broken website rather than a
 * miscounted one.
 *
 * So the first view is left to the snippet and every later one is sent here.
 * `skip` is what keeps them from being counted twice: this effect also runs on
 * the first render, and firing then would double the landing page of every
 * single visit.
 *
 * Only the path is watched, not the query string. Reading search params in the
 * App Router opts the whole tree out of static rendering, and the pages that
 * carry them — booking searches — carry dates and guest counts, which are the
 * guest's business and not worth sending to Google to tell one page view from
 * another.
 */
export const GoogleAnalyticsPageViews: React.FC<{ measurementId: string }> = ({
  measurementId,
}) => {
  const pathname = usePathname()
  const skip = useRef(true)

  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return
    }

    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    if (typeof gtag !== 'function') return

    gtag('event', 'page_view', {
      send_to: measurementId,
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname, measurementId])

  return null
}
