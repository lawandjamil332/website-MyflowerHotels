'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { cn } from '@/utilities/ui'
import { btnPrimary } from './ui'

export type FinderHotel = { slug: string; name: string; openingSoon?: boolean }

/**
 * The search bar every large hotel group opens with: which hotel, which
 * nights, how many people.
 *
 * It does not check live availability — this group has no system holding that
 * — so instead of pretending, it carries the answers straight into the
 * enquiry, which is what a guest would otherwise have typed out by hand. The
 * fields do the remembering; the front desk does the checking.
 *
 * Set as one ruled row rather than a floating box of inputs, so it reads as
 * part of the page rather than a widget dropped on top of the photograph.
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
    const target = hotel
      ? `/${locale}/branches/${hotel}`
      : `/${locale}/contact`
    router.push(`${target}${query ? `?${query}` : ''}#enquire`)
  }

  const field =
    'w-full border-0 bg-transparent px-0 py-2 text-ink focus:outline-none focus:ring-0 text-[0.95rem]'
  const label =
    'block text-[0.58rem] tracking-[0.2em] text-muted-ink uppercase rtl:tracking-normal mb-1'
  const cell = 'flex-1 min-w-0 px-5 py-4 border-line'

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form
      onSubmit={submit}
      aria-label={t.search.title}
      className={cn(
        'overflow-hidden border border-line rounded-2xl bg-card/95 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.5)] backdrop-blur',
        'flex flex-col lg:flex-row lg:items-stretch',
        className,
      )}
    >
      <div className={cn(cell, 'border-b lg:border-b-0 lg:border-e')}>
        <label className={label} htmlFor="finder-hotel">
          {t.search.hotel}
        </label>
        <select
          id="finder-hotel"
          value={hotel}
          onChange={(e) => setHotel(e.target.value)}
          className={cn(field, 'cursor-pointer')}
        >
          <option value="">{t.search.anyHotel}</option>
          {bookable.map((h) => (
            <option key={h.slug} value={h.slug}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className={cn(cell, 'border-b lg:border-b-0 lg:border-e')}>
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
          className={field}
        />
      </div>

      <div className={cn(cell, 'border-b lg:border-b-0 lg:border-e')}>
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
          className={field}
        />
      </div>

      <div className={cn(cell, 'border-b lg:border-b-0 lg:border-e lg:max-w-[9rem]')}>
        <label className={label} htmlFor="finder-guests">
          {t.search.guests}
        </label>
        <select
          id="finder-guests"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className={cn(field, 'cursor-pointer')}
        >
          <option value="">{t.roomsPage.any}</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
              {n === 6 ? '+' : ''}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className={cn(btnPrimary, 'shrink-0 lg:px-10')}>
        {t.search.submit}
      </button>
    </form>
  )
}
