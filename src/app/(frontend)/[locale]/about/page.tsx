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

      {/* The story as a centred band rather than a heading in one column and
          prose in another. Both paragraphs are two sentences, which is the
          length a centred measure carries — this is a section of a site, not
          the opening spread of an article. */}
      <section className="bg-sand">
        <div className={cn(shell, sectionY)}>
          <SectionHeading title={t.home.introTitle} lead={t.about.body1} />
          {/* Set to match SectionHeading's own lead exactly, so the two
              paragraphs read as one column rather than two treatments. */}
          <Reveal delay={120} className="mx-auto mt-6 max-w-2xl text-center">
            <p className="text-[1.05rem] leading-[1.65] text-muted-ink sm:text-[1.15rem]">
              {t.about.body2}
            </p>
          </Reveal>

          {/* Who owns this and how many there are, in one sentence, stated
              plainly enough to be quoted. Most of the multi-property hotel
              names here are foreign operators running a local
              building; independent and Kurdish-owned across four hotels is the
              genuinely unusual thing here, and it was nowhere on the site. */}
          <Reveal delay={200} className="mx-auto mt-10 max-w-2xl">
            <p className="border-t border-line pt-8 text-center text-[1.02rem] leading-[1.8] text-ink">
              {identity}
            </p>
            {/* Set in smaller, quieter type than the sentence above it. The
                claim above is a fact about who owns this company; this one is
                a comparison the group believes and has dated, and reading as
                slightly more careful than the line before it is exactly
                right. */}
            {claim && (
              <p className="mt-5 text-center text-[0.92rem] leading-[1.7] text-muted-ink">
                {claim}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      {/* A full-bleed breath between the story and the hotels themselves. */}
      {mediaUrl(interlude, 'xlarge') && (
        <div className="relative h-[45vh] overflow-hidden bg-ink sm:h-[60vh]">
          <Image
            src={mediaUrl(interlude, 'xlarge')}
            alt={mediaAlt(interlude) || siteName}
            fill
            sizes="100vw"
            className="object-cover"
          />
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
          <CardRail label={t.nav.branches}>
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
            <Reveal className="mx-auto max-w-3xl">
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

  return { title, description }
}
