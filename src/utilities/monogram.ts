/**
 * Initials for the photo frame — "My Flower Citadel" becomes MF. Falls back to
 * the first two letters when there is only one word.
 *
 * Kept apart from the component that draws it. PhotoFrame has to run on the
 * client so it can notice an image failing to load, and a plain function
 * exported from a 'use client' file cannot be called by a server component —
 * every page that did so threw at runtime, which the production build does not
 * catch because nothing calls it until a request arrives.
 */
export const monogramOf = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '—'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
