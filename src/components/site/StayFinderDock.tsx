'use client'

import { useEffect, useState } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { cn } from '@/utilities/ui'
import { StayFinder, type FinderHotel } from './StayFinder'
import { shell } from './ui'

/**
 * The search bar, pinned under the header once the guest scrolls past the top
 * of the page.
 *
 * This is the thing the reference site is recognised by, and the thing this
 * site was missing. On a hotel group's homepage the search box is not a
 * section of the page — it is the page's one control, and it follows you down
 * it. Without this a guest who read three bands of hotels and decided on their
 * dates had to scroll all the way back up to type them, on every page of the
 * site.
 *
 * Rendered once in the layout rather than per page, so it is there on the room
 * list, on a hotel's own page and on the about page too — everywhere a guest
 * might make up their mind.
 *
 * It appears below the fold and never over the hero, where the full-size one
 * already is. Two search boxes stacked on one screen would be a bug, not a
 * feature.
 */
export function StayFinderDock({
  hotels,
  locale,
  t,
}: {
  hotels: FinderHotel[]
  locale: Locale
  t: Dictionary
}) {
  // Desktop only, and decided in JavaScript rather than by a CSS class.
  //
  // Hiding it with `hidden lg:block` still builds it: on a phone the whole
  // search form would sit in the page, five fields deep, inside a box nobody
  // can see. It is a second form with the same five labels as the one in the
  // picture, and everything that reads a document rather than looking at it —
  // a screen reader, a password manager, the browser's own autofill — would
  // find two of everything and have to guess which the guest meant. On a phone
  // there is no dock at all now; the Reserve button in the header is one tap
  // to the same place.
  const [wide, setWide] = useState(false)

  // Whether the search box has ever been needed on this page. Same reasoning:
  // it is not built until the guest has scrolled far enough to want it. Once
  // built it stays, so hiding and showing it again is a transition rather than
  // a rebuild.
  const [built, setBuilt] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    // 64rem — the same width Tailwind's `lg` breaks at, written here in the
    // one place the two have to agree.
    const query = window.matchMedia('(min-width: 64rem)')
    const sync = () => setWide(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!wide) return
    // Hysteresis again, for the same reason as the header: the dock has a
    // shadow and a blurred backing, and a page resting on a single threshold
    // would flicker it on and off under a trackpad's inertia.
    const onScroll = () =>
      setShown((was) => {
        const next = was ? window.scrollY > 300 : window.scrollY > 420
        if (next) setBuilt(true)
        return next
      })
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [wide])

  if (hotels.length === 0 || !wide) return null

  return (
    <div
      // aria-hidden while it is off screen: it holds a second copy of every
      // field in the hero's search box, and a screen reader that reads out
      // "Arriving" twice on one page has been told the page has two forms.
      aria-hidden={!shown}
      className={cn(
        // Under the header (z-50) and over the page, but below the phone menu
        // (z-45) — an open menu must not have a search bar floating on it.
        'fixed inset-x-0 z-40 transition-all duration-500 ease-luxe print:hidden',
        // Sits directly beneath whatever height the header currently is. The
        // header publishes that as a custom property when it collapses, so
        // this never has to know how tall the bar happens to be in Kurdish.
        'top-[var(--site-header-h,4.5rem)]',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0',
      )}
    >
      {/* A band behind the pill rather than the pill alone. The reference
          floats its bar straight over the page, which works there because the
          page beneath it is white — over a photograph, which this site has a
          lot of, a floating white pill sits on whatever happens to be behind
          it and the labels stop being readable. The blurred band costs a few
          pixels and makes it work everywhere. */}
      <div className="border-b border-line/70 bg-bone/85 py-2.5 backdrop-blur-md">
        <div className={shell}>
          {built && <StayFinder hotels={hotels} locale={locale} t={t} idPrefix="dock" compact />}
        </div>
      </div>
    </div>
  )
}
