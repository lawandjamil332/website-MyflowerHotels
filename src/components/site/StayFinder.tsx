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
 * It checks real availability. It used to carry the answers into an enquiry
 * form instead, because nothing here was holding room counts — and that
 * fallback outlived its reason. A guest who picks their nights and presses a
 * button marked "Check availability" is owed rooms and prices, not a page
 * asking them to type the same thing again.
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
  idPrefix = 'finder',
  compact = false,
}: {
  hotels: FinderHotel[]
  locale: Locale
  t: Dictionary
  className?: string
  /**
   * Two of these can be on screen at once — the one in the hero and the one
   * docked at the top of the window — and a form control is addressed by an
   * id that has to be unique in the document. Without this the docked bar's
   * labels pointed at the hero's fields, so tapping "Arriving" up there
   * scrolled the page back to the top and opened the wrong calendar.
   */
  idPrefix?: string
  /** The docked version: same fields, less height, so it clears less page. */
  compact?: boolean
}) {
  const router = useRouter()
  const [hotel, setHotel] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('')
  const [missing, setMissing] = useState(false)

  // Only hotels taking guests can be searched; one still being built would
  // send the visitor to a page with no way to book.
  const bookable = hotels.filter((h) => !h.openingSoon)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    // A button called "Check availability" has exactly one honest outcome:
    // availability. It used to send anyone who had not filled in all three
    // fields to a contact form instead — which is what pressing it looked like
    // from the outside, since the commonest thing a guest does is pick their
    // nights, press it, and get a page with no rooms on it. That fallback was
    // written before this site could answer the question at all. It can now.
    if (!checkIn || !checkOut) {
      setMissing(true)
      // Put them in the field that is actually holding the search up.
      const id = !checkIn ? `${idPrefix}-in` : `${idPrefix}-out`
      document.getElementById(id)?.focus()
      return
    }

    setMissing(false)
    const params = new URLSearchParams()
    params.set('checkIn', checkIn)
    params.set('checkOut', checkOut)
    if (guests) params.set('guests', guests)
    // No hotel chosen searches all of them, which is what "Any hotel" says on
    // the tin and what a guest who does not know the city yet actually wants.
    if (hotel) params.set('hotel', hotel)
    router.push(`/${locale}/book?${params.toString()}`)
  }

  // 16px, not 15.2, and that is the whole reason this is not text-[0.95rem].
  //
  // Safari on iOS zooms the page in whenever a guest focuses a form control
  // set below 16px, and does not zoom back out afterwards. On the search
  // widget that meant tapping "Arriving" threw the whole homepage into a
  // magnified view the guest then had to pinch out of — on the first thing
  // they touch, and the one control this site is built around. The difference
  // on screen is under a pixel.
  const field =
    'w-full cursor-pointer border-0 bg-transparent px-0 py-0.5 text-base text-ink focus:outline-none focus:ring-0'
  // Sentence case at a readable size, not 9px letterspaced capitals. The rest
  // of the site dropped those as a magazine tell and this widget kept them,
  // which is why it read as a form bolted to a hotel site rather than the
  // control the site is built around.
  const label = 'block text-[0.8rem] font-semibold leading-none text-ink'
  // The focus ring lives on the cell, not on the control inside it.
  //
  // A date input here is not an ordinary field: its calendar picker is
  // stretched invisibly over the whole cell so that tapping anywhere opens it,
  // and an outline drawn around the input alone landed in the wrong place. The
  // previous answer was to switch the outline off and put nothing back, which
  // meant a guest moving through the booking form with a keyboard had no way
  // of telling which field they were in — on the one form this site exists to
  // get filled in.
  //
  // has-[:focus-visible] rather than focus-within, so the ring answers a Tab
  // and not a mouse click, matching every other control on the site.
  const cell = cn(
    'flex flex-1 min-w-0 items-center gap-3.5 border-line',
    compact ? 'px-4 py-2 lg:px-5' : 'px-5 py-3.5 lg:px-6',
    'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-brand',
  )

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

  // Ringed rather than reddened. The dates are not wrong, they are not there
  // yet, and the guest is being pointed at them a fraction of a second after
  // pressing the button — this has to read as "here", not as a telling-off.
  const wanted = (empty: boolean) =>
    missing && empty ? 'rounded-xl ring-2 ring-brand/70 ring-offset-2 ring-offset-card' : ''

  return (
    <div className={cn('mx-auto w-full', compact ? 'max-w-[64rem]' : 'max-w-[68rem]')}>
      <form
        onSubmit={submit}
        aria-label={t.search.title}
        className={cn(
          // A pill on a photograph, the shape the reference gives the one
          // control its whole homepage is built around — and capped well short
          // of the page gutter. Run the full width of the shell it stops being
          // an object sitting on the picture and becomes a band ruled across
          // the page.
          'w-full bg-card',
          compact
            ? 'rounded-xl p-1.5 shadow-[0_10px_30px_-16px_rgb(0_0_0/0.45)] lg:rounded-full lg:p-1.5'
            : 'rounded-2xl p-2 shadow-[0_24px_70px_-28px_rgb(0_0_0/0.55)] lg:rounded-full lg:p-2.5',
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
            <label className={label} htmlFor={`${idPrefix}-hotel`}>
              {t.search.hotel}
            </label>
            <select
              id={`${idPrefix}-hotel`}
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
            <label className={label} htmlFor={`${idPrefix}-in`}>
              {t.search.arriving}
            </label>
            <input
              id={`${idPrefix}-in`}
              type="date"
              dir="ltr"
              min={today}
              value={checkIn}
              aria-invalid={missing && !checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className={cn(dateField, 'mt-1.5', wanted(!checkIn))}
            />
          </span>
        </div>

        <div className={cn(cell, 'border-b lg:border-b-0 lg:border-e')}>
          <CalendarIcon />
          <span className="min-w-0 flex-1">
            <label className={label} htmlFor={`${idPrefix}-out`}>
              {t.search.leaving}
            </label>
            <input
              id={`${idPrefix}-out`}
              type="date"
              dir="ltr"
              min={checkIn || today}
              value={checkOut}
              aria-invalid={missing && !checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={cn(dateField, 'mt-1.5', wanted(!checkOut))}
            />
          </span>
        </div>

        <div
          className={cn(cell, 'col-span-2 border-b lg:col-auto lg:border-b-0 lg:max-w-[10.5rem]')}
        >
          <GuestIcon />
          <span className="min-w-0 flex-1">
            <label className={label} htmlFor={`${idPrefix}-guests`}>
              {t.search.guests}
            </label>
            <select
              id={`${idPrefix}-guests`}
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
          className={cn(
            btnPrimary,
            'col-span-2 mt-2 shrink-0 lg:col-auto lg:mt-0',
            compact ? 'px-6 py-3 text-[0.88rem] lg:px-7' : 'lg:px-9',
          )}
        >
          {t.search.submit}
        </button>
      </form>

      {/* Outside the pill, so saying it cannot change the shape of the control
          the whole page is built around. */}
      {missing && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-card/95 px-4 py-2.5 text-center text-[0.9rem] text-ink"
        >
          {t.search.needDates}
        </p>
      )}
    </div>
  )
}
