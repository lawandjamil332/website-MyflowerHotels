import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranches, getFeaturedRooms } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { BranchCard } from '@/components/site/BranchCard'
import { RoomCard } from '@/components/site/RoomCard'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'

type Args = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Args) {
  const { locale: raw } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const [branches, rooms, settings] = await Promise.all([
    getBranches(locale),
    getFeaturedRooms(locale, 6),
    getSettings(locale),
  ])

  // The hero borrows the first branch's photograph. Photography is the design,
  // and this avoids a stock image standing in for the group's real hotels.
  const heroBranch = branches[0]
  const heroUrl = mediaUrl(heroBranch?.heroImage, 'xlarge')
  const siteName = settings.siteName || 'Myflower Hotels'
  const tel = toTelHref(settings.phone)
  const wa = toWhatsAppHref(settings.whatsapp)

  return (
    <>
      <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-stone-900 sm:min-h-[80vh]">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={mediaAlt(heroBranch?.heroImage) || siteName}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : null}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10"
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
          <h1 className="font-display max-w-3xl text-4xl leading-[1.1] text-white sm:text-6xl">
            {siteName}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">{t.home.chooseBranch}</p>
        </div>
      </section>

      {/* The branch switcher: the group's real differentiator, given the room
          to be a decision rather than a dropdown. */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl text-stone-900 sm:text-4xl">
            {t.home.chooseBranch}
          </h2>
          <p className="mt-3 text-stone-500">{t.home.chooseBranchLead}</p>
        </div>

        {branches.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch, i) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                locale={locale}
                t={t}
                priority={i === 0}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-lg border border-dashed border-stone-300 p-10 text-center text-stone-500">
            <p>No hotels have been added yet.</p>
            <p className="mt-1 text-sm">
              Add them in the admin panel and they will appear here automatically.
            </p>
          </div>
        )}
      </section>

      {rooms.length > 0 && (
        <section className="bg-stone-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-3xl text-stone-900 sm:text-4xl">
              {t.home.featuredRooms}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} locale={locale} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {(tel || wa) && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-stone-900 p-10 text-white sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl">{t.branch.enquire}</h2>
              <p className="mt-1 text-white/70">{t.home.chooseBranchLead}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {t.common.whatsapp}
                </a>
              )}
              {tel && (
                <a
                  href={tel}
                  className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  {t.common.call}
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const settings = await getSettings(locale)
  const t = getDictionary(locale)
  const siteName = settings.siteName || 'Myflower Hotels'

  return {
    title: siteName,
    description: t.home.chooseBranch,
  }
}
