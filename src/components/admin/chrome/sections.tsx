import React from 'react'

/**
 * The panel's map, in the extranet's own words.
 *
 * Booking.com does not put eleven database tables in a list down the side. It
 * puts six things across the top — Home, Reservations, Rates & availability,
 * Property, Guests, Settings — and when you are inside one of them, a second
 * row appears with only that section's pages in it. You are never looking at
 * more than about four choices, and you always know which of the six you are
 * in.
 *
 * That is the whole idea, and it is why this file exists rather than the
 * grouping being spread across eleven collection configs. The shape of the
 * navigation is one decision, written down once.
 *
 * Icons are inline SVG rather than a font or a sprite: six of them, drawn at
 * one size, taking `currentColor` so the same markup works white on the blue
 * bar and dark on the tab row.
 */

export type NavLink = {
  label: string
  href: string
  /**
   * A route counts as this link when the path starts with `match` — so a
   * booking's own page keeps Reservations lit rather than dropping the tab
   * the moment you open a row. Defaults to `href`.
   */
  match?: string
}

export type Section = {
  key: string
  label: string
  /** Where the tab itself goes: the section's first page. */
  href: string
  icon: React.ReactNode
  /** The second row. Empty means the section is a single page. */
  links: NavLink[]
}

const svg = (children: React.ReactNode) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
    width="18"
  >
    {children}
  </svg>
)

const icons = {
  home: svg(<path d="M3 10.5L12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" />),
  reservations: svg(
    <>
      <rect height="16.5" rx="2" width="18" x="3" y="4.5" />
      <path d="M3 10h18M8 2.5v4M16 2.5v4M8.8 15.2l2.2 2.2 4.2-4.2" />
    </>,
  ),
  rates: svg(
    <>
      <path d="M3 19v-7h18v7M3 19v2M21 19v2M3 12V6" />
      <path d="M7 12v-2.2a1.3 1.3 0 0 1 1.3-1.3h3.4A1.3 1.3 0 0 1 13 9.8V12" />
    </>,
  ),
  property: svg(
    <>
      <path d="M3 21h18M5.5 21V4.5a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5V21" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M10.5 21v-4h3v4" />
    </>,
  ),
  guests: svg(
    <>
      <path d="M20 21v-1.8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V21" />
      <circle cx="12" cy="7" r="4" />
    </>,
  ),
  settings: svg(
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
    </>,
  ),
}

export const SECTIONS: Section[] = [
  {
    key: 'home',
    label: 'Home',
    href: '/admin',
    icon: icons.home,
    links: [],
  },
  {
    key: 'reservations',
    label: 'Reservations',
    href: '/admin/collections/bookings',
    icon: icons.reservations,
    links: [
      { label: 'Bookings', href: '/admin/collections/bookings' },
      { label: 'Enquiries', href: '/admin/collections/enquiries' },
    ],
  },
  {
    key: 'rates',
    label: 'Rates & availability',
    href: '/admin/calendar',
    icon: icons.rates,
    links: [
      { label: 'Calendar', href: '/admin/calendar' },
      { label: 'Rooms', href: '/admin/collections/rooms' },
      { label: 'Offers', href: '/admin/collections/offers' },
    ],
  },
  {
    key: 'property',
    label: 'Property',
    href: '/admin/collections/branches',
    icon: icons.property,
    links: [
      { label: 'Hotels', href: '/admin/collections/branches' },
      { label: 'Photos', href: '/admin/collections/media' },
    ],
  },
  {
    key: 'guests',
    label: 'Guests',
    href: '/admin/collections/guests',
    icon: icons.guests,
    links: [
      { label: 'Guest accounts', href: '/admin/collections/guests' },
      { label: 'Reviews', href: '/admin/collections/reviews' },
      { label: 'Points', href: '/admin/collections/point-entries' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/admin/globals/settings',
    icon: icons.settings,
    links: [
      { label: 'Site settings', href: '/admin/globals/settings' },
      { label: 'Staff logins', href: '/admin/collections/users' },
    ],
  },
]

/**
 * Which section a path belongs to.
 *
 * Longest match wins, so `/admin/collections/branches/2` picks Hotels over
 * anything that merely shares a prefix, and `/admin` on its own only ever
 * matches Home.
 */
export const activeFor = (pathname: string): { section: Section; link?: NavLink } | null => {
  let best: { section: Section; link?: NavLink; length: number } | null = null

  for (const section of SECTIONS) {
    const candidates: { href: string; link?: NavLink }[] = section.links.length
      ? section.links.map((link) => ({ href: link.match ?? link.href, link }))
      : [{ href: section.href }]

    for (const candidate of candidates) {
      const exact = candidate.href === '/admin'
      const hit = exact ? pathname === '/admin' : pathname.startsWith(candidate.href)
      if (hit && (!best || candidate.href.length > best.length)) {
        best = { section, link: candidate.link, length: candidate.href.length }
      }
    }
  }

  return best ? { section: best.section, link: best.link } : null
}
