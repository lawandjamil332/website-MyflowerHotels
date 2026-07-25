'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { cn } from '@/utilities/ui'
import { LocaleSwitcher } from './LocaleSwitcher'
import { btnLight, btnSmall, shell } from './ui'

type Props = {
  locale: Locale
  t: Dictionary
  siteName: string
  logoUrl: string
  logoAlt: string
  whatsappHref: string
}

/**
 * The bar sits over the photograph at the top of every page and only becomes
 * a solid surface once the guest scrolls past it. That is what keeps the hero
 * full-bleed — a header with its own background permanently pinned above the
 * image is the single clearest tell of a template.
 */
export function HeaderBar({ locale, t, siteName, logoUrl, logoAlt, whatsappHref }: Props) {
  const pathname = usePathname()
  const [solid, setSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Navigating from inside the overlay should close it; without this the menu
  // stays open on top of the page the guest just asked for.
  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const links = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}#collection`, label: t.nav.branches },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ]

  // While the overlay is open the bar always sits on ink, so it uses the
  // light treatment regardless of scroll position.
  const onDark = !solid || menuOpen

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-700 ease-luxe',
          solid && !menuOpen
            ? 'border-b border-line bg-bone/90 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        {/* Scrim only while transparent: white type needs a floor to sit on
            when the top of a photograph happens to be bright sky. */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent transition-opacity duration-700 ease-luxe',
            solid || menuOpen ? 'opacity-0' : 'opacity-100',
          )}
        />

        <div
          className={cn(
            shell,
            'relative flex items-center justify-between gap-3 transition-[height] duration-700 ease-luxe sm:gap-6',
            solid && !menuOpen ? 'h-16' : 'h-20 sm:h-24',
          )}
        >
          {/* `min-w-0` matters: a long hotel name set in letterspaced capitals
              is wide enough to push the menu button off a 360px screen if the
              wordmark is allowed to refuse to shrink. */}
          <Link
            href={`/${locale}`}
            className="flex min-w-0 items-center gap-3"
            aria-label={siteName}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={logoAlt || siteName}
                width={180}
                height={48}
                priority
                className={cn(
                  'w-auto object-contain transition-all duration-700 ease-luxe',
                  solid && !menuOpen ? 'h-8' : 'h-10',
                  onDark && 'brightness-0 invert',
                )}
              />
            ) : (
              <span
                className={cn(
                  'font-display truncate text-base leading-none tracking-[0.16em] uppercase transition-colors duration-700 ease-luxe sm:text-xl sm:tracking-[0.26em]',
                  onDark ? 'text-white' : 'text-ink',
                )}
              >
                {siteName}
              </span>
            )}
          </Link>

          <nav
            className={cn(
              'hidden items-center gap-9 text-[0.7rem] font-medium tracking-[0.22em] uppercase transition-colors duration-700 ease-luxe lg:flex rtl:gap-8 rtl:text-xs rtl:tracking-normal',
              onDark ? 'text-white/85' : 'text-muted-ink',
            )}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'link-line transition-colors duration-500 ease-luxe',
                  onDark ? 'hover:text-white' : 'hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-5">
            <LocaleSwitcher
              current={locale}
              label={t.common.language}
              tone={onDark ? 'light' : 'ink'}
            />

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  btnLight,
                  btnSmall,
                  'hidden lg:inline-flex',
                  !onDark && 'bg-ink text-bone hover:bg-brass hover:text-ink',
                )}
              >
                {t.common.reserve}
              </a>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? t.common.close : t.common.menu}
              className={cn(
                'relative -me-1 flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] transition-colors duration-700 ease-luxe lg:hidden',
                onDark ? 'text-white' : 'text-ink',
              )}
            >
              <span
                className={cn(
                  'block h-px w-6 bg-current transition-transform duration-500 ease-luxe',
                  menuOpen && 'translate-y-[3px] rotate-45',
                )}
              />
              <span
                className={cn(
                  'block h-px w-6 bg-current transition-transform duration-500 ease-luxe',
                  menuOpen && '-translate-y-[3px] -rotate-45',
                )}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen menu rather than a dropdown: on a phone this is the whole
          navigation, and the large type keeps it usable one-handed. */}
      <div
        id="site-menu"
        hidden={!menuOpen}
        className={cn(
          // Above the floating WhatsApp button (z-40), below the bar itself,
          // so the open menu is not stamped over by the green circle.
          'fixed inset-0 z-[45] bg-ink transition-opacity duration-500 ease-luxe lg:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className={cn(shell, 'flex h-full flex-col justify-between pt-28 pb-12')}>
          <nav className="flex flex-col gap-1">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ transitionDelay: menuOpen ? `${120 + i * 70}ms` : '0ms' }}
                className={cn(
                  'font-display border-b border-white/10 py-5 text-3xl text-white transition-all duration-700 ease-luxe sm:text-4xl',
                  menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-8">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(btnLight, 'w-full')}
              >
                {t.common.reserve}
              </a>
            )}
            <LocaleSwitcher
              current={locale}
              label={t.common.language}
              tone="light"
              size="full"
            />
          </div>
        </div>
      </div>
    </>
  )
}
