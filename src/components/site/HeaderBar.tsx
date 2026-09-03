'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { cn } from '@/utilities/ui'
import { CurrencySwitch } from './Currency'
import { LocaleSwitcher } from './LocaleSwitcher'
import { btnLight, btnSmall, shell } from './ui'

/** See CardRail for why this is hoisted rather than chosen inside a component. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type Props = {
  locale: Locale
  t: Dictionary
  siteName: string
  logoUrl: string
  logoLightUrl?: string
  logoAlt: string
  /** First name of the signed-in guest, or '' when nobody is. */
  guestName?: string
}

/** Marks the account control as an account control, before the word is read. */
function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.05rem] w-[1.05rem] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  )
}

/**
 * A masthead: the mark and the guest's own settings on top, the pages ranged
 * underneath it, on a solid dark band.
 *
 * This has been three things. A single solid bar with everything on it at one
 * weight, so nothing led. Then two rows floated transparently over the hero
 * photograph, which is a real pattern and the wrong one here — it looks
 * considered on a bright, wide, professionally shot picture, and over the dark
 * building photographs this site actually has it turned the whole top of the
 * page to mush, header and photograph running into each other with no edge
 * between them.
 *
 * So: a solid band, and the photograph starts cleanly beneath it. That is what
 * the reference does, and the reason it works there is the reason it works
 * here — the band is a fixed, legible object of known height that the search
 * bar can sit against, and the picture below it is allowed to be a picture
 * rather than a backdrop for text.
 *
 * The split is what makes it a masthead rather than a toolbar. The top row is
 * the things a guest sets once — language, currency, who they are — plus the
 * one button that takes a booking. The row beneath is nothing but the five
 * pages, ranged from the same margin the wordmark starts on, so the list reads
 * as a list. Scrolling collapses the second row away; the first stays, and the
 * search bar docks under it.
 */
