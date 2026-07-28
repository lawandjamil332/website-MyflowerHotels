'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import type { Dictionary } from '@/i18n/dictionaries'
import { requestReset, resetPassword, signIn, signUp, type AccountResult } from '@/actions/account'
import { cn } from '@/utilities/ui'
import { btnPrimary } from './ui'

const field =
  'w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[1rem] text-ink focus:border-brand focus:ring-0 focus:outline-none'
const label = 'block text-[0.72rem] font-semibold text-ink'

function Message({ state, t }: { state: AccountResult; t: Dictionary }) {
  if (!state) return null

  if (state.status === 'sent') {
    return (
      <p role="status" className="mt-6 rounded-xl bg-brand/10 px-4 py-3 text-[0.95rem] text-brand">
        {t.account.resetSent}
      </p>
    )
  }

  return (
    <p role="alert" className="mt-6 rounded-xl bg-line/60 px-4 py-3 text-[0.95rem] text-ink">
      {state.message === 'taken'
        ? t.account.taken
        : state.message === 'required'
          ? t.form.errorRequired
          : state.message === 'weak'
            ? t.account.weak
            : t.account.badLogin}
    </p>
  )
}

/**
 * A password box you can read back.
 *
 * The eye is not a convenience. Typing a long password blind on a phone
 * keyboard, in a script that is not the keyboard's first, is how people end up
 * choosing short ones — so the control that lets them check what they typed is
 * the control that lets them choose a good password.
 */
function PasswordField({
  id,
  t,
  autoComplete,
  hint,
}: {
  id: string
  t: Dictionary
  autoComplete: 'current-password' | 'new-password'
  hint?: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div>
      <label className={label} htmlFor={id}>
        {t.account.password}
      </label>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={shown ? 'text' : 'password'}
          required
          minLength={8}
          dir="ltr"
          autoComplete={autoComplete}
          className={cn(field, 'pe-16')}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          // Not a submit button and not in the tab order between the field and
          // the button that submits: a guest tabbing out of the password should
          // land on "Sign in", not on a toggle they did not ask for.
          tabIndex={-1}
          aria-pressed={shown}
          className="absolute end-0 bottom-2 text-[0.75rem] font-semibold text-brand"
        >
          {shown ? t.account.hide : t.account.show}
        </button>
      </div>
      {hint && <p className="mt-2 text-[0.78rem] text-muted-ink">{hint}</p>}
    </div>
  )
}

export function SignInForm({ locale, t }: { locale: string; t: Dictionary }) {
  const [state, action, pending] = useActionState<AccountResult, FormData>(signIn, null)
  const [forgot, setForgot] = useState(false)

  if (forgot) return <ForgotForm locale={locale} t={t} onBack={() => setForgot(false)} />

  return (
    <form action={action}>
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-6">
        <div>
          <label className={label} htmlFor="in-email">
            {t.account.email}
          </label>
          <input
            id="in-email"
            name="email"
            type="email"
            required
            dir="ltr"
            // Named so a password manager recognises this as the sign-in pair
            // and offers to fill it. Without these it offers nothing, and a
            // guest who saved their password still has to go and find it.
            autoComplete="email"
            className={field}
          />
        </div>
        <PasswordField id="in-pass" t={t} autoComplete="current-password" />
      </div>
      <Message state={state} t={t} />
      <button type="submit" disabled={pending} className={cn(btnPrimary, 'mt-8 w-full')}>
        {pending ? t.form.sending : t.account.signIn}
      </button>
      <button
        type="button"
        onClick={() => setForgot(true)}
        className="link-line tap-safe mt-5 text-[0.88rem] text-muted-ink"
      >
        {t.account.forgot}
      </button>
    </form>
  )
}

