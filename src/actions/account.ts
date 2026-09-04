'use server'

import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { cookies, headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'

import { awardPointsForBooking } from '@/utilities/points'
import { dbPool } from '@/utilities/db'
import { sendPasswordReset } from '@/utilities/accountEmail'
import { allow, callerKey } from '@/utilities/throttle'

export type AccountResult =
  | { status: 'error'; message: 'bad' | 'taken' | 'required' | 'weak' }
  | { status: 'sent' }
  | null

const text = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v.trim() : '')

/**
 * The one rule worth enforcing on the server as well as in the browser.
 *
 * Length and nothing else. Forcing a capital, a digit and a symbol is how you
 * get Password1! on ten thousand accounts — it narrows the space people choose
 * from instead of widening it, which is the opposite of the intention. A long
 * passphrase somebody can remember beats a short one they write on a card.
 */
const MIN_PASSWORD = 8
const tooWeak = (password: string): boolean => password.length < MIN_PASSWORD

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
  // Payload locks an account after a few wrong passwords, which stops somebody
  // hammering one guest. It does nothing about the other shape of the attack —
  // one common password tried against a thousand addresses, where no single
  // account ever sees a second wrong try. This limits that, and twenty in ten
  // minutes is far past what a guest mistyping their own password will reach.
  if (!allow(await callerKey('signin'), 20, 10 * 60_000)) {
    return { status: 'error', message: 'bad' }
  }

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
  if (tooWeak(password)) return { status: 'error', message: 'weak' }
  // Nothing stopped a loop here, and every turn of it was a real guest row in
  // the admin panel.
  //
  // Twenty in ten minutes, not six. The number has to clear the worst honest
  // case, and the worst honest case is a lot of people behind one address:
  // hotel wifi, a tour group on the same carrier, a family at one desk. Six
  // would have refused a real guest on a busy morning. Twenty never will, and
  // a script opening accounts in bulk is doing thousands, not twenty-one.
  if (!allow(await callerKey('signup'), 20, 10 * 60_000)) {
    return { status: 'error', message: 'bad' }
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const created = await payload.create({
      collection: 'guests',
      data: { email, password, name, phone: phone || undefined },
      overrideAccess: true,
    })

    const result = await payload.login({ collection: 'guests', data: { email, password } })
    if (result?.token) await setSession(result.token)

    // Bookings they already made, before they had anywhere to keep them.
    await claimBookings(payload, Number(created.id), email)
  } catch (error) {
    const message = String(error)
    if (/duplicate|unique|already/i.test(message)) return { status: 'error', message: 'taken' }
    return { status: 'error', message: 'bad' }
  }

  redirect(`/${locale}/account`)
}

/**
 * Hands a new account the bookings its owner already made without one.
 *
 * This matters more here than at most hotels, because booking never required an
 * account: by the time somebody signs up they may already have stayed three
 * times, and an account that opens showing "Nothing booked yet" to a repeat
 * guest is worse than no account. Their history — and the points those stays
 * earned — has to be waiting for them.
 *
 * Matched on the email address only, and that is a deliberate narrowing.
 *
 * It used to match on the phone number as well — last nine digits, so
 * +964 750 111 2222 on a booking found 07501112222 on an account. The
 * reasoning was sound: the booking form asks for a phone and treats email as
 * optional, so email alone misses most guests. The consequence was not.
 * Signing up proves you hold the email address you signed up with; it proves
 * nothing at all about the phone number you typed into a box. So anyone who
 * knew a guest's number could open an account with it and walk away with that
 * guest's stay — their name, their hotel, their dates, what they paid, and the
 * points it earned — while the guest it belonged to could never claim it,
 * because a booking is only ever claimed once.
 *
 * A phone number is not a secret. It is on a business card, in a WhatsApp
 * group, on a form at a shop counter. It cannot be the only thing standing
 * between a stranger and somebody's stay history.
 *
 * Nothing is lost that mattered. A guest who books with an email still gets
 * their history the moment they sign up, and a guest who books without one now
 * gets it through "Find your booking", which already asks for the reference
 * from their own confirmation as well as the number — proof they hold the
 * booking rather than a claim that they might.
 *
 * Only ever claims bookings with no owner, as before.
 */
const claimBookings = async (payload: Payload, guestId: number, email: string): Promise<void> => {
  try {
    const { rows } = await dbPool(payload).query<{ id: number; status: string }>(
      `UPDATE bookings SET guest_id = $1
        WHERE guest_id IS NULL AND LOWER(guest_email) = $2
        RETURNING id, status`,
      [guestId, email],
    )

    // Stays that had already finished before the account existed still earned
    // their points; they simply had nobody to credit. Awarding them now is what
    // makes signing up after a stay worth doing rather than a fresh start.
    for (const row of rows) {
      if (row.status === 'completed') {
        await awardPointsForBooking(payload, Number(row.id)).catch(() => {})
      }
    }
  } catch (error) {
    // A new account must never fail because an old booking would not attach.
    payload.logger.error(`Could not claim bookings for guest ${guestId} — ${error}`)
  }
}

export async function signOut(formData: FormData): Promise<void> {
  const locale = text(formData.get('locale')) || 'en'
  const jar = await cookies()
  jar.delete('payload-token')
  redirect(`/${locale}`)
}

/**
 * "I have forgotten my password."
 *
 * Without this an account is a trap: the whole point of one here is that it
 * holds a guest's stays and the points those stays earned, and a forgotten
 * password would put all of it out of reach permanently, with nothing the front
 * desk could do about it.
 *
 * Always answers the same way, whether or not the address is one of ours.
 * Anything else turns this form into a way of asking which of your guests have
 * accounts, one address at a time.
 *
 * The mail is sent from here rather than by Payload's own handler so the link
 * lands in the language the guest is reading the site in.
 */
export async function requestReset(
  _prev: AccountResult,
  formData: FormData,
): Promise<AccountResult> {
  const email = text(formData.get('email')).toLowerCase()
  const locale = text(formData.get('locale')) || 'en'
  if (!email) return { status: 'error', message: 'required' }

  // Five in fifteen minutes. A guest needs one; anything sending more is either
  // mining for addresses or using this to post mail through us.
  if (!allow(await callerKey('reset'), 5, 15 * 60 * 1000)) return { status: 'sent' }

  try {
    const payload = await getPayload({ config: configPromise })
    const token = await payload.forgotPassword({
      collection: 'guests',
      data: { email },
      disableEmail: true, // sent below instead, with our own wording and link
    })
    if (token) await sendPasswordReset(payload, email, String(token), locale)
  } catch {
    // An unknown address throws. It must look exactly like a known one.
  }

  return { status: 'sent' }
}

/** Sets the new password and signs them straight in, so the link ends in. */
export async function resetPassword(
  _prev: AccountResult,
  formData: FormData,
): Promise<AccountResult> {
  const token = text(formData.get('token'))
  const password = text(formData.get('password'))
  const locale = text(formData.get('locale')) || 'en'
  if (!token || !password) return { status: 'error', message: 'required' }
  if (tooWeak(password)) return { status: 'error', message: 'weak' }

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.resetPassword({
      collection: 'guests',
      data: { token, password },
      overrideAccess: true,
    })
    if (!result?.token) return { status: 'error', message: 'bad' }
    await setSession(result.token)
  } catch {
    // Expired, already used, or invented. One message for all three: which it
    // was is of interest only to somebody who did not have the link.
    return { status: 'error', message: 'bad' }
  }

  redirect(`/${locale}/account`)
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
