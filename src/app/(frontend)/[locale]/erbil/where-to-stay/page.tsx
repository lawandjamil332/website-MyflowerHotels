import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getGuides } from '@/i18n/guides'
import { getGuideFacts } from '@/utilities/guideFacts'
import { ERBIL_LANDMARKS, formatKm, landmarksFrom } from '@/utilities/landmarks'
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
 * "Where should you stay in Erbil?" — the areas, then the hotels, in that order.
 *
 * The order is the point. A page that answers the question with four hotels is
 * an advertisement; a page that answers it with the four parts of the city a
 * visitor actually chooses between, and then says which of those the group's
 * own hotels are on, is the answer — and it discloses in its first paragraph
 * who wrote it, so a reader can discount the part that needs discounting.
 *
 * The distance table is computed from each hotel's own map pin rather than
 * written down, and says in the copy that it is measuring a straight line.
 */

export const dynamic = 'force-dynamic'

const PATH = '/erbil/where-to-stay'

type Args = { params: Promise<{ locale: string }> }

export default async function WhereToStayPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const g = getGuides(locale)
  const facts = await getGuideFacts(locale)
  const guide = g.whereToStay

  const pool = photoPool(facts.branches, facts.rooms)
  const hero = heroFor(pool, Math.floor(pool.length / 3))
  const cell = 'px-4 py-4 align-top text-[0.95rem] leading-[1.5] sm:px-6'

  // One column per landmark, in the order they are declared rather than in the
  // nearest-first order landmarksFrom returns. The columns have to mean the
  // same thing on every row: sorted per hotel, the second column would be the
  // airport on one line and the Citadel on the next.
  const columns = ERBIL_LANDMARKS.map((l) => ({ id: l.id, name: l.name[locale] ?? l.name.en }))

  const rows = facts.openBranches.map((branch) => ({
    branch,
    distances: new Map(
      landmarksFrom(branch.latitude, branch.longitude, locale).map((d) => [d.id, d.km]),
    ),
  }))

  // Nothing to draw when no hotel has coordinates: an empty table with four
  // rows of dashes says less than no table at all.
  const anyDistance = rows.some((r) => r.distances.size > 0)

  const distanceTable = anyDistance ? (
    <Reveal delay={120} className="mt-7">
      <div className="overflow-x-auto rounded-sm border border-line bg-bone">
        <table className="w-full min-w-[32rem] border-collapse text-start">
          <caption className="sr-only">{g.labels.distanceTitle}</caption>
          <thead>
            <tr className="border-b border-line bg-white/60">
              <th
                scope="col"
                className={cn(
                  cell,
                  'text-start text-[0.7rem] font-medium tracking-[0.14em] text-muted-ink uppercase',
                )}
              >
                {t.branchesPage.colHotel}
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    cell,
                    'text-start text-[0.7rem] font-medium tracking-[0.14em] text-muted-ink uppercase',
                  )}
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ branch, distances }) => (
              <tr key={branch.id} className="border-b border-line/70 last:border-0">
                <th scope="row" className={cn(cell, 'text-start font-normal')}>
                  <Link
                    href={`/${locale}/branches/${branch.slug}`}
                    className="tap-safe font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
                  >
                    {branch.name}
                  </Link>
                </th>
                {columns.map((column) => {
                  const km = distances.get(column.id)
                  return (
                    <td key={column.id} className={cn(cell, 'text-muted-ink')}>
                      {/* Western digits and a Latin unit, so this reads the
                          same way round in all three languages and matches
                          what Google Maps will say for the same route. */}
                      {typeof km === 'number' ? <span dir="ltr">{formatKm(km)}</span> : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  ) : null

  const faq = guide.faq.map((entry) => ({
    q: facts.fill(entry.q),
    a: facts.fill(entry.a),
  }))

  // The distance table belongs under the section that introduces it. Found by
  // the section's id rather than by a number, so inserting a paragraph above it
  // later does not silently move the table under the wrong heading — and rather
  // than by its heading, which is different in all three languages.
  const distanceIndex = guide.sections.findIndex((s) => s.id === 'distances')

  return (
    <>
      <BreadcrumbSchema locale={locale} trail={[{ name: facts.fill(guide.title) }]} />
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
        extras={
          distanceTable && distanceIndex >= 0 ? { [distanceIndex]: distanceTable } : undefined
        }
      >
        <Reveal delay={120} className="mt-14 border-t border-line pt-8">
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
              href={`/${locale}/guides/hotel-groups-in-iraq`}
              className="tap-safe text-[1.02rem] text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
            >
              {g.landscape.title}
            </Link>
          </div>
        </Reveal>
      </GuideArticle>

      {faq.length > 0 && (
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <Reveal>
              <Faq entries={faq} title={t.faq.title} />
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
    title: { absolute: facts.fill(g.whereToStay.metaTitle) },
    description: facts.fill(g.whereToStay.metaDescription),
  }
}
