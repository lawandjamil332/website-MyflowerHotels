import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getRoomBySlug } from '@/utilities/branches'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { formatNumber, formatPrice } from '@/utilities/format'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { shareImage } from '@/utilities/shareImage'
import { cn } from '@/utilities/ui'
import { AmenityList } from '@/components/site/AmenityList'
import { Gallery, type GalleryItem } from '@/components/site/Gallery'
import { EnquiryForm } from '@/components/site/EnquiryForm'
import { PageHero } from '@/components/site/PageHero'
import { Reveal } from '@/components/site/Reveal'
import { SectionHeading } from '@/components/site/SectionHeading'
import { RoomSchema } from '@/components/site/StructuredData'
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
      <PageHero
        eyebrow={branch?.name ?? t.room.detailsEyebrow}
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
      {facts.length > 0 && (
        <section className="border-b border-line bg-card">
          <dl className={cn(shell, 'grid gap-px sm:grid-cols-2 lg:grid-cols-4')}>
            {facts.map((fact) => (
              <div key={fact.label} className="py-8 lg:pe-8">
                <dt className="text-[0.6rem] tracking-[0.22em] text-muted-ink uppercase rtl:tracking-normal">
                  {fact.label}
                </dt>
                <dd className="font-display mt-2 text-2xl leading-tight text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className={cn(shell, 'py-20 sm:py-24 lg:py-28')}>
        <div className="grid gap-14 lg:grid-cols-[1.4fr_0.9fr] lg:gap-20">
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

          <aside>
            <Reveal delay={120} className="lg:sticky lg:top-28">
              <div className="border border-line rounded-2xl bg-card p-7 sm:p-8">
                {price ? (
                  <>
                    <p className="text-[0.6rem] tracking-[0.22em] text-muted-ink uppercase rtl:tracking-normal">
                      {t.room.from}
                    </p>
                    <p className="font-display mt-2 text-4xl leading-none text-ink">{price}</p>
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
                    className="link-line mt-6 inline-block text-sm text-muted-ink hover:text-ink"
                  >
                    {t.room.backToBranch}
                  </Link>
                )}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      <section className={cn(shell, 'pb-20 sm:pb-24 lg:pb-28')}>
        <Reveal>
          <EnquiryForm
            t={t}
            branchId={branch?.id}
            roomId={room.id}
            whatsappHref={wa}
            className="mx-auto max-w-3xl"
          />
        </Reveal>
      </section>

      {gallery.length > 0 && (
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <SectionHeading
              eyebrow={t.room.galleryEyebrow}
              title={t.branch.gallery}
              className="mb-10 lg:mb-14"
            />
            <Reveal>
              <Gallery items={gallery} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const room = await getRoomBySlug(slug, locale)
  if (!room) return {}

  const branchName = typeof room.branch === 'object' ? room.branch?.name : undefined

  return {
    title: room.name,
    openGraph: {
      title: room.name,
      images: shareImage(mediaUrl(room.images?.[0], 'og'), room.name, branchName),
    },
  }
}
