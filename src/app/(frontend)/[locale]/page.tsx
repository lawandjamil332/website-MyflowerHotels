import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { countWord, fillCount } from '@/i18n/count'
import { getBranches, getFeaturedRooms } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { toBranchTeaser } from '@/utilities/teasers'
import { shippedPhoto } from '@/utilities/shippedPhoto'
import { shareImage } from '@/utilities/shareImage'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { cn } from '@/utilities/ui'
import { BranchSwitcher } from '@/components/site/BranchSwitcher'
import { PhotoFrame } from '@/components/site/PhotoFrame'
import { monogramOf } from '@/utilities/monogram'
import { Reveal } from '@/components/site/Reveal'
import { RoomFeature } from '@/components/site/RoomFeature'
import { SectionHeading } from '@/components/site/SectionHeading'
import { StayFinder } from '@/components/site/StayFinder'
import { GroupSchema } from '@/components/site/StructuredData'
import { Stars } from '@/components/site/Stars'
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
    getFeaturedRooms(locale, 4),
    getSettings(locale),
  ])

  // The hero borrows the first branch's photograph. Photography is the design,
  // and this avoids a stock image standing in for the group's real hotels.
  const heroBranch = branches[0]
  const heroUrl = mediaUrl(heroBranch?.heroImage, 'xlarge')
  const siteName = settings.siteName || 'My Flower Hotels'
  const tel = toTelHref(settings.phone)
  const wa = toWhatsAppHref(settings.whatsapp)

  // Two further photographs, so the page does not open, pause and close on the
  // same image.
  const interludeBranch = branches[2] ?? branches[0]
  const closingBranch = branches[1] ?? branches[0]

  // Sentences that spell the number out are filled from the branches actually
  // published, so opening a fifth hotel does not leave the copy saying four.
  const n = branches.length
  const count = (template: string) => fillCount(template, n, locale)

  return (
    <>
      <GroupSchema
        siteName={siteName}
        locale={locale}
        branches={branches}
        phone={settings.phone}
        establishedYear={settings.establishedYear}
      />
      {/* The hero stays put while the page slides up over it. A pure-CSS
          parallax: no scroll listener, no jank, and it gives the opening the
          weight of a title card rather than a banner. */}
      <section className="sticky top-0 flex h-svh items-end overflow-hidden bg-ink">
        <PhotoFrame
          src={heroUrl}
          alt={mediaAlt(heroBranch?.heroImage) || siteName}
          sizes="100vw"
          monogram={monogramOf(siteName)}
          fallbackSrc={shippedPhoto(heroBranch?.slug)}
          priority
          tone="ink"
          imageClassName="ken-burns object-[center_28%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/65"
        />
        <div aria-hidden="true" className="hero-glow absolute inset-0" />

        <div className={cn(shell, 'relative pt-40 pb-24 sm:pb-28')}>
          <div className="rise flex items-center gap-4" style={{ animationDelay: '0.55s' }}>
            <p className="eyebrow">{t.home.heroEyebrow}</p>
            <Stars count={settings.stars} />
          </div>
          <h1
            className="font-display display-hero text-gilt rise mt-7 max-w-5xl text-balance"
            style={{ animationDelay: '0.7s' }}
          >
            {siteName}
          </h1>
          <div aria-hidden="true" className="rule-gilt rise mt-8 w-40" style={{ animationDelay: '0.8s' }} />
          <p
            className="rise mt-8 max-w-lg text-lg leading-relaxed text-white/75 sm:text-xl xl:max-w-2xl xl:text-2xl"
            style={{ animationDelay: '0.9s' }}
          >
            {count(t.home.heroLead)}
          </p>

          <div
            className="rise mt-11 flex flex-wrap gap-3 sm:gap-4"
            style={{ animationDelay: '1.05s' }}
          >
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

      {/* Everything below rides over the pinned hero on its own ground. */}
      <div className="relative z-10 bg-bone">
        {/* Which hotel, which nights, how many — carried into the enquiry
            rather than checked against availability nobody is holding. */}
        {branches.length > 0 && (
          <div className={cn(shell, 'relative -mt-12 lg:-mt-16')}>
            <StayFinder
              hotels={branches.map((b) => ({
                slug: b.slug,
                name: b.name,
                openingSoon: b.status === 'openingSoon',
              }))}
              locale={locale}
              t={t}
            />
          </div>
        )}
        {/* The four things a guest here checks first, answered before they
            have to scroll for them. */}
        <section className="bg-ink">
          <ul className={cn(shell, 'grid gap-px py-14 sm:grid-cols-2 lg:grid-cols-4 lg:py-16')}>
            {[
              { value: countWord(n, locale), label: t.home.creditHotels },
              { value: settings.establishedYear ? String(settings.establishedYear) : '—', label: t.home.creditSince },
              { value: settings.stars ?? '4', label: t.home.creditStars },
              { value: t.branch.anyTime, label: t.home.creditReception },
            ].map((credit, i) => (
              <Reveal
                key={credit.label}
                delay={i * 110}
                className="border-white/10 px-2 text-center lg:not-first:border-s"
              >
                <p className="font-display text-gilt text-4xl leading-none sm:text-5xl">
                  {credit.value}
                </p>
                <p className="mt-3 text-[0.6rem] tracking-[0.24em] text-white/45 uppercase rtl:tracking-normal">
                  {credit.label}
                </p>
              </Reveal>
            ))}
          </ul>
        </section>
        {/* The group in its own words, set as an editorial spread rather than
            a centred paragraph. */}
        <section className={cn(shell, sectionY)}>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <Reveal>
              <div className="flex items-center gap-4">
                <span className="text-xs tracking-[0.2em] tabular-nums text-muted-ink/60">01</span>
                <span aria-hidden="true" className="h-px w-8 bg-line" />
                <p className="eyebrow">{t.home.introEyebrow}</p>
              </div>
              <h2 className="font-display display-lg mt-6 text-balance text-ink">
                {t.home.introTitle}
              </h2>
            </Reveal>

            <Reveal delay={120} className="lg:pt-3">
              <p className="max-w-xl text-lg leading-[1.75] text-ink-soft sm:text-xl xl:max-w-2xl xl:text-[1.375rem]">
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

        {/* The branch switcher: the group's real differentiator, given the
            room to be a decision rather than a dropdown. */}
        <section id="collection" className={cn(shell, 'scroll-mt-24 pb-20 sm:pb-28 lg:pb-36')}>
          <SectionHeading
            index={2}
            eyebrow={t.home.collectionEyebrow}
            title={count(t.home.chooseBranch)}
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

        {/* A held breath between sections: one photograph, one line, nothing
            to click. */}
        <section className="relative flex h-[65vh] items-center justify-center overflow-hidden bg-ink sm:h-[80vh]">
          {mediaUrl(interludeBranch?.heroImage, 'xlarge') ? (
            <Image
              src={mediaUrl(interludeBranch?.heroImage, 'xlarge')}
              alt={mediaAlt(interludeBranch?.heroImage) || siteName}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div aria-hidden="true" className="absolute inset-0 bg-black/65" />
          <Reveal className={cn(shell, 'relative text-center')}>
            <p className="font-display display-lg mx-auto max-w-3xl text-balance text-white">
              {count(t.home.interlude)}
            </p>
          </Reveal>
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
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-ink">
                    {item.body}
                  </p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {rooms.length > 0 && (
          <section className={cn(shell, sectionY)}>
            <SectionHeading
              index={3}
              eyebrow={t.home.roomsEyebrow}
              title={t.home.featuredRooms}
              lead={t.home.roomsLead}
              className="mb-16 lg:mb-24"
            />
            <div className="flex flex-col gap-20 lg:gap-32">
              {rooms.map((room, i) => (
                <Reveal key={room.id}>
                  <RoomFeature room={room} locale={locale} t={t} index={i} priority={i === 0} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* Closing band. A photograph rather than a flat colour, so the page
            hands over to the footer on an image. */}
        <section className="relative flex min-h-[60vh] items-center overflow-hidden bg-ink">
          {mediaUrl(closingBranch?.heroImage, 'xlarge') ? (
            <Image
              src={mediaUrl(closingBranch?.heroImage, 'xlarge')}
              alt={mediaAlt(closingBranch?.heroImage) || siteName}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div aria-hidden="true" className="absolute inset-0 bg-black/75" />

          <div className={cn(shell, 'relative py-24 text-center sm:py-32')}>
            <Reveal className="mx-auto max-w-2xl">
              <p className="eyebrow">{t.home.ctaEyebrow}</p>
              <h2 className="font-display display-xl mt-6 text-balance text-white">
                {t.home.ctaTitle}
              </h2>
              <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-white/70 xl:max-w-2xl xl:text-xl">
                {t.home.ctaLead}
              </p>

              <div className="mt-11 flex flex-wrap justify-center gap-3 sm:gap-4">
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
      </div>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const [settings, branches] = await Promise.all([getSettings(locale), getBranches(locale)])
  const t = getDictionary(locale)
  const siteName = settings.siteName || 'My Flower Hotels'
  const count = (template: string) => fillCount(template, branches.length, locale)

  return {
    title: siteName,
    description: `${count(t.home.heroLead)} ${t.home.chooseBranchLead}`,
    openGraph: {
      title: siteName,
      images: shareImage(mediaUrl(branches[0]?.heroImage, 'og'), siteName, t.home.heroEyebrow),
    },
  }
}
