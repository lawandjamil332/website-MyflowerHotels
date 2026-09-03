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

  // On ink, like the "page not found" page beside it — and not only for the
  // family resemblance.
  //
  // Light, like the rest of the site. This page once had to be painted dark
  // because the navigation floated over it in white and a white page under a
  // white wordmark would have looked like the site had failed twice. The bar
  // is a pale band with dark type on it now, so the page a guest lands on when
  // something has gone wrong is the same colour as every page that worked.
  return (
    <section className="flex min-h-[70svh] items-center bg-bone text-center">
      <div className="mx-auto w-full max-w-xl px-6 pt-[calc(var(--site-header-h,4.5rem)+3rem)] pb-20">
        <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-muted-ink uppercase rtl:tracking-normal">
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
            className="tap-safe rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-bright"
          >
            {t.errors.retry}
          </button>
          <Link
            href={`/${locale}`}
            className="tap-safe rounded-full border border-brand/60 px-7 py-3 text-sm font-semibold text-brand hover:border-brand hover:bg-brand hover:text-white"
          >
            {t.errors.home}
          </Link>
        </div>

        {error.digest && (
          // Shown, not hidden: it is the one thing that lets somebody on the
          // phone find this exact failure in the log.
          <p className="mt-10 text-[0.7rem] tracking-wide text-white/55" dir="ltr">
            {t.errors.reference} {error.digest}
          </p>
        )}
      </div>
    </section>
  )
}
