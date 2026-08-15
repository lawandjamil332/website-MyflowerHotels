import type { Payload } from 'payload'

import { getServerSideURL } from './getURL'
import { diagnoseMailNetwork } from './mailNetworkDiagnosis'
import { button, emailShell, esc, iso, para, type Dir } from './emailLayout'

/**
 * The message that asks a guest how their stay was.
 *
 * Everything needed to collect a review was already built: a form that will
 * only take one from a real booking that actually finished, an approval queue,
 * an average computed from the approved rows, and star-rating markup wired
 * into every hotel page. It had produced nothing at all — no reviews, no
 * stars, nothing for anyone to quote about whether these hotels are any good —
 * because no guest had ever been asked. This is the missing sentence.
 *
 * It is sent when staff mark a stay as having happened, which is the only
 * moment the site knows the guest has something to review. One request per
 * booking, ever: `reviewRequestedAt` is stamped before the send, so re-saving
 * or re-marking a booking cannot produce a second one. A guest asked twice
 * does not leave two reviews; they leave none, and think less of the hotel.
 *
 * The link carries the reference so the guest does not have to find it, and
 * still asks for the telephone number the booking was made on — the same two
 * facts the lookup has always required. An emailed link is not a password.
 */

const COPY = {
  en: {
    subject: (hotel: string) => `How was your stay at ${hotel}?`,
    preheader: 'It takes a minute, and it helps the next guest choose.',
    eyebrow: 'Thank you for staying',
    title: (name: string) => `We hope it was a good one, ${name}`,
    body: (hotel: string) =>
      `Thank you for staying at ${hotel}. If you have a minute, we would like to know how it went — ` +
      `what was good, and what we should put right.`,
    why:
      'Your review appears on the hotel’s page once we have read it, and it is the thing ' +
      'the next guest reads before choosing. It matters more to a hotel this size than any advertisement.',
    cta: 'Leave a review',
    need: 'You will be asked for the telephone number the booking was made on.',
    ref: 'Your reference',
    footerWhy: 'You are receiving this because you stayed with us. We will not ask again.',
  },
  ku: {
    subject: (hotel: string) => `مانەوەکەت لە ${hotel} چۆن بوو؟`,
    preheader: 'خولەکێک دەخایەنێت، و یارمەتی میوانی داهاتوو دەدات.',
    eyebrow: 'سوپاس بۆ مانەوەت',
    title: (name: string) => `هیوادارین باش بووبێت، ${name}`,
    body: (hotel: string) =>
      `سوپاس بۆ مانەوەت لە ${hotel}. ئەگەر خولەکێکت هەیە، دەمانەوێت بزانین چۆن بوو — ` +
      `چی باش بوو، و چی دەبێت چاک بکەینەوە.`,
    why:
      'پێداچوونەوەکەت لە لاپەڕەی هۆتێلەکەدا دەردەکەوێت دوای ئەوەی دەیخوێنینەوە، و ئەوەیە ' +
      'کە میوانی داهاتوو پێش هەڵبژاردن دەیخوێنێتەوە. بۆ هۆتێلێکی بەم قەبارەیە لە هەر ڕێکلامێک گرنگترە.',
    cta: 'پێداچوونەوە بنووسە',
    need: 'داوای ئەو ژمارە تەلەفۆنەت لێ دەکرێت کە حیجزەکەی پێ کراوە.',
    ref: 'ژمارەی حیجزەکەت',
    footerWhy: 'ئەم نامەیەت پێگەیشتووە چونکە لەلامان مایتەوە. دووبارە داوات لێ ناکەین.',
  },
  ar: {
    subject: (hotel: string) => `كيف كانت إقامتك في ${hotel}؟`,
    preheader: 'تستغرق دقيقة واحدة، وتساعد الضيف القادم على الاختيار.',
    eyebrow: 'شكراً لإقامتك معنا',
    title: (name: string) => `نأمل أنها كانت طيبة، ${name}`,
    body: (hotel: string) =>
      `شكراً لإقامتك في ${hotel}. إذا كان لديك دقيقة، نودّ أن نعرف كيف كانت — ` +
      `ما الذي كان جيداً، وما الذي ينبغي أن نصلحه.`,
    why:
      'يظهر تقييمك على صفحة الفندق بعد أن نقرأه، وهو ما يقرأه الضيف القادم قبل أن يختار. ' +
      'وهو أهم لفندق بهذا الحجم من أي إعلان.',
    cta: 'اكتب تقييماً',
    need: 'سيُطلب منك رقم الهاتف الذي تم الحجز به.',
    ref: 'رقم حجزك',
    footerWhy: 'وصلتك هذه الرسالة لأنك أقمت معنا. لن نطلب مرة أخرى.',
  },
} as const

