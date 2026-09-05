'use client'

import { useEffect } from 'react'

import { EVENTS, track } from '@/utilities/track'

/**
 * Counts WhatsApp and telephone taps, everywhere on the site, from one place.
 *
 * These two matter more here than on most hotel websites. Most guests in Erbil
 * do not fill in a form — they press WhatsApp and start typing, or they ring
 * the front desk. A booking funnel that ignores both would report a site
 * converting at almost nothing while the hotel's phone rings all day.
 *
 * It listens on the document rather than being wired into each button, and
 * that is the whole reason it is short. Those buttons are in the footer, the
 * floating dock, the contact page, every hotel page and the booking
 * confirmation — most of them rendered on the server, where an onClick cannot
 * go without turning each into a client component. One listener catches every
 * one of them, including any added later, and nothing has to remember to opt
 * in.
 *
 * `closest` rather than checking the target: the tap lands on the icon or the
 * label inside the link, never on the link itself.
 *
 * Enhanced measurement in Google already records outbound clicks, so wa.me is
 * counted there too — as an anonymous `click` event with a URL to be picked
 * apart. This is the same tap with a name on it and the hotel beside it, which
 * is the difference between a number somebody has to interpret and one they
 * can read.
 */
export const TapTracking: React.FC = () => {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const link = target.closest('a')
      const href = link?.getAttribute('href')
      if (!href) return

      // The hotel this button belongs to, when the markup says. Not always
      // present — the group-wide buttons belong to no single hotel — and an
      // absent one is dropped rather than sent as an empty string.
      const hotel = link?.getAttribute('data-hotel') ?? undefined

      if (href.startsWith('https://wa.me/') || href.includes('web.whatsapp.com')) {
        track(EVENTS.whatsapp, { hotel, page: window.location.pathname })
        return
      }

      if (href.startsWith('tel:')) {
        track(EVENTS.phone, { hotel, page: window.location.pathname })
      }
    }

    // Capture phase, because a tap that navigates away can otherwise unload the
    // page before a bubbled listener runs.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
