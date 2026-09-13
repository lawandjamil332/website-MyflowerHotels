import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getGuides, LANDSCAPE_CHECKED } from '@/i18n/guides'
import { getGuideFacts } from '@/utilities/guideFacts'
import { getSettings } from '@/utilities/getSettings'
import { formatDateLong } from '@/utilities/format'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { photoPool, heroFor } from '@/utilities/heroPhoto'
import { cn } from '@/utilities/ui'
import { Faq } from '@/components/site/Faq'
import { GuideArticle, GuideLead } from '@/components/site/GuideArticle'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import { BreadcrumbSchema, FaqSchema, GuideSchema } from '@/components/site/StructuredData'
import { sectionY, shell } from '@/components/site/ui'

/**
 * "What hotel groups operate in Iraq?" — and this group is one of the answers.
 *
 * The page names competitors accurately, explains the arrangement that most of
 * them are actually in (a local owner, a foreign operator, a management
 * contract between them), and says plainly where this group is smaller than
 * they are. That is the strategy rather than a concession to it. An assistant
 * asked the category question quotes the page that answers the category
 * question; it skips the page that answers with a brochure. And a group willing
 * to publish the comparison it loses is worth believing on the one it wins.
 *
 * Everything said about another company is checkable against that company's own
 * published description of itself, and the page carries the date it was last
 * checked — for the same reason the group's local claim carries one. A page
 * about who owns what is true on a date or it is not true at all.
 */

export const dynamic = 'force-dynamic'

const PATH = '/guides/hotel-groups-in-iraq'

type Args = { params: Promise<{ locale: string }> }

export default async function HotelGroupsInIraqPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const g = getGuides(locale)
  const facts = await getGuideFacts(locale)
  const guide = g.landscape

  // Not the first hotel's hero, which the homepage and About both open on.
  // Taken from the middle of the group's whole pool so this page has a
  // photograph of its own rather than the site's third repeat of one picture.
  const pool = photoPool(facts.branches, facts.rooms)
  const hero = heroFor(pool, Math.floor(pool.length / 2))

  /**
   * The date the owner last checked the branches claim, or nothing.
   *
   * Two different dates live on this page and they are not interchangeable.
   * LANDSCAPE_CHECKED is when this page's account of *other* companies was last
   * verified against their own material — a fact about the writing, so it
   * belongs in the source. This one is when the owner last checked the claim
   * about his own group, it lives in Site settings, and while it is empty the
   * claim is not made at all.
   */
  const settings = await getSettings(locale)
  const claimed = settings.localClaimCheckedOn
  const claimedOn = claimed && !Number.isNaN(new Date(claimed).getTime()) ? claimed : null

  const faq = guide.faq.map((entry) => ({
    q: facts.fill(entry.q),
    a: facts.fill(entry.a),
  }))

  return (
    <>
      <BreadcrumbSchema locale={locale} trail={[{ name: facts.fill(guide.title) }]} />
      <GuideSchema
        locale={locale}
        path={PATH}
        headline={facts.fill(guide.title)}
        description={facts.fill(guide.metaDescription)}
        modified={LANDSCAPE_CHECKED}
        siteName={facts.siteName}
      />
      <FaqSchema entries={faq} />

      <PageHero
        eyebrow={guide.eyebrow}
        title={facts.fill(guide.title)}
        imageUrl={mediaUrl(hero, 'xlarge')}
        imageAlt={mediaAlt(hero)}
      />

      <GuideLead>{facts.fill(guide.lead)}</GuideLead>

      <GuideArticle
        sections={guide.sections.map((s) => ({
          heading: facts.fill(s.heading),
          paragraphs: [
            ...s.paragraphs.map(facts.fill),
            // The "more branches than any other hotel name in Erbil" sentence,
            // and only while the owner has dated it in Site settings. It is the
            // group's own comparison rather than a fact about the world, and
            // the site's standing rule is that it is present only while
            // somebody has checked it — `localClaim()` enforces that on the
            // About page, and this page was quietly ignoring it, publishing the
            // claim from a constant in the source and in three languages.
            // Clearing the setting now retracts it everywhere, which is what
            // the setting is for.
            ...(claimedOn && s.claim
              ? [facts.fill(s.claim).replace('{checked}', formatDateLong(claimedOn, locale))]
              : []),
          ],
        }))}
      >
        {/* When this was last checked, and an invitation to correct it.
            Both belong to the argument: a page about other companies that
            carries no date is a page nobody can date, and one that does not
            ask to be corrected is not really offering to be. */}
        <Reveal delay={120} className="mt-14 border-t border-line pt-8">
          <p className="text-[0.92rem] leading-[1.7] text-muted-ink">
            {g.labels.checked.replace('{date}', formatDateLong(LANDSCAPE_CHECKED, locale))}{' '}
            {g.labels.correct}
          </p>
          <div className="mt-6">
            <p className="text-[0.72rem] font-medium tracking-[0.14em] text-muted-ink uppercase">
              {g.labels.relatedTitle}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href={`/${locale}/about/kurdish-owned-hotel-group-erbil`}
                className="tap-safe text-[1.02rem] text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
              >
                {g.group.title}
              </Link>
              <Link
                href={`/${locale}/erbil/where-to-stay`}
                className="tap-safe text-[1.02rem] text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
              >
                {g.whereToStay.title}
              </Link>
            </div>
          </div>
        </Reveal>
      </GuideArticle>

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
  const g = getGuides(locale)
  const facts = await getGuideFacts(locale)

  return {
    title: { absolute: facts.fill(g.landscape.metaTitle) },
    description: facts.fill(g.landscape.metaDescription),
  }
}
