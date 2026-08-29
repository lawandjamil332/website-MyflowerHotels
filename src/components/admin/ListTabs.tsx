'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import './listTabs.scss'

/**
 * The row of tabs across the top of a reservations list.
 *
 * This is the one thing the extranet has that a content-management panel does
 * not, and it is the thing the whole screen is for. Booking.com opens its
 * reservations page on "Arrivals", not on every booking ever taken, because
 * the question a hotel asks that screen forty times a day is "who is coming
 * today" — and answering it in Payload meant opening the filter builder,
 * choosing a field, an operator and two dates, twice.
 *
 * Each tab is a link with the filter already in it. Payload reads `where` out
 * of the URL exactly as the filter builder would have written it, so these are
 * a shortcut to the panel's own machinery rather than a second one: the filter
 * pills still show what is applied, the columns still sort, and clearing the
 * filter by hand still works.
 *
 * `view` is carried alongside only so a tab knows it is the current one.
 * Payload ignores query parameters it does not recognise.
 */

export type Tab = {
  /** Marks the active tab. Not read by Payload. */
  key: string
  label: string
  /** Filter, as the flat query-string pairs Payload parses back into a Where. */
  where?: Record<string, string>
  sort?: string
}

/** Midnight today and midnight tomorrow, UTC — stays are whole days. */
const days = () => {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const tomorrow = new Date(today.getTime() + 86_400_000)
  return { today: today.toISOString(), tomorrow: tomorrow.toISOString() }
}

/** Statuses that mean a room is actually held. */
const live = (index: number) => ({
  [`where[and][${index}][status][in][0]`]: 'held',
  [`where[and][${index}][status][in][1]`]: 'confirmed',
})

export const bookingTabs = (): Tab[] => {
  const { today, tomorrow } = days()

  return [
    {
      key: 'arrivals',
      label: 'Arriving today',
      sort: 'checkIn',
      where: {
        'where[and][0][checkIn][greater_than_equal]': today,
        'where[and][1][checkIn][less_than]': tomorrow,
        ...live(2),
      },
    },
    {
      key: 'departures',
      label: 'Leaving today',
      sort: 'checkOut',
      where: {
        'where[and][0][checkOut][greater_than_equal]': today,
        'where[and][1][checkOut][less_than]': tomorrow,
        ...live(2),
      },
    },
    {
      key: 'inhouse',
      label: 'Staying tonight',
      sort: 'checkOut',
      where: {
        'where[and][0][checkIn][less_than_equal]': today,
        'where[and][1][checkOut][greater_than]': today,
        ...live(2),
      },
    },
    {
      key: 'upcoming',
      label: 'Still to come',
      sort: 'checkIn',
      where: {
        'where[and][0][checkIn][greater_than_equal]': tomorrow,
        ...live(1),
      },
    },
    {
      key: 'cancelled',
      label: 'Cancelled & no-shows',
      sort: '-updatedAt',
      where: {
        'where[and][0][status][in][0]': 'cancelled',
        'where[and][0][status][in][1]': 'noShow',
      },
    },
    { key: 'all', label: 'Every booking', sort: '-createdAt' },
  ]
}

export const enquiryTabs = (): Tab[] => [
  {
    key: 'new',
    label: 'Waiting for a reply',
    sort: '-createdAt',
    where: { 'where[and][0][status][equals]': 'new' },
  },
  {
    key: 'contacted',
    label: 'Answered',
    sort: '-updatedAt',
    where: { 'where[and][0][status][equals]': 'contacted' },
  },
  { key: 'all', label: 'Every enquiry', sort: '-createdAt' },
]

export const Tabs: React.FC<{ tabs: Tab[] }> = ({ tabs }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('view') ?? 'all'

  const go = (tab: Tab) => {
    const params = new URLSearchParams()
    params.set('view', tab.key)
    if (tab.sort) params.set('sort', tab.sort)
    // Page 1: a filter that leaves seven rows has no page 3 to land on.
    params.set('page', '1')
    for (const [key, value] of Object.entries(tab.where ?? {})) params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <nav className="mf-tabs" aria-label="Quick filters">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className="mf-tabs__tab"
          data-active={tab.key === active ? 'true' : undefined}
          onClick={() => go(tab)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

export const EnquiryTabs: React.FC = () => <Tabs tabs={enquiryTabs()} />
