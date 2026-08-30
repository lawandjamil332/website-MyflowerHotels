import type { AdminViewServerProps } from 'payload'

import Link from 'next/link'
import React from 'react'

import Chrome from '@/components/admin/chrome/Chrome'
import { shortRoomName } from '@/components/admin/roomName'
import { formatDateLong, formatPrice } from '@/utilities/format'

import type { RoomRow } from './availability'

import { BulkEdit } from './BulkEdit'
import { EditableRow } from './EditableRow'
import { ScrollToToday } from './ScrollToToday'
import { monthKey, monthStart, runAvailability, shiftMonth } from './availability'
import './calendar.scss'

const baseClass = 'mf-calendar'

/**
 * Rates & availability — the extranet's calendar.
 *
 * Room types down the side, a calendar month across the top, and two lines for
 * every room: how many are still free that night, and how many are booked. It
 * is the one screen a hotel manager opens without being asked to, and the
 * panel did not have it: the only way to find out whether the 14th was full
 * was to go to the website and try to book it.
 *
 * Three things make it read like the extranet rather than like a report.
 *
 * A property switcher, because this is a group of four and every extranet is
 * built for one: 57 rooms on a single grid is a lot to read when the question
 * is about one building.
 *
 * A row of months, not just two arrows. Clicking November is one tap; getting
 * to November through arrows is three, and you cannot see where you are going.
 *
 * And each hotel's band carries that hotel's own occupancy, night by night,
 * instead of being an empty grey strip with a name in it. A band between two
 * blocks of rooms is where the eye already is.
 *
 * The colour is disciplined on purpose. An earlier version tinted every cell
 * with rooms free, so a quiet month was a wall of pale green and nothing stood
 * out — which is the opposite of what a colour is for. Plenty is plain now;
 * only nearly-gone, sold out and off-sale are coloured, because those are the
 * three a manager does something about.
 */

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const dayKey = (date: Date) => date.toISOString().slice(0, 10)

/** Friday and Saturday are the weekend here, and the nights that fill first. */
const isWeekend = (day: Date) => day.getUTCDay() === 5 || day.getUTCDay() === 6

/**
 * How full a room is that night, as a word the stylesheet colours.
 *
 * Thresholds rather than a gradient: a manager needs to know which nights to
 * do something about, and "63% sold" is not an instruction.
 */
const state = (free: number, quantity: number, onSale: boolean): string => {
  if (!onSale) return 'off'
  if (quantity === 0) return 'none'
  if (free === 0) return 'full'
  if (free / quantity <= 0.34) return 'low'
  return 'open'
}

/** Four bands, so a hotel's night reads as a colour before it reads as a number. */
const band = (percent: number): string => {
  if (percent >= 100) return 'full'
  if (percent >= 80) return 'high'
  if (percent >= 40) return 'mid'
  return 'low'
}

/**
 * The four lines a room type gets.
 *
 * Price and Rooms to sell are typed into; Booked and Rooms left are counted
 * and cannot be. That is the extranet's own order — what you control first,
 * what it produced underneath — and it is why the grid is worth opening rather
 * than only reading: the two numbers a hotel changes are the two at the top.
 *
 * The name spans all four, so a room reads as one block rather than as four
 * rows that happen to be adjacent.
 */
