'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { locales, localeNames, localeShort, type Locale } from '@/i18n/config'
import { cn } from '@/utilities/ui'

/**
 * Swaps only the locale segment of the current path, so switching language
 * keeps the visitor on the page they were reading rather than dumping them
 * back on the homepage.
 *
 * `tone` exists because the header sits on a photograph until the guest
 * scrolls — the same switcher has to read on both a dark hero and the light
 * bar it becomes.
 */
export function LocaleSwitcher({
  current,
  label,
  tone = 'ink',
  size = 'short',
}: {
  current: Locale
  label: string
  tone?: 'ink' | 'light'
  size?: 'short' | 'full'
}) {
  const pathname = usePathname() || `/${current}`
  const rest = pathname.split('/').slice(2).join('/')

  return (
    <nav
      aria-label={label}
      className={cn(
        'flex items-center gap-1 text-[0.7rem] font-medium tracking-[0.14em] uppercase',
        size === 'full' && 'gap-3 text-sm tracking-normal normal-case',
      )}
    >
      {locales.map((locale, i) => {
        const isCurrent = locale === current
        return (
          <span key={locale} className="flex items-center">
            {i > 0 && size === 'short' && (
              <span
                aria-hidden="true"
                className={cn('mx-0.5', tone === 'light' ? 'text-white/30' : 'text-ink/25')}
              >
                /
              </span>
            )}
            <Link
              href={`/${locale}${rest ? `/${rest}` : ''}`}
              hrefLang={locale}
              aria-label={localeNames[locale]}
              aria-current={isCurrent ? 'true' : undefined}
              className={cn(
                'px-1 py-1 transition-colors duration-500 ease-luxe',
                tone === 'light'
                  ? isCurrent
                    ? 'text-white'
                    : 'text-white/55 hover:text-white'
                  : isCurrent
                    ? 'text-ink'
                    : 'text-muted-ink hover:text-ink',
                isCurrent && 'underline decoration-brand decoration-1 underline-offset-[6px]',
              )}
            >
              {size === 'full' ? localeNames[locale] : localeShort[locale]}
            </Link>
          </span>
        )
      })}
    </nav>
  )
}
