import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { SiteSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { toWhatsAppHref } from '@/utilities/contact'
import { currentGuest } from '@/actions/account'
import { HeaderBar } from './HeaderBar'

/**
 * Resolves the settings global into plain strings, so the interactive bar
 * itself stays a small client component with nothing but primitives crossing
 * the boundary.
 */
export async function SiteHeader({
  locale,
  t,
  settings,
}: {
  locale: Locale
  t: Dictionary
  settings: SiteSettings
}) {
  const uploaded = mediaUrl(settings.logo, 'small')

  // Who is signed in, so the bar can say "Sign in" or say their name. The
  // layout is already force-dynamic, so this costs a session read and nothing
  // else. Only the first word of the name: the bar has a fixed width and
  // "Lawand" fits where "Lawand Jamil Mohammed" does not.
  const guest = await currentGuest()
  const guestName = guest?.name ? String(guest.name).trim().split(/\s+/)[0] : ''

  return (
    <HeaderBar
      locale={locale}
      t={t}
      guestName={guestName}
      siteName={settings.siteName || 'My Flower Hotels'}
      // An uploaded logo wins. Otherwise the group's own artwork ships with
      // the site in two versions: full colour, and one with the wordmark
      // lifted to bone for a dark ground. The bar is navy, so it takes the
      // second — the full-colour wordmark is near-black and would vanish.
      logoUrl={uploaded || '/logo.png'}
      logoLightUrl={uploaded ? '' : '/logo-light.png'}
      logoAlt={mediaAlt(settings.logo)}
    />
  )
}
