import Link from 'next/link'

import { btnLight, shell } from '@/components/site/ui'
import { cn } from '@/utilities/ui'

export default function NotFound() {
  return (
    <section className="flex min-h-[70svh] items-center bg-bark">
      <div className={cn(shell, 'pt-[calc(var(--site-header-h,4.5rem)+4rem)] pb-28')}>
        {/* text-white, not the eyebrow's default. That default is the brand
            garnet, and this page is painted near-black — so "404" was being
            drawn in a dark red on a dark ground and was, in practice, not
            there. The same fault the footer's column headings had. */}
        <p className="eyebrow text-white">404</p>
        <h1 className="font-display mt-5 max-w-2xl text-4xl leading-[1.1] text-white sm:text-6xl">
          This page could not be found.
        </h1>
        <Link href="/" className={cn(btnLight, 'mt-10')}>
          Go to the homepage
        </Link>
      </div>
    </section>
  )
}
