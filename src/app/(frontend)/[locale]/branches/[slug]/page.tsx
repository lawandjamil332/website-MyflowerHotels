import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Metadata } from 'next'

import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getBranchBySlug, getBranches, getRoomsForBranch } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { SITE_NAME } from '@/utilities/site'
import { mediaAlt, mediaUrl } from '@/utilities/media'
import { toMapsHref, toTelHref, toWhatsAppHref, whatsappMessage } from '@/utilities/contact'
import { branchLocative } from '@/utilities/teasers'
import { comma, formatDateLong, formatNumber } from '@/utilities/format'
import { shippedPhoto } from '@/utilities/shippedPhoto'
import { shareImage } from '@/utilities/shareImage'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
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
  const wa = toWhatsAppHref(
    branch.whatsapp,
    whatsappMessage(t, { siteName: settings.siteName || SITE_NAME, hotel: branch.name }),
  )
  const tel = toTelHref(branch.phone)
  const telAlt = toTelHref(branch.phoneAlt)
  // Not open yet: the page still shows the hotel, but must not offer a phone
  // line nobody is answering or a room list that does not exist.
  const openingSoon = isOpeningSoon(branch)
  const opening = openingLabel(branch, t.branch.openingSoon)
  const hasOverview = Boolean(branch.description) || (branch.amenities?.length ?? 0) > 0

  // What the left-hand column can show even when nobody has written a word of
  // description. Every hotel has an address, a landmark line, and its hours —
  // and until these moved out of the reservation card, a hotel with no
  // description rendered as one narrow card adrift in the middle of a laptop
  // screen with five hundred pixels of white either side of it. Which is every
  // hotel on this site: none of the four has a description or an amenity
  // entered yet.
  const hasFacts = Boolean(
    branch.address ||
      branch.nearby ||
      branch.checkInAnyTime ||
      branch.checkInTime ||
      branch.checkOutTime,
  )
  const hasLeftColumn = hasOverview || hasFacts

  const factLabel =
    'text-[0.72rem] font-semibold tracking-[0.14em] text-muted-ink uppercase rtl:tracking-normal'

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
        reviews={reviews}
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
      <section className={cn(shell, sectionY)}>
        <div className={cn('grid gap-14 lg:gap-20', hasLeftColumn && 'lg:grid-cols-[1.4fr_0.9fr]')}>
          {hasLeftColumn && (
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

              {/* Where it is, what it is near, and the hours — out here in the
                  wide column rather than stacked inside the reservation card.

                  The card was doing two jobs at once. It carried the facts a
                  guest reads *and* the buttons they press, which made it tall,
                  narrow and slow to scan; and on a hotel with nothing written
                  about it — which is all four of them — it was the only thing
                  on the band, so the page was a single column of small print
                  floating in the middle of a laptop screen. Split, the facts
                  get the width to be read across and the card goes back to
                  being what its name says. */}
              {hasFacts && (
                <Reveal
                  delay={hasOverview ? 210 : 60}
                  className={hasOverview ? 'mt-14 border-t border-line pt-12' : undefined}
                >
                  {!hasOverview && <p className="eyebrow mb-7">{t.branch.overviewEyebrow}</p>}
                  <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
                    {branch.address && (
                      <div className="sm:col-span-2">
                        <dt className={factLabel}>{t.branch.location}</dt>
                        <dd className="mt-2.5 leading-relaxed whitespace-pre-line text-ink-soft">
                          {branch.address}
                        </dd>
                        {/* What this hotel is near, in the owner's own words.
                            Guests look for a room by what it is close to far
                            more often than by the name of the hotel, and until
                            this field existed a page about a hotel ten minutes
                            from the Citadel contained neither the word Citadel
                            nor the ten minutes. */}
                        {branch.nearby && (
                          <dd className="mt-3 leading-relaxed whitespace-pre-line text-muted-ink">
                            {branch.nearby}
                          </dd>
                        )}
                      </div>
                    )}
                    {!openingSoon && (branch.checkInAnyTime || branch.checkInTime) && (
                      <div>
                        <dt className={factLabel}>{t.branch.checkIn}</dt>
                        <dd className="font-display mt-2 text-2xl text-ink">
                          {branch.checkInAnyTime ? t.branch.anyTime : branch.checkInTime}
                        </dd>
                      </div>
                    )}
                    {!openingSoon && branch.checkOutTime && (
                      <div>
                        <dt className={factLabel}>{t.branch.checkOut}</dt>
                        <dd className="font-display mt-2 text-2xl text-ink">
                          {branch.checkOutTime}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Reveal>
              )}
            </div>
          )}

          <aside className={cn(!hasLeftColumn && 'mx-auto w-full max-w-md')}>
            <Reveal
              delay={120}
              className={cn(
                hasLeftColumn && 'lg:sticky lg:top-[calc(var(--site-header-h,4.5rem)+4.5rem)]',
              )}
            >
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

                {/* The reputation this hotel already has, where it actually
                    lives. The reviews section further down is empty on every
                    hotel — nobody has left one here — while Booking.com holds
                    over a thousand for one of these. A guest choosing between
                    this page and a listing site saw nothing here and a score
                    there, and booked there, at fifteen per cent.

                    Attributed and linked rather than absorbed: these are
                    somebody else's reviews on somebody else's site, so the
                    sentence says so and the date says when it was true. It is
                    deliberately not fed into aggregateRating markup — Google
                    requires the reviews behind a rating to be on the page
                    carrying it, and claiming these as our own is how a domain
                    loses its rich results for good. */}
                {typeof branch.bookingComScore === 'number' &&
                  typeof branch.bookingComReviews === 'number' &&
                  branch.bookingComReviews > 0 &&
                  (() => {
                    const line = t.branch.ratedOn
                      .replace('{score}', formatNumber(branch.bookingComScore ?? 0, locale))
                      .replace('{count}', formatNumber(branch.bookingComReviews ?? 0, locale))
                    return (
                      <p className="mt-5 border-t border-line pt-5 text-sm leading-relaxed text-muted-ink">
                        {branch.bookingComUrl ? (
                          <a
                            href={branch.bookingComUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-ink underline decoration-line underline-offset-4 transition-colors hover:text-brand"
                          >
                            {line}
                          </a>
                        ) : (
                          line
                        )}
                        {/* A real space, not only the margin below. Anything
                            reading this page as text — which is the entire
                            point of publishing the figure — sees the two runs
                            joined into "Booking.comas of" without it. */}
                        {branch.bookingComChecked && ' '}
                        {branch.bookingComChecked && (
                          <span className="text-[0.8rem]">
                            {t.branch.ratedOnChecked.replace(
                              '{date}',
                              formatDateLong(branch.bookingComChecked, locale),
                            )}
                          </span>
                        )}
                      </p>
                    )
                  })()}

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
              <Gallery
                items={gallery}
                labels={{
                  close: t.common.close,
                  previous: t.common.previous,
                  next: t.common.next,
                }}
              />
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
            <div>
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
            <CardRail
              label={t.branch.rooms}
              previousLabel={t.common.previous}
              nextLabel={t.common.next}
            >
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
          <CardRail
            label={t.branch.otherHotels}
            previousLabel={t.common.previous}
            nextLabel={t.common.next}
          >
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
            {/* The invitation on one side, the form on the other.
                Centred on its own the card was 768px of form with a thousand
                pixels of empty ground either side of it on a wide screen — and
                it carried its own heading, so the band had a title nobody
                could see from the left margin. Split, the row fills, and the
                two faster ways to reach the desk sit under the words asking
                for a message rather than below the send button. */}
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
              <Reveal>
                <p className="eyebrow">{t.form.eyebrow}</p>
                <h2 className="font-display display-lg mt-5 text-ink">{t.form.title}</h2>
                <p className="mt-5 max-w-md text-[1.05rem] leading-[1.6] text-muted-ink">
                  {t.form.lead}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:max-w-xs">
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(btnWhatsApp, btnSmall)}
                    >
                      <WhatsAppMark />
                      {t.common.whatsapp}
                    </a>
                  )}
                  {tel && (
                    <a href={tel} dir="ltr" className={cn(btnOutline, btnSmall)}>
                      {branch.phone}
                    </a>
                  )}
                </div>
              </Reveal>
              <Reveal delay={120}>
                <EnquiryForm t={t} branchId={branch.id} whatsappHref={wa} showHeading={false} />
              </Reveal>
            </div>
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
      `${branch.name}${comma(locale)} ${t.seo.hotelIn} ${t.seo.locality}`,
      branch.neighbourhood || branch.address,
      t.seo.bookDirect,
    ]
      .filter(Boolean)
      .join('. ')

  return {
    title,
    description,
    openGraph: mergeOpenGraph(
      {
        title,
        description,
        images: shareImage(
          mediaUrl(branch.heroImage, 'og'),
          branch.name,
          branchLocative(branch) || undefined,
        ),
      },
      locale,
    ),
  }
}
