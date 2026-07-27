import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { countWord, fillCount } from '@/i18n/count'
import { getBranches, getFeaturedRooms, getOffers } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { shippedPhoto } from '@/utilities/shippedPhoto'
import { shareImage } from '@/utilities/shareImage'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { cn } from '@/utilities/ui'
import { BranchCard } from '@/components/site/BranchCard'
import { CardRail, RailCard } from '@/components/site/CardRail'
import { OfferCard } from '@/components/site/OfferCard'
import { PhotoFrame } from '@/components/site/PhotoFrame'
import { monogramOf } from '@/utilities/monogram'
import { Reveal } from '@/components/site/Reveal'
import { RoomCard } from '@/components/site/RoomCard'
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
  const [branches, rooms, offers, settings] = await Promise.all([
    getBranches(locale),
    getFeaturedRooms(locale, 4),
    getOffers(locale),
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
      {/* A banner, not a title card. It is deliberately short: the search box
          below it is the most useful thing on this page, and a hero that fills
          the screen pushes the one control a guest came to use below the fold.
          Capped in rem as well as vh so it stays a band on a tall monitor. */}
      <section className="relative flex h-[62svh] max-h-[34rem] min-h-[22rem] items-end overflow-hidden bg-ink">
        <PhotoFrame
          src={heroUrl}
          alt={mediaAlt(heroBranch?.heroImage) || siteName}
          sizes="100vw"
          monogram={monogramOf(siteName)}
          fallbackSrc={shippedPhoto(heroBranch?.slug)}
          priority
          tone="ink"
          imageClassName="object-[center_28%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/45"
        />
        <div aria-hidden="true" className="hero-glow absolute inset-0" />

        <div className={cn(shell, 'relative pt-28 pb-16 sm:pb-20')}>
          <div className="rise flex items-center gap-4" style={{ animationDelay: '0.2s' }}>
            <p className="eyebrow text-white">{t.home.heroEyebrow}</p>
            <Stars count={settings.stars} tone="light" />
          </div>
          <h1
            className="font-display display-hero text-hero rise mt-4 max-w-4xl text-balance"
            style={{ animationDelay: '0.3s' }}
          >
            {siteName}
          </h1>
          <p
            className="rise mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
            style={{ animationDelay: '0.4s' }}
          >
            {count(t.home.heroLead)}
          </p>

          <div className="rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: '0.5s' }}>
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
      </section>

      {/* flow-root, and it is load-bearing. The search pill below is lifted onto
          the hero with a negative top margin, and as the first child of this
          block that margin collapsed straight through the parent — dragging
          the bone background up with it, painting out the bottom of the
          photograph, and landing the pill on a white strip instead of the
          picture. flow-root gives this block its own formatting context so the
          pill moves and the background stays where it was put. */}
      <div className="relative z-10 flow-root bg-bone">
        {/* Which hotel, which nights, how many — carried into the enquiry
            rather than checked against availability nobody is holding. */}
        {branches.length > 0 && (
          <div className={cn(shell, 'relative -mt-12 pb-12 lg:-mt-16 lg:pb-16')}>
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
        {/* The facts a guest checks first, before they scroll for them. The
            guest count sits next to the founding year on purpose: a large
            number means little on its own, and "since 2012" is what turns it
            from a boast into a rate. */}
        <section className="bg-ink">
          <ul
            className={cn(
              shell,
              'grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:py-20 xl:grid-cols-5',
            )}
          >
            {[
              // Dropped rather than shown as zero when the branch query comes
              // back empty: "0 hotels in Erbil" is worse than saying nothing.
              n > 0 ? { value: countWord(n, locale), label: t.home.creditHotels } : null,
              settings.establishedYear
                ? { value: String(settings.establishedYear), label: t.home.creditSince }
                : null,
              { value: t.home.creditGuestsValue, label: t.home.creditGuests },
              { value: settings.stars ?? '4', label: t.home.creditStars },
              { value: t.branch.anyTime, label: t.home.creditReception },
            ]
              .filter((c): c is { value: string; label: string } => c !== null)
              .map((credit, i) => (
                <Reveal key={credit.label} delay={i * 90} className="text-center">
                  {/* Sized down from the four-item version: "1.5 million+" is
                    three times the width of "4", and at the old size it broke
                    its column before it broke the line. */}
                  <p className="font-display text-hero text-4xl leading-tight text-balance sm:text-5xl">
                    {credit.value}
                  </p>
                  <p className="mt-3 text-[0.95rem] text-white/70">{credit.label}</p>
                </Reveal>
              ))}
          </ul>
        </section>

        {/* Who the group is, in one band. */}
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <SectionHeading
              title={t.home.introTitle}
              lead={t.home.introBody}
              action={{ href: `/${locale}/about`, label: t.nav.about }}
            />
          </div>
        </section>

        {/* The hotels, as a rail. This is the decision the whole site exists
            to help with, so it gets the pattern the eye is trained on. */}
        <section id="collection" className={cn(shell, 'scroll-mt-24', sectionY)}>
          <SectionHeading
            title={count(t.home.chooseBranch)}
            lead={t.home.chooseBranchLead}
            className="mb-12 lg:mb-16"
          />

          {branches.length > 0 ? (
            <CardRail label={t.nav.branches}>
              {branches.map((branch, i) => (
                <RailCard key={branch.id}>
                  <BranchCard branch={branch} locale={locale} t={t} priority={i < 2} />
                </RailCard>
              ))}
            </CardRail>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-12 text-center text-muted-ink">
              <p>No hotels have been added yet.</p>
              <p className="mt-1.5 text-sm">
                Add them in the admin panel and they will appear here automatically.
              </p>
            </div>
          )}
        </section>

        {/* Deals, when there are any. With none entered the band does not
            appear at all rather than standing empty. */}
        {offers.length > 0 && (
          <section className="bg-sand">
            <div className={cn(shell, sectionY)}>
              <SectionHeading
                title={t.home.offersTitle}
                lead={t.home.offersLead}
                className="mb-12 lg:mb-16"
              />
              <CardRail label={t.home.offersTitle}>
                {offers.map((offer, i) => (
                  <RailCard key={offer.id}>
                    <OfferCard offer={offer} locale={locale} t={t} priority={i < 2} />
                  </RailCard>
                ))}
              </CardRail>
            </div>
          </section>
        )}

        {/* One line of colour across the page, the way the reference breaks up
            a long scroll without spending another photograph on it. */}
        <section className="bg-brand">
          <div className={cn(shell, 'py-16 text-center sm:py-20')}>
            <Reveal>
              <p className="font-display mx-auto max-w-3xl text-balance text-2xl leading-snug text-white sm:text-3xl">
                {count(t.home.interlude)}
              </p>
            </Reveal>
          </div>
        </section>

        {/* Reasons to book direct, as bordered cards in a rail. */}
        <section className={cn(shell, sectionY)}>
          <SectionHeading title={t.home.assuranceTitle} className="mb-12 lg:mb-16" />
          <CardRail label={t.home.assuranceTitle}>
            {t.home.assurance.map((item) => (
              <RailCard key={item.title}>
                <div className="flex h-full flex-col rounded-2xl border border-line p-8 text-center">
                  <h3 className="font-display text-2xl leading-snug text-ink">{item.title}</h3>
                  <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-ink">{item.body}</p>
                </div>
              </RailCard>
            ))}
          </CardRail>
        </section>

        {rooms.length > 0 && (
          <section className="bg-sand">
            <div className={cn(shell, sectionY)}>
              <SectionHeading
                title={t.home.featuredRooms}
                lead={t.home.roomsLead}
                action={{ href: `/${locale}/rooms`, label: t.nav.rooms }}
                className="mb-12 lg:mb-16"
              />
              <CardRail label={t.nav.rooms}>
                {rooms.map((room, i) => (
                  <RailCard key={room.id}>
                    <RoomCard room={room} locale={locale} t={t} showBranch priority={i < 2} />
                  </RailCard>
                ))}
              </CardRail>
            </div>
          </section>
        )}

        {/* Closing band. A photograph rather than a flat colour, so the page
            hands over to the footer on an image. */}
        <section className="relative flex min-h-[26rem] items-center overflow-hidden bg-ink">
          {mediaUrl(closingBranch?.heroImage, 'xlarge') ? (
            <Image
              src={mediaUrl(closingBranch?.heroImage, 'xlarge')}
              alt={mediaAlt(closingBranch?.heroImage) || siteName}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div aria-hidden="true" className="absolute inset-0 bg-black/70" />

          <div className={cn(shell, 'relative py-20 text-center sm:py-24')}>
            <Reveal className="mx-auto max-w-2xl">
              <h2 className="font-display display-lg text-balance text-white">{t.home.ctaTitle}</h2>
              <p className="mx-auto mt-5 max-w-lg text-[1.05rem] leading-relaxed text-white/85 sm:text-[1.15rem]">
                {t.home.ctaLead}
              </p>

              <div className="mt-9 flex flex-wrap justify-center gap-3 sm:gap-4">
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
