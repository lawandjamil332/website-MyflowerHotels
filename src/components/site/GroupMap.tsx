'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { toMapsHref } from '@/utilities/contact'
import { cn } from '@/utilities/ui'

export type MapPin = {
  slug: string
  name: string
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  mapsUrl?: string | null
  openingSoon?: boolean
}

/**
 * All the group's hotels on one map, with the list beside it.
 *
 * Each hotel already carries a map on its own page, which only helps a guest
 * who has picked one. The question this answers is the earlier one — where
 * these places are in relation to each other and to the city — and it is the
 * question a group of four addresses in one city most needs to answer.
 *
 * The frame is OpenStreetMap rather than Google. Google's embed wants a
 * billable API key, and a map that stops working when a card expires is worse
 * than no map; this needs no key, no account and no quota. It shows one hotel
 * at a time because the free embed carries a single marker — so the list is
 * the real control, and selecting a hotel moves the map to it.
 *
 * The list is also the fallback. An iframe on somebody else's server fails for
 * reasons nothing here controls, and when it does two thirds of this panel is
 * an empty rectangle — so every hotel in the list carries its address and a
 * directions link of its own, and a map that never loads costs a guest
 * nothing.
 */
export function GroupMap({ pins, locale, t }: { pins: MapPin[]; locale: Locale; t: Dictionary }) {
  const located = pins.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number',
  )
  const [active, setActive] = useState(0)

  if (located.length === 0) return null

  const current = located[Math.min(active, located.length - 1)]
  const lat = current.latitude as number
  const lng = current.longitude as number
  // A tight box around the pin — roughly a few streets either side, which is
  // the zoom at which a guest can recognise the neighbourhood.
  const d = 0.008
  const bbox = [lng - d, lat - d / 2, lng + d, lat + d / 2].join('%2C')
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`

  return (
    <div className="grid gap-0 overflow-hidden rounded-2xl border border-line lg:grid-cols-[0.8fr_1.2fr]">
      <ul className="divide-y divide-line bg-bone">
        {located.map((pin, i) => {
          const selected = i === Math.min(active, located.length - 1)
          return (
            // The links are siblings of the button, not children of it.
            //
            // "View details" used to sit inside the <button> that selects the
            // hotel. A link inside a button is invalid HTML and browsers do not
            // agree on what it means: the click can land on the button, on the
            // link, or on both, and a keyboard sees one control where there are
            // two. So the one link on this panel that leaves for the hotel's
            // own page was a coin toss. The button is now just the row you
            // press to move the map, and the links below it are links.
            <li
              key={pin.slug}
              className={cn(
                'transition-colors duration-300 ease-luxe',
                selected ? 'bg-sand' : 'hover:bg-sand/60',
              )}
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={selected}
                className={cn(
                  'flex w-full flex-col items-start gap-1 px-6 pt-5 text-start',
                  selected ? 'pb-2' : 'pb-5',
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold',
                      selected ? 'bg-brand text-white' : 'bg-line text-muted-ink',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="font-display text-lg text-ink">{pin.name}</span>
                </span>
                {pin.address && (
                  <span className="ps-9 text-sm leading-relaxed text-muted-ink">{pin.address}</span>
                )}
              </button>

              {selected && (
                // Directions beside the details link, and it is not a
                // convenience — it is what this panel falls back to.
                //
                // The map is an iframe on somebody else's server. It fails for
                // reasons nothing here controls: a blocker, a phone with no
                // signal left, OpenStreetMap having a bad morning. When it
                // does, the right-hand two thirds of this panel is an empty
                // grey rectangle — on the page whose entire job is telling a
                // guest where these hotels are. With the address above and a
                // working directions link here, the map failing costs a guest
                // nothing they cannot get from the list itself.
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-5 pe-6 ps-[3.75rem]">
                  <Link
                    href={`/${locale}/branches/${pin.slug}`}
                    className="tap-safe text-[0.85rem] font-semibold text-brand underline underline-offset-4"
                  >
                    {t.common.viewDetails}
                  </Link>
                  {toMapsHref(pin.mapsUrl, pin.latitude, pin.longitude) && (
                    <a
                      href={toMapsHref(pin.mapsUrl, pin.latitude, pin.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-safe text-[0.85rem] font-semibold text-brand underline underline-offset-4"
                    >
                      {t.branch.getDirections}
                    </a>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="relative min-h-[20rem] bg-line/40 lg:min-h-[26rem]">
        <iframe
          // Re-mounts per hotel so the frame actually moves rather than
          // keeping whatever it loaded first.
          key={current.slug}
          src={src}
          title={`${current.name} — ${t.branch.location}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  )
}
