'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

/**
 * useLayoutEffect in the browser, useEffect on the server.
 *
 * React warns that useLayoutEffect does nothing during server rendering, and
 * the usual dodge is to pick between the two. That choice used to be made
 * inside the component, which put a hook behind a local variable the linter
 * could not follow: it stopped recognising the call below as an effect at all
 * and started reporting the ref read inside it as a ref read during render.
 * Hoisted here it is a module constant named like a hook, which is both the
 * conventional spelling of this and legible to the rules.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * A row of cards you swipe, with a pair of round arrows for the people who
 * will not swipe.
 *
 * This is the single pattern the reference site is built out of — offers,
 * hotel types, reasons to book, brands, all of it is this same row repeated
 * down the page. Copying its colours without copying this is why an earlier
 * pass here still read as a magazine wearing a hotel group's palette: a
 * stacked column of full-width sections is a completely different object to a
 * page of rails, however it is painted.
 *
 * Built on scroll-snap rather than a carousel library: it works with a thumb,
 * a trackpad, a scrollbar and the keyboard for free, it costs no JavaScript to
 * render, and with scripting off the row is still there and still scrolls. The
 * arrows are the only scripted part, and they take themselves off the page
 * when the row fits — which is most of them on a wide screen.
 */
export function CardRail({
  children,
  label,
  className,
  tone = 'ink',
}: {
  children: React.ReactNode
  /** Names the row for screen readers, e.g. "Our hotels". */
  label: string
  className?: string
  tone?: 'ink' | 'light'
}) {
  const rail = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  // Starts true so the server renders the arrows and a page with no JavaScript
  // keeps them. The first measurement corrects it before paint.
  const [scrollable, setScrollable] = useState(true)

  const measure = useCallback(() => {
    const el = rail.current
    if (!el) return
    // In a right-to-left row scrollLeft runs negative in most browsers, so
    // distance is measured on the absolute value and the ends read the same
    // way in all three languages.
    const x = Math.abs(el.scrollLeft)
    const max = el.scrollWidth - el.clientWidth
    setAtStart(x <= 2)
    setAtEnd(x >= max - 2)
    setScrollable(max > 2)
  }, [])

  // Layout effect, not effect: this can remove the arrows, and doing that after
  // the browser has painted would shift everything below the rail up by the
  // height of a control the guest never saw. Measured before paint, the row
  // simply arrives in its settled state.
  useIsomorphicLayoutEffect(() => {
    const el = rail.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure])

  const step = (direction: 1 | -1) => {
    const el = rail.current
    if (!el) return
    const rtl = getComputedStyle(el).direction === 'rtl'
    // One card plus its gap, so a press always lands on a card edge.
    const first = el.firstElementChild as HTMLElement | null
    const amount = first ? first.getBoundingClientRect().width + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: amount * direction * (rtl ? -1 : 1), behavior: 'smooth' })
  }

  const arrow =
    tone === 'light'
      ? 'border-white/50 text-white hover:bg-white hover:text-ink disabled:opacity-25'
      : 'border-brand/40 text-brand hover:bg-brand hover:text-white disabled:opacity-25'

  return (
    <div className={className}>
      <div
        ref={rail}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          'flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1',
          // A row with fewer cards than fit was left hanging off the leading
          // edge with a quarter of the band empty beside it — three cards in a
          // space built for four read as a row that had failed to load. When
          // there is nothing to scroll, the cards sit in the middle instead.
          !scrollable && 'justify-center',
          // The scrollbar is noise under a row of photographs; the arrows and
          // the partly-visible next card already say it scrolls.
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4',
        )}
      >
        {children}
      </div>

      {/* Only when there is somewhere to go. These used to render always and
          merely disable themselves, so every rail that fitted its band — which
          on a desktop was all of them — closed with a pair of dead circles. */}
      <div className={cn('mt-7 flex justify-end gap-3', !scrollable && 'hidden')}>
        {([-1, 1] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            onClick={() => step(direction)}
            disabled={direction === -1 ? atStart : atEnd}
            aria-label={direction === -1 ? `${label}: previous` : `${label}: next`}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 ease-luxe',
              arrow,
            )}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={cn('h-4 w-4', direction === -1 && 'rotate-180', 'rtl:-scale-x-100')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * One card in the rail. Sized so the next one is always partly visible —
 * that peek is what tells a thumb there is more without any instruction.
 */
export function RailCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <article
      // Three across at the widest, not four. At 1440px a four-up rail gave
      // each hotel about 230 pixels — the photographs are the reason anybody
      // books, and at that size they were thumbnails. Three lets them breathe
      // and leaves the fourth card half-shown at the edge, which is the thing
      // that tells a reader the row scrolls at all.
      className={cn('w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]', className)}
    >
      {children}
    </article>
  )
}
