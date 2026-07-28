'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { cn } from '@/utilities/ui'
import { btnPrimary } from './ui'

export type FinderHotel = { slug: string; name: string; openingSoon?: boolean }

/**
 * Field marks. Deliberately not exported: this is a 'use client' module, and a
 * plain function exported from one and called by a server component took every
 * page down once. They are only ever used inside this file.
 */
const iconClass = 'h-[1.15rem] w-[1.15rem] shrink-0 text-brand'

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={iconClass}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M14 21V10h4a2 2 0 0 1 2 2v9M3 21h18"
        strokeLinecap="round"
      />
      <path d="M7.5 8.5h1.5M7.5 12h1.5M7.5 15.5h1.5" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={iconClass}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="3.25" y="5" width="17.5" height="16" rx="2.5" />
      <path d="M3.25 9.75h17.5M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

function GuestIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={iconClass}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  )
}

/**
 * The search bar every large hotel group opens with: which hotel, which
 * nights, how many people.
 *
 * It does not check live availability — this group has no system holding that
 * — so instead of pretending, it carries the answers straight into the
 * enquiry, which is what a guest would otherwise have typed out by hand. The
 * fields do the remembering; the front desk does the checking.
 *
 * Set as a pill floating on the hero photograph, which is what the reference
 * does with the one control its homepage is built around. It was previously a
 * ruled row spanning the whole gutter, on the reasoning that it should read as
 * part of the page — but at that width it stopped reading as a control at all
 * and became a rule drawn across the picture. A booking site's search box is
 * the product; it is allowed to sit on top and look like an object.
 */
export function StayFinder({
  hotels,
  locale,
  t,
  className,
}: {
  hotels: FinderHotel[]
  locale: Locale
  t: Dictionary
  className?: string
}) {
  const router = useRouter()
  const [hotel, setHotel] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('')

  // Only hotels taking guests can be searched; one still being built would
  // send the visitor to a page with no way to book.
  const bookable = hotels.filter((h) => !h.openingSoon)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (guests) params.set('guests', guests)
    const query = params.toString()

    // With a hotel chosen the guest goes straight to it; without one, to the
    // page that lists them all.
    const target = hotel ? `/${locale}/branches/${hotel}` : `/${locale}/contact`
    router.push(`${target}${query ? `?${query}` : ''}#enquire`)
  }

  const field =
    'w-full cursor-pointer border-0 bg-transparent px-0 py-0.5 text-[0.95rem] text-ink focus:outline-none focus:ring-0'
  // Sentence case at a readable size, not 9px letterspaced capitals. The rest
  // of the site dropped those as a magazine tell and this widget kept them,
  // which is why it read as a form bolted to a hotel site rather than the
  // control the site is built around.
  const label = 'block text-[0.8rem] font-semibold leading-none text-ink'
  const cell = 'flex flex-1 min-w-0 items-center gap-3.5 px-5 py-3.5 border-line lg:px-6'

  // A date input draws its own calendar button, so beside the icon in the cell
  // every date field showed two calendars — and in Arabic, where the field
  // mirrors, they landed side by side. The browser's button is stretched over
  // the whole field and made invisible instead of hidden: it stays the thing
  // that opens the picker, so now the entire field is the click target and
  // only the one drawn calendar is visible.
  const dateField = cn(
    field,
    'relative',
    '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0',
    '[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full',
    '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0',
  )

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form
      onSubmit={submit}
      aria-label={t.search.title}
      className={cn(
        // A pill on a photograph, the shape the reference gives the one control
        // its whole homepage is built around — and capped well short of the
        // page gutter. Run the full width of the shell it stops being an object
        // sitting on the picture and becomes a band ruled across the page.
        'mx-auto w-full max-w-[68rem] rounded-2xl bg-card p-2 lg:rounded-full lg:p-2.5',
        'shadow-[0_24px_70px_-28px_rgb(0_0_0/0.55)]',
        // Two columns on a phone rather than five stacked rows. The two dates
        // belong side by side anyway — they are one decision — and pairing them
        // takes a whole field's height out of a control that now sits at the
        // top of the hero, where every row it costs pushes the photograph down.
        'grid grid-cols-2 lg:flex lg:flex-row lg:items-center',
        className,
      )}
    >
      <div className={cn(cell, 'col-span-2 border-b lg:col-auto lg:border-b-0 lg:border-e')}>
        <BuildingIcon />
        <span className="min-w-0 flex-1">
          <label className={label} htmlFor="finder-hotel">
            {t.search.hotel}
          </label>
          <select
            id="finder-hotel"
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
            className={cn(field, 'mt-1.5')}
          >
            <option value="">{t.search.anyHotel}</option>
            {bookable.map((h) => (
              <option key={h.slug} value={h.slug}>
                {h.name}
              </option>
            ))}
          </select>
        </span>
      </div>

      <div className={cn(cell, 'border-b border-e lg:border-b-0')}>
        <CalendarIcon />
        <span className="min-w-0 flex-1">
          <label className={label} htmlFor="finder-in">
            {t.search.arriving}
          </label>
          <input
            id="finder-in"
            type="date"
            dir="ltr"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={cn(dateField, 'mt-1.5')}
          />
        </span>
      </div>

      <div className={cn(cell, 'border-b lg:border-b-0 lg:border-e')}>
        <CalendarIcon />
        <span className="min-w-0 flex-1">
          <label className={label} htmlFor="finder-out">
            {t.search.leaving}
          </label>
          <input
            id="finder-out"
            type="date"
            dir="ltr"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={cn(dateField, 'mt-1.5')}
          />
        </span>
      </div>

      <div className={cn(cell, 'col-span-2 border-b lg:col-auto lg:border-b-0 lg:max-w-[10.5rem]')}>
        <GuestIcon />
        <span className="min-w-0 flex-1">
          <label className={label} htmlFor="finder-guests">
            {t.search.guests}
          </label>
          <select
            id="finder-guests"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className={cn(field, 'mt-1.5')}
          >
            <option value="">{t.roomsPage.any}</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
                {n === 6 ? '+' : ''}
              </option>
            ))}
          </select>
        </span>
      </div>

      <button
        type="submit"
        className={cn(btnPrimary, 'col-span-2 mt-2 shrink-0 lg:col-auto lg:mt-0 lg:px-9')}
      >
        {t.search.submit}
      </button>
    </form>
  )
}
