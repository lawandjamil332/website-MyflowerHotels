'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'

import type { Dictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'
import { formatNumber } from '@/utilities/format'
import type { AvailableRoom } from '@/utilities/booking'
import { cn } from '@/utilities/ui'
import { EVENTS, track } from '@/utilities/track'
import { submitBooking, type BookingResult } from '@/actions/booking'
import { SignUpForm } from './AccountForms'
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
  hotelName,
  checkIn,
  checkOut,
  guests,
  nights,
  total,
  earns,
  signedIn,
  t,
}: {
  locale: string
  room: AvailableRoom
  branchId: number
  /** Only for the analytics event — "My Flower 3" reads where an id does not. */
  hotelName?: string
  checkIn: string
  checkOut: string
  guests?: number | null
  nights: number
  total: number | null
  /** Points this stay will earn once it is finished, or 0 if none. */
  earns: number
  signedIn: boolean
  t: Dictionary
}) {
  const [state, action, pending] = useActionState<BookingResult | null, FormData>(
    submitBooking,
    null,
  )

  // Kept so the account offer on the next screen can be one field instead of
  // four. They are typing these anyway; asking again half a minute later is
  // what makes an optional account not worth taking up.
  const [given, setGiven] = useState({ name: '', phone: '', email: '' })

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

  /**
   * The booking, counted once.
   *
   * This is the number the whole of Analytics exists to produce: not how many
   * people came, but how many of them booked. Nothing else on this site can
   * report it — a booking here ends on an ordinary page, with no payment step
   * and no return from a card processor to mark the moment.
   *
   * `useEffect` keyed on the reference, not a call inside the render: a render
   * can run more than once for the same result, and a booking counted twice is
   * worse than one not counted at all — it is a number that looks right.
   *
   * The reference itself is the key and is never sent. It goes to Google as
   * nothing; what goes is the shape of the booking — which hotel, how many
   * nights, how many guests, what it came to. See src/utilities/track.ts.
   */
  // Pulled out before the effect because a dependency array cannot narrow a
  // union: `state.reference` only exists on the success branch, and naming it
  // in the array is outside the `if` that proves we are on it.
  const bookedReference = state?.status === 'success' ? state.reference : null

  useEffect(() => {
    if (!bookedReference) return
    track(EVENTS.bookingConfirmed, {
      hotel: hotelName,
      room: room.name,
      nights,
      guests: guests ?? undefined,
      value: total ?? undefined,
      currency: room.currency ?? undefined,
      locale,
    })
  }, [bookedReference, room, hotelName, nights, guests, total, locale])

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

        {/* The account, offered here and nowhere earlier. Demanding one before
            the room is held is the single largest cause of abandoned hotel
            bookings; offering it after costs nothing, because the booking it
            was meant to carry has already happened. One field, since we know
            the rest — and it is a plain sign-up, so it claims their booking by
            matching the number they just gave rather than by trusting anything
            this page sends about which booking it was. */}
        {!signedIn && (
          <div className="mt-10 border-t border-line pt-8 text-start">
            <h3 className="font-display text-xl text-ink">{t.account.keepItTitle}</h3>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-ink">
              {t.account.keepItLead}
            </p>
            <div className="mx-auto mt-7 max-w-sm">
              <SignUpForm locale={locale} t={t} defaults={given} submitLabel={t.account.keepIt} />
            </div>
          </div>
        )}
      </div>
    )
  }

  const field =
    'w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[1rem] text-ink placeholder:text-muted-ink/60 focus:border-brand focus:ring-0 focus:outline-none'
  const label = 'block text-[0.72rem] font-semibold text-ink'

  return (
    <form
      action={action}
      // The step before the booking, and the pair is what makes either
      // readable: on its own "22 bookings" says nothing about whether the form
      // is working. Against "60 people filled it in" it says the form loses
      // two thirds of them, which is a thing that can be fixed.
      //
      // onSubmit rather than the button's onClick, so a guest who finishes the
      // last field and presses Enter is counted like everyone else.
      onSubmit={() =>
        track(EVENTS.bookingStarted, {
          hotel: hotelName,
          room: room.name,
          nights,
          guests: guests ?? undefined,
          value: total ?? undefined,
          currency: room.currency ?? undefined,
          locale,
        })
      }
      className="rounded-2xl border border-line bg-card p-7 sm:p-9"
    >
      <h2 className="font-display text-2xl text-ink sm:text-3xl">{t.booking.confirmTitle}</h2>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-muted-ink">{t.booking.confirmLead}</p>

      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="room" value={room.id} />
      <input type="hidden" name="branch" value={branchId} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      {total ? <input type="hidden" name="totalAmount" value={total} /> : null}
      <input type="hidden" name="currency" value={room.currency} />
      {/* So the confirmation can be written in the language they booked in. */}
      <input type="hidden" name="locale" value={locale} />

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="booking-name">
            {t.form.name}
          </label>
          <input
            id="booking-name"
            name="guestName"
            required
            autoComplete="name"
            onChange={(e) => setGiven((g) => ({ ...g, name: e.target.value }))}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="booking-phone">
            {t.form.phone}
          </label>
          <input
            id="booking-phone"
            name="guestPhone"
            required
            dir="ltr"
            autoComplete="tel"
            onChange={(e) => setGiven((g) => ({ ...g, phone: e.target.value }))}
            className={field}
          />
        </div>
        {/* How many are actually coming.
            This was a hidden field, carried through only from a search that
            named a number — so a guest who reached the room from the rooms
            list or a link stated nothing, and the booking email reaching the
            front desk read "Guests: —". The desk needs the party size to put
            the right beds in the room, and it is the guest's answer to give,
            not something to infer from the room's maximum.

            The list stops at what the room sleeps, so a party too large for it
            cannot be entered here at all — the server enforces the same limit,
            and this simply means nobody has to be told no after filling the
            form in. */}
        <div>
          <label className={label} htmlFor="booking-guests">
            {t.search.guests}
          </label>
          <select
            id="booking-guests"
            name="guests"
            required
            defaultValue={String(Math.min(guests || 1, room.maxGuests || 1))}
            className={field}
          >
            {Array.from({ length: room.maxGuests || 1 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {formatNumber(n, locale as Locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor="booking-email">
            {t.form.email} <span className="font-normal text-muted-ink">({t.form.optional})</span>
          </label>
          <input
            id="booking-email"
            name="guestEmail"
            type="email"
            dir="ltr"
            autoComplete="email"
            onChange={(e) => setGiven((g) => ({ ...g, email: e.target.value }))}
            className={field}
          />
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

      {/* What the stay is worth in points, said before they commit rather than
          discovered afterwards — and said honestly, including when it pays. */}
      {earns > 0 && (
        <p className="mt-5 text-[0.88rem] text-muted-ink">
          <span className="font-semibold text-brand">
            {t.account.earns} {earns.toLocaleString('en-US')} {t.account.points.toLowerCase()}
          </span>{' '}
          · {t.account.earnLead}
        </p>
      )}
    </form>
  )
}
