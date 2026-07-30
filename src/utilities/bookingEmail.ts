import type { Payload } from 'payload'

import { diagnoseMailNetwork } from './mailNetworkDiagnosis'
import { notifyRecipients } from './notifyEmail'
import { getDictionary } from '@/i18n/dictionaries'
import { isLocale, type Locale } from '@/i18n/config'
import { formatDateLong, formatNumber, formatPrice } from './format'
import { getServerSideURL } from './getURL'
import { mediaUrl } from './media'
import { toMapsHref, toWhatsAppHref } from './contact'
import {
  button,
  emailShell,
  esc,
  iso,
  noticeBand,
  panel,
  para,
  referenceBlock,
  row,
  rule,
  stayDates,
  type Dir,
} from './emailLayout'

/**
 * Tells the hotel, and the guest, that a room has been booked.
 *
 * Two messages with different jobs. The hotel's is a work order — who, which
 * room, which nights — and goes to whoever answers that hotel. The guest's is
 * the document they will keep: the reference they read out at the desk, the
 * dates they will check twice, and the two facts that make booking direct
 * worth doing — nothing charged, cancel free.
 *
 * Both were nine lines of plain text, which is a receipt from a cash machine
 * rather than a confirmation from a hotel. They are written as proper
 * documents now, in the language the guest booked in, right-to-left where that
 * is the language.
 *
 * The guest's copy is skipped when they gave no email, which is most of them:
 * the form asks for a phone number and treats email as optional, because a
 * booking should never be lost over an address somebody does not want to type.
 *
 * Nothing here throws. The booking exists; a mail failure must not suggest
 * otherwise, and the log keeps a full copy either way.
 */

const dirOf = (locale: Locale): Dir => (locale === 'en' ? 'ltr' : 'rtl')

const fill = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), template)

/**
 * Everything both messages need, gathered once.
 *
 * depth 2 rather than 1: the hotel's photograph lives one relationship further
 * down than the hotel, and at depth 1 it arrives as a bare id — which is how
 * an email with a picture in it ends up with no picture in it.
 */
