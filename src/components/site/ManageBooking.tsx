'use client'

import { useActionState, useState } from 'react'

import type { Dictionary } from '@/i18n/dictionaries'
import {
  cancelBooking,
  findBooking,
  submitReview,
  type LookupResult,
} from '@/actions/manageBooking'
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
export function ManageBooking({
  t,
  reference = '',
}: {
  t: Dictionary
  /**
   * Filled in from ?reference= when the guest arrived from the email asking
   * them to review their stay. It saves them digging the confirmation out of
   * their inbox, and it gives nothing away: the telephone number is still
   * required below, which is the half of the pair that is actually secret.
   */
  reference?: string
}) {
  // Held here rather than read back out of the DOM at render time: the cancel
  // step has to prove the number again, and reaching into the document during
  // render gives an empty string on the server and a stale one after.
  const [phone, setPhone] = useState('')
  const [found, find, finding] = useActionState<LookupResult, FormData>(findBooking, null)
  const [cancelled, cancel, cancelling] = useActionState<LookupResult, FormData>(
    cancelBooking,
    null,
  )
  const [reviewed, review, reviewing] = useActionState<LookupResult, FormData>(submitReview, null)
  const [stars, setStars] = useState(0)

  const state = reviewed ?? cancelled ?? found
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
              defaultValue={reference}
              className={cn(field, 'uppercase')}
              autoFocus={!reference}
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
              : state.message === 'alreadyReviewed'
                ? t.reviews.already
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
          ) : booking.reviewable ? null : (
            <p className="mt-7 text-[0.9rem] text-muted-ink">{t.booking.tooLate}</p>
          )}

          {/* Offered only after they have left, and only once. The stay is
              already proven by the reference and number above, so there is
              nothing further to ask them for beyond the opinion itself. */}
          {state?.status === 'reviewed' ? (
            <p className="mt-7 rounded-xl bg-brand/10 px-4 py-3 text-[0.95rem] text-brand">
              {t.reviews.thanks}
            </p>
          ) : (
            booking.reviewable && (
              <form action={review} className="mt-8 border-t border-line pt-7">
                <input type="hidden" name="reference" value={booking.reference} />
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="rating" value={stars} />

                <h3 className="font-display text-xl text-ink">{t.reviews.leaveTitle}</h3>
                <p className="mt-2 text-[0.9rem] text-muted-ink">{t.reviews.leaveLead}</p>

                <div className="mt-5 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStars(n)}
                      aria-label={`${n}`}
                      aria-pressed={stars === n}
                      className="tap-safe tap-safe-lg p-0.5"
                    >
                      <svg viewBox="0 0 24 24" className="h-7 w-7">
                        <path
                          d="M12 2.5l2.9 6.05 6.6.9-4.8 4.6 1.2 6.55L12 17.5l-5.9 3.1 1.2-6.55-4.8-4.6 6.6-.9z"
                          className={n <= stars ? 'fill-brand' : 'fill-line'}
                        />
                      </svg>
                    </button>
                  ))}
                </div>

                <label className={cn(label, 'mt-6')} htmlFor="mb-comment">
                  {t.form.message}{' '}
                  <span className="font-normal text-muted-ink">({t.form.optional})</span>
                </label>
                <textarea id="mb-comment" name="comment" rows={3} className={field} />

                <button
                  type="submit"
                  disabled={reviewing || stars === 0}
                  className={cn(btnPrimary, 'mt-6 disabled:opacity-40')}
                >
                  {t.reviews.send}
                </button>
                <p className="mt-3 text-[0.78rem] text-muted-ink">{t.reviews.moderated}</p>
              </form>
            )
          )}
        </div>
      )}
    </div>
  )
}
