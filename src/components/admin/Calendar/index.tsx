import type { AdminViewServerProps } from 'payload'

import Link from 'next/link'
import React from 'react'

import Chrome from '@/components/admin/chrome/Chrome'
import { shortRoomName } from '@/components/admin/roomName'
import { formatDateLong, formatPrice } from '@/utilities/format'

import type { RoomRow } from './availability'

import { NIGHTS, runAvailability, windowStart } from './availability'
import './calendar.scss'

const baseClass = 'mf-calendar'

/**
 * Rates & availability — the extranet's calendar.
 *
 * Room types down the side, the next fortnight across the top, and in every
 * cell the number of that room still free that night. Sold out is red, nearly
 * gone is amber, plenty is quiet. It is the one screen a hotel manager opens
 * without being asked to, and the panel did not have it: the only way to find
 * out whether the 14th was full was to go to the website and try to book it.
 *
 * Payload draws a custom view like this one without its own template, so the
 * page renders the chrome itself. That is the price of the route, and it buys
 * something worth having — the whole width of the window for a grid that needs
 * every pixel of it.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const iso = (date: Date) => date.toISOString().slice(0, 10)

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

const HotelRows: React.FC<{ hotel: string; rooms: RoomRow[] }> = ({ hotel, rooms }) => (
  <>
    <tr className={`${baseClass}__hotel-row`}>
      <th className={`${baseClass}__hotel`} colSpan={NIGHTS + 1} scope="colgroup">
        {hotel}
      </th>
    </tr>
    {rooms.map((room) => (
      <tr key={room.id}>
        <th className={`${baseClass}__room`} scope="row">
          <a href={`/admin/collections/rooms/${room.id}`}>
            {shortRoomName(room.name, room.hotel)}
          </a>
          <span className={`${baseClass}__room-note`}>
            {room.quantity} room{room.quantity === 1 ? '' : 's'}
            {room.price !== null && ` · from ${formatPrice(room.price, room.currency)}`}
            {!room.onSale && ' · not on sale'}
          </span>
        </th>
        {room.nights.map((night) => (
          <td
            className={`${baseClass}__cell`}
            data-state={state(night.free, room.quantity, room.onSale)}
            key={night.date}
            title={`${room.name} · ${formatDateLong(night.date)} · ${night.sold} sold of ${room.quantity}`}
          >
            {room.onSale ? night.free : '—'}
          </td>
        ))}
      </tr>
    ))}
  </>
)

const CalendarView: React.FC<AdminViewServerProps> = async ({ initPageResult, searchParams }) => {
  // Payload renders a custom view without its own permission gate, and this
  // one reads every booking at every hotel. Anyone not logged in gets the
  // login screen, exactly as they would asking for any other admin route.
  if (!initPageResult?.req?.user) {
    const { redirect } = await import('next/navigation')
    redirect('/admin/login')
  }

  const from = typeof searchParams?.from === 'string' ? searchParams.from : undefined
  const availability = await runAvailability(from)

  const start = windowStart(from)
  const back = iso(new Date(start.getTime() - NIGHTS * 86_400_000))
  const forward = iso(new Date(start.getTime() + NIGHTS * 86_400_000))
  const todayIso = iso(new Date())

  const byHotel: { hotel: string; rooms: RoomRow[] }[] = []
  for (const room of availability?.rooms ?? []) {
    const last = byHotel[byHotel.length - 1]
    if (last && last.hotel === room.hotel) last.rooms.push(room)
    else byHotel.push({ hotel: room.hotel, rooms: [room] })
  }

  return (
    <>
      <Chrome />

      <main className={baseClass}>
        <header className={`${baseClass}__head`}>
          <div>
            <h1>Rates &amp; availability</h1>
            <p>
              How many of each room are still free, night by night. Click a room to change its
              price or how many there are.
            </p>
          </div>

          <nav className={`${baseClass}__moves`} aria-label="Change the fortnight shown">
            <Link href={`/admin/calendar?from=${back}`}>← Earlier</Link>
            <Link href="/admin/calendar">Today</Link>
            <Link href={`/admin/calendar?from=${forward}`}>Later →</Link>
          </nav>
        </header>

        {!availability || availability.rooms.length === 0 ? (
          <p className={`${baseClass}__empty`}>
            No rooms are set up yet. Add them under Rates &amp; availability → Rooms, and they will
            appear here with everything booked against them.
          </p>
        ) : (
          <div className={`${baseClass}__scroll`}>
            <table className={`${baseClass}__grid`}>
              <thead>
                <tr>
                  <th className={`${baseClass}__corner`} scope="col">
                    Room
                  </th>
                  {availability.dates.map((date) => {
                    const day = new Date(date)
                    // Friday and Saturday are the weekend in Iraq, and they are
                    // the nights that fill first — worth being able to see.
                    const weekend = day.getUTCDay() === 5 || day.getUTCDay() === 6
                    return (
                      <th
                        className={`${baseClass}__day`}
                        data-today={date.slice(0, 10) === todayIso ? 'true' : undefined}
                        data-weekend={weekend ? 'true' : undefined}
                        key={date}
                        scope="col"
                      >
                        <span className={`${baseClass}__day-name`}>
                          {WEEKDAYS[day.getUTCDay()]}
                        </span>
                        <span className={`${baseClass}__day-number`}>{day.getUTCDate()}</span>
                        <span className={`${baseClass}__day-month`}>
                          {MONTHS[day.getUTCMonth()]}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              <tbody>
                {byHotel.map((group) => (
                  <HotelRows hotel={group.hotel} key={group.hotel} rooms={group.rooms} />
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <th className={`${baseClass}__room`} scope="row">
                    All four hotels
                    <span className={`${baseClass}__room-note`}>rooms sold of rooms on sale</span>
                  </th>
                  {availability.totals.map((total) => (
                    <td className={`${baseClass}__total`} key={total.date}>
                      <strong>{total.sold}</strong>
                      <span>/{total.stock}</span>
                    </td>
                  ))}
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
        </ul>
      </main>
    </>
  )
}

export default CalendarView
