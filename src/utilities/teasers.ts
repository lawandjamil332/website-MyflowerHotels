import type { Branch } from '@/payload-types'
import { mediaAlt, mediaUrl } from './media'

/**
 * The trimmed shape the interactive branch switcher needs. Payload documents
 * carry rich text and nested uploads that would be serialised into the page
 * for no reason — a client component should only receive what it draws.
 */
export type BranchTeaser = {
  id: number
  slug: string
  name: string
  tagline: string
  city: string
  imageUrl: string
  imageAlt: string
}

export const toBranchTeaser = (branch: Branch): BranchTeaser => ({
  id: branch.id,
  slug: branch.slug,
  name: branch.name,
  tagline: branch.tagline ?? '',
  city: branch.city ?? '',
  imageUrl: mediaUrl(branch.heroImage, 'xlarge'),
  imageAlt: mediaAlt(branch.heroImage) || branch.name,
})
