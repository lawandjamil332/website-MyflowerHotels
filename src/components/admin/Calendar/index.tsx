import type { AdminViewServerProps } from 'payload'

import Link from 'next/link'
import React from 'react'

import Chrome from '@/components/admin/chrome/Chrome'
import { shortRoomName } from '@/components/admin/roomName'
import { formatDateLong, formatPrice } from '@/utilities/format'

import type { RoomRow } from './availability'

import { ScrollToToday } from './ScrollToToday'
import { monthKey, monthStart, runAvailability, shiftMonth } from './availability'
import './calendar.scss'

const baseClass = 'mf-calendar'

/**
 * Rates & availability — the extranet's calendar.
 *
 * Room types down the side, a calendar month across the top, and two lines for
 * every room: how many are still free that night, and how many are booked.
 * Sold out is red, nearly gone is amber, the weekend is shaded and today has a
 * ring round it. It is the one screen a hotel manager opens without being
 * asked to, and the panel did not have it: the only way to find out whether
 * the 14th was full was to go to the website and try to book it.
 *
 * A month rather than a rolling fortnight, because a month is the unit hotels
 * think in — "how is September looking" — and because a grid whose first
 * column is a different date every time you open it cannot be compared with
 * the one you looked at yesterday.
 *
 * Payload draws a custom view like this one without its own template, so the
 * page renders the chrome itself. That is the price of the route, and it buys
 * something worth having — the whole width of the window for a grid that needs
 * every pixel of it.
 */

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const dayKey = (date: Date) => date.toISOString().slice(0, 10)

/** Friday and Saturday are the weekend here, and the nights that fill first. */
const isWeekend = (day: Date) => day.getUTCDay() === 5 || day.getUTCDay() === 6

/**
 * How full a room is that night, as a word the stylesheet colours.
 *
 * Thresholds rather than a gradient: a manager needs to know which nights to
 * do something about, and "63% sold" is not an instruction. Sold out, nearly
 * gone, and fine are the three states worth acting on differently.
 */
const state = (free: number, quantity: number, onSale: boolean): string => {
  if (!onSale) return 'off'
  if (quantity === 0) return 'none'
  if (free === 0) return 'full'
  if (free / quantity <= 0.34) return 'low'
  return 'open'
}

/**
 * The two lines a room type gets: what is left, and what is taken.
 *
 * The name spans both, the way the extranet's does, so the eye reads one room
 * as one block rather than as two unrelated rows that happen to be adjacent.
 */
const RoomRows: React.FC<{ room: RoomRow; todayKey: string }> = ({ room, todayKey }) => {
  const name = shortRoomName(room.name, room.hotel)

  return (
    <>
      <tr className={`${baseClass}__row`}>
        <th className={`${baseClass}__room`} rowSpan={2} scope="rowgroup">
          <Link href={`/admin/collections/rooms/${room.id}`}>{name}</Link>
          <span className={`${baseClass}__room-note`}>
            {room.quantity} room{room.quantity === 1 ? '' : 's'}
            {room.price !== null && ` · from ${formatPrice(room.price, room.currency)}`}
          </span>
          {!room.onSale && <span className={`${baseClass}__off-chip`}>Not on sale</span>}
        </th>

        <th className={`${baseClass}__metric`} scope="row">
          Rooms left
        </th>

        {room.nights.map((night) => (
          <td
            className={`${baseClass}__cell`}
            data-state={state(night.free, room.quantity, room.onSale)}
            data-today={night.date.slice(0, 10) === todayKey ? 'true' : undefined}
            data-weekend={isWeekend(new Date(night.date)) ? 'true' : undefined}
            key={night.date}
            title={`${name} · ${formatDateLong(night.date)} · ${night.sold} of ${room.quantity} sold`}
          >
            {room.onSale ? night.free : '—'}
          </td>
        ))}
      </tr>

      <tr className={`${baseClass}__row ${baseClass}__row--sold`}>
        <th className={`${baseClass}__metric`} scope="row">
          Booked
        </th>

        {room.nights.map((night) => (
          <td
            className={`${baseClass}__sold`}
            data-today={night.date.slice(0, 10) === todayKey ? 'true' : undefined}
            data-weekend={isWeekend(new Date(night.date)) ? 'true' : undefined}
            data-zero={night.sold === 0 ? 'true' : undefined}
            key={night.date}
          >
            {night.sold}
          </td>
        ))}
      </tr>
    </>
  )
}