function ForgotForm({ locale, t, onBack }: { locale: string; t: Dictionary; onBack: () => void }) {
  const [state, action, pending] = useActionState<AccountResult, FormData>(requestReset, null)
  return (
    <form action={action}>
      <input type="hidden" name="locale" value={locale} />
      <p className="mb-6 text-[0.92rem] leading-relaxed text-muted-ink">{t.account.forgotLead}</p>
      <div>
        <label className={label} htmlFor="fp-email">
          {t.account.email}
        </label>
        <input
          id="fp-email"
          name="email"
          type="email"
          required
          dir="ltr"
          autoComplete="email"
          className={field}
        />
      </div>
      <Message state={state} t={t} />
      <button type="submit" disabled={pending} className={cn(btnPrimary, 'mt-8 w-full')}>
        {pending ? t.form.sending : t.account.sendReset}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="link-line tap-safe mt-5 text-[0.88rem] text-muted-ink"
      >
        {t.account.backToSignIn}
      </button>
    </form>
  )
}

export function ResetForm({ locale, t, token }: { locale: string; t: Dictionary; token: string }) {
  const [state, action, pending] = useActionState<AccountResult, FormData>(resetPassword, null)
  return (
    <form action={action} className="mx-auto max-w-md">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <PasswordField id="rp-pass" t={t} autoComplete="new-password" hint={t.account.passwordHint} />
      <Message state={state} t={t} />
      <button type="submit" disabled={pending} className={cn(btnPrimary, 'mt-8 w-full')}>
        {pending ? t.form.sending : t.account.setPassword}
      </button>
      <Link
        href={`/${locale}/account`}
        className="link-line tap-safe mt-5 block text-[0.88rem] text-muted-ink"
      >
        {t.account.backToSignIn}
      </Link>
    </form>
  )
}

export function SignUpForm({
  locale,
  t,
  defaults,
  submitLabel,
}: {
  locale: string
  t: Dictionary
  /**
   * What the guest has already told us this session. Used by the offer on the
   * booking confirmation, where asking for their name and number a second time
   * — thirty seconds after they typed them — is how an optional account stops
   * being taken up. Known fields go along as hidden ones.
   */
  defaults?: { name?: string; phone?: string; email?: string }
  submitLabel?: string
}) {
  const [state, action, pending] = useActionState<AccountResult, FormData>(signUp, null)

  const knownName = Boolean(defaults?.name)
  const knownPhone = Boolean(defaults?.phone)
  const knownEmail = Boolean(defaults?.email)

  return (
    <form action={action}>
      <input type="hidden" name="locale" value={locale} />
      {knownName && <input type="hidden" name="name" value={defaults!.name} />}
      {knownPhone && <input type="hidden" name="phone" value={defaults!.phone} />}
      {knownEmail && <input type="hidden" name="email" value={defaults!.email} />}

      <div className="grid gap-6">
        {!knownName && (
          <div>
            <label className={label} htmlFor="up-name">
              {t.form.name}
            </label>
            <input id="up-name" name="name" required autoComplete="name" className={field} />
          </div>
        )}
        {!knownPhone && (
          <div>
            <label className={label} htmlFor="up-phone">
              {t.form.phone}
            </label>
            <input id="up-phone" name="phone" dir="ltr" autoComplete="tel" className={field} />
            {/* Not decoration and not marketing: this is the field that finds
                the stays they made before they had an account. */}
            <p className="mt-2 text-[0.78rem] text-muted-ink">{t.account.phoneHint}</p>
          </div>
        )}
        {!knownEmail && (
          <div>
            <label className={label} htmlFor="up-email">
              {t.account.email}
            </label>
            <input
              id="up-email"
              name="email"
              type="email"
              required
              dir="ltr"
              autoComplete="email"
              className={field}
            />
          </div>
        )}
        <PasswordField
          id="up-pass"
          t={t}
          autoComplete="new-password"
          hint={t.account.passwordHint}
        />
      </div>
      <Message state={state} t={t} />
      <button type="submit" disabled={pending} className={cn(btnPrimary, 'mt-8 w-full')}>
        {pending ? t.form.sending : (submitLabel ?? t.account.signUp)}
      </button>
    </form>
  )
}