const gather = async (payload: Payload, reference: string) => {
  const { docs } = await payload.find({
    collection: 'bookings',
    where: { reference: { equals: reference } },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  })

  const booking = docs[0]
  if (!booking) return null

  const locale: Locale = isLocale(booking.locale ?? '') ? (booking.locale as Locale) : 'en'
  const t = getDictionary(locale)
  const dir = dirOf(locale)

  // Re-read the hotel and room in the guest's language, so a Kurdish
  // confirmation does not name an English room.
  const branchId = typeof booking.branch === 'object' ? booking.branch?.id : booking.branch
  const roomId = typeof booking.room === 'object' ? booking.room?.id : booking.room

  const [branch, room, settings] = await Promise.all([
    branchId
      ? payload
          .findByID({ collection: 'branches', id: branchId, locale, depth: 1, overrideAccess: true })
          .catch(() => null)
      : null,
    roomId
      ? payload
          .findByID({ collection: 'rooms', id: roomId, locale, depth: 0, overrideAccess: true })
          .catch(() => null)
      : null,
    payload.findGlobal({ slug: 'settings', locale, depth: 1 }) as Promise<{
      email?: string | null
      siteName?: string | null
      whatsapp?: string | null
      phone?: string | null
    }>,
  ])

  const base = getServerSideURL()
  const siteName = settings?.siteName || 'My Flower Hotels'

  const arriving = formatDateLong(booking.checkIn, locale)
  const leaving = formatDateLong(booking.checkOut, locale)
  const nights = formatNumber(Number(booking.nights) || null, locale)
  const guests = formatNumber(Number(booking.guests) || null, locale)
  const quoted = formatPrice(Number(booking.totalAmount) || null, booking.currency, locale)
  const rate = formatPrice(Number(room?.priceFrom) || null, booking.currency, locale)

  // The day the free cancellation actually runs out, rather than the phrase
  // "before the day you arrive" and an invitation to work it out. Written from
  // the booking's own arrival date, so it cannot drift from the policy.
  const deadline = new Date(booking.checkIn)
  deadline.setUTCDate(deadline.getUTCDate() - 1)
  const cancelBy = formatDateLong(deadline, locale)

  // An all-day event in whatever calendar the guest uses. A link rather than
  // an attached .ics file: attachments are stripped by some providers and
  // ignored on most phones, and this needs no download to work.
  const stamp = (value: string | Date) =>
    new Date(value).toISOString().slice(0, 10).replace(/-/g, '')
  const calendarUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(`${branch?.name ?? siteName} — ${booking.reference}`)}` +
    `&dates=${stamp(booking.checkIn)}/${stamp(booking.checkOut)}` +
    `&details=${encodeURIComponent(`${t.email.refLabel}: ${booking.reference}`)}` +
    `&location=${encodeURIComponent(branch?.address ?? '')}`

  // The plain-text twin. Every client can read it, it is what lands in the log
  // when a send fails, and a message with no text alternative is more likely to
  // be filed as spam.
  const plain =
    `${t.email.refLabel}: ${booking.reference}\n` +
    `${t.email.lName}: ${booking.guestName}\n` +
    `${t.email.lPhone}: ${booking.guestPhone}\n` +
    (booking.guestEmail ? `${t.email.lEmail}: ${booking.guestEmail}\n` : '') +
    `${t.email.lHotel}: ${branch?.name ?? '—'}\n` +
    `${t.email.lRoom}: ${room?.name ?? '—'}\n` +
    `${t.email.lArriving}: ${arriving}\n` +
    `${t.email.lLeaving}: ${leaving}\n` +
    `${t.email.lNights}: ${nights || '—'}\n` +
    `${t.email.lGuests}: ${guests || '—'}\n` +
    (quoted ? `${t.email.lQuoted}: ${quoted}\n` : '') +
    (booking.notes ? `${t.email.lNotes}: ${booking.notes}\n` : '')

  const hotelInbox = notifyRecipients(
    branch?.email,
    settings?.email,
    process.env.ENQUIRY_NOTIFY_EMAIL,
  )

  // "large" is not generated for every photograph — Payload only makes the
  // sizes that are smaller than the original, and these are portrait shots
  // about 1100px wide. Asking for it fell through to the original: a
  // 1100x1471 portrait dropped into a 600px-wide letter, which is the tall
  // empty column that appeared instead of a picture.
  //
  // "og" is the one size always produced and the only one shaped like a
  // header — 1200x630, landscape, about 50KB. The rest are a ladder down for
  // an image too small even for that.
  const heroPath =
    mediaUrl(branch?.heroImage, 'og') ||
    mediaUrl(branch?.heroImage, 'medium') ||
    mediaUrl(branch?.heroImage, 'small') ||
    mediaUrl(branch?.heroImage)
  const heroUrl = heroPath ? (/^https?:\/\//.test(heroPath) ? heroPath : `${base}${heroPath}`) : null

  return {
    booking,
    branch,
    room,
    settings,
    siteName,
    locale,
    t,
    dir,
    base,
    arriving,
    leaving,
    nights,
    guests,
    quoted,
    rate,
    cancelBy,
    calendarUrl,
    plain,
    hotelInbox,
    heroUrl,
  }
}

type Gathered = NonNullable<Awaited<ReturnType<typeof gather>>>

/** Arrival and departure, as the block a guest re-opens the message for. */
const datesBlock = (g: Gathered) => {
  const { t, dir, branch } = g
  const arrivalNote = branch?.checkInAnyTime
    ? esc(t.email.checkInAny)
    : branch?.checkInTime
      ? `${t.email.lCheckIn} ${esc(branch.checkInTime)}`
      : null
  return stayDates(
    dir,
    {
      label: t.email.lArriving,
      date: iso(g.arriving),
      note: arrivalNote,
    },
    {
      label: t.email.lLeaving,
      date: iso(g.leaving),
      note: branch?.checkOutTime ? `${t.email.lCheckOut} ${esc(branch.checkOutTime)}` : null,
    },
    g.nights ? fill(t.email.lStayLength, { count: g.nights }) : null,
  )
}

/** What was booked, and what it comes to. */
const stayPanel = (g: Gathered) => {
  const { t, dir } = g
  return panel(
    t.email.stayTitle,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${row(t.email.lHotel, iso(g.branch?.name ?? '—'), dir, { strong: true })}
      ${row(t.email.lRoom, iso(g.room?.name ?? '—'), dir, { strong: true })}
      ${g.guests ? row(t.email.lGuests, esc(g.guests), dir) : ''}
      ${g.rate ? row(t.email.lRate, iso(g.rate), dir) : ''}
      ${g.quoted ? row(t.email.lTotal, `${iso(g.quoted)} <span style="color:#8a8378;">· ${esc(t.email.payAtHotel)}</span>`, dir, { strong: true }) : ''}
      ${g.booking.notes ? row(t.email.lNotes, iso(g.booking.notes), dir) : ''}
    </table>`,
    dir,
  )
}

