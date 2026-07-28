'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'
import { WhatsAppMark } from './WhatsAppMark'

export type WhatsAppTarget = { name: string; href: string }

/**
 * Fixed to the bottom of the screen on phones. The brief is explicit that in
 * this market WhatsApp converts better than any form, so it stays reachable on
 * every page rather than living only on the contact page.
 *
 * It used to carry the one group-wide number, which is My Flower 1's line — so
 * a guest reading about My Flower 3 who pressed the WhatsApp button on that
 * page started a conversation with a different hotel. Every hotel keeps its
 * own line, so the button asks which one.
 *
 * With a single number it still links straight out: a chooser offering one
 * choice is a tap wasted.
 */
export function WhatsAppButton({
  targets,
  label,
  chooseLabel,
  closeLabel,
}: {
  targets: WhatsAppTarget[]
  label: string
  /** Heading over the list, e.g. "WhatsApp". */
  chooseLabel: string
  closeLabel: string
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (targets.length === 0) return null

  const fab =
    'flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white ring-1 ring-white/25 shadow-[0_10px_40px_-8px_rgb(0_0_0/0.45)] transition-transform duration-500 ease-luxe hover:scale-105 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'

  return (
    <div
      ref={wrap}
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      className="fixed end-5 z-40 md:hidden"
    >
      {open && targets.length > 1 && (
        <div
          role="dialog"
          aria-label={chooseLabel}
          className="absolute end-0 bottom-[4.5rem] w-[min(17rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-card shadow-[0_24px_70px_-20px_rgb(0_0_0/0.55)]"
        >
          <p className="border-b border-line px-5 pt-4 pb-3 text-[0.7rem] font-semibold tracking-[0.16em] text-muted-ink uppercase rtl:tracking-normal">
            {chooseLabel}
          </p>
          <ul className="divide-y divide-line">
            {targets.map((target) => (
              <li key={target.name}>
                <a
                  href={target.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 text-[0.95rem] text-ink transition-colors duration-300 ease-luxe hover:bg-sand"
                >
                  <WhatsAppMark className="h-4 w-4 shrink-0 text-whatsapp" />
                  {target.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {targets.length === 1 ? (
        <a
          href={targets[0].href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={fab}
        >
          <WhatsAppMark className="h-6 w-6" />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? closeLabel : label}
          className={cn(fab, open && 'scale-105')}
        >
          <WhatsAppMark className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
