import type { SiteSettings } from '@/utilities/getSettings'
import type { PaymentProvider } from './types'
import { gatewayProvider } from './providers/gateway'

export * from './types'
export * from './money'

/**
 * Whether this site takes card payments, and on what terms.
 *
 * Three states, and the first one is the default and the one the site has
 * always been in:
 *
 *   off       Nothing changes. No pay button, no routes doing anything, no
 *             mention of cards anywhere. This is what ships until the hotel
 *             has a live merchant account and has tested one real payment.
 *
 *   optional  The guest books as they always have — a name and a telephone
 *             number, no card, pay at the hotel — and is then *offered* the
 *             chance to pay now. Nothing is withheld if they do not. This is
 *             the state to turn on first, because it cannot lose a booking:
 *             the worst a broken gateway can do is fail a payment on a room
 *             that is already confirmed.
 *
 *   required  Reserved, and not yet implemented on purpose. Making payment a
 *             condition of confirming changes what happens when the gateway is
 *             slow or down: every such moment becomes a lost booking rather
 *             than an unpaid one. It is worth doing once there is a month of
 *             evidence that the gateway is reliable, and not before.
 */
export type PaymentMode = 'off' | 'optional' | 'required'

export const paymentMode = (settings: SiteSettings): PaymentMode => {
  const mode = (settings.onlinePayments?.mode ?? 'off') as PaymentMode
  return mode === 'optional' || mode === 'required' ? mode : 'off'
}

/**
 * The provider, or nothing.
 *
 * One today. It is a list rather than a constant because the likeliest change
 * to this folder is a second processor — a local one for dinars and an
 * international one for cards issued abroad is a common arrangement here — and
 * a booking already stores which provider took it for exactly that reason.
 */
const PROVIDERS: PaymentProvider[] = [gatewayProvider]

export const activeProvider = (): PaymentProvider | null =>
  PROVIDERS.find((provider) => provider.configured()) ?? null

/**
 * Whether a guest should be shown a pay button at all.
 *
 * Both halves have to be true: the owner has turned payments on *and* the
 * credentials are actually present. Either alone shows a button that leads to
 * an apology, which is worse for a guest than no button.
 */
export const paymentsLive = (settings: SiteSettings): boolean =>
  paymentMode(settings) !== 'off' && activeProvider() !== null
