import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches } from '@/utilities/branches'
import { toMapsHref, toTelHref, toWhatsAppHref } from '@/utilities/contact'

type Args = { params: Promise<{ locale: string }> }

export default async function ContactPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const branches = await getBranches(locale)

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-display text-4xl text-stone-900 sm:text-5xl">{t.nav.contact}</h1>
      <p className="mt-3 max-w-xl text-stone-500">{t.home.chooseBranchLead}</p>

      {branches.length > 0 ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const wa = toWhatsAppHref(branch.whatsapp)
            const tel = toTelHref(branch.phone)
            const maps = toMapsHref(branch.googleMapsUrl, branch.latitude, branch.longitude)

            return (
              <div key={branch.id} className="rounded-lg border border-stone-200 p-6">
                <h2 className="font-display text-xl text-stone-900">{branch.name}</h2>
                {branch.address && (
                  <p className="mt-2 whitespace-pre-line text-sm text-stone-600">
                    {branch.address}
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2 text-sm">
                  {tel && (
                    <a
                      href={tel}
                      dir="ltr"
                      className="text-stone-900 underline-offset-4 hover:underline"
                    >
                      {branch.phone}
                    </a>
                  )}
                  {branch.email && (
                    <a
                      href={`mailto:${branch.email}`}
                      className="text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline"
                    >
                      {branch.email}
                    </a>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
                      {t.common.whatsapp}
                    </a>
                  )}
                  {maps && (
                    <a
                      href={maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-50"
                    >
                      {t.branch.getDirections}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-12 text-stone-500">Hotel details will appear here once they are added.</p>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  return { title: getDictionary(locale).nav.contact }
}