const CalendarView: React.FC<AdminViewServerProps> = async ({ initPageResult, searchParams }) => {
  // Payload renders a custom view without its own permission gate, and this
  // one reads every booking at every hotel. Anyone not logged in gets the
  // login screen, exactly as they would asking for any other admin route.
  if (!initPageResult?.req?.user) {
    const { redirect } = await import('next/navigation')
    redirect('/admin/login')
  }

  const month = typeof searchParams?.month === 'string' ? searchParams.month : undefined
  const availability = await runAvailability(month)

  const start = monthStart(month)
  const previous = monthKey(shiftMonth(start, -1))
  const next = monthKey(shiftMonth(start, 1))
  const thisMonth = monthKey(new Date())
  const todayKey = dayKey(new Date())

  const byHotel: { hotel: string; rooms: RoomRow[] }[] = []
  for (const room of availability?.rooms ?? []) {
    const last = byHotel[byHotel.length - 1]
    if (last && last.hotel === room.hotel) last.rooms.push(room)
    else byHotel.push({ hotel: room.hotel, rooms: [room] })
  }

  const columns = availability?.dates.length ?? 0
  const busiest = Math.max(1, ...(availability?.totals ?? []).map((total) => total.stock))

  return (
    <>
      <Chrome />

      <main className={baseClass}>
        <header className={`${baseClass}__head`}>
          <div className={`${baseClass}__title`}>
            <h1>Rates &amp; availability</h1>
            <p>
              How many of each room are still free, and how many are booked, night by night. Open a
              room to change its price or how many there are.
            </p>
          </div>

          <nav className={`${baseClass}__months`} aria-label="Change the month shown">
            <Link
              aria-label="Previous month"
              className={`${baseClass}__arrow`}
              href={`/admin/calendar?month=${previous}`}
            >
              ‹
            </Link>
            <span className={`${baseClass}__month-name`}>
              {MONTHS[start.getUTCMonth()]} {start.getUTCFullYear()}
            </span>
            <Link
              aria-label="Next month"
              className={`${baseClass}__arrow`}
              href={`/admin/calendar?month=${next}`}
            >
              ›
            </Link>
            <Link className={`${baseClass}__today-btn`} href={`/admin/calendar?month=${thisMonth}`}>
              This month
            </Link>
          </nav>
        </header>

        {!availability || availability.rooms.length === 0 ? (
          <p className={`${baseClass}__empty`}>
            No rooms are set up yet. Add them under Rates &amp; availability → Rooms, and they will
            appear here with everything booked against them.
          </p>
        ) : (
          <div className={`${baseClass}__scroll`}>
            <ScrollToToday />
            <table className={`${baseClass}__grid`}>
              <thead>
                <tr>
                  <th className={`${baseClass}__corner`} colSpan={2} scope="col">
                    Room type
                  </th>
                  {availability.dates.map((date) => {
                    const day = new Date(date)
                    return (
                      <th
                        className={`${baseClass}__day`}
                        data-today={date.slice(0, 10) === todayKey ? 'true' : undefined}
                        data-weekend={isWeekend(day) ? 'true' : undefined}
                        key={date}
                        scope="col"
                      >
                        <span className={`${baseClass}__day-name`}>
                          {WEEKDAYS[day.getUTCDay()]}
                          <span className="mf-sr">{WEEKDAY_NAMES[day.getUTCDay()]}</span>
                        </span>
                        <span className={`${baseClass}__day-number`}>{day.getUTCDate()}</span>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              {byHotel.map((group) => (
                <tbody key={group.hotel}>
                  <tr className={`${baseClass}__hotel-row`}>
                    <th className={`${baseClass}__hotel`} colSpan={columns + 2} scope="colgroup">
                      {/* The cell spans the whole month, so sticking the cell
                          itself pins a box whose text is already off to the
                          left. Sticking the label inside it is what keeps the
                          hotel's name on screen however far the grid scrolls. */}
                      <span className={`${baseClass}__hotel-label`}>{group.hotel}</span>
                    </th>
                  </tr>
                  {group.rooms.map((room) => (
                    <RoomRows key={room.id} room={room} todayKey={todayKey} />
                  ))}
                </tbody>
              ))}

              <tfoot>
                <tr>
                  <th className={`${baseClass}__corner`} colSpan={2} scope="row">
                    All four hotels
                    <span className={`${baseClass}__room-note`}>rooms sold of rooms on sale</span>
                  </th>
                  {availability.totals.map((total) => {
                    const percent =
                      total.stock > 0 ? Math.round((total.sold / total.stock) * 100) : 0
                    return (
                      <td
                        className={`${baseClass}__total`}
                        data-today={total.date.slice(0, 10) === todayKey ? 'true' : undefined}
                        data-weekend={isWeekend(new Date(total.date)) ? 'true' : undefined}
                        key={total.date}
                        title={`${formatDateLong(total.date)} · ${total.sold} of ${total.stock} rooms sold`}
                      >
                        <span aria-hidden="true" className={`${baseClass}__total-bar`}>
                          <span
                            className={`${baseClass}__total-fill`}
                            style={{ height: `${Math.round((total.sold / busiest) * 100)}%` }}
                          />
                        </span>
                        <span className={`${baseClass}__total-value`}>{percent}%</span>
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <ul className={`${baseClass}__key`}>
          <li data-state="open">Rooms free</li>
          <li data-state="low">Nearly gone</li>
          <li data-state="full">Sold out</li>
          <li data-state="off">Not on sale</li>
          <li data-state="weekend">Friday &amp; Saturday</li>
        </ul>
      </main>
    </>
  )
}

export default CalendarView
