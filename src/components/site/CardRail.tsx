'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

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
 * arrows are the only scripted part, and they hide themselves when there is
 * nothing to scroll to.
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
  }, [])

  useEffect(() => {
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
          // The scrollbar is noise under a row of photographs; the arrows and
          // the partly-visible next card already say it scrolls.
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4',
        )}
      >
        {children}
      </div>

      <div className="mt-7 flex justify-end gap-3">
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
      className={cn(
        'w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%] xl:w-[23.5%]',
        className,
      )}
    >
      {children}
    </article>
  )
}
