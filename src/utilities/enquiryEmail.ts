import type { Payload } from 'payload'

import type { Branch, Enquiry, Room } from '@/payload-types'

import { notifyRecipients } from './notifyEmail'

/**
 * Tells somebody an enquiry has arrived.
 *
 * Until this existed the form worked perfectly and silently: the enquiry was
 * written to the database, the guest was told "we will reply to the number you
 * gave us, usually within the hour", and nobody at the hotel was told anything
 * at all. The promise on the screen was only kept if a member of staff
 * happened to open the admin panel.
 *
 * Three rules, all of them because this runs on the guest's own request:
 *
 *  - It never throws. A failed send must not fail the enquiry — the record is
 *    already saved, and a guest who is shown an error will not send it twice.
 *  - It never blocks. The reply to the guest does not wait on a mail server.
 *  - Where it cannot send, it says so in the log with the enquiry in it, so a
 *    message is recoverable from the deploy log even when mail is misconfigured.
 */

const line = (label: string, value?: string | null) => (value ? `${label}: ${value}\n` : '')

/** Every address that is actually set — the hotel's, the site's, and the env var. */
export const enquiryRecipient = (
  branch: Branch | null,
  groupEmail?: string | null,
): string | null => notifyRecipients(branch?.email, groupEmail, process.env.ENQUIRY_NOTIFY_EMAIL)

export const sendEnquiryEmail = async ({
  payload,
  enquiry,
  branch,
  room,
  groupEmail,
  siteUrl,
}: {
  payload: Payload
  enquiry: Enquiry
  branch: Branch | null
  room: Room | null
  groupEmail?: string | null
  siteUrl?: string | null
}): Promise<void> => {
  const to = enquiryRecipient(branch, groupEmail)

  // The enquiry itself goes in the log either way. If mail is not configured
  // yet, or the send fails, this is the copy that survives.
  const summary =
    line('Name', enquiry.name) +
    line('Phone', enquiry.phone) +
    line('Email', enquiry.email) +
    line('Hotel', branch?.name) +
    line('Room', room?.name) +
    line('Arriving', enquiry.checkIn) +
    line('Leaving', enquiry.checkOut) +
    line('Guests', enquiry.guests ? String(enquiry.guests) : null) +
    line('Message', enquiry.message)

  if (!to) {
    payload.logger.warn(
      `Enquiry ${enquiry.id} has nowhere to be sent — set an email on the hotel, or on Settings, ` +
        `or as ENQUIRY_NOTIFY_EMAIL. The enquiry is saved and is in the admin panel:\n${summary}`,
    )
    return
  }

  const where = branch?.name ? ` — ${branch.name}` : ''
  const link = siteUrl ? `\n\nOpen it: ${siteUrl}/admin/collections/enquiries/${enquiry.id}` : ''

  try {
    await payload.sendEmail({
      to,
      subject: `New enquiry from ${enquiry.name}${where}`,
      text: `${summary}${link}`,
    })
    payload.logger.info(`Enquiry ${enquiry.id} sent to ${to}`)
  } catch (error) {
    // Logged with the enquiry attached, so nothing is lost to a mail outage.
    payload.logger.error(
      `Enquiry ${enquiry.id} could not be emailed to ${to} — ${error}\n${summary}`,
    )
  }
}
