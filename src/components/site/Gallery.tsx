'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { cn } from '@/utilities/ui'

export type GalleryItem = { url: string; alt: string; full?: string }

/**
 * A mosaic rather than an even grid: photographs of a hotel are not all worth
 * the same amount of space, and a repeating 7/5 rhythm reads as a magazine
 * spread instead of a contact sheet.
 *
 * Tapping a photograph opens it full-screen — on a phone the thumbnails are
 * too small to judge a room by, which is the whole reason the guest is here.
 */
export function Gallery({ items, className }: { items: GalleryItem[]; className?: string }) {
  const [openAt, setOpenAt] = useState<number | null>(null)

  const close = useCallback(() => setOpenAt(null), [])
  const step = useCallback(
    (delta: number) =>
      setOpenAt((current) =>
        current === null ? null : (current + delta + items.length) % items.length,
      ),
    [items.length],
  )

  useEffect(() => {
    if (openAt === null) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      // Arrow keys stay literal: the lightbox mirrors under RTL, but the
      // right-hand key still means "the one drawn to the right".
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [openAt, close, step])

  if (items.length === 0) return null

  // Repeating wide/narrow rhythm across each pair of rows.
  const spans = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7']

  return (
    <>
      <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-12', className)}>
        {items.map((item, i) => (
          <button
            key={`${item.url}-${i}`}
            type="button"
            onClick={() => setOpenAt(i)}
            className={cn(
              // Fixed row height on the mosaic breakpoint: with aspect ratios
              // a 7-column tile is taller than a 5-column one, which leaves
              // holes in the grid instead of a spread.
              'group relative aspect-4/3 overflow-hidden rounded-2xl bg-sand focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none lg:aspect-auto lg:h-[21rem]',
              spans[i % spans.length],
            )}
          >
            <Image
              src={item.url}
              alt={item.alt}
              fill
              sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-1000 ease-luxe group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openAt !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex flex-col bg-bark/97 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-5 py-5 text-white sm:px-8">
            <span className="text-xs tracking-[0.2em] tabular-nums text-white/60">
              {String(openAt + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="text-[0.7rem] tracking-[0.22em] uppercase transition-colors duration-500 hover:text-brand rtl:tracking-normal"
            >
              ✕
            </button>
          </div>

          <div className="relative flex-1">
            <Image
              src={items[openAt].full || items[openAt].url}
              alt={items[openAt].alt}
              fill
              sizes="100vw"
              className="object-contain p-4 sm:p-10"
            />
          </div>

          {items.length > 1 && (
            <div className="flex items-center justify-center gap-4 px-5 py-6">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous"
                className="border border-white/25 px-6 py-3 text-white transition-colors duration-500 hover:border-white hover:bg-white hover:text-ink"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next"
                className="border border-white/25 px-6 py-3 text-white transition-colors duration-500 hover:border-white hover:bg-white hover:text-ink"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
