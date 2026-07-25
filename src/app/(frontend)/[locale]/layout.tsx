import type { Metadata } from 'next'
import React from 'react'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'

// Body text, Latin and Arabic script, from one designed-together family.
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
// Headings. Latin subsets only for Cormorant — the Arabic and Kurdish glyphs
// come from Noto Naskh, so shipping its Cyrillic and Vietnamese ranges would
// be weight nobody on this site ever renders.
import '@fontsource/cormorant-garamond/latin-300.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/noto-naskh-arabic/arabic-400.css'
import '@fontsource/noto-naskh-arabic/arabic-500.css'

import '../globals.css'

import { AdminBar } from '@/components/AdminBar'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { dir, isLocale, locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'
import { getSettings } from '@/utilities/getSettings'

// The database is not reachable during the deploy build, so pages render on
// request. It also means content edited in the admin panel appears at once.
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Args = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const { isEnabled } = await draftMode()
  const t = getDictionary(locale)
  const settings = await getSettings(locale)

  return (
    <html lang={locale} dir={dir(locale)} suppressHydrationWarning>
      <head>
        <InitTheme />
        {/* Marks the document as scripted before first paint. The scroll-in
            reveals hide themselves only under `.js`, so with JavaScript off
            every section renders visible instead of staying blank. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');try{if(sessionStorage.getItem('overture'))document.documentElement.classList.add('overture-seen');else sessionStorage.setItem('overture','1')}catch(e){}`,
          }}
        />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="bg-bone text-ink antialiased">
        {/* Lifts off the page on the first view of a session. Marked
            aria-hidden because it is scenery — the page beneath it is already
            complete and readable to a screen reader. */}
        <div className="overture" aria-hidden="true">
          <span className="overture-mark font-display text-2xl tracking-[0.3em] uppercase sm:text-3xl">
            {settings.siteName || 'Myflower Hotels'}
          </span>
        </div>

        <Providers>
          <AdminBar adminBarProps={{ preview: isEnabled }} />

          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:bg-ink focus:px-4 focus:py-2 focus:text-bone"
          >
            {t.common.skipToContent}
          </a>

          <SiteHeader locale={locale} t={t} settings={settings} />
          <main id="main">{children}</main>
          <SiteFooter locale={locale} t={t} settings={settings} />
          <WhatsAppButton phone={settings.whatsapp} label={t.common.whatsapp} />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
}
