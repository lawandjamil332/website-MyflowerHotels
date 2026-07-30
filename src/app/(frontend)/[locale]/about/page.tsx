import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { fillCount } from '@/i18n/count'
import { getSettings } from '@/utilities/getSettings'
import { getBranches } from '@/utilities/branches'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { cn } from '@/utilities/ui'
import { BranchCard } from '@/components/site/BranchCard'
import { CardRail, RailCard } from '@/components/site/CardRail'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import { SectionHeading } from '@/components/site/SectionHeading'
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

  return (
    <>
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
  return {
    title: `${t.nav.about} — ${t.seo.hotelsIn} ${t.seo.locality}`,
    description: fillCount(t.about.lead, branches.length, locale),
  }
}
