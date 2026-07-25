import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSettings } from '@/utilities/getSettings'
import { getBranches } from '@/utilities/branches'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { cn } from '@/utilities/ui'
import { BranchCard } from '@/components/site/BranchCard'
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
  const siteName = settings.siteName || 'Myflower Hotels'

  // Falls back through the branches, so the page still opens on a photograph
  // before anyone has uploaded a share image in settings.
  const heroSource = settings.socialShareImage ?? branches[0]?.heroImage
  const interlude = branches[1]?.heroImage ?? branches[0]?.heroImage

  return (
    <>
      <PageHero
        eyebrow={t.about.eyebrow}
        title={siteName}
        lead={t.about.lead}
        imageUrl={mediaUrl(heroSource, 'xlarge')}
        imageAlt={mediaAlt(heroSource)}
      />

      <section className={cn(shell, 'py-20 sm:py-24 lg:py-28')}>
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">{t.home.introEyebrow}</p>
            <h2 className="font-display mt-5 text-3xl leading-[1.12] text-balance text-ink sm:text-4xl">
              {t.home.introTitle}
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-lg leading-[1.8] text-ink-soft sm:text-xl">{t.about.body1}</p>
            <p className="mt-7 text-lg leading-[1.8] text-ink-soft sm:text-xl">{t.about.body2}</p>
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
            eyebrow={t.home.collectionEyebrow}
            title={t.home.chooseBranch}
            lead={t.home.chooseBranchLead}
            className="mb-12 lg:mb-16"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch, i) => (
              <Reveal key={branch.id} delay={(i % 3) * 110}>
                <BranchCard branch={branch} locale={locale} t={t} index={i} />
              </Reveal>
            ))}
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
  return { title: t.nav.about, description: t.about.lead }
}
