'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import type { Dictionary } from '@/i18n/dictionaries'
import type { AvailableRoom } from '@/utilities/booking'
import { cn } from '@/utilities/ui'
import { submitBooking, type BookingResult } from '@/actions/booking'
import { btnPrimary } from './ui'

/**
 * The last step: a name, a number, and a button.
 *
 * Deliberately four fields and no account. Making a guest invent a password
 * before they can hold a room is the single largest cause of abandoned hotel
 * bookings, and the account is worth nothing if the booking it was meant to
 * carry never happened. The offer to keep it comes afterwards, once the room
 * is theirs.
 */
export function BookingForm({
  locale,
  room,
  branchId,
  checkIn,
  checkOut,
  guests,
  nights,
  total,
  t,
}: {
  locale: string
  room: AvailableRoom
  branchId: number
  checkIn: string
  checkOut: string
  guests?: number | null
  nights: number
  total: number | null
  t: Dictionary
}) {
  const [state, action, pending] = useActionState<BookingResult | null, FormData>(
    submitBooking,
    null,
  )

  // Made once, when the form first renders, and unchanged for its lifetime.
  // Two presses of this form carry the same key, so the second is recognised as
  // the same intention rather than a second room. Disabling the button while
  // the first is in flight is not enough on its own: that is client-side, and a
  // second request can be on the wire before React has re-rendered anything.
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )

  if (state?.status === 'success') {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center sm:p-10">
        <h2 className="font-display text-3xl text-ink">{t.booking.doneTitle}</h2>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted-ink">{t.booking.doneLead}</p>
        <p className="mt-8 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-ink uppercase rtl:tracking-normal">
          {t.booking.reference}
        </p>
        {/* The one thing on this page worth remembering, at a size that says so. */}
        <p className="font-display mt-2 text-4xl tracking-wide text-brand" dir="ltr">
          {state.reference}
        </p>
        {/* The only moment a guest is certain to be looking at the reference is
            this one, so it is also the only moment worth telling them what it
            opens. Anywhere later they have already closed the page. */}
        <p className="mt-8 text-[0.9rem] text-muted-ink">
          <Link href={`/${locale}/booking`} className="link-line tap-safe text-ink">
            {t.booking.manageTitle}
          </Link>
        </p>
      </div>
    )
  }

  const field =
    'w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[1rem] text-ink placeholder:text-muted-ink/60 focus:border-brand focus:ring-0 focus:outline-none'
  const label = 'block text-[0.72rem] font-semibold text-ink'

  return (
    <form action={action} className="rounded-2xl border border-line bg-card p-7 sm:p-9">
      <h2 className="font-display text-2xl text-ink sm:text-3xl">{t.booking.confirmTitle}</h2>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-muted-ink">{t.booking.confirmLead}</p>

      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="room" value={room.id} />
      <input type="hidden" name="branch" value={branchId} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      {guests ? <input type="hidden" name="guests" value={guests} /> : null}
      {total ? <input type="hidden" name="totalAmount" value={total} /> : null}
      <input type="hidden" name="currency" value={room.currency} />

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="booking-name">
            {t.form.name}
          </label>
          <input id="booking-name" name="guestName" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="booking-phone">
            {t.form.phone}
          </label>
          <input id="booking-phone" name="guestPhone" required dir="ltr" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="booking-email">
            {t.form.email} <span className="font-normal text-muted-ink">({t.form.optional})</span>
          </label>
          <input id="booking-email" name="guestEmail" type="email" dir="ltr" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="booking-notes">
            {t.form.message} <span className="font-normal text-muted-ink">({t.form.optional})</span>
          </label>
          <textarea id="booking-notes" name="notes" rows={2} className={field} />
        </div>
      </div>

      {state?.status === 'error' && (
        <p
          role="alert"
          className={cn(
            'mt-7 rounded-xl px-4 py-3 text-[0.95rem]',
            state.message === 'gone' ? 'bg-brand/10 text-brand' : 'bg-line/60 text-ink',
          )}
        >
          {state.message === 'gone'
            ? t.booking.errorGone
            : state.message === 'required'
              ? t.form.errorRequired
              : state.message === 'dates'
                ? t.booking.errorDates
                : state.message === 'guests'
                  ? t.booking.errorGuests
                  : t.booking.errorGeneric}
        </p>
      )}

      <div className="mt-9 flex flex-wrap items-center gap-5">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? t.booking.sending : t.booking.submit}
        </button>
        <p className="text-[0.9rem] text-muted-ink">
          {nights} {t.booking.nights} · {t.booking.payAtHotel}
        </p>
      </div>
    </form>
  )
}
