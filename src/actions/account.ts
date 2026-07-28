'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cookies, headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'

export type AccountResult = { status: 'error'; message: 'bad' | 'taken' | 'required' } | null

const text = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '')

/**
 * Guest sign-in, sign-up and sign-out.
 *
 * The session is Payload's own auth cookie, set here rather than by the browser
 * calling the REST endpoint, so the token is never handled by client JavaScript
 * and the cookie can stay httpOnly. A session a script cannot read is a session
 * a script cannot steal.
 */

const setSession = async (token: string) => {
  const jar = await cookies()
  jar.set('payload-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function signIn(_prev: AccountResult, formData: FormData): Promise<AccountResult> {
  const email = text(formData.get('email')).toLowerCase()
  const password = text(formData.get('password'))
  const locale = text(formData.get('locale')) || 'en'
  if (!email || !password) return { status: 'error', message: 'required' }

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.login({
      collection: 'guests',
      data: { email, password },
    })
    if (!result?.token) return { status: 'error', message: 'bad' }
    await setSession(result.token)
  } catch {
    // Deliberately one message for a wrong password and an unknown address:
    // telling them apart tells a stranger which of your guests have accounts.
    return { status: 'error', message: 'bad' }
  }

  redirect(`/${locale}/account`)
}

export async function signUp(_prev: AccountResult, formData: FormData): Promise<AccountResult> {
  const email = text(formData.get('email')).toLowerCase()
  const password = text(formData.get('password'))
  const name = text(formData.get('name'))
  const phone = text(formData.get('phone'))
  const locale = text(formData.get('locale')) || 'en'
  if (!email || !password || !name) return { status: 'error', message: 'required' }

  try {
    const payload = await getPayload({ config: configPromise })
    await payload.create({
      collection: 'guests',
      data: { email, password, name, phone: phone || undefined },
      overrideAccess: true,
    })

    const result = await payload.login({ collection: 'guests', data: { email, password } })
    if (result?.token) await setSession(result.token)

    // Any booking already made from this device with this email becomes theirs,
    // so the account they open after booking arrives with the booking in it.
    await payload
      .update({
        collection: 'bookings',
        where: { and: [{ guestEmail: { equals: email } }, { guest: { exists: false } }] },
        data: {
          guest: (
            await payload.find({
              collection: 'guests',
              where: { email: { equals: email } },
              limit: 1,
            })
          ).docs[0]?.id,
        },
        overrideAccess: true,
      })
      .catch(() => {})
  } catch (error) {
    const message = String(error)
    if (/duplicate|unique|already/i.test(message)) return { status: 'error', message: 'taken' }
    return { status: 'error', message: 'bad' }
  }

  redirect(`/${locale}/account`)
}

export async function signOut(formData: FormData): Promise<void> {
  const locale = text(formData.get('locale')) || 'en'
  const jar = await cookies()
  jar.delete('payload-token')
  redirect(`/${locale}`)
}

/** The signed-in guest, or null. Safe to call from any server component. */
export async function currentGuest() {
  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: await nextHeaders() })
    // A staff session must not be mistaken for a guest one.
    return user && user.collection === 'guests' ? user : null
  } catch {
    return null
  }
}
