'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  CapacityError,
  createBooking,
  InvalidDatesError,
  NoAvailabilityError,
} from '@/utilities/booking'
import { currentGuest } from '@/actions/account'
import { sendBookingEmails } from '@/utilities/bookingEmail'

export type BookingResult =
  | { status: 'success'; reference: string }
  | {
      status: 'error'
      message: 'gone' | 'generic' | 'required' | 'dates' | 'guests'
      fields?: string[]
    }

const text = (value: FormDataEntryValue | null): string =>
  typeof value === 'string' ? value.trim() : ''

/**
 * Takes a booking from the confirmation form.
 *
 * Everything that decides whether the room can be had lives in `createBooking`
 * — this only reads the form, calls it, and turns a refusal into something a
 * guest can act on. The two are kept apart deliberately: the rule that stops a
 * room being sold twice must not be reachable from anywhere that could forget
 * to apply it.
 */
export async function submitBooking(
  _previous: BookingResult | null,
  formData: FormData,
): Promise<BookingResult> {
  const guestName = text(formData.get('guestName'))
  const guestPhone = text(formData.get('guestPhone'))

  const missing: string[] = []
  if (!guestName) missing.push('guestName')
  if (!guestPhone) missing.push('guestPhone')
  if (missing.length > 0) return { status: 'error', message: 'required', fields: missing }

  const roomId = Number(text(formData.get('room')))
  const branchId = Number(text(formData.get('branch')))
  const checkIn = new Date(`${text(formData.get('checkIn'))}T00:00:00Z`)
  const checkOut = new Date(`${text(formData.get('checkOut'))}T00:00:00Z`)
  const guests = Number(text(formData.get('guests')))
  const totalAmount = Number(text(formData.get('totalAmount')))
  const currency = text(formData.get('currency')) === 'USD' ? 'USD' : 'IQD'
  // The language the form was filled in. Carried so the confirmation can be
  // written in it rather than in English by default.
  const submitted = text(formData.get('locale'))
  const locale = submitted === 'ku' || submitted === 'ar' ? submitted : 'en'

  if (!Number.isFinite(roomId) || !Number.isFinite(branchId)) {
    return { status: 'error', message: 'generic' }
  }
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return { status: 'error', message: 'generic' }
  }

  try {
    const payload = await getPayload({ config: configPromise })

    // Booked while signed in? Then it is theirs, and it will earn points when
    // they have stayed. Signed out is the ordinary case and stays first-class.
    const guest = await currentGuest()

    const booking = await createBooking(payload, {
      roomId,
      branchId,
      checkIn,
      checkOut,
      guestName,
      guestPhone,
      guestEmail: text(formData.get('guestEmail')) || null,
      guests: Number.isFinite(guests) && guests > 0 ? guests : null,
      totalAmount: Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : null,
      currency,
      notes: text(formData.get('notes')) || null,
      guestId: guest ? Number(guest.id) : null,
      idempotencyKey: text(formData.get('idempotencyKey')) || null,
      locale,
    })

    // Not awaited: the room is already held by the time this runs, and a guest
    // staring at a spinner while a mail server thinks about it is the worst
    // possible moment to be slow.
    void sendBookingEmails(payload, booking.reference).catch(() => {})

    return { status: 'success', reference: booking.reference }
  } catch (error) {
    // The one refusal a guest can do something about: the room went while they
    // were typing. Everything else is ours, not theirs.
    if (error instanceof NoAvailabilityError) return { status: 'error', message: 'gone' }
    // A form left open overnight comes back with yesterday in it; a typed URL
    // can carry anything. Both are worth explaining rather than shrugging at.
    if (error instanceof InvalidDatesError) return { status: 'error', message: 'dates' }
    if (error instanceof CapacityError) return { status: 'error', message: 'guests' }
    return { status: 'error', message: 'generic' }
  }
}
