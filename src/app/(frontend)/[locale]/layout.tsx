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
// Headings. Latin subsets only for Fraunces — the Arabic and Kurdish glyphs
// come from Noto Naskh, so shipping ranges this site never draws would be
// weight paid for on every first visit and never used.
//
// Three weights and no more. 600 is what `.font-display` asks for and is the
// one every heading uses; 400 is for the few places a serif runs at body size;
// 700 is held for the rare line that has to carry more. The body sets
// `font-synthesis-weight: none`, so a weight that is asked for and not loaded
// is silently served as the nearest one that is — which is how every headline
// on the site spent months a step lighter than the design asked for.
import '@fontsource/fraunces/latin-400.css'
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/fraunces/latin-700.css'
import '@fontsource/noto-naskh-arabic/arabic-400.css'
import '@fontsource/noto-naskh-arabic/arabic-500.css'
import '@fontsource/noto-naskh-arabic/arabic-600.css'

import '../globals.css'

import { AdminBar } from '@/components/AdminBar'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { GOOGLE_SITE_VERIFICATION, SITE_NAME } from '@/utilities/site'
import { dir, isLocale, locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { CurrencyProvider } from '@/components/site/Currency'
import { Hreflang } from '@/components/site/Hreflang'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { ContactDock } from '@/components/site/ContactDock'
import { StayFinderDock } from '@/components/site/StayFinderDock'
import { getSettings } from '@/utilities/getSettings'
import { getBranches } from '@/utilities/branches'
import { toMapsHref, toWhatsAppHref } from '@/utilities/contact'

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

  // And the same for the map. A guest standing in Erbil with the site open has
  // one question the page cannot answer — which of these is nearest me, and how
  // do I get there — and the answer lives in an app they already have.
  //
  // Per hotel, never for the group: four hotels in one city have four pins, and
  // a single "find us" that opened one of them would be the same fault the
  // WhatsApp button had before it was split, sending everybody to My Flower 1.
  //
  // `toMapsHref` is what the hotel pages and the booking emails already use, so
  // a hotel with no share link pasted in still gets a pin from its coordinates
  // rather than dropping off the list.
  const mapsTargets = branches
    .map((branch) => ({
      name: branch.name,
      href: toMapsHref(branch.googleMapsUrl, branch.latitude, branch.longitude),
    }))
    .filter((target): target is { name: string; href: string } => Boolean(target.href))

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
        {/* The tab icon was a navy square with gold petals that nobody at the
            hotel recognised — a mark drawn here rather than the group's own,
            on the reasoning that a detailed logo turns to mush at 16px. It
            does lose detail at that size; it is still theirs, and a stranger's
            flower on the tab is worse than a small version of the real one.
            The SVG is gone, and every size below is cut from the actual mark.
            Listed smallest first, so a browser picking the first workable
            entry does not download 192px to draw 16. */}
        <link href="/favicon.ico" rel="icon" sizes="16x16 32x32 48x48" />
        <link href="/favicon-32.png" rel="icon" type="image/png" sizes="32x32" />
        <link href="/favicon-192.png" rel="icon" type="image/png" sizes="192x192" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180" />
        {/* The icons existed in /public and nothing pointed at the manifest,
            so "Add to Home Screen" saved a browser screenshot rather than the
            hotel. */}
        <link href="/manifest.webmanifest" rel="manifest" />
        {/* The colour a phone paints its own chrome with, and it has to be
            the colour of the bar directly under it or the two read as two
            different sites stacked. It was the footer's near-black, from when
            the masthead was near-black too; the masthead is the page's own
            pale ground now, so this is that. */}
        <meta name="theme-color" content="#fbfcfd" />
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
            {/* Rides at the top of every page once the guest scrolls, so the
                dates they have just decided on can be typed where they are
                rather than back at the top of the homepage. */}
            <StayFinderDock
              locale={locale}
              t={t}
              hotels={branches.map((branch) => ({
                slug: branch.slug,
                name: branch.name,
                openingSoon: branch.status === 'openingSoon',
              }))}
            />
            <main id="main">{children}</main>
            <SiteFooter locale={locale} t={t} settings={settings} />
            <ContactDock
              whatsapp={whatsappTargets}
              instagram={instagramTargets}
              maps={mapsTargets}
              whatsappLabel={t.common.whatsapp}
              mapsLabel={t.branch.getDirections}
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
  // Every page's own title, then the group's name. Set once here rather than
  // appended by hand on each page — the page that forgot would be the one
  // whose search result read "Contact" and nothing else, which tells a
  // searcher nothing about whose contact page it is.
  title: {
    template: `%s | ${SITE_NAME}`,
    default: SITE_NAME,
  },
  openGraph: mergeOpenGraph(),
  // Search Console's ownership check. Emitted on every page rather than only
  // the homepage: the site's root redirects to /en, and a verifier that does
  // not follow that redirect would find nothing at the address it was given.
  verification: { google: GOOGLE_SITE_VERIFICATION },
}
