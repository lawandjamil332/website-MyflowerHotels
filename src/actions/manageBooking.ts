'use server'

import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { sendCancellationEmails } from '@/utilities/bookingEmail'
import { reportBookingEvent } from '@/utilities/analyticsServer'
import { allow, callerKey } from '@/utilities/throttle'
import { currentGuest } from './account'
import { awardPointsForBooking } from '@/utilities/points'
import { dbPool } from '@/utilities/db'

export type FoundBooking = {
  reference: string
  guestName: string
  hotel: string
  room: string
  checkIn: string
  checkOut: string
  nights: number | null
  status: string
  cancellable: boolean
  /** A finished stay with nothing said about it yet. */
  reviewable: boolean
  branchId: number | null
  bookingId: number
}

export type LookupResult =
  | { status: 'found'; booking: FoundBooking }
  | { status: 'cancelled'; booking: FoundBooking }
  | { status: 'reviewed'; booking: FoundBooking }
  | {
      status: 'error'
      message: 'notFound' | 'required' | 'tooLate' | 'generic' | 'tooMany' | 'alreadyReviewed'
    }
  | null

const text = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '')

/**
 * Finding and cancelling a booking made without an account.
 *
 * Most bookings are made without one — that is the point of not demanding a
 * password — so without this the majority of guests have a reference and no way
 * to use it, and every change has to go through somebody answering a phone.
 *
 * A reference alone is not enough to open a booking. References are short so
 * they can be read down a phone line, which also means they can be guessed, and
 * a booking carries a name and a phone number. So the phone number has to match
 * as well: two things, neither of which is discoverable from the other.
 *
 * A wrong reference and a wrong phone give the same answer, for the same reason
 * a wrong password and an unknown email do.
 */

/** Compares the last nine digits, so +964 750 111 2222 and 07501112222 match. */
const samePhone = (a: string, b: string): boolean => {
  const digits = (v: string) => v.replace(/\D/g, '').slice(-9)
  const left = digits(a)
  return left.length >= 6 && left === digits(b)
}

const day = (v?: string | null) => (v ? String(v).slice(0, 10) : '')

const shape = (booking: any, reviewed = false): FoundBooking => {
  const checkIn = day(booking.checkIn)
  const today = new Date().toISOString().slice(0, 10)
  const branch = typeof booking.branch === 'object' ? booking.branch : null
  return {
    reference: booking.reference,
    guestName: booking.guestName,
    hotel: typeof booking.branch === 'object' ? (booking.branch?.name ?? '—') : '—',
    room: typeof booking.room === 'object' ? (booking.room?.name ?? '—') : '—',
    checkIn,
    checkOut: day(booking.checkOut),
    nights: booking.nights ?? null,
    status: booking.status,
    // A stay already under way is the front desk's business, not a web form's.
    cancellable: ['held', 'confirmed'].includes(booking.status) && checkIn > today,
    // Only after they have actually left, and only once. Asking someone to
    // review a stay they have not had yet is how review sections fill up with
    // opinions about a website.
    reviewable:
      !reviewed && !['cancelled'].includes(booking.status) && day(booking.checkOut) <= today,
    branchId: branch?.id ?? null,
    bookingId: Number(booking.id),
  }
}

const load = async (reference: string, phone: string) => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'bookings',
    where: { reference: { equals: reference.trim().toUpperCase() } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  const booking = docs[0]
  if (!booking || !samePhone(phone, booking.guestPhone ?? '')) return null
  return { payload, booking }
}

/** One review per stay. The database enforces it too; this is so the form knows. */
const alreadyReviewed = async (payload: any, bookingId: number): Promise<boolean> => {
  try {
    const { totalDocs } = await payload.count({
      collection: 'reviews',
      where: { booking: { equals: bookingId } },
    })
    return totalDocs > 0
  } catch {
    return false
  }
}

/**
 * Twenty tries in ten minutes, which no guest reading their own confirmation
 * will ever reach and which turns a reference-guessing run into something that
 * would take longer than the hotel will stand.
 */
const guard = async (): Promise<boolean> => allow(await callerKey('lookup'), 20, 10 * 60 * 1000)

export async function findBooking(_prev: LookupResult, formData: FormData): Promise<LookupResult> {
  const reference = text(formData.get('reference'))
  const phone = text(formData.get('phone'))
  if (!reference || !phone) return { status: 'error', message: 'required' }
  if (!(await guard())) return { status: 'error', message: 'tooMany' }

  try {
    const found = await load(reference, phone)
    if (!found) return { status: 'error', message: 'notFound' }
    // Signed in? Then this stay joins their account.
    //
    // This is the safe half of what signing up used to do on its own. Claiming
    // a booking off a phone number alone let anyone who knew the number take
    // the stay; here the guest has just produced the reference from their own
    // confirmation as well, which is the proof that was missing. Same benefit —
    // a returning guest's history is waiting for them — without the hole.
    await attachToAccount(found.payload, found.booking)
    return {
      status: 'found',
      booking: shape(found.booking, await alreadyReviewed(found.payload, Number(found.booking.id))),
    }
  } catch {
    return { status: 'error', message: 'generic' }
  }
}

/**
 * Puts a booking the guest has just proved they hold onto their account.
 *
 * Only ever a booking with no owner: one already attached to somebody cannot be
 * moved, whatever anybody produces. Failures are swallowed on purpose — finding
 * a booking must never break because filing it did.
 */
