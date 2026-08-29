import React from 'react'

import { StatusPill } from '@/components/admin/StatusPill'
import { shortRoomName } from '@/components/admin/roomName'
import { BOOKING_STATUS, look } from '@/components/admin/statuses'
import { formatDateLong, formatDateShort, formatPrice } from '@/utilities/format'

import type { Stay } from './figures'

import { runChecks } from './checks'
import { runFigures } from './figures'
import './index.scss'

const baseClass = 'before-dashboard'

/**
 * The first screen after logging in.
 *
 * It has been three things. A fixed welcome explaining how to set the site up,
 * which stopped being true the day it was followed. Then a checklist counted
 * from the database, which was honest and current and still answered a
 * question nobody opens the panel to ask: not "what is missing from the
 * website" but "what is happening at my hotels today".
 *
 * So it opens the way Booking.com's extranet opens. Who is arriving, who is
 * leaving, who is in a room right now, how full each of the four buildings is
 * tonight. Then the two lists that turn those numbers into work — today's
 * arrivals and today's departures, with the phone number to ring in the row.
 *
 * The checklist is still here, at the bottom, where a thing you do twice a
 * year belongs.
 *
 * Every number is counted when the page opens. Nothing is cached, because a
 * dashboard that is an hour out of date about tonight is worse than no
 * dashboard: it is a wrong answer given confidently.
 */

const Tile: React.FC<{
  label: string
  value: React.ReactNode
  note?: string
  href?: string
  tone?: 'plain' | 'attention'
}> = ({ label, value, note, href, tone = 'plain' }) => {
  const body = (
    <>
      <span className={`${baseClass}__tile-value`}>{value}</span>
      <span className={`${baseClass}__tile-label`}>{label}</span>
      {note && <span className={`${baseClass}__tile-note`}>{note}</span>}
    </>
  )

  return href ? (
    <a className={`${baseClass}__tile`} data-tone={tone} href={href}>
      {body}
    </a>
  ) : (
    <div className={`${baseClass}__tile`} data-tone={tone}>
      {body}
    </div>
  )
}

/** One arrival or departure, with everything needed to act on it in the row. */
const StayRow: React.FC<{ stay: Stay; kind: 'arrival' | 'departure' }> = ({ stay, kind }) => {
  const status = look(BOOKING_STATUS, stay.status)
  const nights = stay.nights === null ? '' : `${stay.nights} night${stay.nights === 1 ? '' : 's'}`

  // An arrival is read forwards — how long are they here, when do I get the
  // room back. A departure is read backwards: when did they get here.
  const when =
    kind === 'arrival'
      ? [nights, `leaves ${formatDateShort(stay.checkOut)}`].filter(Boolean).join(' · ')
      : [`arrived ${formatDateShort(stay.checkIn)}`, nights].filter(Boolean).join(' · ')

  return (
    <li className={`${baseClass}__stay`}>
      <a className={`${baseClass}__stay-name`} href={`/admin/collections/bookings/${stay.id}`}>
        {stay.guestName}
      </a>

      <span className={`${baseClass}__stay-where`}>
        {[stay.hotel, shortRoomName(stay.room, stay.hotel)].filter(Boolean).join(' · ') || '—'}
      </span>

      <span className={`${baseClass}__stay-when`}>{when}</span>

      {stay.guestPhone ? (
        <a className={`${baseClass}__stay-phone`} href={`tel:${stay.guestPhone}`}>
          {stay.guestPhone}
        </a>
      ) : (
        <span className={`${baseClass}__stay-phone`} />
      )}

      <span className={`${baseClass}__stay-status`}>
        {status && <StatusPill label={status.label} tone={status.tone} />}
      </span>
    </li>
  )
}

const StayList: React.FC<{
  title: string
  empty: string
  stays: Stay[]
  kind: 'arrival' | 'departure'
}> = ({ title, empty, stays, kind }) => (
  <section className={`${baseClass}__panel`}>
    <h3 className={`${baseClass}__panel-title`}>
      {title}
      <span className={`${baseClass}__panel-count`}>{stays.length}</span>
    </h3>
    {stays.length === 0 ? (
      <p className={`${baseClass}__panel-empty`}>{empty}</p>
    ) : (
      <ul className={`${baseClass}__stays`}>
        {stays.map((stay) => (
          <StayRow key={stay.id} stay={stay} kind={kind} />
        ))}
      </ul>
    )}
  </section>
)

