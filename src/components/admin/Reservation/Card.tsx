import type { UIFieldServerProps } from 'payload'

import React from 'react'

import { StatusPill } from '@/components/admin/StatusPill'
import { shortRoomName } from '@/components/admin/roomName'
import { BOOKING_STATUS, look } from '@/components/admin/statuses'
import { dbPool } from '@/utilities/db'
import { formatDateLong, formatPrice } from '@/utilities/format'

import './card.scss'

const baseClass = 'mf-res'

/**
 * A reservation, at the top of the reservation.
 *
 * Opening a booking gave a content-management form: eighteen labelled inputs
 * in the order the collection happens to declare them, with the guest's phone
 * number as an editable text box between "Guest email" and "Hotel". Everything
 * is there and nothing is answered. The questions somebody actually opens a
 * booking to answer are: who is this, when are they here, what did they pay,
 * and how do I reach them — and every one of those was a different part of the
 * page.
 *
 * So the extranet's reservation card sits above the form, and the form stays
 * underneath for the edits it is good at. Nothing here is editable, which is
 * the point: it is the answer, and the fields below are where you change it.
 *
 * The price breaks down night by night, which only became possible when nights
 * got prices of their own. It is the single most useful thing on this screen
 * for a guest arguing about a bill: the Friday was 180,000 because Friday is
 * 180,000, and here is the night it was charged on.
 *
 * A server component, so the hotel and room names and the nightly rates are
 * read straight from the database as the page renders rather than fetched
 * afterwards by the browser.
 */

type Night = { date: string; price: number | null }

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className={`${baseClass}__cell`}>
    <span className={`${baseClass}__label`}>{label}</span>
    <span className={`${baseClass}__value`}>{children}</span>
  </div>
)

const ReservationCard: React.FC<UIFieldServerProps> = async ({ data, payload }) => {
  // A booking being created has nothing to summarise yet, and the form below
  // is the whole of the job.
  if (!data?.id || !data?.reference) return null

  const id = (value: unknown): number | null =>
    typeof value === 'number' ? value : typeof value === 'object' && value && 'id' in value
      ? Number((value as { id: unknown }).id)
      : null

  const branchId = id(data.branch)
  const roomId = id(data.room)

  const [branch, room] = await Promise.all([
    branchId
      ? payload.findByID({ collection: 'branches', id: branchId, depth: 0 }).catch(() => null)
      : null,
    roomId ? payload.findByID({ collection: 'rooms', id: roomId, depth: 0 }).catch(() => null) : null,
  ])

  const checkIn = data.checkIn ? new Date(String(data.checkIn)) : null
  const checkOut = data.checkOut ? new Date(String(data.checkOut)) : null
  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000))
      : 0

  /**
   * What each night of this stay was worth on the day it was sold.
   *
   * Read from the calendar now rather than stored at the time, which means a
   * rate changed later shows the changed rate. That is a real limitation and
   * the honest one to have: the booking's own `totalAmount` is what the guest
   * was charged and is shown as the total, so the breakdown explains the
   * total without ever being allowed to contradict it.
   */
  let breakdown: Night[] = []
  if (roomId && checkIn && nights > 0 && nights <= 31) {
    try {
      const { rows } = await dbPool(payload).query<{ date: Date; price: string | null }>(
        `SELECT date, price FROM room_rates
          WHERE room_id = $1 AND date >= $2 AND date < $3`,
        [roomId, checkIn, checkOut],
      )
      const set = new Map(rows.map((r) => [new Date(r.date).toISOString().slice(0, 10), r.price]))
      const base = typeof room?.priceFrom === 'number' ? room.priceFrom : null

      breakdown = Array.from({ length: nights }, (_, i) => {
        const date = new Date(checkIn.getTime() + i * 86_400_000)
        const own = set.get(date.toISOString().slice(0, 10))
        return { date: date.toISOString(), price: own == null ? base : Number(own) }
      })
    } catch {
      breakdown = []
    }
  }

  const status = look(BOOKING_STATUS, typeof data.status === 'string' ? data.status : null)
  const currency = typeof data.currency === 'string' ? data.currency : 'IQD'
  const total = typeof data.totalAmount === 'number' ? data.totalAmount : null
  const phone = typeof data.guestPhone === 'string' ? data.guestPhone : null
  const email = typeof data.guestEmail === 'string' ? data.guestEmail : null
  const hotel = typeof branch?.name === 'string' ? branch.name : null
  const roomName = typeof room?.name === 'string' ? room.name : null

  // A phone number a hotel can dial. Iraqi numbers are given out as 0750…
  // locally and +964 750… everywhere else; WhatsApp wants neither the plus
  // nor the leading zero, so it gets its own.
  const dial = phone ? phone.replace(/[^\d+]/g, '') : null
  const whatsapp = dial ? dial.replace(/^\+/, '').replace(/^00/, '') : null

  return (
    <section className={baseClass}>
      <header className={`${baseClass}__head`}>
        <div>
          <h2 className={`${baseClass}__guest`}>{String(data.guestName ?? 'Guest')}</h2>
          <p className={`${baseClass}__meta`}>
            {String(data.reference)}
            {data.createdAt && ` · booked ${formatDateLong(String(data.createdAt))}`}
            {typeof data.locale === 'string' &&
              ` · booked in ${{ ar: 'Arabic', en: 'English', ku: 'Kurdish' }[data.locale] ?? data.locale}`}
          </p>
        </div>
        {status && <StatusPill label={status.label} tone={status.tone} />}
      </header>

      <div className={`${baseClass}__grid`}>
        <Row label="Arriving">{checkIn ? formatDateLong(checkIn) : '—'}</Row>
        <Row label="Leaving">{checkOut ? formatDateLong(checkOut) : '—'}</Row>
        <Row label="Nights">{nights || '—'}</Row>
        <Row label="Guests">{typeof data.guests === 'number' ? data.guests : '—'}</Row>
        <Row label="Hotel">{hotel ?? '—'}</Row>
        <Row label="Room">{shortRoomName(roomName, hotel) ?? '—'}</Row>
      </div>

      {(dial || email) && (
        <div className={`${baseClass}__actions`}>
          {dial && (
            <a className={`${baseClass}__action`} href={`tel:${dial}`}>
              Ring {phone}
            </a>
          )}
          {whatsapp && (
            <a
              className={`${baseClass}__action`}
              href={`https://wa.me/${whatsapp}`}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          )}
          {email && (
            <a className={`${baseClass}__action`} href={`mailto:${email}`}>
              {email}
            </a>
          )}
        </div>
      )}

      {breakdown.length > 0 && (
        <details className={`${baseClass}__nights`}>
          <summary>
            What the nights cost
            <span>
              {total === null ? '' : formatPrice(total, currency)}
            </span>
          </summary>
          <ul>
            {breakdown.map((night) => (
              <li key={night.date}>
                <span>{formatDateLong(night.date)}</span>
                <span>{night.price === null ? '—' : formatPrice(night.price, currency)}</span>
              </li>
            ))}
          </ul>
          <p className={`${baseClass}__note`}>
            Tonight&rsquo;s rates for these dates. The total above is what this guest was actually
            charged; if the two differ, a rate has been changed since they booked.
          </p>
        </details>
      )}
    </section>
  )
}

export default ReservationCard