const attachToAccount = async (
  payload: Payload,
  booking: { id: number | string; guest?: unknown; status?: string | null },
): Promise<void> => {
  try {
    if (booking.guest) return
    const guest = await currentGuest()
    if (!guest?.id) return
    const { rowCount } = await dbPool(payload).query(
      `UPDATE bookings SET guest_id = $1 WHERE id = $2 AND guest_id IS NULL`,
      [Number(guest.id), Number(booking.id)],
    )
    if (rowCount && booking.status === 'completed') {
      await awardPointsForBooking(payload, Number(booking.id)).catch(() => {})
    }
  } catch {
    // Nothing a guest looking for their booking should ever see.
  }
}

export async function cancelBooking(
  _prev: LookupResult,
  formData: FormData,
): Promise<LookupResult> {
  const reference = text(formData.get('reference'))
  const phone = text(formData.get('phone'))
  if (!reference || !phone) return { status: 'error', message: 'required' }
  if (!(await guard())) return { status: 'error', message: 'tooMany' }

  try {
    const found = await load(reference, phone)
    if (!found) return { status: 'error', message: 'notFound' }

    const current = shape(found.booking)
    if (!current.cancellable) return { status: 'error', message: 'tooLate' }

    // Cancelling puts the room straight back into stock: only held, confirmed
    // and completed count against availability, so nothing else has to happen
    // and there is no second place for the two to disagree.
    await found.payload.update({
      collection: 'bookings',
      id: found.booking.id,
      data: { status: 'cancelled' },
      overrideAccess: true,
    })

    // The hotel has to hear about this. A room that quietly returns to stock
    // while the front desk still has the guest written down is how a cancelled
    // booking turns into a room sold twice on paper.
    void sendCancellationEmails(found.payload, current.reference).catch(() => {})

    // Reported too, or the figures only ever climb.
    //
    // Bookings are counted as they are made and nothing would ever take one
    // back, so a month where half of them cancelled would read exactly like a
    // month where none did — and the site would be judged on a number that
    // cannot go down. The value is sent as a negative so the two cancel out
    // where they are added up.
    //
    // No client id: a cancellation is usually made days later, often on a
    // different device, and guessing at which browser it was would attach it
    // to the wrong visit. It stands on its own, as the fact it is.
    const cancelled = found.booking
    const refunded = Number(cancelled.totalAmount) || 0
    void reportBookingEvent(found.payload, 'booking_cancelled', null, {
      // "—" is what `shape` puts in when the relationship did not come back;
      // it reads as a hotel called "—" in a report, so it is dropped.
      hotel: current.hotel === '—' ? null : current.hotel,
      room: current.room === '—' ? null : current.room,
      nights: current.nights,
      guests: Number(cancelled.guests) || null,
      value: refunded > 0 ? -refunded : null,
      currency: cancelled.currency ?? null,
    }).catch(() => {})

    return { status: 'cancelled', booking: { ...current, status: 'cancelled', cancellable: false } }
  } catch {
    return { status: 'error', message: 'generic' }
  }
}

/**
 * A review, left by somebody who can prove they stayed.
 *
 * The proof is the same pair that opens the booking — a reference and the
 * number it was made on — so this needs no new way in and no account. It is
 * also the whole value of the thing: a review section anybody can post to is
 * worth nothing to a guest reading it, and the hotels this group is competing
 * against are trusted precisely because their reviews are attached to stays.
 *
 * Three conditions, all checked here rather than in the form: the stay must
 * exist, must have finished, and must not already have been reviewed. The form
 * hides the option when they are not met, but a hidden form field is a
 * suggestion, not a rule.
 *
 * Arrives unapproved. Nothing reaches the website, or the average, until the
 * owner has read it.
 */
export async function submitReview(_prev: LookupResult, formData: FormData): Promise<LookupResult> {
  const reference = text(formData.get('reference'))
  const phone = text(formData.get('phone'))
  const rating = Number(text(formData.get('rating')))
  const comment = text(formData.get('comment'))

  if (!reference || !phone) return { status: 'error', message: 'required' }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { status: 'error', message: 'required' }
  }
  if (!(await guard())) return { status: 'error', message: 'tooMany' }

  try {
    const found = await load(reference, phone)
    if (!found) return { status: 'error', message: 'notFound' }

    const current = shape(
      found.booking,
      await alreadyReviewed(found.payload, Number(found.booking.id)),
    )
    if (!current.reviewable) {
      return { status: 'error', message: 'alreadyReviewed' }
    }
    // A review has to belong to a hotel — it is what the average is grouped by
    // and what the page reads. A booking with no branch cannot produce one.
    if (!current.branchId) return { status: 'error', message: 'generic' }

    await found.payload.create({
      collection: 'reviews',
      data: {
        guestName: current.guestName,
        rating: Math.round(rating),
        comment: comment || undefined,
        branch: current.branchId,
        booking: current.bookingId,
        stayedOn: found.booking.checkOut ?? undefined,
        // Set here and nowhere else. It is the only claim on a review that
        // cannot be typed by a person, which is what makes it worth showing.
        verified: true,
        approved: false,
      },
      overrideAccess: true,
    })

    return { status: 'reviewed', booking: { ...current, reviewable: false } }
  } catch (error) {
    // The unique index catches a second review that raced the check above.
    if ((error as { code?: string })?.code === '23505') {
      return { status: 'error', message: 'alreadyReviewed' }
    }
    return { status: 'error', message: 'generic' }
  }
}
