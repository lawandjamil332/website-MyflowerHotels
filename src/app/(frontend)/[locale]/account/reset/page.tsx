import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/utilities/ui'
import { ResetForm } from '@/components/site/AccountForms'
import { PageHero } from '@/components/site/PageHero'
import { sectionY, shell } from '@/components/site/ui'

type Args = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Where the link in the reset mail lands. */
export default async function ResetPage({ params, searchParams }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const t = getDictionary(locale)

  const query = await searchParams
  const token = Array.isArray(query.token) ? (query.token[0] ?? '') : (query.token ?? '')

  return (
    <>
      <PageHero title={t.account.setPassword} lead={token ? t.account.resetLead : undefined} />
      <section className={cn(shell, sectionY)}>
        {token ? (
          <ResetForm locale={locale} t={t} token={token} />
        ) : (
          // Reached without a link — usually the address was copied by hand and
          // the token left behind. Say so rather than showing a form that can
          // only fail.
          <p className="mx-auto max-w-md rounded-2xl border border-dashed border-line p-10 text-center text-muted-ink">
            {t.account.resetNoToken}
          </p>
        )}
      </section>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  return { title: t.account.setPassword, robots: { index: false, follow: false } }
}