/** Where the hotel is and how to reach it — the guest's copy only. */
const hotelPanel = (g: Gathered) => {
  const { t, dir, branch } = g
  if (!branch) return ''
  return panel(
    t.email.hotelTitle,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${branch.address ? row(t.email.lAddress, iso(branch.address).replace(/\n/g, '<br>'), dir) : ''}
      ${branch.phone ? row(t.email.lPhone, `<a href="tel:${esc(branch.phone.replace(/\s/g, ''))}" style="color:#0f2f4a;text-decoration:none;" dir="ltr">${esc(branch.phone)}</a>`, dir) : ''}
    </table>`,
    dir,
  )
}

/** Who booked it — the hotel's copy only. */
const guestPanel = (g: Gathered) => {
  const { t, dir, booking } = g
  const langName = { en: 'English', ku: 'Kurdish', ar: 'Arabic' }[g.locale]
  return panel(
    t.email.guestTitle,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${row(t.email.lName, iso(booking.guestName), dir, { strong: true })}
      ${row(t.email.lPhone, `<a href="tel:${esc(booking.guestPhone.replace(/\s/g, ''))}" style="color:#0f2f4a;text-decoration:none;" dir="ltr">${esc(booking.guestPhone)}</a>`, dir, { strong: true })}
      ${booking.guestEmail ? row(t.email.lEmail, `<a href="mailto:${esc(booking.guestEmail)}" style="color:#0f2f4a;text-decoration:none;" dir="ltr">${esc(booking.guestEmail)}</a>`, dir) : ''}
      ${row(t.email.lLanguage, esc(langName), dir)}
    </table>`,
    dir,
  )
}

const send = async (
  payload: Payload,
  reference: string,
  to: string,
  subject: string,
  html: string,
  text: string,
  { critical }: { critical: boolean },
) => {
  try {
    await payload.sendEmail({ to, subject, html, text })
    payload.logger.info(`Booking ${reference} → ${to}`)
  } catch (error) {
    if (critical) {
      // The measurement goes in the same line as the failure, because that is
      // the line somebody is already reading when they want to know why.
      payload.logger.error(
        `Booking ${reference} could not be emailed to ${to} — ${error}` +
          `${await diagnoseMailNetwork()}\n${text}`,
      )
    } else {
      payload.logger.warn(`Booking ${reference}: copy to ${to} not sent — ${error}`)
    }
  }
}

