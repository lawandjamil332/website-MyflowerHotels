import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/utilities/ui'
import { ManageBooking } from '@/components/site/ManageBooking'
import { PageHero } from '@/components/site/PageHero'
import { sectionY, shell } from '@/components/site/ui'

type Args = { params: Promise<{ locale: string }> }

export default async function ManageBookingPage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const t = getDictionary(locale)

  return (
    <>
      <PageHero title={t.booking.manageTitle} lead={t.booking.manageLead} />
      <section className={cn(shell, sectionY)}>
        <ManageBooking t={t} />
      </section>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const t = getDictionary(locale)
  return { title: t.booking.manageTitle, robots: { index: false, follow: false } }
}