const RoomRows: React.FC<{ room: RoomRow; todayKey: string }> = ({ room, todayKey }) => {
  const name = shortRoomName(room.name, room.hotel)

  const nameCell = (
    <th className={`${baseClass}__room`} rowSpan={4} scope="rowgroup">
      <Link href={`/admin/collections/rooms/${room.id}`}>{name}</Link>
      <span className={`${baseClass}__room-note`}>
        {room.quantity} room{room.quantity === 1 ? '' : 's'}
        {room.price !== null && ` · usually ${formatPrice(room.price, room.currency)}`}
      </span>
      {!room.onSale && <span className={`${baseClass}__off-chip`}>Not on sale</span>}
    </th>
  )

  return (
    <>
      <EditableRow
        field="price"
        kind="money"
        label={`Price ${room.currency}`}
        leading={nameCell}
        nights={room.nights.map((night) => ({
          closed: night.closed,
          date: night.date,
          set: night.set,
          value: night.price,
        }))}
        roomId={room.id}
        todayKey={todayKey}
      />

      <EditableRow
        field="roomsToSell"
        kind="count"
        label="Rooms to sell"
        nights={room.nights.map((night) => ({
          closed: night.closed,
          date: night.date,
          set: night.set,
          value: night.roomsToSell,
        }))}
        roomId={room.id}
        todayKey={todayKey}
      />

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

      <tr className={`${baseClass}__row ${baseClass}__row--left`}>
        <th className={`${baseClass}__metric`} scope="row">
          Rooms left
        </th>
        {room.nights.map((night) => (
          <td
            className={`${baseClass}__cell`}
            data-state={state(night.free, night.roomsToSell, room.onSale && !night.closed)}
            data-today={night.date.slice(0, 10) === todayKey ? 'true' : undefined}
            data-weekend={isWeekend(new Date(night.date)) ? 'true' : undefined}
            key={night.date}
            title={`${name} · ${formatDateLong(night.date)} · ${night.sold} of ${night.roomsToSell} sold`}
          >
            {room.onSale && !night.closed ? night.free : '—'}
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
  const hotel = typeof searchParams?.hotel === 'string' ? searchParams.hotel : undefined
  const availability = await runAvailability(month, hotel)

  const start = monthStart(month)
  const now = new Date()
  const realMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const todayKey = dayKey(now)
  const shown = monthKey(start)

  /** Every link on this screen keeps whichever hotel is being looked at. */
  const href = (nextMonth: string, nextHotel = hotel) =>
    `/admin/calendar?month=${nextMonth}${nextHotel ? `&hotel=${nextHotel}` : ''}`

  // Twelve months, starting from whichever of this month and the month on
  // screen comes first — so paging back never leaves the strip behind.
  const stripStart = start < realMonth ? start : realMonth
  const strip = Array.from({ length: 12 }, (_, i) => shiftMonth(stripStart, i))

  const byHotel: { hotel: string; rooms: RoomRow[] }[] = []
  for (const room of availability?.rooms ?? []) {
    const last = byHotel[byHotel.length - 1]
    if (last && last.hotel === room.hotel) last.rooms.push(room)
    else byHotel.push({ hotel: room.hotel, rooms: [room] })
  }

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
              href={href(monthKey(shiftMonth(start, -1)))}
            >
              ‹
            </Link>
            <span className={`${baseClass}__month-name`}>
              {MONTHS[start.getUTCMonth()]} {start.getUTCFullYear()}
            </span>
            <Link
              aria-label="Next month"
              className={`${baseClass}__arrow`}
              href={href(monthKey(shiftMonth(start, 1)))}
            >
              ›
            </Link>
            <Link className={`${baseClass}__today-btn`} href={href(monthKey(realMonth))}>
              This month
            </Link>
          </nav>
        </header>

        {availability && availability.hotels.length > 1 && (
          <nav className={`${baseClass}__properties`} aria-label="Which hotel">
            <Link
              className={`${baseClass}__property`}
              data-active={hotel ? undefined : 'true'}
              href={`/admin/calendar?month=${shown}`}
            >
              All four hotels
            </Link>
            {availability.hotels.map((option) => (
              <Link
                className={`${baseClass}__property`}
                data-active={hotel === String(option.id) ? 'true' : undefined}
                href={href(shown, String(option.id))}
                key={option.id}
              >
                {option.name}
              </Link>
            ))}
          </nav>
        )}

        <nav className={`${baseClass}__strip`} aria-label="Jump to a month">
          {strip.map((entry) => {
            const key = monthKey(entry)
            return (
              <Link
                className={`${baseClass}__strip-month`}
                data-active={key === shown ? 'true' : undefined}
                href={href(key)}
                key={key}
              >
                <span>{MONTHS_SHORT[entry.getUTCMonth()]}</span>
                <em>{entry.getUTCFullYear()}</em>
              </Link>
            )
          })}
        </nav>

        {availability && availability.rooms.length > 0 && (
          <BulkEdit
            from={availability.dates[0].slice(0, 10)}
            rooms={availability.rooms.map((room) => ({
              hotel: room.hotel,
              id: room.id,
              name: shortRoomName(room.name, room.hotel) ?? room.name,
            }))}
            to={availability.dates[availability.dates.length - 1].slice(0, 10)}
          />
        )}

        {!availability || availability.rooms.length === 0 ? (
          <p className={`${baseClass}__empty`}>
            No rooms are set up here yet. Add them under Rates &amp; availability → Rooms, and they
            will appear with everything booked against them.
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

              {byHotel.map((group) => {
                // The band above a hotel's rooms carries that hotel's own
                // occupancy rather than only its name.
                const nights = availability.dates.map((date, i) => {
                  const sold = group.rooms.reduce((sum, room) => sum + room.nights[i].sold, 0)
                  const stock = group.rooms.reduce(
                    (sum, room) => sum + (room.onSale ? room.quantity : 0),
                    0,
                  )
                  return { date, sold, stock, percent: stock ? Math.round((sold / stock) * 100) : 0 }
                })

                return (
                  <tbody key={group.hotel}>
                    <tr className={`${baseClass}__hotel-row`}>
                      <th className={`${baseClass}__hotel`} colSpan={2} scope="rowgroup">
                        <span className={`${baseClass}__hotel-label`}>{group.hotel}</span>
                      </th>
                      {nights.map((night) => (
                        <td
                          className={`${baseClass}__hotel-cell`}
                          data-band={band(night.percent)}
                          data-today={night.date.slice(0, 10) === todayKey ? 'true' : undefined}
                          key={night.date}
                          title={`${group.hotel} · ${formatDateLong(night.date)} · ${night.sold} of ${night.stock} rooms sold`}
                        >
                          {night.percent}
                          <span className={`${baseClass}__pc`}>%</span>
                        </td>
                      ))}
                    </tr>
                    {group.rooms.map((room) => (
                      <RoomRows key={room.id} room={room} todayKey={todayKey} />
                    ))}
                  </tbody>
                )
              })}

              <tfoot>
                <tr>
                  <th className={`${baseClass}__corner`} colSpan={2} scope="row">
                    {hotel ? 'This hotel' : 'All four hotels'}
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
          <li data-state="band">The band above each hotel is how full it is that night</li>
        </ul>
      </main>
    </>
  )
}

export default CalendarView
