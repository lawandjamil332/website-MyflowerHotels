'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { use } from 'react'

/**
 * What a guest sees when a page throws.
 *
 * Without this file Next.js serves its own default: an unstyled page reading
 * "Application error: a client-side exception has occurred". A guest who hits
 * that on the way to booking a room does not try again — they have no reason
 * to think anything here works.
 *
 * So this stays inside the site: the hotel's name, a way to try again, and the
 * telephone number, because the one thing a guest needs when the website has
 * failed is a way to reach a person that does not involve the website.
 */
export default function LocaleError({
  error,
  reset,
  params,
}: {
  error: Error & { digest?: string }
  reset: () => void
  params?: Promise<{ locale: string }>
}) {
  // Resolved where possible so the message is in the language they were
  // reading; English if the route parameters are part of what broke.
  const resolved = params ? use(params) : undefined
  const locale: Locale = resolved && isLocale(resolved.locale) ? (resolved.locale as Locale) : 'en'
  const t = getDictionary(locale)

  useEffect(() => {
    // The digest is the only handle on the server-side stack, and without it
    // in the browser console a report of "it broke" cannot be traced to
    // anything in the logs.
    console.error('Page error', error.digest ?? '', error.message)
  }, [error])

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-6 py-20 text-center">
      <p className="text-[0.62rem] tracking-[0.22em] text-brand uppercase rtl:tracking-normal">
        {t.errors.eyebrow}
      </p>
      <h1 className="font-display mt-4 text-3xl leading-tight text-ink sm:text-4xl">
        {t.errors.title}
      </h1>
      <p className="mt-5 leading-relaxed text-muted-ink">{t.errors.body}</p>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="tap-safe rounded-full bg-brand px-7 py-3 text-sm text-white transition-opacity hover:opacity-90"
        >
          {t.errors.retry}
        </button>
        <Link
          href={`/${locale}`}
          className="tap-safe rounded-full border border-line px-7 py-3 text-sm text-ink hover:border-ink"
        >
          {t.errors.home}
        </Link>
      </div>

      {error.digest && (
        // Shown, not hidden: it is the one thing that lets somebody on the
        // phone find this exact failure in the log.
        <p className="mt-10 text-[0.7rem] tracking-wide text-muted-ink" dir="ltr">
          {t.errors.reference} {error.digest}
        </p>
      )}
    </section>
  )
}
