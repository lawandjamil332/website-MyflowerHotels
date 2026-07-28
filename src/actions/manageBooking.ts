'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { sendCancellationEmails } from '@/utilities/bookingEmail'
import { allow, callerKey } from '@/utilities/throttle'

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
}

export type LookupResult =
  | { status: 'found'; booking: FoundBooking }
  | { status: 'cancelled'; booking: FoundBooking }
  | { status: 'error'; message: 'notFound' | 'required' | 'tooLate' | 'generic' | 'tooMany' }
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

const shape = (booking: any): FoundBooking => {
  const checkIn = day(booking.checkIn)
  const today = new Date().toISOString().slice(0, 10)
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
    return { status: 'found', booking: shape(found.booking) }
  } catch {
    return { status: 'error', message: 'generic' }
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

    return { status: 'cancelled', booking: { ...current, status: 'cancelled', cancellable: false } }
  } catch {
    return { status: 'error', message: 'generic' }
  }
}
