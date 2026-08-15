import { getPayload } from 'payload'
import config from '../../src/payload.config.ts'

/**
 * The message that asks a guest how their stay was.
 *
 * Three things have to hold, and the third is the one that will break: it is
 * sent when a stay is marked as finished, it is written in the language the
 * guest booked in, and it is sent exactly once however many times staff touch
 * the row afterwards. Marking a booking Stayed, unmarking it and marking it
 * again is an ordinary afternoon in a hotel, and a guest asked three times for
 * a review leaves none.
 */

let failed = 0
const ok = (name, cond, note = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`)
  if (!cond) failed++
}

const payload = await getPayload({ config })

// Captured rather than sent. These suites run against a real database and a
// real Payload, and a test that actually posted mail to a guest would be a
// bug of its own.
const sent = []
payload.sendEmail = async (msg) => {
  sent.push(msg)
  return { messageId: 'captured' }
}

const branch = (await payload.find({ collection: 'branches', limit: 1, locale: 'ar' })).docs[0]
const room = (
  await payload.find({ collection: 'rooms', limit: 1, where: { branch: { equals: branch.id } } })
).docs[0]

const reference = `MF-RV${Math.floor(Math.random() * 9000 + 1000)}`
let booking

try {
  booking = await payload.create({
    collection: 'bookings',
    data: {
      reference,
      guestName: 'لاوەند جميل أحمد',
      guestPhone: '+964 750 111 2222',
      guestEmail: 'guest@example.invalid',
      branch: branch.id,
      room: room.id,
      checkIn: '2026-08-01',
      checkOut: '2026-08-03',
      nights: 2,
      guests: 2,
      totalAmount: 200000,
      currency: 'IQD',
      status: 'confirmed',
      locale: 'ar',
    },
    overrideAccess: true,
  })

  ok('a confirmed booking is not asked for a review', sent.length === 0, `${sent.length} sent`)

  await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: { status: 'completed' },
    overrideAccess: true,
  })
  // The hook is deliberately not awaited by the collection, so the stay can be
  // marked without waiting on a mail server.
  await new Promise((r) => setTimeout(r, 2500))

  ok('marking the stay finished asks for one', sent.length === 1, `${sent.length} sent`)

  const mail = sent[0] ?? {}
  ok('it goes to the guest', mail.to === 'guest@example.invalid', String(mail.to))
  ok('in the language they booked in', /كيف كانت إقامتك/.test(mail.subject ?? ''), mail.subject)
  ok('it carries their reference', (mail.text ?? '').includes(reference))
  // Straight into the lookup with the reference filled in — the guest still
  // has to prove the booking is theirs with the telephone number.
  ok(
    'and links to the form with the reference filled in',
    (mail.text ?? '').includes(`/ar/booking?reference=${reference}`),
  )
  ok('the html is built too, not just the text', (mail.html ?? '').includes('<!doctype html>'))
  // A telephone number dropped raw into Arabic comes out with its + at the
  // wrong end. Every mail on this site isolates them.
  ok(
    'telephone numbers are isolated for right-to-left',
    !/[؀-ۿ]\s*\+\d/.test(mail.html ?? '') && (mail.html ?? '').includes('⁨'),
  )

  const stamped = await payload.findByID({
    collection: 'bookings',
    id: booking.id,
    overrideAccess: true,
  })
  ok('the booking records that it asked', !!stamped.reviewRequestedAt, stamped.reviewRequestedAt)

  // The part that matters: staff toggling the status must not ask again.
  await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: { status: 'confirmed' },
    overrideAccess: true,
  })
  await payload.update({
    collection: 'bookings',
    id: booking.id,
    data: { status: 'completed' },
    overrideAccess: true,
  })
  await new Promise((r) => setTimeout(r, 2000))
  ok('and never asks twice', sent.length === 1, `${sent.length} sent after re-marking Stayed`)

  // A booking with no email address is the normal case here — most guests
  // leave a telephone number and nothing else — and must not raise anything.
  const noEmail = await payload.create({
    collection: 'bookings',
    data: {
      reference: `MF-RN${Math.floor(Math.random() * 9000 + 1000)}`,
      guestName: 'No Email',
      guestPhone: '+964 750 333 4444',
      branch: branch.id,
      room: room.id,
      checkIn: '2026-08-01',
      checkOut: '2026-08-02',
      nights: 1,
      guests: 1,
      totalAmount: 100000,
      currency: 'IQD',
      status: 'completed',
      locale: 'en',
    },
    overrideAccess: true,
  })
  await new Promise((r) => setTimeout(r, 1500))
  ok('a guest who left no email is simply not written to', sent.length === 1, `${sent.length} sent`)
  await payload.delete({ collection: 'bookings', id: noEmail.id, overrideAccess: true })
} finally {
  if (booking) {
    await payload.delete({ collection: 'bookings', id: booking.id, overrideAccess: true }).catch(() => {})
  }
}

console.log(`\n${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
