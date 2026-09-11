/**
 * WhatsApp's click-to-chat links accept digits only — no +, spaces or dashes.
 * Staff will reasonably type "+964 750 123 4567", so normalise rather than
 * insisting on a format.
 */
export const toWhatsAppHref = (phone?: string | null, message?: string): string => {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/**
 * The message a WhatsApp button hands the guest, ready to send.
 *
 * One function rather than a string built at each button, because the whole
 * point of the wording is that whoever answers recognises it instantly — and a
 * phrase that is assembled in nine places is a phrase that reads nine slightly
 * different ways within a year.
 *
 * Every message opens by saying the guest came from the website. That is the
 * fact reception could not get from the old text: "Enquire about a stay — My
 * Flower 3" is a fragment that could have come from anywhere, and the desk had
 * no way to tell a guest reading the site from somebody who saw a signboard.
 *
 * Which of the four it uses follows what the guest was looking at: a room, a
 * hotel, the group, or a booking they already hold.
 */
export const whatsappMessage = (
  t: {
    common: {
      waAsk: string
      waAskGroup: string
      waRoom: string
      waRoomOnly: string
      waRoomDates: string
      waBooking: string
    }
  },
  {
    siteName,
    hotel,
    room,
    reference,
    dates,
  }: {
    siteName: string
    hotel?: string | null
    room?: string | null
    reference?: string | null
    /**
     * The nights the guest has already chosen, written out for a person to
     * read. Only the results page has these; everywhere else it is absent and
     * the message is the one it always was.
     */
    dates?: string | null
  },
): string => {
  const fill = (template: string) =>
    template
      .replace('{site}', siteName)
      .replace('{hotel}', hotel ?? '')
      .replace('{room}', room ?? '')
      .replace('{ref}', reference ?? '')
      .replace('{dates}', dates ?? '')

  // Does the room's name already carry its hotel?
  //
  // Every room here is named "<room> — <hotel>", so naming the hotel again
  // after it gave "ask about Deluxe Double — My Flower 2 at My Flower 2".
  // Testing whether the room's name contains the hotel's does not work: room
  // names stay in English while the hotel's name is translated, so on the
  // Arabic and Kurdish pages the two never match and the stutter came back in
  // exactly the two languages most guests read. Whether the name carries a
  // suffix at all is the same question in every language, so that is the test.
  const roomNamesItsHotel = Boolean(room && /\s[—–]\s/u.test(room))

  if (reference) return fill(t.common.waBooking)
  // Dates first, because a guest who has picked their nights has told us the
  // most useful thing about their enquiry and it should not be dropped on the
  // way to WhatsApp. Only with a room: dates alone name no room to ask about.
  if (room && dates) return fill(t.common.waRoomDates)
  if (room && roomNamesItsHotel) return fill(t.common.waRoomOnly)
  if (room && hotel) return fill(t.common.waRoom)
  if (hotel) return fill(t.common.waAsk)
  return fill(t.common.waAskGroup)
}

export const toTelHref = (phone?: string | null): string => {
  if (!phone) return ''
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : ''
}

/** Falls back to a plain maps search when no share link has been pasted in. */
export const toMapsHref = (
  googleMapsUrl?: string | null,
  latitude?: number | null,
  longitude?: number | null,
): string => {
  if (googleMapsUrl) return googleMapsUrl
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
  }
  return ''
}
