import Link from 'next/link'

import { btnPrimary, shell } from '@/components/site/ui'
import { cn } from '@/utilities/ui'

export default function NotFound() {
  return (
    <section className="flex min-h-[70svh] items-center bg-bone">
      <div className={cn(shell, 'pt-[calc(var(--site-header-h,4.5rem)+4rem)] pb-28')}>
        {/* The eyebrow's own colour, on the page's own ground. This page was
            painted near-black to sit under a white wordmark, which meant "404"
            was drawn in a dark grey on a dark ground and was, in practice,
            not there. The bar above is pale now and so is this. */}
        <p className="eyebrow">404</p>
        <h1 className="font-display mt-5 max-w-2xl text-4xl leading-[1.1] text-ink sm:text-6xl">
          This page could not be found.
        </h1>
        <Link href="/" className={cn(btnPrimary, 'mt-10')}>
          Go to the homepage
        </Link>
      </div>
    </section>
  )
}
