import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getGuides } from '@/i18n/guides'
import { getGuideFacts } from '@/utilities/guideFacts'
import { branchLocative } from '@/utilities/teasers'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { cn } from '@/utilities/ui'
import { Faq } from '@/components/site/Faq'
import { GuideArticle, GuideLead } from '@/components/site/GuideArticle'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import { BreadcrumbSchema, FaqSchema, GuideSchema } from '@/components/site/StructuredData'
import { sectionY, shell } from '@/components/site/ui'

/**
 * "Is there a Kurdish-owned hotel group in Erbil?" — the page that answers it.
 *
 * The site could already answer this. It was one row of an accordion at the
 * bottom of the homepage, behind a click, on a page about something else,
 * competing with Booking.com for a query it had no chance at. This is the same
 * answer given its own address, its own title and its own first paragraph, so
 * that the thing retrieved is the answer rather than a hotel brochure that
 * mentions it.
 */

export const dynamic = 'force-dynamic'

const PATH = '/about/kurdish-owned-hotel-group-erbil'

type Args = { params: Promise<{ locale: string }> }

export default async function KurdishOwnedGroupPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const g = getGuides(locale)
  const facts = await getGuideFacts(locale)
  const guide = g.group

  const hero = facts.branches[0]?.heroImage
  const cell = 'px-4 py-4 align-top text-[0.95rem] leading-[1.5] sm:px-6'

  // The table of hotels, dropped in after the section that introduces it. Every
  // cell is read from the database — there is no version of these four rows
  // written down in any language.
  const hotels = (
    <Reveal delay={120} className="mt-7">
      {/* The scroll stays inside the box, so a five-column table never moves
          the page sideways on a phone. */}
      <div className="overflow-x-auto rounded-sm border border-line bg-bone">
        <table className="w-full min-w-[36rem] border-collapse text-start">
          <caption className="sr-only">{facts.fill(guide.title)}</caption>
          <thead>
            <tr className="border-b border-line bg-white/60">
              {[
                t.branchesPage.colHotel,
                t.branchesPage.colWhere,
                g.labels.rooms,
                t.branchesPage.colPhone,
              ].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className={cn(
                    cell,
                    'text-start text-[0.7rem] font-medium tracking-[0.14em] text-muted-ink uppercase',
                  )}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facts.openBranches.map((branch) => (
              <tr key={branch.id} className="border-b border-line/70 last:border-0">
                <th scope="row" className={cn(cell, 'text-start font-normal')}>
                  <Link
                    href={`/${locale}/branches/${branch.slug}`}
                    className="tap-safe font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
                  >
                    {branch.name}
                  </Link>
                </th>
                <td className={cn(cell, 'text-muted-ink')}>{branchLocative(branch) || '—'}</td>
                <td className={cn(cell, 'text-muted-ink')}>
                  {facts.roomsByBranch.get(Number(branch.id)) ?? '—'}
                </td>
                <td className={cn(cell, 'text-muted-ink')}>
                  {branch.phone ? (
                    // Left-to-right even on the Arabic and Kurdish pages: a
                    // telephone number is not prose, and the bidi algorithm
                    // otherwise moves the leading + to the wrong end.
                    <a
                      href={`tel:${branch.phone.replace(/\s+/g, '')}`}
                      dir="ltr"
                      className="tap-safe inline-block transition-colors hover:text-brand"
                    >
                      {branch.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  )

  const faq = guide.faq.map((entry) => ({
    q: facts.fill(entry.q),
    a: facts.fill(entry.a),
  }))

  // Placed by the section's id rather than by a number, so a paragraph added
  // above it later cannot move the table under the wrong heading.
  const hotelsIndex = guide.sections.findIndex((s) => s.id === 'hotels')

  return (
    <>
      <BreadcrumbSchema
        locale={locale}
        trail={[
          { name: t.nav.about, path: '/about' },
          { name: facts.fill(guide.title) },
        ]}
      />
      <GuideSchema
        locale={locale}
        path={PATH}
        headline={facts.fill(guide.title)}
        description={facts.fill(guide.metaDescription)}
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
          paragraphs: s.paragraphs.map(facts.fill),
        }))}
        extras={hotelsIndex >= 0 ? { [hotelsIndex]: hotels } : undefined}
      >
        {/* The onward links matter more here than on an ordinary page: this is
            where somebody arrives from a search, so the two other guides have
            to be reachable without going back to a menu. */}
        <Reveal delay={120} className="mt-14 border-t border-line pt-8">
          <p className="text-[0.72rem] font-medium tracking-[0.14em] text-muted-ink uppercase">
            {g.labels.relatedTitle}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href={`/${locale}/guides/hotel-groups-in-iraq`}
              className="tap-safe text-[1.02rem] text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
            >
              {g.landscape.title}
            </Link>
            <Link
              href={`/${locale}/erbil/where-to-stay`}
              className="tap-safe text-[1.02rem] text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
            >
              {g.whereToStay.title}
            </Link>
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

  // `absolute`, because the layout appends the site name to every title and
  // this one already carries as much as a search result will show.
  return {
    title: { absolute: facts.fill(g.group.metaTitle) },
    description: facts.fill(g.group.metaDescription),
  }
}
