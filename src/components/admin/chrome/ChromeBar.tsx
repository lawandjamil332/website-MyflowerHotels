'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import type { Counts } from './counts'

import { SECTIONS, activeFor } from './sections'
import './chrome.scss'

/**
 * The extranet's chrome: a blue bar, then a row of tabs, then the pages of
 * whichever tab you are on.
 *
 * The sidebar this replaces was the single thing that made the panel read as a
 * content-management system rather than a booking system. Every extranet in
 * the trade — Booking.com's, Expedia's, Agoda's — is a coloured bar across the
 * top with the property's name in it and horizontal tabs underneath, and there
 * is a reason: the work happens in wide tables, and a 275px column down the
 * left is 275px of table you cannot see.
 *
 * Three rows, and each one answers a different question:
 *
 *   the blue bar   whose hotels are these, and what needs me right now
 *   the tabs       which of the six parts of the business am I in
 *   the sub-tabs   which page of that part
 *
 * The counters in the bar are links, so noticing "2 waiting" and acting on it
 * is one click rather than a hunt through a menu.
 */

const Alert: React.FC<{
  count: number | null
  href: string
  label: string
  urgent?: boolean
}> = ({ count, href, label, urgent }) => {
  if (count === null) return null

  return (
    <Link className="mf-chrome__alert" data-urgent={urgent && count > 0 ? 'true' : undefined} href={href}>
      <span className="mf-chrome__alert-count">{count}</span>
      <span className="mf-chrome__alert-label">{label}</span>
    </Link>
  )
}

export const ChromeBar: React.FC<{ counts: Counts }> = ({ counts }) => {
  const pathname = usePathname()
  const active = activeFor(pathname)
  const section = active?.section
  const links = section?.links ?? []

  return (
    <header className="mf-chrome">
      <div className="mf-chrome__bar">
        <Link className="mf-chrome__brand" href="/admin">
          <span className="mf-chrome__mark" aria-hidden="true">
            <svg fill="none" height="22" viewBox="0 0 24 24" width="22">
              <path
                d="M12 3.2c1.9 1.7 2.8 3.4 2.8 5.2 0 1.5-.6 2.6-1.7 3.4 1.6-.2 2.9-.9 3.9-2.1.7 2.4.4 4.5-.9 6.2-1.3 1.8-3.3 2.7-5.9 2.7-2.4 0-4.3-.7-5.6-2.2C3.3 15 2.8 13.2 3.1 11c1 1.3 2.3 2.1 4 2.3-1.2-.9-1.8-2.1-1.8-3.6 0-2.2 1.4-4.1 4.2-5.6-.3 1.5.1 2.7 1 3.7.3-1.7 1.1-3.2 2.5-4.6z"
                fill="currentColor"
              />
              <path d="M12 18.5V22" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </span>
          <span className="mf-chrome__names">
            <strong>My Flower Hotels</strong>
            <span>
              {counts.hotels ? `${counts.hotels} hotels · ` : ''}
              Erbil, Kurdistan Region
            </span>
          </span>
        </Link>

        <div className="mf-chrome__alerts">
          <Alert
            count={counts.arrivals}
            href="/admin/collections/bookings?view=arrivals"
            label="arriving today"
          />
          <Alert
            count={counts.departures}
            href="/admin/collections/bookings?view=departures"
            label="leaving today"
          />
          <Alert
            count={counts.enquiries}
            href="/admin/collections/enquiries?view=new"
            label="enquiries waiting"
            urgent
          />
        </div>
      </div>

      <nav className="mf-chrome__tabs" aria-label="Sections">
        {SECTIONS.map((item) => (
          <Link
            className="mf-chrome__tab"
            data-active={item.key === section?.key ? 'true' : undefined}
            href={item.href}
            key={item.key}
          >
            <span className="mf-chrome__tab-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {links.length > 0 && (
        <nav className="mf-chrome__sub" aria-label={`${section?.label} pages`}>
          {links.map((link) => (
            <Link
              className="mf-chrome__sub-link"
              data-active={link.href === active?.link?.href ? 'true' : undefined}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
