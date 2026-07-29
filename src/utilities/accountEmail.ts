import type { Payload } from 'payload'

import { getServerSideURL } from './getURL'
import { diagnoseMailNetwork } from './mailNetworkDiagnosis'

/**
 * The password-reset mail.
 *
 * Written rather than left to Payload's default because that one is addressed
 * to an administrator of a content system, in English, and links into the admin
 * panel — which is a door guests are deliberately not admitted through.
 *
 * Three things a reset mail has to do, in this order: say which hotel it is
 * from, give the link, and say what to do if it was not them. The last one is
 * not politeness. This is the only message a guest receives that they did not
 * ask for, so it is the one that has to explain itself.
 */

const COPY = {
  en: {
    subject: (site: string) => `Reset your ${site} password`,
    body: (site: string, link: string, hours: number) =>
      `Somebody asked to reset the password on your ${site} account.\n\n` +
      `Open this link to choose a new one:\n${link}\n\n` +
      `The link works once and expires in ${hours} hour${hours === 1 ? '' : 's'}.\n\n` +
      `If this was not you, nothing has changed and you can ignore this message. ` +
      `Your password stays as it is until somebody opens the link above.`,
  },
  ku: {
    subject: (site: string) => `گۆڕینی وشەی نهێنی ${site}`,
    body: (site: string, link: string, hours: number) =>
      `کەسێک داوای گۆڕینی وشەی نهێنی هەژمارەکەت لە ${site} کردووە.\n\n` +
      `ئەم بەستەرە بکەرەوە بۆ هەڵبژاردنی یەکێکی نوێ:\n${link}\n\n` +
      `بەستەرەکە تەنها جارێک کار دەکات و دوای ${hours} کاتژمێر بەسەردەچێت.\n\n` +
      `ئەگەر تۆ نەبووی، هیچ نەگۆڕاوە و دەتوانیت پشتگوێی بخەیت. ` +
      `وشەی نهێنیەکەت وەک خۆی دەمێنێتەوە تا کەسێک بەستەرەکەی سەرەوە بکاتەوە.`,
  },
  ar: {
    subject: (site: string) => `إعادة تعيين كلمة مرور ${site}`,
    body: (site: string, link: string, hours: number) =>
      `طلب أحدهم إعادة تعيين كلمة المرور لحسابك في ${site}.\n\n` +
      `افتح هذا الرابط لاختيار كلمة مرور جديدة:\n${link}\n\n` +
      `يعمل الرابط مرة واحدة وتنتهي صلاحيته خلال ${hours} ساعة.\n\n` +
      `إذا لم تكن أنت، فلم يتغير شيء ويمكنك تجاهل هذه الرسالة. ` +
      `تبقى كلمة مرورك كما هي حتى يفتح أحدهم الرابط أعلاه.`,
  },
} as const

/** Payload's default reset-token lifetime, stated here so the mail can say it. */
const EXPIRY_HOURS = 1

export const sendPasswordReset = async (
  payload: Payload,
  email: string,
  token: string,
  locale: string,
): Promise<void> => {
  try {
    const settings = (await payload.findGlobal({ slug: 'settings', depth: 0 })) as {
      siteName?: string | null
    }
    const site = settings?.siteName || 'My Flower Hotels'
    const copy = COPY[locale as keyof typeof COPY] ?? COPY.en
    const link = `${getServerSideURL()}/${locale}/account/reset?token=${encodeURIComponent(token)}`

    await payload.sendEmail({
      to: email,
      subject: copy.subject(site),
      text: copy.body(site, link, EXPIRY_HOURS),
    })
    payload.logger.info(`Password reset sent to ${email}`)
  } catch (error) {
    // Logged with the link, so a guest locked out while the mail server is down
    // can still be helped by somebody with access to the logs.
    payload.logger.error(
      `Password reset for ${email} could not be sent — ${error}${await diagnoseMailNetwork()}`,
    )
  }
}
