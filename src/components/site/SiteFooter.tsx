import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { SiteSettings } from '@/utilities/getSettings'
import { getBranches } from '@/utilities/branches'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { cn } from '@/utilities/ui'
import { LocaleSwitcher } from './LocaleSwitcher'
import { Stars } from './Stars'
import { shell } from './ui'

/**
 * Ink footer. It closes the page on the darkest surface on the site, which is
 * what stops a long scroll of photographs from simply stopping.
 *
 * Every hotel is listed by name here as well as in the switcher: the
 * footer is where a returning guest looks for the branch they stayed at last
 * time.
 */
export async function SiteFooter({
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
  const branches = await getBranches(locale)

  const socialLinks = [
    { href: social.facebook, label: 'Facebook' },
    { href: social.instagram, label: 'Instagram' },
    { href: social.tiktok, label: 'TikTok' },
    { href: social.youtube, label: 'YouTube' },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href))

  const columnHeading = 'text-[0.65rem] tracking-[0.24em] text-brass uppercase rtl:tracking-normal'
  const columnLink =
    'link-line text-sm text-white/60 transition-colors duration-500 ease-luxe hover:text-white'

  return (
    <footer className="bg-ink text-white">
      <div className={cn(shell, 'py-20 sm:py-24')}>
        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <p className="font-display text-2xl tracking-[0.22em] uppercase">{siteName}</p>
            <Stars count={settings.stars} className="mt-4" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              {t.home.heroEyebrow}
            </p>
            {settings.establishedYear && (
              <p className="mt-2 text-xs tracking-[0.2em] text-white/40 uppercase rtl:tracking-normal">
                Since {settings.establishedYear}
              </p>
            )}
            <div aria-hidden="true" className="rule-brass mt-7" />
          </div>

          <nav className="flex flex-col items-start gap-3.5">
            <p className={columnHeading}>{t.common.menu}</p>
            <Link href={`/${locale}`} className={columnLink}>
              {t.nav.home}
            </Link>
            <Link href={`/${locale}#collection`} className={columnLink}>
              {t.nav.branches}
            </Link>
            <Link href={`/${locale}/about`} className={columnLink}>
              {t.nav.about}
            </Link>
            <Link href={`/${locale}/contact`} className={columnLink}>
              {t.nav.contact}
            </Link>
          </nav>

          <nav className="flex flex-col items-start gap-3.5">
            <p className={columnHeading}>{t.nav.branches}</p>
            {branches.length > 0 ? (
              branches.map((branch) => (
                <Link
                  key={branch.id}
                  href={`/${locale}/branches/${branch.slug}`}
                  className={columnLink}
                >
                  {branch.name}
                </Link>
              ))
            ) : (
              <span className="text-sm text-white/35">—</span>
            )}
          </nav>

          <div className="flex flex-col items-start gap-3.5">
            <p className={columnHeading}>{t.nav.contact}</p>
            {tel && (
              <a href={tel} className={columnLink} dir="ltr">
                {settings.phone}
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={columnLink}>
                {t.common.whatsapp}
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className={columnLink}>
                {settings.email}
              </a>
            )}
            {socialLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={columnLink}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The name at architectural scale across the foot of the page. It is
          the last thing a guest sees, and at this size it registers as a mark
          rather than a line of small print. */}
      <div className={cn(shell, 'overflow-hidden pt-4')} aria-hidden="true">
        <p
          className="font-display leading-[0.8] whitespace-nowrap text-white/[0.07] select-none"
          style={{
            // Sized from the name's own length so it fills the width and stops
            // there. A fixed viewport size would clip "Myflower Hotels"
            // mid-word and leave a short name marooned in the middle.
            fontSize: `clamp(2.75rem, ${Math.min(15, 205 / Math.max(siteName.length, 7)).toFixed(2)}vw, 13rem)`,
            letterSpacing: '0',
          }}
        >
          {siteName}
        </p>
      </div>

      <div className="border-t border-white/10">
        <div
          className={cn(
            shell,
            'flex flex-col-reverse items-center justify-between gap-5 py-7 sm:flex-row',
          )}
        >
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} {siteName}
          </p>
          <LocaleSwitcher current={locale} label={t.common.language} tone="light" size="full" />
        </div>
      </div>
    </footer>
  )
}
