'use client'

import { useActionState, useState } from 'react'

import type { Dictionary } from '@/i18n/dictionaries'
import { cancelBooking, findBooking, type LookupResult } from '@/actions/manageBooking'
import { cn } from '@/utilities/ui'
import { btnOutline, btnPrimary } from './ui'

const field =
  'w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[1rem] text-ink focus:border-brand focus:ring-0 focus:outline-none'
const label = 'block text-[0.72rem] font-semibold text-ink'

/**
 * Look a booking up with its reference and the number it was made on, and
 * cancel it if it has not started.
 *
 * The reference alone would do for finding it, and would also do for anyone
 * else — they are six characters, meant to be read down a phone line. The
 * phone number is the second thing, and the two are not discoverable from each
 * other.
 */
export function ManageBooking({ t }: { t: Dictionary }) {
  // Held here rather than read back out of the DOM at render time: the cancel
  // step has to prove the number again, and reaching into the document during
  // render gives an empty string on the server and a stale one after.
  const [phone, setPhone] = useState('')
  const [found, find, finding] = useActionState<LookupResult, FormData>(findBooking, null)
  const [cancelled, cancel, cancelling] = useActionState<LookupResult, FormData>(
    cancelBooking,
    null,
  )

  const state = cancelled ?? found
  const booking = state && 'booking' in state ? state.booking : null

  return (
    <div className="mx-auto max-w-xl">
      <form action={find} className="rounded-2xl border border-line bg-card p-7 sm:p-9">
        <div className="grid gap-6">
          <div>
            <label className={label} htmlFor="mb-ref">
              {t.booking.yourReference}
            </label>
            <input
              id="mb-ref"
              name="reference"
              required
              dir="ltr"
              placeholder="MF-XXXXXX"
              className={cn(field, 'uppercase')}
            />
          </div>
          <div>
            <label className={label} htmlFor="mb-phone">
              {t.form.phone}
            </label>
            <input
              id="mb-phone"
              name="phone"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={field}
            />
          </div>
        </div>
        <button type="submit" disabled={finding} className={cn(btnPrimary, 'mt-8 w-full')}>
          {t.booking.findIt}
        </button>
      </form>

      {state?.status === 'error' && (
        <p role="alert" className="mt-6 rounded-xl bg-line/60 px-4 py-3 text-[0.95rem] text-ink">
          {state.message === 'notFound'
            ? t.booking.notFound
            : state.message === 'tooMany'
              ? t.booking.tooMany
              : state.message === 'tooLate'
                ? t.booking.tooLate
                : state.message === 'required'
                  ? t.form.errorRequired
                  : t.booking.errorGeneric}
        </p>
      )}

      {booking && (
        <div className="mt-8 rounded-2xl border border-line bg-card p-7 sm:p-9">
          <p className="font-display text-2xl tracking-wide text-brand" dir="ltr">
            {booking.reference}
          </p>
          <dl className="mt-6 grid gap-3 text-[0.95rem]">
            <div className="flex justify-between gap-6">
              <dt className="text-muted-ink">{booking.hotel}</dt>
              <dd className="text-ink">{booking.room}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-ink">{booking.guestName}</dt>
              <dd className="text-ink" dir="ltr">
                {booking.checkIn} → {booking.checkOut}
              </dd>
            </div>
          </dl>

          {state?.status === 'cancelled' ? (
            <p className="mt-7 rounded-xl bg-brand/10 px-4 py-3 text-[0.95rem] text-brand">
              {t.booking.cancelled}
            </p>
          ) : booking.cancellable ? (
            <form action={cancel} className="mt-7">
              <input type="hidden" name="reference" value={booking.reference} />
              {/* Carried through so the second step proves itself again rather
                  than trusting that the first step happened. */}
              <input type="hidden" name="phone" value={phone} />
              <p className="mb-4 text-[0.85rem] text-muted-ink">{t.booking.confirmCancel}</p>
              <button type="submit" disabled={cancelling} className={btnOutline}>
                {t.booking.cancel}
              </button>
            </form>
          ) : (
            <p className="mt-7 text-[0.9rem] text-muted-ink">{t.booking.tooLate}</p>
          )}
        </div>
      )}
    </div>
  )
}
