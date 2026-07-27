'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { BranchTeaser } from '@/utilities/teasers'
import { cn } from '@/utilities/ui'
import { OpeningMark } from './OpeningMark'
import { PhotoFrame } from './PhotoFrame'
import { monogramOf } from '@/utilities/monogram'

/**
 * The homepage's centrepiece, and the one thing this group has that a
 * single-property hotel does not.
 *
 * On a desktop it is an index: a numbered list of the hotels beside one
 * large frame, and moving between the names changes the photograph in that
 * frame. Choosing a branch becomes a moment rather than a dropdown.
 *
 * On a phone there is no hover and no room for a side-by-side, so it becomes
 * three tall full-bleed cards — the same content, read by scrolling.
 */
export function BranchSwitcher({
  branches,
  locale,
  t,
}: {
  branches: BranchTeaser[]
  locale: Locale
  t: Dictionary
}) {
  const [active, setActive] = useState(0)

  if (branches.length === 0) return null

  return (
    <>
      {/* Desktop: index beside a single changing frame. */}
      <div className="hidden gap-14 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
        <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-sand">
          {branches.map((branch, i) => (
            <div
              key={branch.id}
              className={cn(
                'absolute inset-0 transition-all duration-1000 ease-luxe',
                i === active ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
              )}
            >
              <PhotoFrame
                src={branch.imageUrl}
                alt={branch.imageAlt}
                sizes="50vw"
                monogram={monogramOf(branch.name)}
                fallbackSrc={branch.shippedPhoto}
                priority={i === 0}
              />
            </div>
          ))}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="text-sm tracking-[0.2em] text-white/80 uppercase rtl:tracking-normal">
              {branches[active]?.neighbourhood || branches[active]?.city}
            </p>
          </div>
        </div>

        <ol className="flex flex-col justify-center">
          {branches.map((branch, i) => (
            <li key={branch.id} className="border-b border-line first:border-t">
              <Link
                href={`/${locale}/branches/${branch.slug}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="group flex items-baseline gap-6 py-9 transition-colors duration-700 ease-luxe focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'text-xs tracking-[0.2em] tabular-nums transition-colors duration-700 ease-luxe',
                    i === active ? 'text-brand' : 'text-muted-ink',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'font-display block text-4xl leading-tight transition-all duration-700 ease-luxe xl:text-5xl',
                      i === active ? 'text-ink' : 'text-ink/35',
                    )}
                  >
                    {branch.name}
                  </span>
                  {branch.neighbourhood && (
                    <span
                      className={cn(
                        'mt-2 block text-xs tracking-[0.16em] uppercase transition-colors duration-700 ease-luxe rtl:tracking-normal',
                        i === active ? 'text-brand' : 'text-muted-ink',
                      )}
                    >
                      {branch.neighbourhood}
                    </span>
                  )}
                  {branch.tagline && (
                    <span
                      className={cn(
                        'mt-2 block max-w-sm text-sm leading-relaxed text-muted-ink transition-all duration-700 ease-luxe',
                        i === active
                          ? 'max-h-24 opacity-100'
                          : 'max-h-0 overflow-hidden opacity-0',
                      )}
                    >
                      {branch.tagline}
                    </span>
                  )}
                </span>

                {branch.openingSoon ? (
                  <OpeningMark
                    label={branch.openingNote || t.branch.openingSoon}
                    className="whitespace-nowrap"
                  />
                ) : (
                  <span
                    className={cn(
                      'text-[0.65rem] tracking-[0.22em] whitespace-nowrap uppercase transition-all duration-700 ease-luxe rtl:tracking-normal',
                      i === active ? 'text-brand opacity-100' : 'text-muted-ink opacity-0',
                    )}
                  >
                    {t.common.viewDetails}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* Phone and tablet: the same hotels as tall photographic cards. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {branches.map((branch, i) => (
          <Link
            key={branch.id}
            href={`/${locale}/branches/${branch.slug}`}
            className={cn(
              'group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-2xl bg-sand focus-visible:ring-1 focus-visible:ring-ink focus-visible:ring-offset-2',
              // An odd third card spans the row rather than leaving a hole.
              branches.length % 2 === 1 && i === branches.length - 1 && 'sm:col-span-2 sm:aspect-16/9',
            )}
          >
            <PhotoFrame
              src={branch.imageUrl}
              alt={branch.imageAlt}
              sizes="(min-width: 640px) 50vw, 100vw"
              monogram={monogramOf(branch.name)}
              fallbackSrc={branch.shippedPhoto}
              priority={i === 0}
              imageClassName="transition-transform duration-1000 ease-luxe group-hover:scale-105"
            />
            {branch.imageUrl && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
              />
            )}
            <div className="relative p-6 sm:p-7">
              <p className="text-[0.65rem] tracking-[0.24em] text-brand-bright uppercase rtl:tracking-normal">
                {String(i + 1).padStart(2, '0')}
                {branch.neighbourhood || branch.city
                  ? ` · ${branch.neighbourhood || branch.city}`
                  : ''}
              </p>
              <h3 className="font-display mt-3 text-3xl leading-tight text-white">{branch.name}</h3>
              {branch.openingSoon && (
                <OpeningMark
                  label={branch.openingNote || t.branch.openingSoon}
                  tone="light"
                  className="mt-3"
                />
              )}
              {branch.tagline && (
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
                  {branch.tagline}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
