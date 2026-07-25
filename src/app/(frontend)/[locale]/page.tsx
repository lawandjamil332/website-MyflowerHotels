import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches, getFeaturedRooms } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { toBranchTeaser } from '@/utilities/teasers'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { cn } from '@/utilities/ui'
import { BranchSwitcher } from '@/components/site/BranchSwitcher'
import { Reveal } from '@/components/site/Reveal'
import { RoomCard } from '@/components/site/RoomCard'
import { SectionHeading } from '@/components/site/SectionHeading'
import { WhatsAppMark } from '@/components/site/WhatsAppMark'
import { btnLight, btnOnDark, btnPrimary, sectionY, shell } from '@/components/site/ui'

type Args = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const [branches, rooms, settings] = await Promise.all([
    getBranches(locale),
    getFeaturedRooms(locale, 6),
    getSettings(locale),
  ])

  // The hero borrows the first branch's photograph. Photography is the design,
  // and this avoids a stock image standing in for the group's real hotels.
  const heroBranch = branches[0]
  const heroUrl = mediaUrl(heroBranch?.heroImage, 'xlarge')
  const siteName = settings.siteName || 'Myflower Hotels'
  const tel = toTelHref(settings.phone)
  const wa = toWhatsAppHref(settings.whatsapp)

  // A second photograph for the closing band, so the page does not open and
  // close on the same image.
  const closingBranch = branches[1] ?? branches[0]
  const closingUrl = mediaUrl(closingBranch?.heroImage, 'xlarge')

  return (
    <>
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={mediaAlt(heroBranch?.heroImage) || siteName}
            fill
            sizes="100vw"
            className="ken-burns object-cover"
            priority
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40"
        />

        <div className={cn(shell, 'relative pt-40 pb-24 sm:pb-32')}>
          <p className="eyebrow">{t.home.heroEyebrow}</p>
          <h1 className="font-display mt-6 max-w-4xl text-5xl leading-[1.02] text-balance text-white sm:text-7xl lg:text-8xl">
            {siteName}
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/75 sm:text-xl">
            {t.home.heroLead}
          </p>

          <div className="mt-11 flex flex-wrap gap-3 sm:gap-4">
            <Link href="#collection" className={btnLight}>
              {t.home.exploreCollection}
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={btnOnDark}>
                <WhatsAppMark />
                {t.common.whatsapp}
              </a>
            )}
          </div>
        </div>

        {/* Quiet indication that the page continues, instead of a bouncing
            chevron. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 hidden justify-center pb-8 sm:flex"
        >
          <span className="relative block h-14 w-px overflow-hidden bg-white/20">
            <span className="animate-[scroll-cue_2.6s_var(--ease-luxe)_infinite] absolute inset-x-0 top-0 block h-6 bg-brass-bright" />
          </span>
        </div>
      </section>

      {/* The group in its own words, set as an editorial spread rather than a
          centred paragraph. */}
      <section className={cn(shell, sectionY)}>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">{t.home.introEyebrow}</p>
            <h2 className="font-display mt-5 text-4xl leading-[1.1] text-balance text-ink sm:text-5xl">
              {t.home.introTitle}
            </h2>
          </Reveal>

          <Reveal delay={120} className="lg:pt-3">
            <p className="max-w-xl text-lg leading-[1.75] text-ink-soft sm:text-xl">
              {t.home.introBody}
            </p>
            <Link
              href={`/${locale}/about`}
              className="link-line mt-8 inline-block text-[0.7rem] tracking-[0.22em] text-ink uppercase rtl:tracking-normal"
            >
              {t.nav.about}
            </Link>
          </Reveal>
        </div>
      </section>

      {/* The branch switcher: the group's real differentiator, given the room
          to be a decision rather than a dropdown. */}
      <section id="collection" className={cn(shell, 'scroll-mt-24 pb-20 sm:pb-28 lg:pb-36')}>
        <SectionHeading
          eyebrow={t.home.collectionEyebrow}
          title={t.home.chooseBranch}
          lead={t.home.chooseBranchLead}
          className="mb-12 lg:mb-16"
        />

        {branches.length > 0 ? (
          <BranchSwitcher branches={branches.map(toBranchTeaser)} locale={locale} t={t} />
        ) : (
          <div className="border border-dashed border-line p-12 text-center text-muted-ink">
            <p>No hotels have been added yet.</p>
            <p className="mt-1.5 text-sm">
              Add them in the admin panel and they will appear here automatically.
            </p>
          </div>
        )}
      </section>

      {/* Three reasons to trust the group, set as type on a hairline grid —
          the brief rules out floating icon cards, and numbers read calmer. */}
      <section className="bg-sand">
        <div className={cn(shell, sectionY)}>
          <ul className="grid border-t border-line lg:grid-cols-3">
            {t.home.assurance.map((item, i) => (
              <Reveal
                as="li"
                key={item.title}
                delay={i * 120}
                className="border-line pt-8 pb-2 lg:pe-10 lg:ps-10 lg:not-first:border-s lg:first:ps-0"
              >
                <span className="text-xs tracking-[0.2em] tabular-nums text-brass">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display mt-4 text-2xl leading-snug text-ink">{item.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-ink">{item.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {rooms.length > 0 && (
        <section className={cn(shell, sectionY)}>
          <SectionHeading
            eyebrow={t.home.roomsEyebrow}
            title={t.home.featuredRooms}
            lead={t.home.roomsLead}
            className="mb-12 lg:mb-16"
          />
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <Reveal key={room.id} delay={(i % 3) * 110}>
                <RoomCard room={room} locale={locale} t={t} showBranch priority={i === 0} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Closing band. A photograph rather than a flat colour, so the page
          hands over to the footer on an image. */}
      <section className="relative flex min-h-[60vh] items-center overflow-hidden bg-ink">
        {closingUrl ? (
          <Image
            src={closingUrl}
            alt={mediaAlt(closingBranch?.heroImage) || siteName}
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div aria-hidden="true" className="absolute inset-0 bg-black/65" />

        <div className={cn(shell, 'relative py-24 text-center sm:py-32')}>
          <Reveal className="mx-auto max-w-2xl">
            <p className="eyebrow">{t.home.ctaEyebrow}</p>
            <h2 className="font-display mt-5 text-4xl leading-[1.1] text-balance text-white sm:text-5xl lg:text-6xl">
              {t.home.ctaTitle}
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              {t.home.ctaLead}
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={btnLight}>
                  <WhatsAppMark />
                  {t.common.whatsapp}
                </a>
              )}
              {tel && (
                <a href={tel} className={btnOnDark} dir="ltr">
                  {t.common.call}
                </a>
              )}
              {!wa && !tel && (
                <Link href={`/${locale}/contact`} className={btnPrimary}>
                  {t.nav.contact}
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const settings = await getSettings(locale)
  const t = getDictionary(locale)
  const siteName = settings.siteName || 'Myflower Hotels'

  return {
    title: siteName,
    description: `${t.home.heroLead} ${t.home.chooseBranchLead}`,
  }
}