export const sendBookingEmails = async (payload: Payload, reference: string): Promise<void> => {
  try {
    const g = await gather(payload, reference)
    if (!g) return
    const { booking, branch, t, dir, base, locale, siteName, plain, hotelInbox } = g

    const manageUrl = `${base}/${locale}/booking`
    const maps = toMapsHref(branch?.googleMapsUrl, branch?.latitude, branch?.longitude)
    const wa = toWhatsAppHref(branch?.whatsapp, `${booking.reference}`)

    // ---- the hotel's work order ----
    if (!hotelInbox) {
      payload.logger.warn(
        `Booking ${booking.reference} has nowhere to be sent — set an email on the hotel, on ` +
          `Settings, or as ENQUIRY_NOTIFY_EMAIL. The booking is made and is in the admin panel:\n${plain}`,
      )
    } else {
      const html = emailShell({
        dir: 'ltr',
        siteName,
        preheader: fill(t.email.preHotel, {
          guest: booking.guestName,
          room: g.room?.name ?? '',
          arriving: g.arriving,
        }),
        eyebrow: t.email.newEyebrow,
        title: fill(t.email.newTitle, { hotel: iso(branch?.name ?? siteName) }),
        body:
          para(esc(t.email.newLead), 'ltr') +
          referenceBlock(t.email.refLabel, booking.reference, 'ltr') +
          datesBlock({ ...g, dir: 'ltr' }) +
          guestPanel(g) +
          stayPanel({ ...g, dir: 'ltr' }) +
          rule() +
          button(`${base}/admin/collections/bookings`, 'Open in the admin panel'),
        footerLines: [
          fill(t.email.footerContact, {
            hotel: iso(branch?.name ?? siteName),
            address: iso(branch?.address?.replace(/\n/g, ', ') ?? ''),
            phone: iso(branch?.phone ?? ''),
          }),
          esc(t.email.footerHotel),
        ],
      })

      await send(
        payload,
        booking.reference,
        hotelInbox,
        fill(t.email.subjHotel, {
          ref: booking.reference,
          hotel: branch?.name ?? '',
          date: g.arriving,
        }),
        html,
        plain,
        { critical: true },
      )
    }

    // ---- the guest's document ----
    if (booking.guestEmail) {
      const html = emailShell({
        dir,
        siteName,
        preheader: fill(t.email.preGuest, {
          ref: booking.reference,
          arriving: g.arriving,
          nights: g.nights ? `${g.nights} ${t.email.lNights}` : '',
        }),
        // No photograph, deliberately. It is the one element that depends on a
        // fetch this code cannot make on the guest's behalf, and when that
        // fetch fails it does not fail quietly — it leaves a dead 200px band
        // above the message, which is worse than the message simply not
        // having a picture. The letter carries perfectly well without it.
        //
        // To put it back: pass `heroUrl: g.heroUrl` here. The shell still
        // renders one, and g.heroUrl is still computed. Do it once the
        // address it produces has been opened in a browser and shown to be a
        // photograph — not before.
        eyebrow: t.email.confirmEyebrow,
        title: fill(t.email.confirmTitle, { name: iso(booking.guestName) }),
        body:
          para(esc(t.email.confirmLead), dir) +
          referenceBlock(t.email.refLabel, booking.reference, dir) +
          datesBlock(g) +
          stayPanel(g) +
          rule() +
          noticeBand(
            [
              t.email.payNotice,
              `<strong>${esc(fill(t.email.freeUntil, { date: g.cancelBy }))}</strong> ${esc(t.email.cancelSelf)}`,
              esc(t.email.deskNotice),
            ],
            dir,
          ) +
          hotelPanel(g) +
          button(manageUrl, esc(t.email.btnManage)) +
          button(g.calendarUrl, esc(t.email.btnCalendar), 'quiet') +
          (maps ? button(maps, esc(t.email.btnDirections), 'quiet') : '') +
          (wa ? button(wa, esc(t.email.btnWhatsApp), 'green') : ''),
        footerLines: [
          fill(t.email.footerContact, {
            hotel: iso(branch?.name ?? siteName),
            address: iso(branch?.address?.replace(/\n/g, ', ') ?? ''),
            phone: iso(branch?.phone ?? ''),
          }),
          esc(t.email.footerGuest),
          esc(t.email.footerWhy),
        ],
      })

      await send(
        payload,
        booking.reference,
        booking.guestEmail,
        fill(t.email.subjGuest, { hotel: branch?.name ?? siteName, ref: booking.reference }),
        html,
        `${fill(t.email.confirmTitle, { name: booking.guestName })}\n\n${plain}\n${t.email.deskNotice}\n${manageUrl}\n`,
        { critical: false },
      )
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
    const g = await gather(payload, reference)
    if (!g) return
    const { booking, branch, t, dir, siteName, plain, hotelInbox } = g

    if (!hotelInbox) {
      payload.logger.warn(`Booking ${booking.reference} cancelled, nowhere to send it:\n${plain}`)
    } else {
      const html = emailShell({
        dir: 'ltr',
        siteName,
        preheader: fill(t.email.preHotelCx, {
          guest: booking.guestName,
          room: g.room?.name ?? '',
          arriving: g.arriving,
        }),
        eyebrow: t.email.cxEyebrow,
        title: fill(t.email.cxHotelTitle, { hotel: iso(branch?.name ?? siteName) }),
        body:
          para(esc(t.email.cxHotelLead), 'ltr') +
          referenceBlock(t.email.refLabel, booking.reference, 'ltr') +
          datesBlock({ ...g, dir: 'ltr' }) +
          guestPanel(g) +
          stayPanel({ ...g, dir: 'ltr' }),
        footerLines: [esc(t.email.footerHotel)],
      })

      await send(
        payload,
        booking.reference,
        hotelInbox,
        fill(t.email.subjHotelCx, {
          ref: booking.reference,
          hotel: branch?.name ?? '',
          date: g.arriving,
        }),
        html,
        `CANCELLED\n\n${plain}`,
        { critical: true },
      )
    }

    if (booking.guestEmail) {
      const html = emailShell({
        dir,
        siteName,
        preheader: fill(t.email.preGuestCx, { ref: booking.reference }),
        eyebrow: t.email.cxEyebrow,
        title: esc(t.email.cxTitle),
        body:
          para(esc(t.email.cxLead), dir) +
          referenceBlock(t.email.refLabel, booking.reference, dir) +
          stayPanel(g) +
          noticeBand([esc(t.email.cxNotice)], dir) +
          hotelPanel(g),
        footerLines: [
          fill(t.email.footerContact, {
            hotel: iso(branch?.name ?? siteName),
            address: iso(branch?.address?.replace(/\n/g, ', ') ?? ''),
            phone: iso(branch?.phone ?? ''),
          }),
          esc(t.email.footerWhy),
        ],
      })

      await send(
        payload,
        booking.reference,
        booking.guestEmail,
        fill(t.email.subjGuestCx, { ref: booking.reference, hotel: branch?.name ?? siteName }),
        html,
        `${t.email.cxTitle}\n\n${plain}`,
        { critical: false },
      )
    }
  } catch (error) {
    payload.logger.error(`Booking ${reference}: cancellation could not be announced — ${error}`)
  }
}
