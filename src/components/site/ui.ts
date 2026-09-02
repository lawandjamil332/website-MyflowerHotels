/**
 * Shared surface classes. Buttons, rules and section shells appear on every
 * page; keeping the definitions in one place is what stops the site drifting
 * into six slightly different greys and four button heights.
 *
 * A button here says what it does, in the body face at its heaviest, at a size
 * you can read without leaning in. The previous design set them in letterspaced
 * capitals at 11px, which looked considered and cost a moment's reading every
 * time — and on a booking site the control is the product.
 */

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[0.95rem] font-semibold leading-none transition-all duration-300 ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50'

/** Solid navy pill. The one thing on a light section meant to be pressed. */
export const btnPrimary = `${base} bg-brand px-8 py-4 text-white hover:bg-brand-bright focus-visible:ring-brand focus-visible:ring-offset-bone`

/** Outlined in the same navy, for the secondary action beside it. */
export const btnOutline = `${base} border border-brand bg-bone px-8 py-4 text-brand hover:bg-sand focus-visible:ring-brand focus-visible:ring-offset-bone`

/** Sits on a photograph or on the navy footer. */
export const btnOnDark = `${base} border border-white/70 px-8 py-4 text-white hover:border-white hover:bg-white hover:text-ink focus-visible:ring-white focus-visible:ring-offset-transparent`

/** Filled light pill on a dark ground — the primary action over a hero. */
export const btnLight = `${base} bg-white px-8 py-4 text-ink hover:bg-sand focus-visible:ring-white focus-visible:ring-offset-transparent`

/** WhatsApp keeps its own colour: guests recognise it faster than any label. */
export const btnWhatsApp = `${base} bg-whatsapp px-8 py-4 text-white hover:brightness-95 focus-visible:ring-whatsapp focus-visible:ring-offset-bone`

/** Compact variant for cards and sidebars where a full-height button crowds. */
export const btnSmall = 'px-6 py-2.5 text-[0.85rem]'

/**
 * Standard page gutter. Wide, because the photography needs the room — and it
 * keeps widening past the laptop sizes. Capping the measure at 1376px is right
 * for a column of prose and wrong for a page carrying full-bleed photographs:
 * on a 2560px monitor it left nearly half the screen empty.
 */
export const shell =
  'mx-auto w-full max-w-[86rem] px-5 sm:px-8 lg:px-12 xl:max-w-[94rem] 2xl:max-w-[108rem] 2xl:px-16'

/**
 * Vertical rhythm between major sections.
 *
 * Tightened again, and this time from a screenshot rather than from taste. At
 * py-24 with a section heading carrying mb-16 under it, two consecutive bands
 * put about four hundred pixels of empty ground between one row of cards and
 * the next — so a page with real content on it read as a page waiting for
 * content to load. The reference is dense: every band carries a row of cards
 * or a photograph, and the space between them is a breath, not a gap.
 *
 * Air is worth paying for around a *heading*, which is why headings keep their
 * own margin. It is not worth paying for twice in the same place.
 */
export const sectionY = 'py-12 sm:py-16 lg:py-20'
