'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { locales, localeNames, type Locale } from '@/i18n/config'

/**
 * Swaps only the locale segment of the current path, so switching language
 * keeps the visitor on the page they were reading rather than dumping them
 * back on the homepage.
 */
export function LocaleSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname() || `/${current}`
  const rest = pathname.split('/').slice(2).join('/')

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-sm">
      {locales.map((locale) => {
        const isCurrent = locale === current
        return (
          <Link
            key={locale}
            href={`/${locale}${rest ? `/${rest}` : ''}`}
            hrefLang={locale}
            aria-current={isCurrent ? 'true' : undefined}
            className={
              isCurrent
                ? 'rounded-full bg-stone-900 px-3 py-1 text-white'
                : 'rounded-full px-3 py-1 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900'
            }
          >
            {localeNames[locale]}
          </Link>
        )
      })}
    </nav>
  )
}
