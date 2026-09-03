import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches } from '@/utilities/branches'
import { heroFor, photoPool } from '@/utilities/heroPhoto'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { cn } from '@/utilities/ui'
import { ManageBooking } from '@/components/site/ManageBooking'
import { PageHero } from '@/components/site/PageHero'
import { sectionY, shell } from '@/components/site/ui'

type Args = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ reference?: string | string[] }>
}

export default async function ManageBookingPage({ params, searchParams }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale
  const t = getDictionary(locale)

  // Carried by the link in the review request, so a guest who has been asked
  // how their stay went does not have to go and find their reference first.
  // Trimmed to the shape a reference actually has rather than passed through:
  // it is rendered into an input, and the length cap is what stops the page
  // being used to put a paragraph of somebody else's choosing on the screen.
  const { reference: fromLink } = await searchParams
  const reference = (Array.isArray(fromLink) ? fromLink[0] : fromLink || '')
    .replace(/[^A-Za-z0-9-]/g, '')
    .slice(0, 24)
    .toUpperCase()

  // A photograph, like every other page on the site. Without one PageHero
  // falls back to drawing the title's initials, so the page a guest reaches
  // from their confirmation email opened on a black band with a giant grey
  // "F Y" on it.
  const heroSource = heroFor(photoPool(await getBranches(locale)), 4)

  return (
    <>
      <PageHero
        title={t.booking.manageTitle}
        lead={t.booking.manageLead}
        imageUrl={mediaUrl(heroSource, 'xlarge')}
        imageAlt={mediaAlt(heroSource)}
      />
      <section className={cn(shell, sectionY)}>
        <ManageBooking t={t} reference={reference} />
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