const BeforeDashboard: React.FC = async () => {
  const [figures, checks] = await Promise.all([runFigures(), runChecks()])

  return (
    <div className={baseClass}>
      {figures && (
        <>
          <header className={`${baseClass}__today`}>
            <h2>Today</h2>
            <p>{formatDateLong(figures.today)}</p>
          </header>

          <div className={`${baseClass}__tiles`}>
            <Tile
              label="Arriving today"
              value={figures.arrivals}
              href="/admin/collections/bookings?sort=checkIn"
              tone={figures.arrivals > 0 ? 'attention' : 'plain'}
            />
            <Tile
              label="Leaving today"
              value={figures.departures}
              href="/admin/collections/bookings?sort=checkOut"
            />
            <Tile label="Staying tonight" value={figures.inHouse} />
            <Tile
              label="Rooms full tonight"
              value={figures.occupancy === null ? '—' : `${figures.occupancy}%`}
              note={figures.stock > 0 ? `of ${figures.stock} rooms` : 'no rooms on sale'}
            />
            <Tile
              label="Booked this week"
              value={figures.bookedThisWeek}
              href="/admin/collections/bookings"
            />
            <Tile
              label="Enquiries waiting"
              value={figures.newEnquiries}
              href="/admin/collections/enquiries"
              tone={figures.newEnquiries > 0 ? 'attention' : 'plain'}
            />
            <Tile
              label="Booked this month"
              value={
                figures.revenue.length === 0 ? (
                  '—'
                ) : (
                  <span className={`${baseClass}__money`}>
                    {figures.revenue.map((line) => (
                      <span key={line.currency}>{formatPrice(line.amount, line.currency)}</span>
                    ))}
                  </span>
                )
              }
              note="what guests were quoted"
            />
          </div>

          {figures.hotels.length > 0 && (
            <section className={`${baseClass}__panel`}>
              <h3 className={`${baseClass}__panel-title`}>Tonight, hotel by hotel</h3>
              <table className={`${baseClass}__hotels`}>
                <thead>
                  <tr>
                    <th>Hotel</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Sold</th>
                    <th className={`${baseClass}__hotels-bar-head`}>Full</th>
                  </tr>
                </thead>
                <tbody>
                  {figures.hotels.map((hotel) => {
                    const percent = hotel.stock > 0 ? Math.round((hotel.sold / hotel.stock) * 100) : null
                    return (
                      <tr key={hotel.id}>
                        <th scope="row">
                          <a href={`/admin/collections/branches/${hotel.id}`}>
                            {hotel.name || `Hotel ${hotel.id}`}
                          </a>
                        </th>
                        <td>{hotel.arrivals || <span className={`${baseClass}__zero`}>0</span>}</td>
                        <td>{hotel.departures || <span className={`${baseClass}__zero`}>0</span>}</td>
                        <td>
                          {hotel.sold}
                          <span className={`${baseClass}__of`}> / {hotel.stock}</span>
                        </td>
                        <td>
                          <span className={`${baseClass}__bar`}>
                            <span
                              className={`${baseClass}__bar-fill`}
                              style={{ width: `${Math.min(100, percent ?? 0)}%` }}
                            />
                          </span>
                          <span className={`${baseClass}__bar-value`}>
                            {percent === null ? '—' : `${percent}%`}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )}

          <div className={`${baseClass}__columns`}>
            <StayList
              title="Arrivals today"
              empty="Nobody is checking in today."
              stays={figures.arrivalList}
              kind="arrival"
            />
            <StayList
              title="Departures today"
              empty="Nobody is checking out today."
              stays={figures.departureList}
              kind="departure"
            />
          </div>
        </>
      )}

      {checks !== null && checks.length > 0 && (
        <section className={`${baseClass}__panel`}>
          <h3 className={`${baseClass}__panel-title`}>
            Worth filling in
            <span className={`${baseClass}__panel-count`}>{checks.length}</span>
          </h3>

          <p className={`${baseClass}__lead`}>
            Counted from the site just now. None of these can be written for you — they are facts
            only the hotels know. Each one closes itself off this list once it is filled in.
          </p>

          <ul className={`${baseClass}__checks`}>
            {checks.map((check) => (
              <li key={check.title} className={`${baseClass}__check`} data-weight={check.weight}>
                <strong>{check.href ? <a href={check.href}>{check.title}</a> : check.title}</strong>
                <span className={`${baseClass}__why`}>{check.why}</span>
                {check.detail && <span className={`${baseClass}__detail`}>{check.detail}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {checks !== null && checks.length === 0 && (
        <p className={`${baseClass}__all-clear`}>
          Every hotel has its address, landmarks, reviews and listings. Nothing is waiting on you.
        </p>
      )}
    </div>
  )
}

export default BeforeDashboard
