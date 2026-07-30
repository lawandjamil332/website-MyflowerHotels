import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { toMapsHref, toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { branchLocative } from '@/utilities/teasers'
import { cn } from '@/utilities/ui'
import { OpeningMark, isOpeningSoon, openingLabel } from '@/components/site/OpeningMark'
import { EnquiryForm } from '@/components/site/EnquiryForm'
import { GroupMap } from '@/components/site/GroupMap'
import { PageHero } from '@/components/site/PageHero'
import { SectionHeading } from '@/components/site/SectionHeading'
import { BreadcrumbSchema, ContactSchema } from '@/components/site/StructuredData'
import { Reveal } from '@/components/site/Reveal'
import { WhatsAppMark } from '@/components/site/WhatsAppMark'
import { btnOutline, btnSmall, btnWhatsApp, shell } from '@/components/site/ui'

type Args = { params: Promise<{ locale: string }> }

export default async function ContactPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const [branches, settings] = await Promise.all([getBranches(locale), getSettings(locale)])
  const heroSource = branches[2]?.heroImage ?? branches[0]?.heroImage

  return (
    <>
      <ContactSchema
        siteName={settings.siteName || 'My Flower Hotels'}
        locale={locale}
        branches={branches}
        phone={settings.phone}
        email={settings.email}
      />
      <BreadcrumbSchema locale={locale} trail={[{ name: t.nav.contact }]} />
      <PageHero
        eyebrow={t.contact.eyebrow}
        title={t.nav.contact}
        lead={t.contact.lead}
        imageUrl={mediaUrl(heroSource, 'xlarge')}
        imageAlt={mediaAlt(heroSource)}
      />

      <section className={cn(shell, 'py-20 sm:py-24 lg:py-28')}>
        {branches.length > 0 ? (
          <ol className="border-t border-line">
            {branches.map((branch, i) => {
              const wa = toWhatsAppHref(branch.whatsapp, `${t.branch.enquire} — ${branch.name}`)
              const tel = toTelHref(branch.phone)
              const telAlt = toTelHref(branch.phoneAlt)
              const maps = toMapsHref(branch.googleMapsUrl, branch.latitude, branch.longitude)
              const openingSoon = isOpeningSoon(branch)

              return (
                <Reveal as="li" key={branch.id} delay={(i % 3) * 100}>
                  <div className="grid gap-8 border-b border-line py-12 lg:grid-cols-[0.5fr_1fr_0.8fr] lg:gap-12 lg:py-14">
                    <div>
                      {/* The name is the way through to the hotel. Without
                          this the page was a list of four addresses with no
                          exit — a guest who decided here had to go back to
                          the menu and start again. */}
                      <h2 className="font-display text-3xl leading-tight text-ink">
                        <Link
                          href={`/${locale}/branches/${branch.slug}`}
                          className="link-line tap-safe hover:text-brand"
                        >
                          {branch.name}
                        </Link>
                      </h2>
                      {branchLocative(branch) && (
                        <p className="mt-2 max-w-[22ch] text-sm leading-relaxed text-muted-ink">
                          {branchLocative(branch)}
                        </p>
                      )}
                      {openingSoon && (
                        <OpeningMark
                          label={openingLabel(branch, t.branch.openingSoon)}
                          className="mt-4"
                        />
                      )}
                    </div>

                    <div className="space-y-3 text-sm">
                      {branch.address && (
                        <p className="leading-relaxed whitespace-pre-line text-ink-soft">
                          {branch.address}
                        </p>
                      )}
                      {!openingSoon && tel && (
                        <a
                          href={tel}
                          dir="ltr"
                          className="link-line tap-safe block w-fit text-ink hover:text-brand"
                        >
                          {branch.phone}
                        </a>
                      )}
                      {!openingSoon && telAlt && (
                        <a
                          href={telAlt}
                          dir="ltr"
                          className="link-line tap-safe block w-fit text-ink hover:text-brand"
                        >
                          {branch.phoneAlt}
                        </a>
                      )}
                      {!openingSoon && branch.email && (
                        <a
                          href={`mailto:${branch.email}`}
                          className="link-line tap-safe block w-fit text-muted-ink hover:text-ink"
                        >
                          {branch.email}
                        </a>
                      )}
                      {!openingSoon &&
                        (branch.checkInAnyTime || branch.checkInTime || branch.checkOutTime) && (
                          <p className="pt-1 text-xs text-muted-ink">
                            {(branch.checkInAnyTime || branch.checkInTime) &&
                              `${t.branch.checkIn} ${
                                branch.checkInAnyTime ? t.branch.anyTime : branch.checkInTime
                              }`}
                            {(branch.checkInAnyTime || branch.checkInTime) &&
                              branch.checkOutTime &&
                              '  ·  '}
                            {branch.checkOutTime && `${t.branch.checkOut} ${branch.checkOutTime}`}
                          </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {!openingSoon && wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(btnWhatsApp, btnSmall, 'w-full')}
                        >
                          <WhatsAppMark />
                          {t.common.whatsapp}
                        </a>
                      )}
                      {maps && (
                        <a
                          href={maps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(btnOutline, btnSmall, 'w-full')}
                        >
                          {t.branch.getDirections}
                        </a>
                      )}
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </ol>
        ) : (
          <p className="text-muted-ink">Hotel details will appear here once they are added.</p>
        )}

        {/* Every hotel on one map. Each already carries its own on its own
            page, which only helps once a guest has chosen — this answers the
            question that comes before that: where these four are, and how far
            apart. */}
        <Reveal className="mt-20">
          <SectionHeading title={t.branch.location} className="mb-10" />
          <GroupMap
            pins={branches.map((b) => ({
              slug: b.slug,
              name: b.name,
              address: b.address,
              latitude: b.latitude,
              longitude: b.longitude,
              mapsUrl: b.googleMapsUrl,
              openingSoon: isOpeningSoon(b),
            }))}
            locale={locale}
            t={t}
          />
        </Reveal>

        <Reveal className="mt-16">
          <EnquiryForm t={t} whatsappHref={toWhatsAppHref(settings.whatsapp)} />
        </Reveal>

        {(settings.phone || settings.email || settings.whatsapp) && (
          <Reveal className="mt-16 border border-line rounded-2xl bg-card p-8 sm:p-10">
            <p className="eyebrow">{t.home.ctaEyebrow}</p>
            <h2 className="font-display mt-4 text-2xl text-ink sm:text-3xl">{t.home.ctaTitle}</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-ink">{t.home.ctaLead}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {toWhatsAppHref(settings.whatsapp) && (
                <a
                  href={toWhatsAppHref(settings.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(btnWhatsApp, btnSmall)}
                >
                  <WhatsAppMark />
                  {t.common.whatsapp}
                </a>
              )}
              {toTelHref(settings.phone) && (
                <a href={toTelHref(settings.phone)} dir="ltr" className={cn(btnOutline, btnSmall)}>
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className={cn(btnOutline, btnSmall)}>
                  {settings.email}
                </a>
              )}
            </div>
          </Reveal>
        )}
      </section>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  return { title: t.nav.contact, description: t.contact.lead }
}
