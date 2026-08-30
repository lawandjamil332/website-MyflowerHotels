import type { AdminViewServerProps } from 'payload'

import React from 'react'

import Chrome from '@/components/admin/chrome/Chrome'
import { StatusPill } from '@/components/admin/StatusPill'
import { BOOKING_STATUS, look } from '@/components/admin/statuses'
import { formatNumber, formatPrice } from '@/utilities/format'

import { Columns } from './Columns'
import { runAnalytics } from './figures'
import './analytics.scss'

const baseClass = 'mf-analytics'

/**
 * Analytics — the last of the extranet's tabs this panel did not have.
 *
 * The dashboard says what is happening tonight and the calendar says what is
 * left to sell. Neither answers the question that actually decides a price: is
 * September better than last September, and how far ahead do these guests
 * book. Every number needed has been in the database since the first booking
 * and none of it was ever added up.
 *
 * Five charts and a row of figures, all of them one series in one colour,
 * because every question here is "compare these twelve months" rather than
 * "tell these things apart". Colour carrying identity when there is only one
 * thing would be decoration, and decoration in a chart is a lie waiting to
 * happen.
 *
 * The one place with several colours at once is how bookings ended, and that
 * is deliberately not a chart. Cancelled, No-show, Held and Stayed drawn as
 * four segments of a stacked bar failed the colour check outright — amber
 * against green is a colour difference of 2.2 to a reader with protanopia, and
 * red against amber only 10.5 to everyone else. So it is a table of status
 * pills, where the word carries the meaning and the colour only agrees with
 * it.
 */

const Tile: React.FC<{ label: string; value: React.ReactNode; note?: string }> = ({
  label,
  value,
  note,
}) => (
  <div className={`${baseClass}__tile`}>
    <span className={`${baseClass}__tile-value`}>{value}</span>
    <span className={`${baseClass}__tile-label`}>{label}</span>
    {note && <span className={`${baseClass}__tile-note`}>{note}</span>}
  </div>
)

const Panel: React.FC<{ title: string; lead: string; children: React.ReactNode }> = ({
  title,
  lead,
  children,
}) => (
  <section className={`${baseClass}__panel`}>
    <h2>{title}</h2>
    <p>{lead}</p>
    {children}
  </section>
)

