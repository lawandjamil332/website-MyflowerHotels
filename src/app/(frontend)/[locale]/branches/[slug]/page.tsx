import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranchBySlug, getBranches, getRoomsForBranch } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { toMapsHref, toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { branchLocative } from '@/utilities/teasers'
import { shippedPhoto } from '@/utilities/shippedPhoto'
import { shareImage } from '@/utilities/shareImage'
import { cn } from '@/utilities/ui'
import { AmenityList } from '@/components/site/AmenityList'
import { BranchCard } from '@/components/site/BranchCard'
import { CardRail, RailCard } from '@/components/site/CardRail'
import { Gallery, type GalleryItem } from '@/components/site/Gallery'
import { EnquiryForm } from '@/components/site/EnquiryForm'
import { OpeningMark, isOpeningSoon, openingLabel } from '@/components/site/OpeningMark'
import { PageHero } from '@/components/site/PageHero'
import { ReserveBar } from '@/components/site/ReserveBar'
import { Reveal } from '@/components/site/Reveal'
import { RoomCard } from '@/components/site/RoomCard'
import { SectionHeading } from '@/components/site/SectionHeading'
import { BreadcrumbSchema, FaqSchema, HotelSchema } from '@/components/site/StructuredData'
import { Faq } from '@/components/site/Faq'
import { buildFaq } from '@/utilities/faq'
import { pointsRate } from '@/utilities/points'
import { ReviewList } from '@/components/site/Reviews'
import { getRating, getReviews } from '@/utilities/reviews'
import { WhatsAppMark } from '@/components/site/WhatsAppMark'
import RichText from '@/components/RichText'
import {
  btnOutline,
  btnPrimary,
  btnSmall,
  btnWhatsApp,
  sectionY,
  shell,
} from '@/components/site/ui'

type Args = { params: Promise<{ locale: string; slug: string }> }

export default async function BranchPage({ params }: Args) {
  const { locale: raw, slug } = await params
  if (!isLocale(raw)) notFound()
  const locale = raw as Locale

  const t = getDictionary(locale)
  const branch = await getBranchBySlug(slug, locale)
  if (!branch) notFound()

  const [rooms, settings, reviews, rating, allBranches] = await Promise.all([
    getRoomsForBranch(branch.id, locale),
    getSettings(locale),
    getReviews(branch.id),
    getRating(branch.id),
    getBranches(locale),
  ])
  const otherBranches = allBranches.filter((b) => b.id !== branch.id)

  // Answered from what this hotel has actually been told about itself, so a
  // question only appears where there is a true answer for it.
  const payload = await getPayload({ config: configPromise })
  const rate = await pointsRate(payload)
  const faq = buildFaq(branch, rooms, t, locale, { pointsEnabled: rate.enabled })
  const maps = toMapsHref(branch.googleMapsUrl, branch.latitude, branch.longitude)
  const wa = toWhatsAppHref(branch.whatsapp, `${t.branch.enquire} — ${branch.name}`)
  const tel = toTelHref(branch.phone)
  const telAlt = toTelHref(branch.phoneAlt)
  // Not open yet: the page still shows the hotel, but must not offer a phone
  // line nobody is answering or a room list that does not exist.
  const openingSoon = isOpeningSoon(branch)
  const opening = openingLabel(branch, t.branch.openingSoon)
  const hasOverview = Boolean(branch.description) || (branch.amenities?.length ?? 0) > 0

  const gallery: GalleryItem[] = (branch.gallery ?? [])
    .filter((g) => mediaUrl(g))
    .map((g) => ({
      url: mediaUrl(g, 'large'),
      full: mediaUrl(g, 'xlarge') || mediaUrl(g),
      alt: mediaAlt(g) || branch.name,
    }))

  // Google's embed works from plain coordinates without an API key, so the
  // map costs nothing to run and needs no key in the environment.
  const hasPin = typeof branch.latitude === 'number' && typeof branch.longitude === 'number'
  const embedSrc = hasPin
    ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}&hl=${locale}&z=15&output=embed`
    : ''

  return (
    <>
      <HotelSchema
        branch={branch}
        locale={locale}
        stars={settings.stars}
        rating={rating}
        rooms={rooms}
        amenityLabel={(key) => t.amenity[key]}
      />
      <BreadcrumbSchema
        locale={locale}
        trail={[{ name: t.nav.branches, path: '/branches' }, { name: branch.name }]}
      />
      <FaqSchema entries={faq} />
      <PageHero
        title={branch.name}
        lead={branch.tagline ?? undefined}
        imageUrl={mediaUrl(branch.heroImage, 'xlarge')}
        imageAlt={mediaAlt(branch.heroImage)}
        fallbackSrc={shippedPhoto(branch.slug)}
        size="tall"
      >
        {openingSoon && <OpeningMark label={opening} tone="light" className="mt-7" />}
      </PageHero>

      {/* Overview beside a standing reservation card. The card is what the
          page exists for, so it stays in view as the guest reads.

          With neither a description nor amenities written yet, the wide column
          would be empty and the card would sit marooned beside a third of a
          screen of nothing. In that case the card becomes the whole section. */}
      <section className={cn(shell, 'py-20 sm:py-24 lg:py-28')}>
        <div className={cn('grid gap-14 lg:gap-20', hasOverview && 'lg:grid-cols-[1.4fr_0.9fr]')}>
          {hasOverview && (
            <div>
              {/* The eyebrow labels the description; with no description written
                yet it would sit orphaned above the amenities. */}
              {branch.description && (
                <Reveal>
                  <p className="eyebrow">{t.branch.overviewEyebrow}</p>
                  <RichText
                    data={branch.description}
                    enableGutter={false}
                    className="mt-7 max-w-none prose-p:text-[1.0625rem] prose-p:leading-[1.85] prose-p:text-ink-soft prose-li:text-ink-soft prose-strong:text-ink prose-a:text-ink prose-headings:font-display prose-headings:font-normal prose-headings:text-ink"
                  />
                </Reveal>
              )}

              {branch.amenities && branch.amenities.length > 0 && (
                <Reveal delay={150} className={branch.description ? 'mt-14' : undefined}>
                  <h2 className="font-display text-2xl text-ink sm:text-3xl">
                    {t.branch.amenities}
                  </h2>
                  <AmenityList amenities={branch.amenities} t={t} className="mt-7" columns={2} />
                </Reveal>
              )}
            </div>
          )}

          <aside className={cn(!hasOverview && 'mx-auto w-full max-w-md')}>
            <Reveal delay={120} className={cn(hasOverview && 'lg:sticky lg:top-28')}>
              <div id="reserve-card" className="border border-line rounded-2xl bg-card p-7 sm:p-8">
                <p className="eyebrow">{openingSoon ? opening : t.branch.stayEyebrow}</p>
                <h2 className="font-display mt-4 text-2xl text-ink">
                  {openingSoon ? t.branch.openingSoon : t.branch.contactTitle}
                </h2>
                {openingSoon && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-ink">
                    {t.branch.openingBody}
                  </p>
                )}

                {branch.address && (
                  <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-muted-ink">
                    {branch.address}
                  </p>
                )}

                {/* What this hotel is near, in the owner's own words. Guests
                    look for a room by what it is close to far more often than
                    by the name of the hotel, and until this field existed a
                    page about a hotel ten minutes from the Citadel contained
                    neither the word Citadel nor the ten minutes. */}
                {branch.nearby && (
                  <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-muted-ink">
                    {branch.nearby}
                  </p>
                )}

                {!openingSoon &&
                  (branch.checkInAnyTime || branch.checkInTime || branch.checkOutTime) && (
                    <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6">
                      {(branch.checkInAnyTime || branch.checkInTime) && (
                        <div>
                          <dt className="text-[0.6rem] tracking-[0.2em] text-muted-ink uppercase rtl:tracking-normal">
                            {t.branch.checkIn}
                          </dt>
                          <dd className="font-display mt-1.5 text-xl text-ink">
                            {branch.checkInAnyTime ? t.branch.anyTime : branch.checkInTime}
                          </dd>
                        </div>
                      )}
                      {branch.checkOutTime && (
                        <div>
                          <dt className="text-[0.6rem] tracking-[0.2em] text-muted-ink uppercase rtl:tracking-normal">
                            {t.branch.checkOut}
                          </dt>
                          <dd className="font-display mt-1.5 text-xl text-ink">
                            {branch.checkOutTime}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                {/* A hotel that is not open yet still answers the phone.
                    These were hidden along with everything else while the copy
                    directly above said "send us a message and we will tell you
                    as soon as it is taking guests" — so the fourth hotel's page
                    asked for a message and then rendered an empty box where
                    every way of sending one should have been.

                    What stays hidden is booking: a room cannot be reserved at a
                    hotel that has not opened. A line somebody answers is a
                    different thing, and for the fourth hotel that line is the
                    third hotel's. */}
                <div className="mt-7 flex flex-col gap-2.5">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btnWhatsApp, btnSmall, 'w-full')}
                    >
                      <WhatsAppMark />
                      {t.branch.enquire}
                    </a>
                  )}
                  {tel && (
                    <a href={tel} dir="ltr" className={cn(btnOutline, btnSmall, 'w-full')}>
                      {branch.phone}
                    </a>
                  )}
                  {telAlt && (
                    <a href={telAlt} dir="ltr" className={cn(btnOutline, btnSmall, 'w-full')}>
                      {branch.phoneAlt}
                    </a>
                  )}
                  {!openingSoon && branch.bookingComUrl && (
                    <a
                      href={branch.bookingComUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btnPrimary, btnSmall, 'w-full')}
                    >
                      {t.branch.bookNow}
                    </a>
                  )}
                </div>

                {branch.email && (
                  <a
                    href={`mailto:${branch.email}`}
                    className="link-line tap-safe mt-6 block w-fit text-sm text-muted-ink hover:text-ink"
                  >
                    {branch.email}
                  </a>
                )}

                {/* Each hotel keeps its own page, so these belong here rather
                    than only in the group-wide footer. */}
                {(branch.facebook || branch.instagram) && (
                  <div className="mt-4 flex gap-5 text-sm">
                    {branch.facebook && (
                      <a
                        href={branch.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-line tap-safe text-muted-ink hover:text-ink"
                      >
                        Facebook
                      </a>
                    )}
                    {branch.instagram && (
                      <a
                        href={branch.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-line tap-safe text-muted-ink hover:text-ink"
                      >
                        Instagram
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

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

      {reviews.length > 0 && (
        <section className={cn(shell, sectionY)}>
          <Reveal>
            <ReviewList reviews={reviews} rating={rating} t={t} locale={locale} />
          </Reveal>
        </section>
      )}

      {faq.length > 0 && (
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <div className="mx-auto max-w-3xl">
              <Reveal>
                <Faq entries={faq} title={t.faq.title} />
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {!openingSoon && (
        <section className={cn(shell, sectionY)}>
          <SectionHeading title={t.branch.rooms} className="mb-12 lg:mb-16" />
          {rooms.length > 0 ? (
            <CardRail label={t.branch.rooms}>
              {rooms.map((room, i) => (
                <RailCard key={room.id}>
                  <RoomCard room={room} locale={locale} t={t} priority={i < 2} />
                </RailCard>
              ))}
            </CardRail>
          ) : (
            <p className="text-muted-ink">{t.branch.noRooms}</p>
          )}
        </section>
      )}

      {/* The other hotels in the group.
          On a hotel that has not opened, this is the whole point: every other
          section is hidden until it does, which left the page with not one
          link leading out of it — and it is in the sitemap, so people land on
          it from search and find a dead end. On an open hotel it answers the
          quieter version of the same thing: this one is full, or wrong, or in
          the wrong part of town. */}
      {otherBranches.length > 0 && (
        <section className={cn(shell, sectionY)}>
          <SectionHeading title={t.branch.otherHotels} className="mb-12 lg:mb-16" />
          <CardRail label={t.branch.otherHotels}>
            {otherBranches.map((other) => (
              <RailCard key={other.id}>
                <BranchCard branch={other} locale={locale} t={t} />
              </RailCard>
            ))}
          </CardRail>
        </section>
      )}

      {/* The form the brief asked for, beside WhatsApp rather than instead of
          it: one works at three in the morning, the other converts faster. */}
      {!openingSoon && (
        <section className="bg-sand">
          <div className={cn(shell, sectionY)}>
            <Reveal>
              <EnquiryForm
                t={t}
                branchId={branch.id}
                whatsappHref={wa}
                className="mx-auto max-w-3xl"
              />
            </Reveal>
          </div>
        </section>
      )}

      {(embedSrc || maps || branch.address) && (
        <section className="border-t border-line bg-sand">
          <div className={cn(shell, 'grid gap-0 lg:grid-cols-[0.85fr_1.15fr]')}>
            <div className="py-16 lg:py-24 lg:pe-16">
              <p className="eyebrow">{t.branch.locationEyebrow}</p>
              <h2 className="font-display mt-5 text-3xl text-ink sm:text-4xl">
                {t.branch.location}
              </h2>
              {branch.address && (
                <p className="mt-6 max-w-sm leading-relaxed whitespace-pre-line text-ink-soft">
                  {branch.address}
                </p>
              )}
              {maps && (
                <a
                  href={maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(btnOutline, 'mt-8')}
                >
                  {t.branch.getDirections}
                </a>
              )}
            </div>

            {embedSrc && (
              // Tinted ground behind the frame, so a map that is slow to load
              // reads as a panel rather than a hole in the page.
              <div className="relative min-h-[22rem] border-s border-line bg-line/40 lg:min-h-[30rem]">
                <iframe
                  src={embedSrc}
                  title={`${branch.name} — ${t.branch.location}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full grayscale-[35%] contrast-[1.05]"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Slides up once the reserve card above has scrolled away, so the way
          to act is never more than a thumb-reach from wherever they are. */}
      {!openingSoon && (
        <ReserveBar
          watch="reserve-card"
          title={branch.name}
          meta={branch.neighbourhood || branch.city || undefined}
          whatsappHref={wa || undefined}
          telHref={tel || undefined}
          reserveLabel={t.common.reserve}
          whatsappLabel={t.common.whatsapp}
          callLabel={t.common.call}
        />
      )}
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = (isLocale(raw) ? raw : 'en') as Locale
  const branch = await getBranchBySlug(slug, locale)
  if (!branch) return {}
  const t = getDictionary(locale)

  // The place goes in the title because that is what is actually searched.
  // "My Flower 1" is typed only by somebody who already knows the group;
  // "hotel in Erbil" is typed by the guest worth winning.
  const title = `${branch.name} — ${t.seo.hotelIn} ${t.seo.locality}`

  // Never left empty. Without one Google writes its own from whatever text it
  // finds first, which on a hotel page is the navigation menu — and a result
  // whose summary reads "Home Our hotels Rooms About Contact" is one nobody
  // clicks. Built from the hotel's own words where it has them, and from the
  // facts that are always true of it where it does not.
  const description =
    branch.tagline ||
    [
      `${branch.name}, ${t.seo.hotelIn} ${t.seo.locality}`,
      branch.neighbourhood || branch.address,
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
      images: shareImage(
        mediaUrl(branch.heroImage, 'og'),
        branch.name,
        branchLocative(branch) || undefined,
      ),
    },
  }
}
