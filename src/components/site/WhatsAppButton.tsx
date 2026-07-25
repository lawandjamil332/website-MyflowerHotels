import { toWhatsAppHref } from '@/utilities/contact'
import { WhatsAppMark } from './WhatsAppMark'

/**
 * Fixed to the bottom of the screen on phones. The brief is explicit that in
 * this market WhatsApp converts better than any form, so it stays reachable
 * on every page rather than living only on the contact page.
 *
 * Hidden entirely when no number is set, rather than rendering a dead button.
 */
export function WhatsAppButton({ phone, label }: { phone?: string | null; label: string }) {
  const href = toWhatsAppHref(phone)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      className="fixed end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white ring-1 ring-white/25 shadow-[0_10px_40px_-8px_rgb(0_0_0/0.45)] transition-transform duration-500 ease-luxe hover:scale-105 focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 md:hidden"
    >
      <WhatsAppMark className="h-6 w-6" />
    </a>
  )
}
