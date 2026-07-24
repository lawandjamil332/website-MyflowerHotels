import type { Metadata } from 'next'
import React from 'react'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'

import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
import '@fontsource/ibm-plex-serif/400.css'
import '@fontsource/ibm-plex-serif/500.css'

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
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="bg-white text-stone-900 antialiased">
        <Providers>
          <AdminBar adminBarProps={{ preview: isEnabled }} />

          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-white"
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
