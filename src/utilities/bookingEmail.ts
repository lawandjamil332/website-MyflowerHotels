import type { Payload } from 'payload'

import { notifyRecipients } from './notifyEmail'

/**
 * Tells the hotel, and the guest, that a room has been booked.
 *
 * Two messages with different jobs. The hotel's is a work order — who, which
 * room, which nights — and goes to whoever answers that hotel. The guest's is a
 * receipt, and its only real content is the reference: it is what they will
 * read out at the desk, and the thing they will look for in their inbox at
 * midnight when they cannot remember whether the booking went through.
 *
 * The guest's copy is skipped when they gave no email, which is most of them:
 * the form asks for a phone number and treats email as optional, because a
 * booking should never be lost over an address somebody does not want to type.
 *
 * Nothing here throws. The booking exists; a mail failure must not suggest
 * otherwise, and the log keeps a copy either way.
 */
const day = (value?: string | null) => (value ? String(value).slice(0, 10) : '—')

/**
 * Everything both messages need, gathered once.
 *
 * Returns null when the booking has gone, which is not an error worth raising:
 * both callers run detached from the request that caused them.
 */
const gather = async (payload: Payload, reference: string) => {
  const { docs } = await payload.find({
    collection: 'bookings',
    where: { reference: { equals: reference } },
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })

  const booking = docs[0]
  if (!booking) return null

  const branch = typeof booking.branch === 'object' ? booking.branch : null
  const room = typeof booking.room === 'object' ? booking.room : null
  const settings = (await payload.findGlobal({ slug: 'settings', depth: 0 })) as {
    email?: string | null
    siteName?: string | null
  }

  const stay =
    `Reference: ${booking.reference}\n` +
    `Guest: ${booking.guestName}\n` +
    `Phone: ${booking.guestPhone}\n` +
    (booking.guestEmail ? `Email: ${booking.guestEmail}\n` : '') +
    `Hotel: ${branch?.name ?? '—'}\n` +
    `Room: ${room?.name ?? '—'}\n` +
    `Arriving: ${day(booking.checkIn)}\n` +
    `Leaving: ${day(booking.checkOut)}\n` +
    `Nights: ${booking.nights ?? '—'}\n` +
    `Guests: ${booking.guests ?? '—'}\n` +
    (booking.totalAmount ? `Quoted: ${booking.totalAmount} ${booking.currency}\n` : '') +
    (booking.notes ? `Notes: ${booking.notes}\n` : '')

  // Every address that is actually set, not just the first one found — see
  // notifyRecipients for why "first found wins" was the wrong rule here.
  const hotelInbox = notifyRecipients(
    branch?.email,
    settings?.email,
    process.env.ENQUIRY_NOTIFY_EMAIL,
  )

  return { booking, branch, room, settings, stay, hotelInbox }
}

export const sendBookingEmails = async (payload: Payload, reference: string): Promise<void> => {
  try {
    const gathered = await gather(payload, reference)
    if (!gathered) return
    const { booking, branch, settings, stay, hotelInbox } = gathered

    if (!hotelInbox) {
      payload.logger.warn(
        `Booking ${booking.reference} has nowhere to be sent — set an email on the hotel, on ` +
          `Settings, or as ENQUIRY_NOTIFY_EMAIL. The booking is made and is in the admin panel:\n${stay}`,
      )
    } else {
      try {
        await payload.sendEmail({
          to: hotelInbox,
          subject: `Booking ${booking.reference} — ${branch?.name ?? ''} — ${day(booking.checkIn)}`,
          text: stay,
        })
        payload.logger.info(`Booking ${booking.reference} sent to ${hotelInbox}`)
      } catch (error) {
        payload.logger.error(
          `Booking ${booking.reference} could not be emailed — ${error}\n${stay}`,
        )
      }
    }

    if (booking.guestEmail) {
      try {
        await payload.sendEmail({
          to: booking.guestEmail,
          subject: `Your booking at ${branch?.name ?? settings?.siteName ?? 'My Flower Hotels'} — ${booking.reference}`,
          text:
            `Thank you — your room is booked.\n\n${stay}\n` +
            `You pay at the hotel when you arrive. Quote ${booking.reference} at the desk.\n` +
            (branch?.phone ? `\nAny questions: ${branch.phone}\n` : ''),
        })
      } catch (error) {
        // The hotel has it; failing to send the guest their copy is not worth
        // an error anybody has to act on.
        payload.logger.warn(`Booking ${booking.reference}: guest copy not sent — ${error}`)
      }
    }
  } catch (error) {
    payload.logger.error(`Booking ${reference}: could not be announced — ${error}`)
  }
}

/**
 * The other half of the same job: telling both sides a room has been given up.
 *
 * A cancellation that only the database knows about is worse than no
 * cancellation at all. The website puts the room straight back on sale, while
 * the front desk still has the guest written in the book — so the same night
 * can be promised to two people, and neither of them did anything wrong.
 *
 * The guest's copy exists for a smaller but sharper reason: cancelling is the
 * one thing on this site that cannot be undone, and a written record of it is
 * what settles an argument at the desk three weeks later.
 */
export const sendCancellationEmails = async (
  payload: Payload,
  reference: string,
): Promise<void> => {
  try {
    const gathered = await gather(payload, reference)
    if (!gathered) return
    const { booking, branch, settings, stay, hotelInbox } = gathered

    const notice = `This booking has been cancelled by the guest on the website.\n\n${stay}`

    if (!hotelInbox) {
      payload.logger.warn(`Booking ${booking.reference} cancelled, nowhere to send it:\n${notice}`)
    } else {
      try {
        await payload.sendEmail({
          to: hotelInbox,
          subject: `CANCELLED — ${booking.reference} — ${branch?.name ?? ''} — ${day(booking.checkIn)}`,
          text: notice,
        })
        payload.logger.info(`Cancellation ${booking.reference} sent to ${hotelInbox}`)
      } catch (error) {
        payload.logger.error(`Cancellation ${booking.reference} not emailed — ${error}\n${notice}`)
      }
    }

    if (booking.guestEmail) {
      try {
        await payload.sendEmail({
          to: booking.guestEmail,
          subject: `Cancelled — ${booking.reference} — ${branch?.name ?? settings?.siteName ?? 'My Flower Hotels'}`,
          text:
            `Your booking has been cancelled. There is nothing to pay.\n\n${stay}\n` +
            (branch?.phone ? `If this was not you, call us: ${branch.phone}\n` : ''),
        })
      } catch (error) {
        payload.logger.warn(`Cancellation ${booking.reference}: guest copy not sent — ${error}`)
      }
    }
  } catch (error) {
    payload.logger.error(`Booking ${reference}: cancellation could not be announced — ${error}`)
  }
}