type Copy = (typeof COPY)[keyof typeof COPY]

export const sendReviewRequest = async (
  payload: Payload,
  bookingId: number,
): Promise<void> => {
  let reference = String(bookingId)

  try {
    const booking = await payload.findByID({
      collection: 'bookings',
      id: bookingId,
      depth: 1,
      overrideAccess: true,
    })
    if (!booking) return

    reference = booking.reference ?? reference
    const to = booking.guestEmail
    // Most bookings here are made with a phone number and no email at all.
    // That is deliberate and it simply means there is nobody to write to.
    if (!to) return
    if (booking.reviewRequestedAt) return

    const locale = (['en', 'ku', 'ar'].includes(String(booking.locale)) ? booking.locale : 'en') as
      | 'en'
      | 'ku'
      | 'ar'
    const copy: Copy = COPY[locale]
    const dir: Dir = locale === 'en' ? 'ltr' : 'rtl'

    const settings = (await payload.findGlobal({ slug: 'settings', depth: 0 })) as {
      siteName?: string | null
      phone?: string | null
    }
    const siteName = settings?.siteName || 'My Flower Hotels'
    const branch = typeof booking.branch === 'object' && booking.branch ? booking.branch : null
    const hotel = branch?.name || siteName
    // First name only. "Dear Lawand Jamil Ahmed" is a letter from a bank.
    const firstName = String(booking.guestName ?? '').trim().split(/\s+/)[0] || ''

    // Straight to the lookup with the reference already filled in. The guest
    // still proves the booking is theirs with the telephone number.
    const link =
      `${getServerSideURL()}/${locale}/booking` +
      `?reference=${encodeURIComponent(booking.reference ?? '')}#review`

    const body = [
      para(copy.body(iso(hotel)), dir),
      para(copy.why, dir),
      `<div style="height:8px;line-height:8px;">&nbsp;</div>`,
      button(link, copy.cta),
      `<div style="height:8px;line-height:8px;">&nbsp;</div>`,
      para(
        `${esc(copy.ref)}: <strong style="letter-spacing:0.08em;">${iso(booking.reference)}</strong>`,
        dir,
      ),
      para(copy.need, dir),
    ].join('\n')

    const html = emailShell({
      dir,
      siteName,
      preheader: copy.preheader,
      eyebrow: copy.eyebrow,
      title: copy.title(iso(firstName)).trim().replace(/,\s*$/, ''),
      body,
      // Isolated, and the hotel's own number ahead of the group's. A telephone
      // number dropped raw into an Arabic or Kurdish footer is reordered by the
      // bidi algorithm — "+964 772 541 9898" came out as "9898 541 772 964+",
      // with the plus at the wrong end, which is what every other mail on this
      // site already wraps iso() around to prevent.
      footerLines: [iso(branch?.phone || settings?.phone || ''), copy.footerWhy].filter(Boolean),
    })

    const text =
      `${copy.body(hotel)}\n\n${copy.why}\n\n` +
      `${copy.cta}: ${link}\n\n` +
      `${copy.ref}: ${booking.reference}\n${copy.need}`

    // Stamped before the send, not after. If the mail server is slow enough
    // that staff save the row again meanwhile, the worst outcome should be a
    // review request that never arrives — not two that do.
    await payload.update({
      collection: 'bookings',
      id: bookingId,
      data: { reviewRequestedAt: new Date().toISOString() },
      overrideAccess: true,
      context: { skipReviewRequest: true },
    })

    await payload.sendEmail({ to, subject: copy.subject(hotel), html, text })
    payload.logger.info(`Review request for ${reference} → ${to}`)
  } catch (error) {
    // Never allowed to matter. This runs off the back of staff marking a stay
    // as finished, and that must not fail because a review email did.
    payload.logger.error(
      `Review request for ${reference} could not be sent — ${error}${await diagnoseMailNetwork()}`,
    )
  }
}
