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
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
  delay?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
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
  }, [])

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