export function HeaderBar({
  locale,
  t,
  siteName,
  logoUrl,
  logoLightUrl,
  logoAlt,
  guestName = '',
}: Props) {
  const pathname = usePathname()
  const [condensed, setCondensed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const header = useRef<HTMLElement>(null)

  useEffect(() => {
    // Hysteresis, not a single threshold. The bar changes its own height when
    // it collapses, and a page resting exactly on one threshold would trip it,
    // grow, untrip, shrink, and flicker for as long as the guest sat there.
    const onScroll = () => setCondensed((was) => (was ? window.scrollY > 40 : window.scrollY > 96))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Publishes the bar's real height, so everything that has to clear it — the
  // hero's top padding, the docked search bar, the anchor scroll offset — can
  // read one number instead of each carrying its own guess. The guesses were
  // the bug this replaces: the hero's clearance was a hard-coded pt-28 that
  // had to be re-measured by hand every time the bar changed, and it went
  // wrong in the language with the longest menu labels.
  const publishHeight = useCallback(() => {
    const h = header.current?.offsetHeight
    if (h) document.documentElement.style.setProperty('--site-header-h', `${h}px`)
  }, [])

  useIsomorphicLayoutEffect(() => {
    publishHeight()
    const el = header.current
    if (!el) return
    const observer = new ResizeObserver(publishHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [publishHeight, condensed])

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

  // Places, not actions. The account door used to sit at the end of this list
  // as "My bookings", where it read as a sixth page rather than as the way in
  // — which is why signing in looked like it was not there at all. Every hotel
  // group of any size puts it in the corner, beside the reserve button, and
  // says the words "Sign in" while nobody is.
  const links = [
    { href: `/${locale}`, label: t.nav.home },
    // A page, not an anchor. This pointed at the homepage's collection band,
    // which meant "Our hotels" scrolled you down the page you were already on
    // and did nothing at all if you were on any other one.
    { href: `/${locale}/branches`, label: t.nav.branches },
    { href: `/${locale}/rooms`, label: t.nav.rooms },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ]

  const accountLabel = guestName || t.account.signIn

  // Which page you are on, marked under the label. `startsWith` rather than
  // equality so /branches/my-flower-2 still lights "Our hotels" — but the home
  // link has to be exact, or it would be lit on every page of the site.
  const isCurrent = (href: string) =>
    href === `/${locale}` ? pathname === href : pathname.startsWith(href)

  return (
    <>
      <header
        ref={header}
        className={cn(
          'fixed inset-x-0 top-0 z-50 bg-bark transition-shadow duration-500 ease-luxe',
          condensed && !menuOpen && 'shadow-[0_2px_16px_rgb(0_0_0/0.35)]',
        )}
      >
        <div className={shell}>
          {/* Row one: the mark, and the things a guest sets once — the
              language, the currency, who they are, and the way to a booking.
              Small type, because none of it is what the page is about. */}
          <div
            className={cn(
              'flex items-center justify-between gap-3 transition-[height] duration-500 ease-luxe sm:gap-6',
              condensed && !menuOpen ? 'h-14' : 'h-16 lg:h-[4.25rem]',
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
                  // The dark-surface artwork already carries a legible
                  // wordmark, so it must not be run through a filter — that
                  // would flatten the flower to a white silhouette and throw
                  // the brand away.
                  src={logoLightUrl || logoUrl}
                  alt={logoAlt || siteName}
                  width={228}
                  height={147}
                  priority
                  className={cn(
                    'w-auto object-contain transition-all duration-500 ease-luxe',
                    condensed && !menuOpen ? 'h-9' : 'h-10 sm:h-11',
                    !logoLightUrl && 'brightness-0 invert',
                  )}
                />
              ) : (
                <span className="font-display truncate text-lg leading-none text-white sm:text-xl">
                  {siteName}
                </span>
              )}
            </Link>

            <div className="flex shrink-0 items-center gap-1 sm:gap-4">
              <CurrencySwitch
                label={t.common.currency}
                className="hidden border-white/25 md:inline-flex"
              />
              <LocaleSwitcher current={locale} label={t.common.language} tone="light" />

              {/* Shown from tablet up rather than desktop only: on a phone this
                  would crowd the burger, and the phone menu carries it. */}
              <Link
                href={`/${locale}/account`}
                className="tap-safe hidden items-center gap-2 text-[0.82rem] font-medium text-white/85 transition-colors duration-300 ease-luxe hover:text-white md:inline-flex"
              >
                <PersonIcon />
                <span className="max-w-[9rem] truncate">{accountLabel}</span>
              </Link>

              {/* Up here beside the account, not down in the row of pages.
                  The pages are places; this is the one action, and it belongs
                  with the other things a guest does rather than reads. It also
                  means it survives the second row collapsing on scroll. */}
              <Link
                href={`/${locale}/book`}
                className={cn(btnLight, btnSmall, 'hidden sm:inline-flex')}
              >
                {t.common.reserve}
              </Link>

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

          {/* Row two: nothing but the pages, ranged from the same margin the
              wordmark above them starts on.
              It used to end with the Reserve button on the opposite side,
              which made the row a mix of two things — five places and one
              action — and gave the eye two places to land. With the action
              moved up beside the account, this row is one list, and the list
              begins directly under the mark. That is the arrangement the
              reference uses and it is what makes a header read as a masthead
              rather than as a toolbar. */}
          <div
            className={cn(
              'hidden overflow-hidden border-t transition-all duration-500 ease-luxe lg:block',
              condensed && !menuOpen
                ? 'h-0 border-transparent opacity-0'
                : 'h-12 border-white/12 opacity-100',
            )}
          >
            <nav className="flex h-12 items-center gap-8 text-[0.88rem] font-medium xl:gap-10">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrent(link.href) ? 'page' : undefined}
                  className={cn(
                    'relative py-1 transition-colors duration-300 ease-luxe hover:text-white',
                    isCurrent(link.href) ? 'text-white' : 'text-white/75',
                  )}
                >
                  {link.label}
                  {/* The marker is drawn rather than an underline so it sits
                      clear of the descenders in "Rooms" and does not cut the
                      Kurdish and Arabic labels through the middle. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-brass transition-opacity duration-300 ease-luxe',
                      isCurrent(link.href) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </Link>
              ))}
            </nav>
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
          'fixed inset-0 z-[45] bg-bark transition-opacity duration-500 ease-luxe lg:hidden',
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
            <div className="flex flex-col gap-3">
              <Link href={`/${locale}/book`} className={cn(btnLight, 'w-full')}>
                {t.common.reserve}
              </Link>
              {/* Beside Reserve, not buried in the list of pages above it —
                  these two are the things a guest came to do. */}
              <Link
                href={`/${locale}/account`}
                className="tap-safe flex items-center justify-center gap-2 py-2 text-[0.95rem] font-medium text-white/85"
              >
                <PersonIcon />
                <span className="truncate">{accountLabel}</span>
              </Link>
            </div>
            <LocaleSwitcher current={locale} label={t.common.language} tone="light" size="full" />
          </div>
        </div>
      </div>
    </>
  )
}
