import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { countWord, fillCount } from '@/i18n/count'
import { getSettings } from '@/utilities/getSettings'
import { getBranches } from '@/utilities/branches'
import { groupIdentity, localClaim } from '@/utilities/group'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { cn } from '@/utilities/ui'
import { BranchCard } from '@/components/site/BranchCard'
import { CardRail, RailCard } from '@/components/site/CardRail'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import { SectionHeading } from '@/components/site/SectionHeading'
import { Faq } from '@/components/site/Faq'
import { BreadcrumbSchema, FaqSchema, GroupSchema } from '@/components/site/StructuredData'
import { buildGroupFaq } from '@/utilities/faq'
import { pointsRate } from '@/utilities/points'
import { sectionY, shell } from '@/components/site/ui'

type Args = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const [settings, branches] = await Promise.all([getSettings(locale), getBranches(locale)])
  const siteName = settings.siteName || 'My Flower Hotels'

  // Falls back through the branches, so the page still opens on a photograph
  // before anyone has uploaded a share image in settings.
  const heroSource = settings.socialShareImage ?? branches[0]?.heroImage
  const interlude = branches[1]?.heroImage ?? branches[0]?.heroImage

  // Counted from the hotels rather than written down, so "all in Erbil"
  // becomes "across Iraq" on its own the day one opens elsewhere.
  const identity = groupIdentity(branches, t, locale, settings.establishedYear)

  // Only ever present once the owner has set a date in Site settings. Kept
  // out of `identity`, which is the site's description everywhere — a dated
  // claim has no business in a meta description or in structured data.
  const claim = localClaim(branches, t, locale, settings.localClaimCheckedOn)

  const payload = await getPayload({ config: configPromise })
  const rate = await pointsRate(payload)
  const faq = buildGroupFaq(branches, t, locale, {
    pointsEnabled: rate.enabled,
    phone: settings.whatsapp || settings.phone,
    establishedYear: settings.establishedYear,
  })

  return (
    <>
      <BreadcrumbSchema locale={locale} trail={[{ name: t.nav.about }]} />
      {/* The company, on the page about the company. This lived only on the
          homepage, so the one URL a person or a crawler follows to find out
          who runs these hotels described the hotels and never the group —
          and every `parentOrganization` on the site pointed at an entity this
          page did not itself declare. Same `@id`, so the two are one record. */}
      <GroupSchema
        siteName={siteName}
        locale={locale}
        branches={branches}
        phone={settings.phone}
        email={settings.email}
        establishedYear={settings.establishedYear}
        description={identity}
        logoUrl={mediaUrl(settings.logo)}
        imageUrl={mediaUrl(settings.socialShareImage, 'og') || mediaUrl(heroSource, 'og')}
        social={[
          settings.social?.instagram,
          settings.social?.facebook,
          settings.social?.tiktok,
          settings.social?.youtube,
        ]}
      />
      <FaqSchema entries={faq} />
      <PageHero
        title={siteName}
        lead={fillCount(t.about.lead, branches.length, locale)}
        imageUrl={mediaUrl(heroSource, 'xlarge')}
        imageAlt={mediaAlt(heroSource)}
      />

      {/* The story, ranged left in one column with the group's own statement
          across from it.

          It was a centred band: heading centred, two paragraphs centred under
          it, and a third centred under a rule. Three centred blocks stacked is
          the arrangement that made every page on this site look like a
          template — each block finds its own middle, so nothing lines up with
          the heading, the hero or the cards further down. Ranged left they are
          one column a reader runs down, and the ownership sentence gets the
          facing half rather than a rule and more centred type. */}
      <section className="bg-sand">
        <div className={cn(shell, sectionY)}>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div>
              <SectionHeading
                eyebrow={t.about.eyebrow}
                title={t.home.introTitle}
                lead={t.about.body1}
              />
              {/* Set to match SectionHeading's own lead exactly, so the two
                  paragraphs read as one column rather than two treatments. */}
              <Reveal delay={120} className="mt-5 max-w-2xl">
                <p className="text-[1.05rem] leading-[1.65] text-muted-ink sm:text-[1.1rem]">
                  {t.about.body2}
                </p>
              </Reveal>
            </div>

            {/* Who owns this and how many there are, in one sentence, stated
                plainly enough to be quoted. Most of the multi-property hotel
                names here are foreign operators running a local building;
                independent and Kurdish-owned across four hotels is the
                genuinely unusual thing here, and it was nowhere on the site. */}
            <Reveal delay={200} className="lg:pt-2">
              <div className="border-s-2 border-mist ps-6">
                <p className="font-display text-[1.25rem] leading-[1.5] text-balance text-ink sm:text-[1.4rem]">
                  {identity}
                </p>
                {/* What separates this group from the international brands it
                    gets compared with, stated as structure rather than as a
                    ranking. A foreign brand's four hotels in a country are
                    four buildings owned by four investors with the brand
                    managing or franchising each; these four are one family's.
                    It sits above the dated claim because it is a fact about
                    how the company is put together, not a comparison anybody
                    has to keep re-checking.

                    The count is capitalised here, unlike everywhere else it is
                    filled in, because this sentence opens with it. */}
                <p className="mt-5 leading-[1.85] text-ink-soft">
                  {fillCount(t.about.ownershipStructure, branches.length, locale)}
                </p>
                {/* Set in smaller, quieter type than the two sentences above.
                    Those are facts about who owns this company; this is a
                    comparison the group believes and has dated, and reading as
                    slightly more careful than the lines before it is exactly
                    right. */}
                {claim && (
                  <p className="mt-5 text-[0.92rem] leading-[1.7] text-muted-ink">{claim}</p>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* A full-bleed breath between the story and the hotels themselves —
          with something written on it.

          It used to be 60vh of bare photograph: on a laptop, five hundred
          pixels of a phone snapshot of a facade and nothing else, sitting
          between two blocks of type. A picture carrying no words in the middle
          of a page reads as a gap somebody filled rather than a thing somebody
          chose. Where it is and how long it has been there is already written
          in two places on this site, so it costs no new sentence to say it
          here, and the plate becomes a statement.

          Fixed heights rather than vh, so it is the same plate on a laptop and
          on a tall monitor instead of growing to half of whatever screen it
          lands on. The grade and the gradient are the hero's, which is what
          keeps the four different afternoons these photographs were taken on
          reading as one page. */}
      {mediaUrl(interlude, 'xlarge') && (
        <div className="relative flex h-[20rem] items-end overflow-hidden bg-bark sm:h-[25rem] lg:h-[30rem]">
          <Image
            src={mediaUrl(interlude, 'xlarge')}
            alt={mediaAlt(interlude) || siteName}
            fill
            sizes="100vw"
            className="object-cover saturate-[0.82] contrast-[1.06]"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-bark/18 mix-blend-multiply" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-bark/80 via-bark/20 to-transparent"
          />
          <div className={cn(shell, 'relative pb-10 sm:pb-12')}>
            <p className="font-display text-[1.5rem] leading-tight text-balance text-white sm:text-[2rem]">
              {t.home.heroEyebrow}
            </p>
            {/* "Welcoming guests since", in the language of the page. It was
                the English word "Since" written straight into the markup, so
                a Kurdish reader and an Arabic reader both got one English
                word stamped across the photograph. The phrase is already
                translated for the same year on the front page. */}
            {settings.establishedYear && (
              <p className="mt-3 text-xs tracking-[0.14em] text-white/70 uppercase rtl:tracking-normal">
                {t.home.creditSince} {settings.establishedYear}
              </p>
            )}
          </div>
        </div>
      )}

      {branches.length > 0 && (
        <section className={cn(shell, sectionY)}>
          <SectionHeading
            title={fillCount(t.home.chooseBranch, branches.length, locale)}
            lead={t.home.chooseBranchLead}
            className="mb-12 lg:mb-16"
          />
          {/* The same rail the homepage uses for the same four hotels: a guest
              who has just read who runs them is one swipe from choosing one. */}
          <CardRail
            label={t.nav.branches}
            previousLabel={t.common.previous}
            nextLabel={t.common.next}
          >
            {branches.map((branch, i) => (
              <RailCard key={branch.id}>
                <BranchCard branch={branch} locale={locale} t={t} priority={i < 2} />
              </RailCard>
            ))}
          </CardRail>
        </section>
      )}

      {/* What somebody who has just heard the name wants to know: how many
          there are, where, and how booking works. */}
      {faq.length > 0 && (
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <Reveal>
              <Faq entries={faq} title={t.faq.groupTitle} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  // The lead carries a {count} placeholder meant to be filled from the number
  // of hotels actually published. Passed straight to `description` it was not
  // filled at all, so the search result for this page literally read
  // "{count} hotels in Erbil" — visible to every searcher, invisible on the
  // page itself, which is why it survived this long.
  const branches = await getBranches(locale)
  const settings = await getSettings(locale)
  const siteName = settings.siteName || 'My Flower Hotels'
  const count = countWord(branches.length, locale)

  /**
   * This page's title used to lead with the word "About".
   *
   * Nobody searches for "about". This is the page that answers "is there an
   * Iraqi hotel group in Erbil", "family-owned hotels Erbil", "hotel chain in
   * Erbil" — the searches where the whole point of this company is the answer
   * — and it was introducing itself with the one word on it that no query
   * contains. The name still leads, because a title has to say whose page it
   * is; what follows is now what the page is actually for.
   */
  const title =
    branches.length > 0
      ? `${siteName} — ${t.seo.hotelGroupIn} ${t.seo.locality}`
      : `${t.nav.about} — ${t.seo.hotelsIn} ${t.seo.locality}`

  // Written for this page rather than borrowed from the hero. The lead is one
  // clause; a search summary has about two lines to earn a click, and the
  // things worth spending them on are the count, the ownership and the fact
  // that booking here takes no card.
  const description =
    branches.length > 0
      ? t.seo.groupDescription
          .replace('{count}', count.toLocaleLowerCase(locale === 'en' ? 'en' : undefined))
          .replace('{city}', t.seo.locality)
      : fillCount(t.about.lead, branches.length, locale)

  // `absolute`, because this title already opens with the group's name and the
  // layout's template appends it to everything. Without it the search result
  // for this page read "My Flower Hotels — Kurdish-owned hotel group in Erbil |
  // My Flower Hotels" — the name twice, and seventy-two characters where
  // Google shows about sixty, so the half that was cut was the half that says
  // what the page is.
  return { title: { absolute: title }, description }
}
