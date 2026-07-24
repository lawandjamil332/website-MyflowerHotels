import Image from 'next/image'
import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { SiteSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { LocaleSwitcher } from './LocaleSwitcher'

export function SiteHeader({
  locale,
  t,
  settings,
}: {
  locale: Locale
  t: Dictionary
  settings: SiteSettings
}) {
  const logo = mediaUrl(settings.logo, 'small')
  const siteName = settings.siteName || 'Myflower Hotels'

  const links = [
    { href: `/${locale}`, label: t.nav.branches },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          {logo ? (
            <Image
              src={logo}
              alt={mediaAlt(settings.logo) || siteName}
              width={140}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          ) : (
            <span className="font-display text-lg tracking-tight text-stone-900">{siteName}</span>
          )}
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <nav className="hidden items-center gap-6 text-sm text-stone-600 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-stone-900">
                {link.label}
              </Link>
            ))}
          </nav>
          <LocaleSwitcher current={locale} label={t.common.language} />
        </div>
      </div>
    </header>
  )
}
