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
import { CurrencyProvider } from '@/components/site/Currency'
import { Hreflang } from '@/components/site/Hreflang'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { ContactDock } from '@/components/site/ContactDock'
import { getSettings } from '@/utilities/getSettings'
import { getBranches } from '@/utilities/branches'
import { toWhatsAppHref } from '@/utilities/contact'

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

  // The floating button used to carry the one group-wide number, which belongs
  // to My Flower 1 — so anyone reading about another hotel and pressing it
  // opened a chat with the wrong front desk. Each hotel that has its own line
  // is offered instead, and the group number only stands in when none do.
  const branches = await getBranches(locale)
  const hotelChats = branches
    .map((branch) => ({
      name: branch.name,
      href: toWhatsAppHref(branch.whatsapp, `${t.branch.enquire} — ${branch.name}`),
    }))
    .filter((chat): chat is { name: string; href: string } => Boolean(chat.href))

  const groupChat = toWhatsAppHref(settings.whatsapp)
  const whatsappTargets =
    hotelChats.length > 0
      ? hotelChats
      : groupChat
        ? [{ name: settings.siteName || 'My Flower Hotels', href: groupChat }]
        : []

  // The same treatment for Instagram: four accounts, one per hotel, so the
  // button asks which. Falls back to a group account only when no hotel has
  // one of its own.
  const hotelGrams = branches
    .filter((branch) => Boolean(branch.instagram))
    .map((branch) => ({ name: branch.name, href: branch.instagram as string }))

  const instagramTargets =
    hotelGrams.length > 0
      ? hotelGrams
      : settings.social?.instagram
        ? [{ name: settings.siteName || 'My Flower Hotels', href: settings.social.instagram }]
        : []

  return (
    <html lang={locale} dir={dir(locale)} suppressHydrationWarning>
      <head>
        <InitTheme />
        {/* Marks the document as scripted before first paint. The scroll-in
            reveals hide themselves only under `.js`, so with JavaScript off
            every section renders visible instead of staying blank. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/favicon-32.png" rel="icon" type="image/png" sizes="32x32" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180" />
        <meta name="theme-color" content="#0f3a5e" />
        <Hreflang locale={locale} />
      </head>
      <body className="bg-bone text-ink antialiased">
        {/* The opening curtain that used to sit here is gone with the rest of
            the editorial treatment. A guest checking a room rate does not want
            to be shown a title sequence first, and no group site has one. */}
        <Providers>
          <CurrencyProvider rate={settings.iqdPerUsd}>
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
            <ContactDock
              whatsapp={whatsappTargets}
              instagram={instagramTargets}
              whatsappLabel={t.common.whatsapp}
              closeLabel={t.common.close}
            />
          </CurrencyProvider>
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
}
