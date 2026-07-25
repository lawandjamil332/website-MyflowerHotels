import Link from 'next/link'

import { btnLight, shell } from '@/components/site/ui'
import { cn } from '@/utilities/ui'

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center bg-ink">
      <div className={cn(shell, 'py-32')}>
        <p className="eyebrow">404</p>
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
