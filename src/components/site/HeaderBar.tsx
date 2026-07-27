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
  logoLightUrl?: string
  logoAlt: string
  whatsappHref: string
}

/**
 * A solid navy bar, present from the first pixel and unchanged by scrolling.
 *
 * The previous design floated it transparently over the hero so the
 * photograph could run full-bleed. That is the right call for a single
 * property selling a mood; it is the wrong one here. A group site is
 * navigated, and navigation you can always see — in a colour that never
 * shifts under you — is worth more than an uninterrupted photograph.
 */
export function HeaderBar({
  locale,
  t,
  siteName,
  logoUrl,
  logoLightUrl,
  logoAlt,
  whatsappHref,
}: Props) {
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
    { href: `/${locale}/rooms`, label: t.nav.rooms },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ]

  // The bar is navy at every scroll position, so everything on it takes the
  // light treatment. Scrolling only tightens the height and adds a shadow.
  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink transition-shadow duration-500 ease-luxe',
          solid && !menuOpen && 'shadow-[0_2px_12px_rgb(0_0_0/0.28)]',
        )}
      >
        <div
          className={cn(
            shell,
            'relative flex items-center justify-between gap-3 transition-[height] duration-500 ease-luxe sm:gap-6',
            solid && !menuOpen ? 'h-16' : 'h-18 sm:h-20',
          )}
        >
          {/* `min-w-0` matters: a long hotel name is wide enough to push the
              menu button off a 360px screen if the wordmark is allowed to
              refuse to shrink. */}
          <Link
            href={`/${locale}`}
            className="flex min-w-0 items-center gap-3"
            aria-label={siteName}
          >
            {logoUrl ? (
              <Image
                // The dark-surface artwork already carries a legible wordmark,
                // so it must not be run through a filter — that would flatten
                // the flower to a white silhouette and throw the brand away.
                src={logoLightUrl || logoUrl}
                alt={logoAlt || siteName}
                width={228}
                height={147}
                priority
                className={cn(
                  'w-auto object-contain transition-all duration-500 ease-luxe',
                  solid && !menuOpen ? 'h-10' : 'h-12 sm:h-14',
                  !logoLightUrl && 'brightness-0 invert',
                )}
              />
            ) : (
              <span className="font-display truncate text-lg leading-none text-white sm:text-xl">
                {siteName}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-7 text-[0.92rem] font-medium text-white/85 lg:flex xl:gap-9">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors duration-300 ease-luxe hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-5">
            <LocaleSwitcher current={locale} label={t.common.language} tone="light" />

            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(btnLight, btnSmall, 'hidden lg:inline-flex')}
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
              className="relative -me-1 flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] text-white lg:hidden"
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
