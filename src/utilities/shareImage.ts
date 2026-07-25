import { getServerSideURL } from './getURL'

/**
 * The image that appears when a link is shared. A real photograph wins when
 * one exists; otherwise the site draws a branded card rather than falling back
 * to a stock picture that is not of these hotels.
 */
export const shareImage = (photoUrl: string, title: string, eyebrow?: string): string => {
  if (photoUrl) return photoUrl
  const params = new URLSearchParams({ title })
  if (eyebrow) params.set('eyebrow', eyebrow)
  return `${getServerSideURL()}/api/og?${params.toString()}`
}
