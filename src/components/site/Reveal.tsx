'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

/**
 * Fades and lifts its children into place the first time they are scrolled
 * near. Fires once — content that re-animates every time it passes the
 * viewport feels restless, which is the opposite of the intent.
 *
 * The hidden state lives in CSS under `.js`, so the markup is complete and
 * visible before hydration and for anyone without JavaScript.
 */
export function Reveal({
  children,
  className,
  as: Tag = 'div',
  delay = 0,
  immediate = false,
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
  delay?: number
  /**
   * Skip the fade and paint immediately, for anything above the fold.
   *
   * The hidden state is real CSS — opacity 0 until an observer says otherwise
   * — so content wrapped in this does not exist, visually, until the page has
   * loaded its JavaScript, hydrated, run an effect and finished a 1.1s
   * transition. Below the fold that is a nice piece of motion nobody waits
   * for. At the top of the page it is the largest thing on screen arriving a
   * second and a half late: measured on the booking page, the heading that
   * defines Largest Contentful Paint painted at 1488ms on a page that had
   * finished loading at 238ms. Google measures that number, and so does a
   * guest deciding whether this site works.
   */
  immediate?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(immediate)

  useEffect(() => {
    if (immediate) return
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        }
      },
      // Starts a little before the element arrives, so the motion finishes as
      // it settles into view rather than after.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [immediate])

  return (
    <Tag
      // @ts-expect-error — one ref type across the allowed tags
      ref={ref}
      data-reveal={shown ? 'in' : 'out'}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  )
}
