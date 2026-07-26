/**
 * Shared surface classes. Buttons, rules and section shells appear on every
 * page; keeping the definitions in one place is what stops the site drifting
 * into six slightly different greys and four button heights.
 *
 * Letterspaced uppercase is the house voice for anything clickable — but only
 * in Latin. Arabic and Kurdish letters join, so tracking them apart breaks the
 * word; every button resets it under `rtl:`.
 */

const base =
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-[0.7rem] font-medium uppercase tracking-[0.22em] rtl:tracking-normal rtl:text-xs transition-all duration-500 ease-luxe focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 disabled:opacity-50'

/** Solid ink. The single most important action on a light section. */
export const btnPrimary = `${base} bg-ink px-8 py-4 text-bone hover:bg-ink-soft focus-visible:ring-ink focus-visible:ring-offset-bone`

/** Outlined, for the secondary action beside it. */
export const btnOutline = `${base} border border-ink/25 px-8 py-4 text-ink hover:border-ink hover:bg-ink hover:text-bone focus-visible:ring-ink focus-visible:ring-offset-bone`

/** Sits on a photograph or on the ink footer. */
export const btnOnDark = `${base} border border-white/35 px-8 py-4 text-white hover:border-white hover:bg-white hover:text-ink focus-visible:ring-white focus-visible:ring-offset-transparent`

/** Filled light button on a dark ground — the primary action over a hero. */
export const btnLight = `${base} bg-bone px-8 py-4 text-ink hover:bg-brass focus-visible:ring-white focus-visible:ring-offset-transparent`

/** WhatsApp keeps its own colour: guests recognise it faster than any label. */
export const btnWhatsApp = `${base} bg-whatsapp px-8 py-4 text-white hover:brightness-95 focus-visible:ring-whatsapp focus-visible:ring-offset-bone`

/** Compact variant for cards and sidebars where a full-height button crowds. */
export const btnSmall = 'px-6 py-3'

/**
 * Standard page gutter. Wide, because the photography needs the room — and it
 * keeps widening past the laptop sizes. Capping the measure at 1376px is right
 * for a column of prose and wrong for a page carrying full-bleed photographs:
 * on a 2560px monitor it left nearly half the screen empty.
 */
export const shell =
  'mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-12 xl:max-w-[94rem] 2xl:max-w-[108rem] 2xl:px-16'

/** Vertical rhythm between major sections. */
export const sectionY = 'py-20 sm:py-28 lg:py-36'
