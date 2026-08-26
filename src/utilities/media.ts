import type { Media } from '@/payload-types'

type MediaLike = number | Media | null | undefined

/**
 * Upload fields arrive either as a populated document or as a bare id,
 * depending on query depth. These narrow that down without every component
 * repeating the same checks.
 */
export const mediaUrl = (media: MediaLike, size?: keyof NonNullable<Media['sizes']>): string => {
  if (!media || typeof media === 'number') return ''
  if (size && media.sizes) {
    const variant = media.sizes[size]
    if (variant && typeof variant === 'object' && 'url' in variant && variant.url) {
      return variant.url
    }
  }
  return media.url ?? ''
}

/**
 * Descriptions that are not descriptions.
 *
 * The alt field is hidden in the admin panel because the owner uploads in
 * bulk, and a handful of photographs carry whatever was typed into the box
 * before it was hidden — a single letter, a number, the camera's filename.
 * Stored, those win over the fallback every caller passes in, so a hotel
 * exterior went out as alt="k" while the branch's own name sat unused one
 * line below. That is worse than an empty description: a screen reader reads
 * "k" aloud, and a search engine indexes the page as being about it.
 *
 * So a stored description has to look like one. Under three characters, or a
 * filename, or nothing with two letters in it anywhere — in any script — is
 * treated as absent, and the caller's fallback is used instead. Those
 * fallbacks are the hotel's name, the room's name or the site's name, which
 * is close to what a written description would have said anyway.
 */
const describes = (alt: string): boolean => {
  const trimmed = alt.trim()
  if (trimmed.length < 3) return false
  if (/\.(jpe?g|png|webp|avif|gif|heic|heif)$/i.test(trimmed)) return false
  // \p{L} rather than A-Z, so Kurdish and Arabic descriptions are kept.
  return /\p{L}{2,}/u.test(trimmed)
}

export const mediaAlt = (media: MediaLike): string => {
  if (!media || typeof media === 'number') return ''
  const alt = media.alt ?? ''
  return describes(alt) ? alt : ''
}

export const hasMedia = (media: MediaLike): media is Media =>
  Boolean(media) && typeof media !== 'number'
