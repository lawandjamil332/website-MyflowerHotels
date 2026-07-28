import type { Dictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'
import { formatNumber } from './format'

type LayoutLike = {
  bedrooms?: number | null
  livingRooms?: number | null
  bathrooms?: number | null
  hasKitchen?: boolean | null
}

/**
 * "2 bedrooms · 1 hall · 2 bathrooms · Kitchen".
 *
 * One function rather than the same three ternaries repeated on the card, the
 * feature strip, the search result and the detail page — which is how the four
 * of them end up disagreeing about whether a hall counts.
 *
 * Says nothing at all for an ordinary room. A line reading "1 bedroom" under
 * every single room in the group is noise: it is true of all of them, so it
 * distinguishes none of them, and it buries the one line that matters on the
 * apartment three rows further down.
 */
export const layoutParts = (room: LayoutLike, t: Dictionary, locale: Locale): string[] => {
  const bedrooms = room.bedrooms ?? 0
  const livingRooms = room.livingRooms ?? 0
  const bathrooms = room.bathrooms ?? 0

  // Nothing here that an ordinary room does not already have.
  const notableLayout = bedrooms > 1 || livingRooms > 0 || bathrooms > 1
  if (!notableLayout && !room.hasKitchen) return []

  const n = (value: number) => formatNumber(value, locale)
  const parts: string[] = []

  if (bedrooms > 0) {
    parts.push(`${n(bedrooms)} ${bedrooms === 1 ? t.room.bedroom : t.room.bedrooms}`)
  }
  if (livingRooms > 0) {
    parts.push(`${n(livingRooms)} ${livingRooms === 1 ? t.room.hall : t.room.halls}`)
  }
  if (bathrooms > 0) {
    parts.push(`${n(bathrooms)} ${bathrooms === 1 ? t.room.bathroom : t.room.bathrooms}`)
  }
  if (room.hasKitchen) parts.push(t.room.kitchen)

  return parts
}

export const layoutLine = (room: LayoutLike, t: Dictionary, locale: Locale): string =>
  layoutParts(room, t, locale).join(' · ')
