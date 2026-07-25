import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { SiteSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { toWhatsAppHref } from '@/utilities/contact'
import { HeaderBar } from './HeaderBar'

/**
 * Resolves the settings global into plain strings, so the interactive bar
 * itself stays a small client component with nothing but primitives crossing
 * the boundary.
 */
export function SiteHeader({
  locale,
  t,
  settings,
}: {
  locale: Locale
  t: Dictionary
  settings: SiteSettings
}) {
  const uploaded = mediaUrl(settings.logo, 'small')

  return (
    <HeaderBar
      locale={locale}
      t={t}
      siteName={settings.siteName || 'My Flower Hotels'}
      // An uploaded logo wins. Otherwise the group's own artwork ships with
      // the site, in two versions: full colour for the solid bar, and one with
      // the wordmark lifted to bone for while the bar is over a photograph.
      logoUrl={uploaded || '/logo.png'}
      logoLightUrl={uploaded ? '' : '/logo-light.png'}
      logoAlt={mediaAlt(settings.logo)}
      whatsappHref={toWhatsAppHref(settings.whatsapp)}
    />
  )
}
