'use client'

import { useActionState } from 'react'

import type { Dictionary } from '@/i18n/dictionaries'
import { signIn, signUp, type AccountResult } from '@/actions/account'
import { cn } from '@/utilities/ui'
import { btnPrimary } from './ui'

const field =
  'w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[1rem] text-ink focus:border-brand focus:ring-0 focus:outline-none'
const label = 'block text-[0.72rem] font-semibold text-ink'

function Error({ state, t }: { state: AccountResult; t: Dictionary }) {
  if (!state) return null
  return (
    <p role="alert" className="mt-6 rounded-xl bg-line/60 px-4 py-3 text-[0.95rem] text-ink">
      {state.message === 'taken'
        ? t.account.taken
        : state.message === 'required'
          ? t.form.errorRequired
          : t.account.badLogin}
    </p>
  )
}

export function SignInForm({ locale, t }: { locale: string; t: Dictionary }) {
  const [state, action, pending] = useActionState<AccountResult, FormData>(signIn, null)
  return (
    <form action={action}>
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-6">
        <div>
          <label className={label} htmlFor="in-email">
            {t.account.email}
          </label>
          <input id="in-email" name="email" type="email" required dir="ltr" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="in-pass">
            {t.account.password}
          </label>
          <input
            id="in-pass"
            name="password"
            type="password"
            required
            dir="ltr"
            autoComplete="current-password"
            className={field}
          />
        </div>
      </div>
      <Error state={state} t={t} />
      <button type="submit" disabled={pending} className={cn(btnPrimary, 'mt-8 w-full')}>
        {t.account.signIn}
      </button>
    </form>
  )
}

export function SignUpForm({ locale, t }: { locale: string; t: Dictionary }) {
  const [state, action, pending] = useActionState<AccountResult, FormData>(signUp, null)
  return (
    <form action={action}>
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-6">
        <div>
          <label className={label} htmlFor="up-name">
            {t.form.name}
          </label>
          <input id="up-name" name="name" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="up-phone">
            {t.form.phone} <span className="font-normal text-muted-ink">({t.form.optional})</span>
          </label>
          <input id="up-phone" name="phone" dir="ltr" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="up-email">
            {t.account.email}
          </label>
          <input id="up-email" name="email" type="email" required dir="ltr" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="up-pass">
            {t.account.password}
          </label>
          <input
            id="up-pass"
            name="password"
            type="password"
            required
            minLength={8}
            dir="ltr"
            autoComplete="new-password"
            className={field}
          />
        </div>
      </div>
      <Error state={state} t={t} />
      <button type="submit" disabled={pending} className={cn(btnPrimary, 'mt-8 w-full')}>
        {t.account.signUp}
      </button>
    </form>
  )
}
