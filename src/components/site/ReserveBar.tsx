'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/utilities/ui'
import { WhatsAppMark } from './WhatsAppMark'
import { btnPrimary, btnSmall, shell } from './ui'

/**
 * The bar that slides up once the hotel's own reserve card has scrolled away.
 *
 * On a phone the card holding the phone number and the WhatsApp button sits
 * near the top of the page, and everything a guest reads to make up their mind
 * — rooms, amenities, the address — is below it. By the time they have
 * decided, the way to act on it is several screens behind them. This keeps it
 * one thumb-reach away for the whole page.
 *
 * It appears only after that card is genuinely out of view, watched with an
 * observer rather than a scroll offset, so it never doubles up with the card
 * it stands in for.
 */
export function ReserveBar({
  title,
  meta,
  whatsappHref,
  telHref,
  reserveLabel,
  whatsappLabel,
  callLabel,
  /** Element to watch; the bar shows only once this has left the screen. */
  watch,
}: {
  title: string
  meta?: string
  whatsappHref?: string
  telHref?: string
  reserveLabel: string
  whatsappLabel: string
  callLabel: string
  watch: string
}) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const target = document.getElementById(watch)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only once the card has passed *upwards* out of view. Without the
        // boundingClientRect check the bar would also appear before the guest
        // has scrolled down to the card at all.
        setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [watch])

  if (!whatsappHref && !telHref) return null

  return (
    <div
      className={cn(
        // Below the header (z-50) and above the page, but clear of the
        // floating WhatsApp circle so the two never stack on a phone.
        'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bone/95 backdrop-blur',
        'transition-transform duration-500 ease-luxe',
        'shadow-[0_-8px_28px_-18px_rgb(0_0_0/0.45)]',
        shown ? 'translate-y-0' : 'translate-y-full',
      )}
      // Hidden from assistive tech while off-screen: the same actions are
      // already in the page, and announcing them twice is noise.
      aria-hidden={!shown}
      inert={!shown ? true : undefined}
    >
      <div className={cn(shell, 'flex items-center justify-between gap-4 py-3.5')}>
        <div className="min-w-0">
          <p className="font-display truncate text-lg leading-tight text-ink">{title}</p>
          {meta && <p className="truncate text-sm text-muted-ink">{meta}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {telHref && (
            <a
              href={telHref}
              dir="ltr"
              className="hidden rounded-full border border-brand/40 px-5 py-2.5 text-[0.85rem] font-semibold text-brand transition-colors duration-300 ease-luxe hover:bg-sand sm:inline-flex"
            >
              {callLabel}
            </a>
          )}
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(btnPrimary, btnSmall)}
            >
              <WhatsAppMark />
              <span className="hidden sm:inline">{whatsappLabel}</span>
              <span className="sm:hidden">{reserveLabel}</span>
            </a>
          ) : (
            telHref && (
              <a href={telHref} dir="ltr" className={cn(btnPrimary, btnSmall, 'sm:hidden')}>
                {callLabel}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  )
}
