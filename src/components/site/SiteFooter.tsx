import Image from 'next/image'
import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { SiteSettings } from '@/utilities/getSettings'
import { getBranches } from '@/utilities/branches'
import { toTelHref, toWhatsAppHref } from '@/utilities/contact'
import { cn } from '@/utilities/ui'
import { InstagramMark } from './InstagramMark'
import { WhatsAppMark } from './WhatsAppMark'
import { LocaleSwitcher } from './LocaleSwitcher'
import { Stars } from './Stars'
import { shell } from './ui'

/**
 * Ink footer. It closes the page on the darkest surface on the site, which is
 * what stops a long scroll of photographs from simply stopping.
 *
 * Every hotel is listed by name here as well as in the switcher: the
 * footer is where a returning guest looks for the branch they stayed at last
 * time.
 */
export async function SiteFooter({
  locale,
  t,
  settings,
}: {
  locale: Locale
  t: Dictionary
  settings: SiteSettings
}) {
  const siteName = settings.siteName || 'My Flower Hotels'
  const tel = toTelHref(settings.phone)
  const wa = toWhatsAppHref(settings.whatsapp)
  const social = settings.social ?? {}
  const branches = await getBranches(locale)

  // There is no group Instagram — there are four, one per hotel, and they are
  // shown against their own hotels below. The single site-wide account was one
  // of those four standing in for the group, which sent everyone looking for
  // My Flower 1 to My Flower 3. It is dropped here once the hotels carry their
  // own, and still shown when none of them do, so a group account entered in
  // settings is never silently ignored.
  const anyBranchInstagram = branches.some((branch) => Boolean(branch.instagram))

  // Same reasoning for the phone. The site-wide number is My Flower 1's line,
  // and now every hotel prints its own two above, it appeared a third time
  // under a "Contact" heading as though it belonged to the group — which is
  // exactly the "it only writes one number" the owner was looking at. It is
  // kept only as a fallback, for the case where no hotel has a line of its own.
  const anyBranchPhone = branches.some((branch) => Boolean(branch.phone))
  const showGroupContact = !anyBranchPhone

  const socialLinks = [
    { href: social.facebook, label: 'Facebook' },
    { href: anyBranchInstagram ? undefined : social.instagram, label: 'Instagram' },
    { href: social.tiktok, label: 'TikTok' },
    { href: social.youtube, label: 'YouTube' },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href))

  // With the group number demoted, this column can hold nothing at all. A
  // heading standing over an empty space reads as content that failed to load,
  // so the column is dropped and the row closes up around it.
  const hasContactColumn = Boolean(
    (showGroupContact && (tel || wa)) || settings.email || socialLinks.length > 0,
  )

  // White, not brand. These headings were set in the brand navy on a footer
  // painted the same brand navy, so "Menu", "Our hotels" and "Contact" were
  // rendering at one-to-one contrast — present in the markup, read out by
  // screen readers, and invisible to everyone looking at the page.
  const columnHeading =
    'text-[0.65rem] tracking-[0.24em] text-white/70 uppercase rtl:tracking-normal'
  // tap-safe-lg gives these a 44px hit area; the gap-6 on every column below
  // is what stops those areas overlapping each other.
  const columnLink =
    'link-line tap-safe tap-safe-lg text-sm text-white/60 transition-colors duration-500 ease-luxe hover:text-white'
  const iconLink =
    'flex h-11 w-11 items-center justify-center text-white/45 transition-colors duration-500 ease-luxe hover:text-white'

  return (
    <footer className="bg-brand text-white">
      <div className={cn(shell, 'py-16 sm:py-20')}>
        <div
          className={cn(
            // items-start, and it is the whole fix for a footer that was half
            // empty navy. A grid row stretches every cell to the tallest one,
            // and the hotels column — four names, each with two numbers under
            // it — is roughly three times the height of the menu beside it. So
            // the short columns were being stretched to match and their links
            // spread down four hundred pixels of nothing.
            'grid items-start gap-12 lg:gap-14',
            // The hotels take two columns' worth of width, because inside them
            // they are laid out two across — see below.
            hasContactColumn
              ? 'lg:grid-cols-[1.1fr_0.8fr_1.6fr_0.9fr]'
              : 'lg:grid-cols-[1.1fr_0.8fr_1.6fr]',
          )}
        >
          <div>
            <Image
              src="/logo-light.png"
              alt={siteName}
              width={228}
              height={147}
              className="h-16 w-auto object-contain"
            />
            <Stars count={settings.stars} className="mt-4" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/75">
              {t.home.heroEyebrow}
            </p>
            {settings.establishedYear && (
              <p className="mt-2 text-xs tracking-[0.12em] text-white/65 uppercase rtl:tracking-normal">
                Since {settings.establishedYear}
              </p>
            )}
            <div aria-hidden="true" className="rule-brand mt-7" />
          </div>

          <nav className="flex flex-col items-start gap-6">
            <p className={columnHeading}>{t.common.menu}</p>
            <Link href={`/${locale}`} className={columnLink}>
              {t.nav.home}
            </Link>
            <Link href={`/${locale}/branches`} className={columnLink}>
              {t.nav.branches}
            </Link>
            <Link href={`/${locale}/rooms`} className={columnLink}>
              {t.nav.rooms}
            </Link>
            <Link href={`/${locale}/about`} className={columnLink}>
              {t.nav.about}
            </Link>
            <Link href={`/${locale}/contact`} className={columnLink}>
              {t.nav.contact}
            </Link>
            <Link href={`/${locale}/account`} className={columnLink}>
              {t.account.myBookings}
            </Link>
            {/* For the guest who booked without an account, which is most of
                them. Without a door here their reference opens nothing and
                every change goes through somebody answering a phone. */}
            <Link href={`/${locale}/booking`} className={columnLink}>
              {t.booking.manageTitle}
            </Link>
          </nav>

          {/* Each hotel keeps its own Instagram, so the account sits beside the
              hotel it belongs to rather than in a list of its own. Listing the
              four accounts separately would print all four hotel names twice
              in one footer, and pairing them here says which is which without
              a word of explanation. */}
          <nav>
            <p className={cn(columnHeading, 'mb-6 block')}>{t.nav.branches}</p>
            {/* Two across, not four down.
                Four hotels each carrying a name, two icons and two phone
                numbers made a column about three times the height of the menu
                beside it — so the footer was as tall as a section of the page
                and two thirds of it was empty navy to the left of this list.
                Paired, the whole footer is one screenful and the columns end
                near enough together to read as a row. */}
            <div className="grid items-start gap-x-10 gap-y-8 sm:grid-cols-2">
              {branches.length > 0 ? (
                branches.map((branch) => {
                  const branchWa = toWhatsAppHref(
                    branch.whatsapp,
                    `${t.branch.enquire} — ${branch.name}`,
                  )
                  const numbers = [branch.phone, branch.phoneAlt].filter(Boolean) as string[]
                  return (
                    <div key={branch.id} className="flex flex-col items-start gap-4">
                      <span className="flex items-center gap-2">
                        <Link href={`/${locale}/branches/${branch.slug}`} className={columnLink}>
                          {branch.name}
                        </Link>
                        {branchWa && (
                          <a
                            href={branchWa}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${branch.name} — ${t.common.whatsapp}`}
                            className={iconLink}
                          >
                            <WhatsAppMark className="h-4 w-4" />
                          </a>
                        )}
                        {branch.instagram && (
                          <a
                            href={branch.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${branch.name} — Instagram`}
                            className={iconLink}
                          >
                            <InstagramMark />
                          </a>
                        )}
                      </span>

                      {numbers.length > 0 && (
                        <span className="flex flex-wrap items-center gap-x-4 gap-y-3">
                          {numbers.map((number) => (
                            <a
                              key={number}
                              href={toTelHref(number)}
                              dir="ltr"
                              className="link-line tap-safe tap-safe-lg text-xs text-white/50 transition-colors duration-500 ease-luxe hover:text-white"
                            >
                              {number}
                            </a>
                          ))}
                        </span>
                      )}
                    </div>
                  )
                })
              ) : (
                <span className="text-sm text-white/60">—</span>
              )}
            </div>
          </nav>

          {hasContactColumn && (
            <div className="flex flex-col items-start gap-6">
              <p className={columnHeading}>{t.nav.contact}</p>
              {showGroupContact && tel && (
                <a href={tel} className={columnLink} dir="ltr">
                  {settings.phone}
                </a>
              )}
              {showGroupContact && wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className={columnLink}>
                  {t.common.whatsapp}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className={columnLink}>
                  {settings.email}
                </a>
              )}
              {socialLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={columnLink}
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* The name at architectural scale across the foot of the page. It is
          the last thing a guest sees, and at this size it registers as a mark
          rather than a line of small print. */}
      <div className={cn(shell, 'overflow-hidden pt-4')} aria-hidden="true">
        <p
          className="font-display leading-[0.8] whitespace-nowrap text-white/[0.07] select-none"
          style={{
            // Sized from the name's own length so it fills the width and stops
            // there. A fixed viewport size would clip "My Flower Hotels"
            // mid-word and leave a short name marooned in the middle.
            fontSize: `clamp(2.75rem, ${Math.min(15, 205 / Math.max(siteName.length, 7)).toFixed(2)}vw, 13rem)`,
            letterSpacing: '0',
          }}
        >
          {siteName}
        </p>
      </div>

      <div className="border-t border-white/10">
        <div
          className={cn(
            shell,
            'flex flex-col-reverse items-center justify-between gap-5 py-7 sm:flex-row',
          )}
        >
          <p className="text-xs text-white/65">
            © {new Date().getFullYear()} {siteName}
          </p>
          <LocaleSwitcher current={locale} label={t.common.language} tone="light" size="full" />
        </div>
      </div>
    </footer>
  )
}
