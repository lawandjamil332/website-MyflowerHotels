'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'
import { InstagramMark } from './InstagramMark'
import { WhatsAppMark } from './WhatsAppMark'

export type DockTarget = { name: string; href: string }

type Channel = 'whatsapp' | 'instagram'

/**
 * The buttons fixed to the corner of a phone screen: message us, or go and
 * look at us.
 *
 * One component owns both because they share a corner. Written as two
 * independent buttons they would each keep their own open state, and opening
 * the second while the first was still up would stack one panel over the
 * other. Here only one channel can be open at a time.
 *
 * Both keep their own brand colour rather than the site's navy, on the same
 * reasoning as the WhatsApp button in the enquiry forms: a guest recognises
 * these two marks faster than they read any label, and that recognition is the
 * whole reason the button is worth the corner it occupies.
 *
 * A channel with a single destination links straight out — a chooser offering
 * one choice is a tap wasted — and a channel with none does not appear.
 */
export function ContactDock({
  whatsapp,
  instagram,
  whatsappLabel,
  closeLabel,
}: {
  whatsapp: DockTarget[]
  instagram: DockTarget[]
  whatsappLabel: string
  closeLabel: string
}) {
  const [open, setOpen] = useState<Channel | null>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Instagram has no single flat colour — its mark is a gradient, and drawn in
  // one colour it stops being recognisable, which is the only thing this button
  // is for.
  const allChannels: {
    key: Channel
    targets: DockTarget[]
    label: string
    tone: string
    listTone: string
    Mark: (props: { className?: string }) => React.ReactElement
  }[] = [
    {
      key: 'instagram',
      targets: instagram,
      label: 'Instagram',
      tone: 'bg-[linear-gradient(45deg,#f09433_0%,#dc2743_45%,#bc1888_100%)]',
      listTone: 'text-[#dc2743]',
      Mark: InstagramMark,
    },
    {
      key: 'whatsapp',
      targets: whatsapp,
      label: whatsappLabel,
      tone: 'bg-whatsapp',
      listTone: 'text-whatsapp',
      Mark: WhatsAppMark,
    },
  ]

  const channels = allChannels.filter((channel) => channel.targets.length > 0)

  if (channels.length === 0) return null

  const fab =
    'flex h-14 w-14 items-center justify-center rounded-full text-white ring-1 ring-white/25 shadow-[0_10px_40px_-8px_rgb(0_0_0/0.45)] transition-transform duration-500 ease-luxe hover:scale-105 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'

  const openChannel = channels.find((channel) => channel.key === open)

  return (
    // Anchored by its bottom edge, so the panel opening above it grows the
    // stack upward instead of pushing the buttons off the screen.
    <div
      ref={wrap}
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      className="fixed end-5 z-40 flex flex-col items-end gap-3 md:hidden"
    >
      {openChannel && openChannel.targets.length > 1 && (
        <div
          role="dialog"
          aria-label={openChannel.label}
          className="w-[min(17rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-card shadow-[0_24px_70px_-20px_rgb(0_0_0/0.55)]"
        >
          <p className="border-b border-line px-5 pt-4 pb-3 text-[0.7rem] font-semibold tracking-[0.16em] text-muted-ink uppercase rtl:tracking-normal">
            {openChannel.label}
          </p>
          <ul className="divide-y divide-line">
            {openChannel.targets.map((target) => (
              <li key={target.name}>
                <a
                  href={target.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(null)}
                  className="flex items-center gap-3 px-5 py-3.5 text-[0.95rem] text-ink transition-colors duration-300 ease-luxe hover:bg-sand"
                >
                  <openChannel.Mark className={cn('h-4 w-4 shrink-0', openChannel.listTone)} />
                  {target.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {channels.map((channel) =>
        channel.targets.length === 1 ? (
          <a
            key={channel.key}
            href={channel.targets[0].href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={channel.label}
            className={cn(fab, channel.tone)}
          >
            <channel.Mark className="h-6 w-6" />
          </a>
        ) : (
          <button
            key={channel.key}
            type="button"
            onClick={() => setOpen((current) => (current === channel.key ? null : channel.key))}
            aria-expanded={open === channel.key}
            aria-label={open === channel.key ? closeLabel : channel.label}
            className={cn(fab, channel.tone, open === channel.key && 'scale-105')}
          >
            <channel.Mark className="h-6 w-6" />
          </button>
        ),
      )}
    </div>
  )
}
