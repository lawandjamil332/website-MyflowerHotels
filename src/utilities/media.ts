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

export const mediaAlt = (media: MediaLike): string => {
  if (!media || typeof media === 'number') return ''
  return media.alt ?? ''
}

export const hasMedia = (media: MediaLike): media is Media =>
  Boolean(media) && typeof media !== 'number'
