import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getRoomBySlug, getRoomsForBranch } from '@/utilities/branches'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { formatNumber, formatPrice } from '@/utilities/format'
import { layoutLine } from '@/utilities/layout'
import { Price } from '@/components/site/Currency'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { shareImage } from '@/utilities/shareImage'
import { cn } from '@/utilities/ui'
import { AmenityList } from '@/components/site/AmenityList'
import { CardRail, RailCard } from '@/components/site/CardRail'
import { Gallery, type GalleryItem } from '@/components/site/Gallery'
import { EnquiryForm } from '@/components/site/EnquiryForm'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import { RoomCard } from '@/components/site/RoomCard'
import { SectionHeading } from '@/components/site/SectionHeading'
import { BreadcrumbSchema, RoomSchema } from '@/components/site/StructuredData'
import { WhatsAppMark } from '@/components/site/WhatsAppMark'
import RichText from '@/components/RichText'
import { btnOutline, btnSmall, btnWhatsApp, sectionY, shell } from '@/components/site/ui'
import type { Branch } from '@/payload-types'

type Args = { params: Promise<{ locale: string; slug: string }> }

export default async function RoomPage({ params }: Args) {
  const { locale: raw, slug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const room = await getRoomBySlug(slug, locale)
  if (!room) notFound()

  const branch = (typeof room.branch === 'object' ? room.branch : null) as Branch | null
  const images = (room.images ?? []).filter((i) => mediaUrl(i))
  const price = formatPrice(room.priceFrom, room.currency, locale)

  const hasDetails = Boolean(room.description) || (room.amenities?.length ?? 0) > 0

  // Every other room in this hotel, for the rail at the foot of the page.
  const siblings = branch
    ? (await getRoomsForBranch(branch.id, locale)).filter((r) => r.id !== room.id)
    : []

  // Pre-fills the WhatsApp message with the room, so the guest does not have
  // to explain which one they mean.
  const enquiryText = branch
    ? `${t.room.enquire}: ${room.name} — ${branch.name}`
    : `${t.room.enquire}: ${room.name}`
  const wa = toWhatsAppHref(branch?.whatsapp, enquiryText)
  const tel = toTelHref(branch?.phone)

  const facts = [
    price ? { label: t.room.from, value: `${price} · ${t.room.perNight}` } : null,
    room.maxGuests ? { label: t.room.guests, value: formatNumber(room.maxGuests, locale) } : null,
    room.bedType ? { label: t.room.bedType, value: t.bed[room.bedType] ?? room.bedType } : null,
    room.sizeSqm ? { label: t.room.size, value: `${formatNumber(room.sizeSqm, locale)} m²` } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  // Kept out of the band above and given a line of its own. That band is four
  // numbers at display size; "2 bedrooms · 1 hall · 2 bathrooms · Kitchen" is a
  // phrase, and as a fifth cell it would either sit alone on a second row or
  // squeeze five columns where the longest value needs the most room.
  const layout = layoutLine(room, t, locale)

  // The opening photograph carries the hero, so the mosaic below shows the
  // rest rather than repeating it.
  const gallery: GalleryItem[] = images.slice(1).map((item) => ({
    url: mediaUrl(item, 'large'),
    full: mediaUrl(item, 'xlarge') || mediaUrl(item),
    alt: mediaAlt(item) || room.name,
  }))

  return (
    <>
      <RoomSchema room={room} branch={branch} locale={locale} />
      <BreadcrumbSchema
        locale={locale}
        trail={[
          { name: t.nav.rooms, path: '/rooms' },
          ...(branch ? [{ name: branch.name, path: `/branches/${branch.slug}` }] : []),
          { name: room.name },
        ]}
      />
      <PageHero
        title={room.name}
        imageUrl={mediaUrl(images[0], 'xlarge')}
        imageAlt={mediaAlt(images[0])}
        size="tall"
      >
        {room.isAvailable === false && (
          <p className="mt-7 inline-block border border-white/35 px-4 py-2 text-[0.65rem] tracking-[0.2em] text-white uppercase rtl:tracking-normal">
            {t.room.unavailable}
          </p>
        )}
      </PageHero>

      {/* The four numbers a guest decides on, given a band of their own. */}
      {(facts.length > 0 || layout) && (
        <section className="border-b border-line bg-card">
          {facts.length > 0 && (
            <dl className={cn(shell, 'grid gap-px sm:grid-cols-2 lg:grid-cols-4')}>
              {facts.map((fact) => (
                <div key={fact.label} className="py-8 lg:pe-8">
                  <dt className="text-[0.6rem] tracking-[0.22em] text-muted-ink uppercase rtl:tracking-normal">
                    {fact.label}
                  </dt>
                  <dd className="font-display mt-2 text-2xl leading-tight text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {layout && (
            <div className={cn(shell, facts.length > 0 && 'border-t border-line')}>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 py-6">
                <span className="text-[0.6rem] tracking-[0.22em] text-muted-ink uppercase rtl:tracking-normal">
                  {t.room.layout}
                </span>
                <span className="text-[1.05rem] text-ink">{layout}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* As on the hotel page: with no description and no amenities written,
          the wide column is empty, so the price card becomes the section
          rather than sitting beside a blank third of the screen. */}
      <section className={cn(shell, 'py-20 sm:py-24 lg:py-28')}>
        <div className={cn('grid gap-14 lg:gap-20', hasDetails && 'lg:grid-cols-[1.4fr_0.9fr]')}>
          {hasDetails && (
            <div>
              {/* The room's name is already the page heading above; repeating it
                here and again over the gallery would say it three times. */}
              {room.description && (
                <Reveal>
                  <p className="eyebrow">{t.room.detailsEyebrow}</p>
                  <RichText
                    data={room.description}
                    enableGutter={false}
                    className="mt-7 max-w-none prose-p:text-[1.0625rem] prose-p:leading-[1.85] prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-ink prose-headings:font-display prose-headings:font-normal prose-headings:text-ink"
                  />
                </Reveal>
              )}

              {room.amenities && room.amenities.length > 0 && (
                <Reveal delay={150} className={room.description ? 'mt-14' : undefined}>
                  <h3 className="font-display text-2xl text-ink">{t.room.amenities}</h3>
                  <AmenityList amenities={room.amenities} t={t} className="mt-7" columns={2} />
                </Reveal>
              )}
            </div>
          )}

          <aside className={cn(!hasDetails && 'mx-auto w-full max-w-md')}>
            <Reveal delay={120} className={cn(hasDetails && 'lg:sticky lg:top-28')}>
              <div className="border border-line rounded-2xl bg-card p-7 sm:p-8">
                {price ? (
                  <>
                    <p className="text-[0.6rem] tracking-[0.22em] text-muted-ink uppercase rtl:tracking-normal">
                      {t.room.from}
                    </p>
                    <Price
                      amount={room.priceFrom}
                      currency={room.currency}
                      locale={locale}
                      className="font-display mt-2 block text-4xl leading-none text-ink"
                    />
                    <p className="mt-2 text-sm text-muted-ink">{t.room.perNight}</p>
                  </>
                ) : (
                  <p className="font-display text-2xl text-ink">{t.room.enquire}</p>
                )}

                <div className="mt-7 flex flex-col gap-2.5 border-t border-line pt-7">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btnWhatsApp, btnSmall, 'w-full')}
                    >
                      <WhatsAppMark />
                      {t.room.enquire}
                    </a>
                  )}
                  {tel && (
                    <a href={tel} dir="ltr" className={cn(btnOutline, btnSmall, 'w-full')}>
                      {branch?.phone}
                    </a>
                  )}
                </div>

                {branch && (
                  <Link
                    href={`/${locale}/branches/${branch.slug}`}
                    className="link-line tap-safe mt-6 inline-block text-sm text-muted-ink hover:text-ink"
                  >
                    {t.room.backToBranch}
                  </Link>
                )}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      {/* Photographs before the form. A guest decides on the pictures, so
          asking them to enquire before they have seen the room puts the
          request ahead of the reason to make it. */}
      {gallery.length > 0 && (
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <SectionHeading title={t.branch.gallery} className="mb-10 lg:mb-14" />
            <Reveal>
              <Gallery items={gallery} />
            </Reveal>
          </div>
        </section>
      )}

      {/* The other rooms in the same hotel. This room may simply be the wrong
          size or the wrong price, and without this the only way on from here
          is the browser's back button. */}
      {siblings.length > 0 && (
        <section className={cn(shell, sectionY)}>
          <SectionHeading title={t.branch.rooms} className="mb-12 lg:mb-16" />
          <CardRail label={t.branch.rooms}>
            {siblings.map((sibling) => (
              <RailCard key={sibling.id}>
                <RoomCard room={sibling} locale={locale} t={t} />
              </RailCard>
            ))}
          </CardRail>
        </section>
      )}

      <section className="bg-sand">
        <div className={cn(shell, sectionY)}>
          <Reveal>
            <EnquiryForm
              t={t}
              branchId={branch?.id}
              roomId={room.id}
              whatsappHref={wa}
              className="mx-auto max-w-3xl"
            />
          </Reveal>
        </div>
      </section>
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const room = await getRoomBySlug(slug, locale)
  if (!room) return {}

  const branchName = typeof room.branch === 'object' ? room.branch?.name : undefined

  const t = getDictionary(locale)

  // Room names are already written as "Deluxe Double — My Flower 1", so
  // appending the hotel again produced "Deluxe Double — My Flower 1 — My
  // Flower 1, Erbil". Only what is missing gets added.
  const named = branchName && room.name.includes(branchName)
  const title = named
    ? `${room.name}, ${t.seo.locality}`
    : branchName
      ? `${room.name} — ${branchName}, ${t.seo.locality}`
      : room.name

  // Assembled from what the room actually is, so no room page ships without a
  // description. A room whose search result summarises the site navigation is
  // one nobody clicks, and that is what an empty description produces.
  const description = [
    named
      ? `${room.name}, ${t.seo.locality}`
      : `${room.name}${branchName ? ` — ${branchName}, ${t.seo.locality}` : ''}`,
    room.maxGuests ? `${t.room.guests} ${room.maxGuests}` : null,
    layoutLine(room, t, locale) || null,
    t.seo.bookDirect,
  ]
    .filter(Boolean)
    .join('. ')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: shareImage(mediaUrl(room.images?.[0], 'og'), room.name, branchName),
    },
  }
}
