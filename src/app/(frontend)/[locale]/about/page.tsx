import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSettings } from '@/utilities/getSettings'
import { getBranches } from '@/utilities/branches'
import { BranchCard } from '@/components/site/BranchCard'

type Args = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const [settings, branches] = await Promise.all([getSettings(locale), getBranches(locale)])
  const siteName = settings.siteName || 'Myflower Hotels'

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl text-stone-900 sm:text-5xl">{t.nav.about}</h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-600">
          {siteName} — {t.home.chooseBranch}.
        </p>
        <p className="mt-4 text-stone-500">
          The group&apos;s story goes here. Replace this text once the wording is decided; it is the
          one page guests read to decide whether they trust you.
        </p>
      </div>

      {branches.length > 0 && (
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  return { title: getDictionary(locale).nav.about }
}
