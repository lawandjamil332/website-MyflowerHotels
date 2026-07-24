import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { SiteSettings } from '@/utilities/getSettings'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'

export function SiteFooter({
  locale,
  t,
  settings,
}: {
  locale: Locale
  t: Dictionary
  settings: SiteSettings
}) {
  const siteName = settings.siteName || 'Myflower Hotels'
  const tel = toTelHref(settings.phone)
  const wa = toWhatsAppHref(settings.whatsapp)
  const social = settings.social ?? {}

  const socialLinks = [
    { href: social.facebook, label: 'Facebook' },
    { href: social.instagram, label: 'Instagram' },
    { href: social.tiktok, label: 'TikTok' },
    { href: social.youtube, label: 'YouTube' },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href))

  return (
    <footer className="mt-24 border-t border-stone-200 bg-stone-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-lg text-stone-900">{siteName}</p>
          <p className="mt-2 text-sm text-stone-500">Erbil, Kurdistan Region, Iraq</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm text-stone-600">
          <Link href={`/${locale}`} className="transition hover:text-stone-900">
            {t.nav.branches}
          </Link>
          <Link href={`/${locale}/about`} className="transition hover:text-stone-900">
            {t.nav.about}
          </Link>
          <Link href={`/${locale}/contact`} className="transition hover:text-stone-900">
            {t.nav.contact}
          </Link>
        </nav>

        <div className="flex flex-col gap-2 text-sm text-stone-600">
          {tel && (
            <a href={tel} className="transition hover:text-stone-900" dir="ltr">
              {settings.phone}
            </a>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-stone-900"
            >
              {t.common.whatsapp}
            </a>
          )}
          {settings.email && (
            <a href={`mailto:${settings.email}`} className="transition hover:text-stone-900">
              {settings.email}
            </a>
          )}
          {socialLinks.length > 0 && (
            <div className="mt-2 flex gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-stone-900"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-stone-200 px-4 py-6 text-center text-xs text-stone-400 sm:px-6">
        © {new Date().getFullYear()} {siteName}
      </div>
    </footer>
  )
}
