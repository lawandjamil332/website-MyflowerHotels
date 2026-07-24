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