const AnalyticsView: React.FC<AdminViewServerProps> = async ({ initPageResult }) => {
  // Payload renders a custom view without its own permission gate, and this one
  // reads every booking the group has ever taken.
  if (!initPageResult?.req?.user) {
    const { redirect } = await import('next/navigation')
    redirect('/admin/login')
  }

  const data = await runAnalytics()

  if (!data || data.headline.bookings === 0) {
    return (
      <>
        <Chrome />
        <main className={baseClass}>
          <header className={`${baseClass}__head`}>
            <h1>Analytics</h1>
            <p>The last twelve months, counted from the bookings themselves.</p>
          </header>
          <p className={`${baseClass}__empty`}>
            Nothing to count yet. Once the website has taken bookings, this screen fills itself in
            — there is nothing to switch on.
          </p>
        </main>
      </>
    )
  }

  const { headline, hotels, lengths, months, occupancy, outcomes, revenue, window: lead } = data
  const label = new Map(months.map((month) => [month.key, month]))

  return (
    <>
      <Chrome />

      <main className={baseClass}>
        <header className={`${baseClass}__head`}>
          <h1>Analytics</h1>
          <p>
            The last twelve months, counted from the bookings themselves. Nothing here is an
            estimate — hover any column, or open the numbers under it.
          </p>
        </header>

        <div className={`${baseClass}__tiles`}>
          <Tile
            label="Rooms full, last 30 nights"
            note={`${formatNumber(headline.sold30)} room-nights sold`}
            value={headline.occupancy30 === null ? '—' : `${headline.occupancy30}%`}
          />
          <Tile
            label="Booked in 30 days"
            note="what guests were quoted"
            value={
              headline.booked30.length === 0 ? (
                '—'
              ) : (
                <span className={`${baseClass}__money`}>
                  {headline.booked30.map((line) => (
                    <span key={line.currency}>{formatPrice(line.amount, line.currency)}</span>
                  ))}
                </span>
              )
            }
          />
          <Tile
            label="Bookings in the year"
            note="every status"
            value={formatNumber(headline.bookings)}
          />
          <Tile
            label="Cancelled or no-show"
            note="of the year's bookings"
            value={headline.cancelledShare === null ? '—' : `${headline.cancelledShare}%`}
          />
          <Tile
            label="Average stay"
            note="nights"
            value={headline.averageStay === null ? '—' : headline.averageStay}
          />
          <Tile
            label="Booked ahead"
            note="days, on average"
            value={headline.averageWindow === null ? '—' : Math.round(headline.averageWindow)}
          />
        </div>

        <Panel
          lead="Room-nights sold against room-nights there were to sell. The rooms switched off in a month are not counted as empty — they were never for sale."
          title="How full, month by month"
        >
          <Columns
            columns={occupancy.map((entry) => ({
              label: label.get(entry.month)?.short ?? entry.month,
              note: `${formatNumber(entry.sold)} of ${formatNumber(entry.available)} room-nights`,
              value: entry.percent,
            }))}
            format={(value) => `${value}%`}
            max={100}
            measure="Full"
            unit="%"
          />
        </Panel>

        {revenue.map((line) => (
          <Panel
            key={line.currency}
            lead={`Totalled by the month the booking was taken, not the month of the stay — the same sense the dashboard uses. ${line.currency} only; the other currency has its own chart rather than being converted into this one at a rate nobody was charged.`}
            title={`Money booked, ${line.currency}`}
          >
            <Columns
              columns={line.byMonth.map((entry) => ({
                label: label.get(entry.month)?.short ?? entry.month,
                value: entry.value,
              }))}
              format={(value) => formatPrice(value, line.currency)}
              measure={line.currency}
            />
          </Panel>
        ))}

        <div className={`${baseClass}__pair`}>
          <Panel
            lead="From the day a booking was taken to the night the guest arrives. It is what tells you how late you can still move a price and have it matter."
            title="How far ahead they book"
          >
            <Columns columns={lead} measure="Bookings" size="half" />
          </Panel>

          <Panel
            lead="Nights per booking. A hotel of one-nighters is a different business from a hotel of week-long stays, and it is priced differently."
            title="How long they stay"
          >
            <Columns columns={lengths} measure="Bookings" size="half" />
          </Panel>
        </div>

        <Panel
          lead="Room-nights sold over the twelve months, hotel by hotel. Not a league table — they are different sizes — but a year is long enough that a hotel well below its own usual share is worth asking about."
          title="Which hotel sold the nights"
        >
          <Columns columns={hotels} measure="Room-nights" />
        </Panel>

        <Panel
          lead="Every booking taken in the year, by how it ended. Deliberately a table and not a chart: four of these colours drawn as segments of one bar are indistinguishable to a reader with colour blindness, so the word does the work and the colour only agrees."
          title="How they ended"
        >
          <table className={`${baseClass}__outcomes`}>
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Bookings</th>
                <th scope="col">Share</th>
                <th scope="col">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((outcome) => {
                const status = look(BOOKING_STATUS, outcome.status)
                return (
                  <tr key={outcome.status}>
                    <th scope="row">
                      {status && <StatusPill label={status.label} tone={status.tone} />}
                    </th>
                    <td>{formatNumber(outcome.count)}</td>
                    <td>{outcome.share}%</td>
                    <td>
                      <span aria-hidden="true" className={`${baseClass}__share`}>
                        <span
                          className={`${baseClass}__share-fill`}
                          style={{ width: `${outcome.share}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>

        <p className={`${baseClass}__foot`}>
          Counted when this page opened. &ldquo;Sold&rdquo; means held, confirmed or stayed — the
          same three the calendar and the booking engine treat as holding a room, so these numbers
          cannot disagree with those screens.
        </p>
      </main>
    </>
  )
}

export default AnalyticsView
