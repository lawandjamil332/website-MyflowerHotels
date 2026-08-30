'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import { BOOKING_STATUS } from './statuses'
import { Tabs, bookingTabs } from './ListTabs'
import './reservationSearch.scss'

/**
 * The reservations search, the way an extranet asks the question.
 *
 * Payload ships a search box that matches one field — here, the booking
 * reference — and a filter builder behind a menu, where finding "everyone
 * called Ahmed arriving in September" means choosing a field, an operator and
 * a value, three times, from dropdowns listing every column in the table.
 * It is a query builder for people who know what a query is.
 *
 * A hotel asks four questions of a reservations list and no others: who, on
 * what dates, arriving or leaving, and in what state. So that is the form —
 * all four visible at once, none of them behind a menu.
 *
 * Everything is composed into Payload's own `where` query string, so this is a
 * shortcut to the panel's own machinery rather than a second one: the filter
 * pills still show what is applied, the columns still sort, and clearing a
 * filter by hand still works. The plain `q`, `on`, `from`, `to` and `st`
 * parameters ride alongside so the form can fill itself back in from a URL
 * somebody was sent; Payload ignores parameters it does not recognise.
 */

type DateField = 'checkIn' | 'checkOut' | 'createdAt'

const DATE_FIELDS: { value: DateField; label: string }[] = [
  { value: 'checkIn', label: 'Arriving' },
  { value: 'checkOut', label: 'Leaving' },
  { value: 'createdAt', label: 'Booked on' },
]

const STATUSES = Object.entries(BOOKING_STATUS).map(([value, look]) => ({ value, ...look }))

/** Midnight UTC of a yyyy-mm-dd, and the last instant of that same day. */
const dayStart = (value: string) => `${value}T00:00:00.000Z`
const dayEnd = (value: string) => `${value}T23:59:59.999Z`

export const ReservationSearch: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [text, setText] = React.useState(searchParams.get('q') ?? '')
  const [on, setOn] = React.useState<DateField>((searchParams.get('on') as DateField) || 'checkIn')
  const [from, setFrom] = React.useState(searchParams.get('from') ?? '')
  const [to, setTo] = React.useState(searchParams.get('to') ?? '')
  const [statuses, setStatuses] = React.useState<string[]>(
    (searchParams.get('st') ?? '').split(',').filter(Boolean),
  )

  const toggle = (value: string) =>
    setStatuses((current) =>
      current.includes(value) ? current.filter((s) => s !== value) : [...current, value],
    )

  const search = (event: React.FormEvent) => {
    event.preventDefault()

    /**
     * Each clause becomes one entry of Payload's `and` array, and the keys are
     * the rest of the bracket path after that entry — so they start with `[`
     * and are concatenated, not wrapped. Written the other way round the first
     * time, which produced `where[and][0][or[0][guestName][like]]`: a single
     * key with brackets inside it, which qs parses into a field nothing is
     * named, so every search returned nothing at all and looked like a working
     * filter with no matches.
     */
    const clauses: Record<string, string>[] = []

    const query = text.trim()
    if (query) {
      // A guest quotes whichever of the four they have to hand at the desk.
      clauses.push({
        '[or][0][guestName][like]': query,
        '[or][1][reference][like]': query,
        '[or][2][guestPhone][like]': query,
        '[or][3][guestEmail][like]': query,
      })
    }
    if (from) clauses.push({ [`[${on}][greater_than_equal]`]: dayStart(from) })
    if (to) clauses.push({ [`[${on}][less_than_equal]`]: dayEnd(to) })
    if (statuses.length) {
      const clause: Record<string, string> = {}
      statuses.forEach((value, i) => {
        clause[`[status][in][${i}]`] = value
      })
      clauses.push(clause)
    }

    const params = new URLSearchParams()
    params.set('view', 'search')
    params.set('page', '1')
    params.set('sort', on === 'createdAt' ? '-createdAt' : on)

    // Kept so the form can fill itself in again from a shared link.
    if (query) params.set('q', query)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (statuses.length) params.set('st', statuses.join(','))
    params.set('on', on)

    clauses.forEach((clause, i) => {
      for (const [key, value] of Object.entries(clause)) {
        params.set(`where[and][${i}]${key}`, value)
      }
    })

    router.push(`${pathname}?${params.toString()}`)
  }

  const clear = () => {
    setText('')
    setFrom('')
    setTo('')
    setStatuses([])
    setOn('checkIn')
    router.push(pathname)
  }

  const isSearch = searchParams.get('view') === 'search'

  /**
   * The spreadsheet of whatever is on the screen.
   *
   * The list's own query string is handed straight to the export, so a search
   * for cancelled stays in September downloads cancelled stays in September.
   * An export that ignored the filter would be four thousand rows and a second
   * job, which is how these end up unused.
   */
  const exportHref = `/api/bookings/export?${searchParams.toString()}`

  return (
    <div className="mf-search">
      <Tabs tabs={bookingTabs()} />

      <form className="mf-search__form" onSubmit={search}>
        <div className="mf-search__row">
          <label className="mf-search__field mf-search__field--grow">
            <span className="mf-search__label">Guest, reference or phone</span>
            <input
              className="mf-search__input"
              onChange={(event) => setText(event.target.value)}
              placeholder="Ahmed Kareem, MF-1042, 0750…"
              type="search"
              value={text}
            />
          </label>

          <label className="mf-search__field">
            <span className="mf-search__label">Dates for</span>
            <select
              className="mf-search__input"
              onChange={(event) => setOn(event.target.value as DateField)}
              value={on}
            >
              {DATE_FIELDS.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mf-search__field">
            <span className="mf-search__label">From</span>
            <input
              className="mf-search__input"
              onChange={(event) => setFrom(event.target.value)}
              type="date"
              value={from}
            />
          </label>

          <label className="mf-search__field">
            <span className="mf-search__label">To</span>
            <input
              className="mf-search__input"
              onChange={(event) => setTo(event.target.value)}
              type="date"
              value={to}
            />
          </label>
        </div>

        <div className="mf-search__row mf-search__row--end">
          <div className="mf-search__field mf-search__field--grow">
            <span className="mf-search__label">Status</span>
            <div className="mf-search__chips">
              {STATUSES.map((status) => (
                <button
                  className="mf-search__chip"
                  data-on={statuses.includes(status.value) ? 'true' : undefined}
                  data-tone={status.tone}
                  key={status.value}
                  onClick={() => toggle(status.value)}
                  type="button"
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mf-search__actions">
            {(isSearch || text || from || to || statuses.length > 0) && (
              <button className="mf-search__clear" onClick={clear} type="button">
                Clear
              </button>
            )}
            <a className="mf-search__export" href={exportHref}>
              Export
            </a>
            <button className="mf-search__go" type="submit">
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
