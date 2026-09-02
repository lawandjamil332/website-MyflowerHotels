import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { fillCount } from '@/i18n/count'
import { getSettings } from '@/utilities/getSettings'
import { getAllRooms, getBranches } from '@/utilities/branches'
import { groupIdentity } from '@/utilities/group'
import { formatPrice } from '@/utilities/format'
import { branchLocative } from '@/utilities/teasers'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { heroFor, photoPool } from '@/utilities/heroPhoto'
import { cn } from '@/utilities/ui'
import { BranchCard } from '@/components/site/BranchCard'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import { SectionHeading } from '@/components/site/SectionHeading'
import { Faq } from '@/components/site/Faq'
import { isOpeningSoon } from '@/components/site/OpeningMark'
import { BreadcrumbSchema, FaqSchema, HotelListSchema } from '@/components/site/StructuredData'
import { buildGroupFaq } from '@/utilities/faq'
import { pointsRate } from '@/utilities/points'
import { sectionY, shell } from '@/components/site/ui'

/**
 * Every hotel in the group, on one page.
 *
 * There was no such page. `/branches/my-flower-1` worked, `/branches` was a
 * 404, and the only list of all four hotels on the whole site was an anchor
 * section on the homepage that the header and the footer both linked to as
 * `/#collection`. That is a fine place for a guest who is already scrolling
 * and a poor one for everything else: an anchor is not a page, so it has no
 * title of its own, no description, no entry in the sitemap, and nothing to
 * return when somebody — a search engine, an assistant, a guest typing the
 * address bar — asks the obvious question of a company with four hotels, which
 * is "what are they".
 *
 * So the answer lives at its own address now, and it is deliberately literal:
 * the identity sentence, the four photographs, and then a plain table of name,
 * neighbourhood, telephone and nightly rate. The table is the point. It is the
 * form the information takes when a guest rings up and asks, and it happens to
 * also be the form that survives being read by a machine — four rows of facts
 * that can be quoted whole, rather than four cards that have to be visited.
 */

type Args = { params: Promise<{ locale: string }> }

