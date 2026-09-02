import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { countWord, fillCount } from '@/i18n/count'
import { getBranches, getFeaturedRooms, getOffers } from '@/utilities/branches'
import { groupIdentity } from '@/utilities/group'
import { getSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { shippedPhoto } from '@/utilities/shippedPhoto'
import { shareImage } from '@/utilities/shareImage'
import { comma } from '@/utilities/format'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
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
import { FaqSchema, GroupSchema, WebSiteSchema } from '@/components/site/StructuredData'
import { Faq } from '@/components/site/Faq'
import { buildGroupFaq } from '@/utilities/faq'
import { pointsRate } from '@/utilities/points'
import { Stars } from '@/components/site/Stars'
import { WhatsAppMark } from '@/components/site/WhatsAppMark'
import { btnLight, btnOnDark, btnPrimary, sectionY, shell } from '@/components/site/ui'

type Args = { params: Promise<{ locale: string }> }

/**
 * One mark per reason to book direct, in the order the dictionary lists them:
 * where the hotels are, how fast a message is answered, and the generator.
 *
 * Drawn here rather than pulled from an icon set, for the same reason the rest
 * of the site draws its own: three shapes is not worth a dependency, and a set
 * would bring a house style with it that is not this one. Indexed rather than
 * keyed by the English title — the titles are translated, so a lookup by title
 * would find nothing on the Kurdish and Arabic pages and leave the cards bare.
 */
const assuranceMarks = [
  // A pin: every hotel is in the middle of the city.
  <svg
    key="place"
    viewBox="0 0 24 24"
    className="h-7 w-7"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>,
  // A message: WhatsApp reaches the front desk.
  <svg
    key="reply"
    viewBox="0 0 24 24"
    className="h-7 w-7"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      d="M20 12a7.5 7.5 0 0 1-7.5 7.5H12l-4.5 2.2.6-2.9A7.5 7.5 0 1 1 20 12Z"
      strokeLinejoin="round"
    />
    <path d="M8.75 11.5h6.5M8.75 14.5h4" strokeLinecap="round" />
  </svg>,
  // A bolt: the power does not stop.
  <svg
    key="power"
    viewBox="0 0 24 24"
    className="h-7 w-7"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M13.2 2.5 5.5 13.4h5.2l-.9 8.1 7.7-10.9h-5.2l.9-8.1Z" strokeLinejoin="round" />
  </svg>,
]

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

  // Four hotels is true and provable. Four hotels *open* is not, while one of
  // them is still being finished, and a guest who reads "Four — Hotels in
  // Erbil" and then finds My Flower 4 marked "opening soon" two sections later
  // has caught the page overstating itself on the one number it leads with.
  // The number stays; what is added is the part that makes it honest.
  const openCount = branches.filter((b) => b.status !== 'openingSoon').length
  const soonCount = n - openCount

  // Lower-cased because it lands mid-sentence, the same way groupIdentity
  // handles it. Kurdish and Arabic have no case, so this changes nothing in
  // either. Counted from the hotels that are open rather than the four that
  // exist: the guests in that figure were welcomed by three hotels, and a
  // number given the wrong scope is the fault this whole band is fixing.
  const openWord = countWord(openCount, locale).toLocaleLowerCase(
    locale === 'en' ? 'en' : undefined,
  )

  // Written once and used three times — the schema description, the site
  // description, and now the sentence in the band beside the photograph. It
  // was already being built twice on this page.
  const identity = groupIdentity(branches, t, locale, settings.establishedYear)

  const payload = await getPayload({ config: configPromise })
  const rate = await pointsRate(payload)
  const faq = buildGroupFaq(branches, t, locale, {
    pointsEnabled: rate.enabled,
    phone: settings.whatsapp || settings.phone,
  })

  return (
    <>
      <GroupSchema
        siteName={siteName}
        locale={locale}
        branches={branches}
        phone={settings.phone}
        email={settings.email}
        establishedYear={settings.establishedYear}
        description={identity}
        logoUrl={mediaUrl(settings.logo)}
        imageUrl={mediaUrl(settings.socialShareImage, 'og') || heroUrl}
        social={[
          settings.social?.instagram,
          settings.social?.facebook,
          settings.social?.tiktok,
          settings.social?.youtube,
        ]}
      />
      <FaqSchema entries={faq} />
      {/* The site itself — its name, the three languages it is published in,
          and the one page here that answers a typed query. */}
      <WebSiteSchema siteName={siteName} locale={locale} description={identity} />
      {/* The search box sits at the top of the picture, above the name, which
          is where the reference puts it and is the right way round: the one
          control a guest came to use should not be something they scroll to.
          It was previously below the hero, which is also why the hero had to
          be kept short — with the control inside it the banner can be a proper
          photograph again. Height comes from the content rather than a fixed
          vh, so nothing is ever clipped in the language with the longest
          labels. */}
      <section className="relative flex min-h-[34rem] flex-col overflow-hidden bg-bark lg:min-h-[40rem]">
        <PhotoFrame
          src={heroUrl}
          alt={mediaAlt(heroBranch?.heroImage) || siteName}
          sizes="100vw"
          monogram={monogramOf(siteName)}
          fallbackSrc={shippedPhoto(heroBranch?.slug)}
          priority
          tone="ink"
          // A slight grade, and the reason is the photographs rather than the
          // design. Every picture this site has is a phone snapshot of a
          // building facade in flat daylight, and dropped straight onto a page
          // they read as documentation. Pulling a little saturation out and a
          // little contrast in settles them into one warm register instead of
          // four different afternoons, which is most of what "art-directed"
          // means when the photography cannot be reshot.
          imageClassName="object-[center_38%] saturate-[0.82] contrast-[1.06]"
        />
        {/* Two layers. The warm one ties the picture to the palette — a flat
            black scrim over a cool photograph leaves the hero grey while the
            rest of the page is ivory and garnet, and that mismatch is half of
            why the top of the page felt like a different site. The vertical
            gradient underneath it is what keeps the type legible. */}
        <div aria-hidden="true" className="absolute inset-0 bg-bark/30 mix-blend-multiply" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-bark/85 via-bark/25 to-bark/40"
        />
        <div aria-hidden="true" className="hero-glow absolute inset-0" />

        {/* Which hotel, which nights, how many — checked against the same
            calendar the site sells from.

            The clearance is the header's own measured height plus a gap,
            published by the bar as a custom property. It used to be a
            hard-coded pt-28 that had to be re-measured by hand every time the
            bar changed, and was one pixel out at tablet widths. */}
        {branches.length > 0 && (
          <div className={cn(shell, 'relative pt-[calc(var(--site-header-h,4.5rem)+1.75rem)]')}>
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

        <div className={cn(shell, 'relative mt-auto pt-14 pb-16 sm:pb-20')}>
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

      <div className="relative z-10 bg-bone">
        {/* Who the group is, and the facts a guest checks, in one band.
            These were two full-height sections — a wall of five numbers on
            ink, then a heading and two sentences on sand — and between them
            they spent six hundred pixels on about forty words. That is what
            made the page read as empty next to a reference that stacks one
            row of cards on the next. Together they are one section that earns
            its height.

            The guest count sits beside the founding year on purpose: a large
            number means little on its own, and "since 2012" is what turns it
            from a boast into a rate. */}
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <SectionHeading
              eyebrow={t.home.introEyebrow}
              title={t.home.introTitle}
              lead={t.home.introBody}
              action={{ href: `/${locale}/about`, label: t.nav.about }}
            />

            {/* Five facts on one rule, each ranged left in its own column.
                They were five centred blocks, which is the arrangement a
                template reaches for and the one that reads as weakest: five
                numbers each finding its own middle line up with nothing, so
                the row has no spine. Ranged left against a hairline they read
                as a table of facts — which is what they are — and the eye runs
                along them instead of hopping.
                Two across on a phone rather than five stacked: they are meant
                to be taken in at a glance, and a column of five cannot be. */}
            <ul className="-mx-4 mt-12 grid grid-cols-2 gap-px border-y border-line bg-line sm:-mx-5 lg:mt-14 lg:grid-cols-3 xl:grid-cols-5">
              {[
                // Dropped rather than shown as zero when the branch query comes
                // back empty: "0 hotels in Erbil" is worse than saying nothing.
                n > 0
                  ? {
                      value: countWord(n, locale),
                      label: t.home.creditHotels,
                      // Only while one is unopened. Once the fourth opens this
                      // disappears on its own, with nobody editing anything.
                      note:
                        soonCount > 0
                          ? t.home.creditHotelsNote
                              .replace('{open}', countWord(openCount, locale))
                              .replace('{soon}', countWord(soonCount, locale))
                          : undefined,
                    }
                  : null,
                settings.establishedYear
                  ? { value: String(settings.establishedYear), label: t.home.creditSince }
                  : null,
                {
                  value: t.home.creditGuestsValue,
                  // "2 million" on its own is a number with no scope, which is
                  // the kind of figure a reader discounts entirely. Saying
                  // which hotels it covers costs four words and makes it a
                  // claim somebody could check.
                  label: t.home.creditGuests.replace('{count}', openWord),
                },
                { value: settings.stars ?? '4', label: t.home.creditStars },
                { value: t.branch.anyTime, label: t.home.creditReception },
              ]
                .filter((c): c is { value: string; label: string; note?: string } => c !== null)
                .map((credit, i) => (
                  <Reveal key={credit.label} delay={i * 80} className="bg-sand px-4 py-7 sm:px-5">
                    {/* Sized down from the four-item version: "2 million" is
                        several times the width of "4", and at the old size it
                        broke its column before it broke the line. */}
                    <p className="font-display text-[1.9rem] leading-none text-balance text-ink sm:text-[2.15rem]">
                      {credit.value}
                    </p>
                    <p className="mt-3 text-[0.88rem] leading-snug text-muted-ink">
                      {credit.label}
                    </p>
                    {credit.note && (
                      <p className="mt-1.5 text-[0.78rem] leading-snug text-muted-ink/80">
                        {credit.note}
                      </p>
                    )}
                  </Reveal>
                ))}
            </ul>
          </div>
        </section>

        {/* The hotels, as a rail. This is the decision the whole site exists
            to help with, so it gets the pattern the eye is trained on. */}
        <section
          id="collection"
          // Clears the header *and* the docked search bar, both of which are
          // fixed to the top — a plain scroll-mt-24 landed this heading
          // underneath them, so "Explore the hotels" jumped to a band whose
          // title was hidden behind the furniture.
          className={cn(shell, 'scroll-mt-[calc(var(--site-header-h,4.5rem)+5rem)]', sectionY)}
        >
          <SectionHeading
            eyebrow={t.branchesPage.eyebrow}
            title={count(t.home.chooseBranch)}
            lead={t.home.chooseBranchLead}
            action={{ href: `/${locale}/branches`, label: t.branchesPage.gridTitle }}
            className="mb-10 lg:mb-12"
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
                eyebrow={t.home.offersEverywhere}
                title={t.home.offersTitle}
                lead={t.home.offersLead}
                className="mb-10 lg:mb-12"
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

        {/* A photograph beside a sentence, rather than a sentence alone.

            This band used to be one line of type centred in about four hundred
            pixels of flat navy. It was there to break up a long scroll, which
            is a real job — but a colour with nothing in it does not break a
            scroll up, it puts a gap in it, and on a page a guest reads at
            speed a gap looks like something that failed to load. The reference
            breaks its scroll with exactly this: a picture on one side, a short
            heading and a sentence on the other, and the way on.

            Left on white: the photograph in it is the size of a section on its
            own, so it separates this band from the one above without a change
            of ground as well. */}
        <section>
          <div className={cn(shell, sectionY)}>
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal className="relative aspect-4/3 overflow-hidden rounded-2xl bg-bark lg:aspect-3/2">
                <PhotoFrame
                  src={mediaUrl(interludeBranch?.heroImage, 'large')}
                  alt={mediaAlt(interludeBranch?.heroImage) || siteName}
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  monogram={monogramOf(interludeBranch?.name || siteName)}
                  fallbackSrc={shippedPhoto(interludeBranch?.slug)}
                  tone="ink"
                />
              </Reveal>

              <Reveal delay={120}>
                <p className="eyebrow mb-3.5">{t.home.introEyebrow}</p>
                <h2 className="font-display display-lg text-balance text-ink">
                  {count(t.home.interlude)}
                </h2>
                <p className="mt-5 max-w-xl text-[1.05rem] leading-[1.65] text-muted-ink sm:text-[1.1rem]">
                  {identity}
                </p>
                <Link href={`/${locale}/branches`} className={cn(btnPrimary, 'mt-8')}>
                  {t.nav.branches}
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Reasons to book direct. A grid of three, not a rail: a rail is for
            a row you scroll through, and three cards on a desktop never
            scrolled — so it drew a pair of dead arrows under every one of
            them. They also had nothing in them but two lines of type in a thin
            rectangle, which is what an empty box looks like. Each carries the
            mark of the thing it is talking about now. */}
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <SectionHeading
              eyebrow={t.home.ctaEyebrow}
              title={t.home.assuranceTitle}
              className="mb-10 lg:mb-12"
            />
            <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
              {t.home.assurance.map((item, i) => (
                <Reveal key={item.title} delay={i * 90} className="h-full">
                  {/* Ranged left, like the heading above it and the cards in
                      every rail. Centred text inside a bordered box is the
                      shape a template makes; here the words start where every
                      other word in the band starts. */}
                  <div className="flex h-full flex-col rounded-2xl border border-line bg-card p-7">
                    <span className="text-brand" aria-hidden="true">
                      {assuranceMarks[i] ?? assuranceMarks[0]}
                    </span>
                    <h3 className="font-display mt-5 text-xl leading-snug text-ink sm:text-[1.4rem]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[0.98rem] leading-relaxed text-muted-ink">
                      {item.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {rooms.length > 0 && (
          <section>
            <div className={cn(shell, sectionY)}>
              <SectionHeading
                eyebrow={t.home.roomsEyebrow}
                title={t.home.featuredRooms}
                lead={t.home.roomsLead}
                action={{ href: `/${locale}/rooms`, label: t.roomsPage.title }}
                className="mb-10 lg:mb-12"
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

        {/* The questions, before the closing picture.
            This is the page that has to compete for "hotels in Erbil", and it
            was the thinnest of the main pages — a hero, four cards and a
            slogan. Somebody arriving on the name alone had to click into a
            hotel before the site told them anything: how many there are,
            whether a card is needed, whether a booking can be undone. */}
        {/* On sand, because the band above it is white too. Two white sections
            running into each other do not read as two sections — they read as
            one very tall one with a lot of nothing in the middle, which is
            most of what made the old page feel empty. The grounds alternate
            all the way down now. */}
        {faq.length > 0 && (
          <section className="bg-sand">
            <div className={cn(shell, sectionY)}>
              <div className="mx-auto max-w-3xl">
                <Faq entries={faq} title={t.faq.groupTitle} />
              </div>
            </div>
          </section>
        )}

        {/* Closing band. A photograph rather than a flat colour, so the page
            hands over to the footer on an image. */}
        <section className="relative flex min-h-[26rem] items-center overflow-hidden bg-bark">
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

  // The homepage competes for the city, not for the brand — somebody typing
  // the brand will find it regardless.
  //
  // The number goes in it. "Hotels in Erbil" is what every hotel in Erbil
  // says; "Four Hotels in Erbil" is the one thing about this group that no
  // competitor in the city can copy, and a title is the single line a search
  // result, a shared link and a browser tab all read from. The region came
  // out to make room — it is already in the description, in the address on
  // every page, and in the structured data — because a title Google truncates
  // at sixty-odd characters spends its last words on nothing.
  //
  // Both halves are checkable: four hotels, and the year the owner entered in
  // settings. Nothing here claims a size, a rank or a first.
  const owned = settings.establishedYear
    ? ` | ${t.seo.ownedSince.replace('{year}', String(settings.establishedYear))}`
    : ''
  const title =
    branches.length > 0
      ? `${siteName} — ${countWord(branches.length, locale)} ${t.seo.hotelsIn} ${t.seo.locality}${owned}`
      : `${siteName} — ${t.seo.hotelsIn} ${t.seo.locality}${comma(locale)} ${t.seo.region}`

  // Written once and used for both. Without it the share card fell through to
  // the English site description, so a homepage link sent in Arabic arrived
  // with an Arabic headline and an English sentence under it.
  const description = `${count(t.home.heroLead)} ${t.home.chooseBranchLead}`

  return {
    title,
    description,
    openGraph: mergeOpenGraph(
      {
        title,
        description,
        images: shareImage(mediaUrl(branches[0]?.heroImage, 'og'), siteName, t.home.heroEyebrow),
      },
      locale,
    ),
  }
}
