'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { Locale } from '@/i18n/config'
import { formatPrice } from '@/utilities/format'
import { cn } from '@/utilities/ui'

type Display = 'IQD' | 'USD'

type Ctx = {
  display: Display
  setDisplay: (d: Display) => void
  /** Dinars per dollar, or null when the owner has not entered a rate. */
  rate: number | null
}

const CurrencyContext = createContext<Ctx>({ display: 'IQD', setDisplay: () => {}, rate: null })

const STORAGE_KEY = 'mf-currency'

/**
 * Lets a guest read room rates in dinars or dollars.
 *
 * Rooms are priced in dinars, which is right for the people who live here and
 * unhelpful for the ones flying in: a rate in the hundreds of thousands reads
 * as expensive until you divide it, and doing that arithmetic on a phone is
 * exactly the friction that loses a booking.
 *
 * The conversion is one rate the owner keeps roughly current, not a live feed.
 * That is honest for a room rate — nobody settles an account against a hotel
 * website — and it means the page never waits on, or breaks with, a currency
 * API. With no rate entered the switch does not appear at all and every price
 * stays exactly as it was.
 */
export function CurrencyProvider({
  rate,
  children,
}: {
  rate?: number | null
  children: React.ReactNode
}) {
  const usable = typeof rate === 'number' && Number.isFinite(rate) && rate > 0 ? rate : null
  const [display, setDisplayState] = useState<Display>('IQD')

  // Read the stored choice after mount rather than during render: the server
  // has no idea what this guest picked last time, and rendering dollars on the
  // client while the server sent dinars is a hydration mismatch.
  useEffect(() => {
    if (!usable) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'USD' || saved === 'IQD') setDisplayState(saved)
    } catch {
      // Private browsing can refuse storage; the default is fine.
    }
  }, [usable])

  const setDisplay = useCallback((next: Display) => {
    setDisplayState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not being able to remember the choice is not a reason to ignore it.
    }
  }, [])

  return (
    <CurrencyContext.Provider value={{ display, setDisplay, rate: usable }}>
      {children}
    </CurrencyContext.Provider>
  )
}

/**
 * A price, in whichever currency the guest is reading in.
 *
 * Only dinar prices convert. A room already priced in dollars, or in anything
 * else, is shown as entered — converting a currency we have no rate for would
 * be inventing a number.
 */
export function Price({
  amount,
  currency,
  locale,
  className,
}: {
  amount?: number | null
  currency?: string | null
  locale: Locale
  className?: string
}) {
  const { display, rate } = useContext(CurrencyContext)
  if (typeof amount !== 'number' || Number.isNaN(amount)) return null

  const base = (currency || 'IQD').toUpperCase()
  const convertible = base === 'IQD' && rate !== null && display === 'USD'

  if (!convertible) {
    return <span className={className}>{formatPrice(amount, base, locale)}</span>
  }

  // Rounded to whole dollars: a hotel rate carrying cents implies a precision
  // a hand-kept rate does not have.
  const dollars = Math.round(amount / (rate as number))
  return <span className={className}>{formatPrice(dollars, 'USD', locale)}</span>
}

/** The switch itself. Renders nothing when there is no rate to switch with. */
export function CurrencySwitch({ label, className }: { label: string; className?: string }) {
  const { display, setDisplay, rate } = useContext(CurrencyContext)
  if (rate === null) return null

  return (
    <div
      className={cn('inline-flex items-center rounded-full border border-line p-0.5', className)}
      role="group"
      aria-label={label}
    >
      {(['IQD', 'USD'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setDisplay(code)}
          aria-pressed={display === code}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition-colors duration-300 ease-luxe',
            display === code ? 'bg-brand text-white' : 'text-muted-ink hover:text-ink',
          )}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
