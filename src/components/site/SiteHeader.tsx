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
  return (
    <HeaderBar
      locale={locale}
      t={t}
      siteName={settings.siteName || 'Myflower Hotels'}
      logoUrl={mediaUrl(settings.logo, 'small')}
      logoAlt={mediaAlt(settings.logo)}
      whatsappHref={toWhatsAppHref(settings.whatsapp)}
    />
  )
}
