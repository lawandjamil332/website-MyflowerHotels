/**
 * Photographs that ship with the site itself, keyed by hotel slug.
 *
 * These are the exterior shots from the group's printed card, kept in the
 * repository rather than in the database. Anything stored as an upload depends
 * on the storage bucket being connected; these do not, so a hotel always has
 * at least one real picture no matter what happens to the uploads.
 *
 * An uploaded photograph always wins. This is the floor, not the ceiling.
 */
const shipped: Record<string, string> = {
  'my-flower-1': '/hotels/my-flower-1.jpg',
  'my-flower-2': '/hotels/my-flower-2.jpg',
  'my-flower-3': '/hotels/my-flower-3.jpg',
}

export const shippedPhoto = (slug?: string | null): string | undefined =>
  slug ? shipped[slug] : undefined
