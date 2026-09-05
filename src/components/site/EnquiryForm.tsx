'use client'

import { useSearchParams } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'

import type { Dictionary } from '@/i18n/dictionaries'
import { submitEnquiry, type EnquiryState } from '@/actions/enquiry'
import { cn } from '@/utilities/ui'
import { EVENTS, track } from '@/utilities/track'
import { WhatsAppMark } from './WhatsAppMark'
import { btnPrimary, btnWhatsApp, btnSmall } from './ui'

/**
 * Inputs are ruled underneath rather than boxed. A page built on hairlines and
 * photographs should not suddenly grow six grey rectangles — the line under
 * the label is enough to say "write here", and it keeps the form quiet enough
 * to sit beside the photography.
 */
const field =
  'w-full border-0 border-b border-line bg-transparent px-0 py-3 text-ink placeholder:text-muted-ink/50 focus:border-brand focus:outline-none focus:ring-0 transition-colors duration-500 ease-luxe'

const label =
  'block text-[0.72rem] font-semibold tracking-[0.14em] text-muted-ink uppercase rtl:tracking-normal'

function SubmitButton({ t }: { t: Dictionary }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={cn(btnPrimary, 'w-full sm:w-auto')}>
      {pending ? `${t.form.sending}…` : t.form.submit}
    </button>
  )
}

export function EnquiryForm({
  t,
  branchId,
  roomId,
  whatsappHref,
  /**
   * Whether the card draws its own eyebrow, heading and lead.
   *
   * Off when the band around it already carries them. On a wide screen the
   * form is a 768px card, and centred on its own it left a thousand pixels of
   * empty ground either side; ranged beside its own heading it is a two-column
   * band that fills the row. The card keeps the heading when nothing outside
   * it is providing one, so nothing turns up untitled.
   */
  showHeading = true,
  className,
}: {
  t: Dictionary
  branchId?: number
  roomId?: number
  whatsappHref?: string
  showHeading?: boolean
  className?: string
}) {
  const [state, action] = useActionState<EnquiryState, FormData>(submitEnquiry, {
    status: 'idle',
  })

  // Dates and party size chosen in the search bar on the homepage arrive as
  // query parameters. Carrying them in means the guest types them once, not
  // twice — the whole point of asking on the first screen.
  const search = useSearchParams()
  const prefill = {
    checkIn: search?.get('checkIn') ?? '',
    checkOut: search?.get('checkOut') ?? '',
    guests: search?.get('guests') ?? '',
  }

  // The other way a guest asks for a room. Counted alongside bookings so the
  // funnel is not reading half the demand: plenty of people here send a
  // question rather than filling in dates, and a site judged only on completed
  // bookings undercounts what it is actually producing for the hotel.
  useEffect(() => {
    if (state.status !== 'success') return
    track(EVENTS.enquiry, { page: window.location.pathname })
  }, [state.status])

  if (state.status === 'success') {
    return (
      <div
        id="enquire"
        className={cn('border border-brand/40 rounded-2xl bg-card p-8 sm:p-10', className)}
      >
        <p className="eyebrow">{t.form.eyebrow}</p>
        <p className="font-display mt-5 text-3xl text-ink">{t.form.successTitle}</p>
        <p className="mt-4 max-w-md leading-relaxed text-muted-ink">{t.form.successBody}</p>
      </div>
    )
  }

  const invalid = (name: string) => state.fields?.includes(name)

  return (
    <form
      id="enquire"
      action={action}
      className={cn('scroll-mt-28 border border-line rounded-2xl bg-card p-8 sm:p-10', className)}
    >
      {showHeading && (
        <>
          <p className="eyebrow">{t.form.eyebrow}</p>
          <h2 className="font-display display-lg mt-5 text-ink">{t.form.title}</h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-ink">{t.form.lead}</p>
        </>
      )}

      <input type="hidden" name="branch" value={branchId ?? ''} />
      <input type="hidden" name="room" value={roomId ?? ''} />

      {/* Honeypot: hidden from guests, irresistible to bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={cn('grid gap-x-8 gap-y-7 sm:grid-cols-2', showHeading && 'mt-9')}>
        <div>
          <label className={label} htmlFor="enq-name">
            {t.form.name}
          </label>
          <input
            id="enq-name"
            name="name"
            required
            autoComplete="name"
            aria-invalid={invalid('name') || undefined}
            className={cn(field, invalid('name') && 'border-destructive')}
          />
        </div>

        <div>
          <label className={label} htmlFor="enq-phone">
            {t.form.phone}
          </label>
          <input
            id="enq-phone"
            name="phone"
            required
            type="tel"
            dir="ltr"
            autoComplete="tel"
            aria-invalid={invalid('phone') || undefined}
            className={cn(field, invalid('phone') && 'border-destructive')}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor="enq-email">
            {t.form.email}{' '}
            <span className="tracking-normal normal-case opacity-60">({t.form.optional})</span>
          </label>
          <input
            id="enq-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="enq-in">
            {t.form.checkIn}
          </label>
          <input
            id="enq-in"
            name="checkIn"
            type="date"
            dir="ltr"
            defaultValue={prefill.checkIn}
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="enq-out">
            {t.form.checkOut}
          </label>
          <input
            id="enq-out"
            name="checkOut"
            type="date"
            dir="ltr"
            defaultValue={prefill.checkOut}
            className={field}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor="enq-guests">
            {t.form.guests}
          </label>
          <input
            id="enq-guests"
            name="guests"
            type="number"
            min={1}
            max={20}
            dir="ltr"
            defaultValue={prefill.guests}
            className={cn(field, 'sm:max-w-32')}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={label} htmlFor="enq-message">
            {t.form.message}{' '}
            <span className="tracking-normal normal-case opacity-60">({t.form.optional})</span>
          </label>
          <textarea id="enq-message" name="message" rows={3} className={cn(field, 'resize-none')} />
        </div>
      </div>

      {state.status === 'error' && (
        <p role="alert" className="mt-7 border-s-2 border-destructive ps-4 text-sm text-ink">
          {state.message === 'required' ? t.form.errorRequired : t.form.errorGeneric}
        </p>
      )}

      <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton t={t} />

        {whatsappHref && (
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-ink sm:inline">{t.form.orWhatsApp}</span>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(btnWhatsApp, btnSmall)}
            >
              <WhatsAppMark />
              {t.common.whatsapp}
            </a>
          </div>
        )}
      </div>
    </form>
  )
}
