'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { allow, callerKey } from '@/utilities/throttle'

export type EnquiryState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  /** Field names that failed validation, so the form can mark them. */
  fields?: string[]
}

const text = (value: FormDataEntryValue | null): string =>
  typeof value === 'string' ? value.trim() : ''

/**
 * Takes a reservation enquiry from the website into the admin panel.
 *
 * WhatsApp still converts better here and stays the loudest button on every
 * page — but a form works at three in the morning, works for a guest abroad
 * without the number saved, and leaves a written record of the dates. The two
 * are not alternatives.
 *
 * Runs with `overrideAccess: false`, so the collection's own access rules
 * decide: anyone may create an enquiry, only staff may read one back.
 */
export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  // Honeypot. A real guest never sees this field; automated submitters fill
  // every input they find.
  if (text(formData.get('company'))) {
    return { status: 'success' }
  }

  // The honeypot catches the lazy ones. This catches the rest: every enquiry
  // is a database row and an email to the hotel, so a loop here fills the
  // inbox the front desk actually reads. Answered as success, because telling
  // a submitter it has been throttled is telling it to slow down and continue.
  if (!allow(await callerKey('enquiry'), 6, 10 * 60_000)) {
    return { status: 'success' }
  }

  const name = text(formData.get('name'))
  const phone = text(formData.get('phone'))
  const missing: string[] = []
  if (!name) missing.push('name')
  if (!phone) missing.push('phone')

  if (missing.length > 0) {
    return { status: 'error', message: 'required', fields: missing }
  }

  const guests = Number(text(formData.get('guests')))
  const branchId = Number(text(formData.get('branch')))
  const roomId = Number(text(formData.get('room')))
  const checkIn = text(formData.get('checkIn'))
  const checkOut = text(formData.get('checkOut'))

  try {
    const payload = await getPayload({ config: configPromise })
    await payload.create({
      collection: 'enquiries',
      overrideAccess: false,
      data: {
        name,
        phone,
        email: text(formData.get('email')) || undefined,
        branch: Number.isFinite(branchId) && branchId > 0 ? branchId : undefined,
        room: Number.isFinite(roomId) && roomId > 0 ? roomId : undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests: Number.isFinite(guests) && guests > 0 ? guests : undefined,
        message: text(formData.get('message')) || undefined,
        status: 'new',
      },
    })
    return { status: 'success' }
  } catch {
    // The guest cannot act on a database error, and the WhatsApp button is
    // right there — so say plainly that it did not send and point at it.
    return { status: 'error', message: 'generic' }
  }
}