export default async function BranchesPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const [settings, branches, rooms] = await Promise.all([
    getSettings(locale),
    getBranches(locale),
    getAllRooms(locale),
  ])

  // A page listing nothing is worse than no page: it would sit in the sitemap
  // telling every crawler this company has no hotels.
  if (branches.length === 0) notFound()

  // Offset 2, so the page listing every hotel does not open on the same
  // photograph as the homepage or the rooms browser.
  const heroSource = heroFor(photoPool(branches), 2) ?? settings.socialShareImage

  // Counted rather than claimed, exactly as on the About page — one sentence
  // that is true whether this group has four hotels or seven.
  const identity = groupIdentity(branches, t, locale, settings.establishedYear)

  // The cheapest published room at each hotel. Rooms carry their branch as a
  // relationship, populated at depth 2, so this is read from the same rows the
  // rooms index prints rather than typed in beside them and left to rot.
  const cheapest = new Map<number, { amount: number; currency?: string | null }>()
  for (const room of rooms) {
    const id = typeof room.branch === 'number' ? room.branch : room.branch?.id
    if (typeof id !== 'number') continue
    if (typeof room.priceFrom !== 'number' || room.priceFrom <= 0) continue
    const current = cheapest.get(id)
    if (!current || room.priceFrom < current.amount) {
      cheapest.set(id, { amount: room.priceFrom, currency: room.currency })
    }
  }

  const payload = await getPayload({ config: configPromise })
  const rate = await pointsRate(payload)
  const faq = buildGroupFaq(branches, t, locale, {
    pointsEnabled: rate.enabled,
    phone: settings.whatsapp || settings.phone,
  })

  const cell = 'px-4 py-4 align-top text-[0.95rem] leading-[1.5] sm:px-6'

  return (
    <>
      <BreadcrumbSchema locale={locale} trail={[{ name: t.nav.branches }]} />
      <HotelListSchema branches={branches} locale={locale} name={t.branchesPage.glanceTitle} />
      <FaqSchema entries={faq} />

      <PageHero
        eyebrow={t.branchesPage.eyebrow}
        title={fillCount(t.branchesPage.title, branches.length, locale)}
        lead={t.branchesPage.lead}
        imageUrl={mediaUrl(heroSource, 'xlarge')}
        imageAlt={mediaAlt(heroSource)}
      />

      {/* Who this is, before the list of what it owns. The same sentence the
          About page ends on, because a page reached directly from a search
          result cannot assume anybody has read that one. */}
      <section className="bg-sand">
        <div className={cn(shell, 'py-12 sm:py-16')}>
          <Reveal className="mx-auto max-w-2xl">
            <p className="text-center text-[1.02rem] leading-[1.8] text-ink">{identity}</p>
          </Reveal>
        </div>
      </section>

      {/* The hotels as photographs. A grid rather than the homepage rail: this
          page is the destination, so nothing here should need swiping past.

          The heading is not decoration. Each card titles itself with an h3,
          and without an h2 over them this page ran h1 straight to h3 and then
          back up to h2 at the table below — so the one page whose whole job is
          to be read as "here are the four hotels" had an outline that said
          nothing of the kind, to a screen reader or to anything parsing it. */}
      <section className={cn(shell, sectionY)}>
        <SectionHeading title={t.branchesPage.gridTitle} className="mb-10 lg:mb-12" />
        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {branches.map((branch, i) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              locale={locale}
              t={t}
              priority={i < 2}
              className="h-full"
            />
          ))}
        </div>
      </section>

      {/* The same four hotels as facts. */}
      <section className="bg-sand">
        <div className={cn(shell, sectionY)}>
          <SectionHeading
            title={t.branchesPage.glanceTitle}
            lead={t.branchesPage.glanceLead}
            className="mb-10 lg:mb-12"
          />
          <Reveal delay={120}>
            {/* Wide tables are the classic way a page ends up scrolling
                sideways on a phone. The scroll is kept inside this box so the
                body never moves. */}
            <div className="overflow-x-auto rounded-sm border border-line bg-bone">
              <table className="w-full min-w-[38rem] border-collapse text-start">
                <caption className="sr-only">
                  {fillCount(t.branchesPage.title, branches.length, locale)}
                </caption>
                <thead>
                  <tr className="border-b border-line bg-white/60 text-start">
                    {[
                      t.branchesPage.colHotel,
                      t.branchesPage.colWhere,
                      t.branchesPage.colPhone,
                      t.branchesPage.colFrom,
                      t.branchesPage.colStatus,
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className={cn(
                          cell,
                          'text-start text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-ink',
                        )}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => {
                    const price = cheapest.get(branch.id)
                    const soon = isOpeningSoon(branch)
                    return (
                      <tr key={branch.id} className="border-b border-line/70 last:border-0">
                        <th scope="row" className={cn(cell, 'text-start font-normal')}>
                          <Link
                            href={`/${locale}/branches/${branch.slug}`}
                            className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
                          >
                            {branch.name}
                          </Link>
                        </th>
                        <td className={cn(cell, 'text-muted-ink')}>
                          {branchLocative(branch) || '—'}
                        </td>
                        <td className={cn(cell, 'text-muted-ink')}>
                          {branch.phone ? (
                            // Written left-to-right even on the Arabic and
                            // Kurdish pages: a telephone number is not prose,
                            // and the bidi algorithm otherwise moves a leading
                            // + to the wrong end of it.
                            <a
                              href={`tel:${branch.phone.replace(/\s+/g, '')}`}
                              dir="ltr"
                              className="inline-block transition-colors hover:text-brand"
                            >
                              {branch.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={cn(cell, 'text-muted-ink')}>
                          {price ? (
                            <>
                              <span className="text-ink">
                                {formatPrice(price.amount, price.currency, locale)}
                              </span>{' '}
                              <span className="whitespace-nowrap text-[0.8rem]">
                                {t.branchesPage.perNight}
                              </span>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={cn(cell, 'text-muted-ink')}>
                          {soon ? t.branchesPage.statusSoon : t.branchesPage.statusOpen}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {faq.length > 0 && (
        <section className={cn(shell, sectionY)}>
          <Reveal>
            <Faq entries={faq} title={t.faq.groupTitle} />
          </Reveal>
        </section>
      )}
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  const branches = await getBranches(locale)

  return {
    title: `${t.nav.branches} — ${fillCount(t.branchesPage.title, branches.length, locale)}`,
    description: fillCount(t.branchesPage.metaDescription, branches.length, locale),
    // No `alternates` here. The <Hreflang> component in the locale layout
    // already emits the canonical and the three translations for every page,
    // and declaring them again produced two canonical tags pointing at the
    // same URL — which is not a tie Google is obliged to break in your favour.
  }
}
