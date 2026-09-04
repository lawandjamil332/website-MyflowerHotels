import { chromium } from 'playwright-core'
import { execSync } from 'node:child_process'

/**
 * Who is allowed to take a booking that has no account attached to it.
 *
 * Signing up used to claim every unowned booking whose phone number matched
 * the one typed into the sign-up form — last nine digits, so a local number
 * found an international one. The intention was a returning guest opening an
 * account and finding their history waiting. The effect was that a phone
 * number, which is on a business card and in a dozen WhatsApp groups, was the
 * only thing between a stranger and somebody's stay: their name, their hotel,
 * their dates, what they paid, and the points it earned. And because a booking
 * is claimed only once, the guest it belonged to could never get it back.
 *
 * Now the email address claims — the account proves that one — and a booking
 * made without an email joins an account through "Find your booking", which
 * asks for the reference off the guest's own confirmation as well as the
 * number. This suite holds both halves in place: the door is shut, and the
 * corridor beside it is open.
 *
 * The matching limit — that opening accounts in bulk is refused at all — is
 * proved in the throttle suite, which runs last: a suite that deliberately
 * exhausts a per-address allowance starves every suite after it.
 */
const DB = process.env.DATABASE_URI
const q = (sql) =>
  execSync(`psql "${DB}" -t -A -c ${JSON.stringify(sql.replace(/\s+/g, ' '))}`).toString().trim()

let fails = 0
const ok = (label, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!cond) fails++
}

const base = process.env.BASE_URL || 'http://localhost:3000'
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const IN = day(540)
const OUT = day(542)
const PHONE = '+9647706661122'
const stamp = Date.now()
const VICTIM_REF = `MF-CLM${String(stamp).slice(-3)}`

const roomId = Number(q(`SELECT id FROM rooms ORDER BY id LIMIT 1`))
const branchId = Number(q(`SELECT branch_id FROM rooms WHERE id=${roomId}`))

const wipe = () => {
  q(`DELETE FROM bookings WHERE reference = '${VICTIM_REF}'`)
  q(`DELETE FROM guests WHERE email LIKE 'claim-${stamp}%@example.com'`)
}
wipe()

// A booking made the way most are: a phone number and no email.
q(`INSERT INTO bookings (reference, guest_name, guest_phone, branch_id, room_id, check_in,
     check_out, nights, total_amount, currency, status, updated_at, created_at)
   VALUES ('${VICTIM_REF}','Real Guest','${PHONE}',${branchId},${roomId},'${IN}','${OUT}',
           2, 200000, 'IQD', 'confirmed', NOW(), NOW())`)

const browser = await chromium.launch({
  args: ['--no-sandbox'],
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})

/** Opens an account in its own browser, and says whether it landed. */
async function signUp(email, phone) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${base}/en/account`, { waitUntil: 'networkidle', timeout: 60000 })
  const form = page
    .locator('form')
    .filter({ has: page.locator('input[name="name"]') })
    .first()
  if ((await form.count()) === 0) {
    await ctx.close()
    return { ctx: null, landed: false }
  }
  await form.locator('input[name="name"]').fill('Somebody Else')
  await form.locator('input[type="email"]').fill(email)
  const ph = form.locator('input[name="phone"], input[type="tel"]').first()
  if (await ph.count()) await ph.fill(phone)
  await form.locator('input[type="password"]').first().fill('Str0ngPassw0rd!x')
  await form.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(3500)
  const landed = /\/account/.test(page.url())
  return { ctx, page, landed }
}

// --- a stranger who knows only the number ----------------------------------
const strangerEmail = `claim-${stamp}-a@example.com`
const stranger = await signUp(strangerEmail, PHONE)
const strangerId = q(`SELECT COALESCE(id::text,'') FROM guests WHERE email='${strangerEmail}'`)
const ownerAfterSignup = q(
  `SELECT COALESCE(guest_id::text,'none') FROM bookings WHERE reference='${VICTIM_REF}'`,
)
ok(
  'a phone number alone does not claim somebody else’s booking',
  ownerAfterSignup === 'none',
  `signed up as guest ${strangerId || '(none)'}; booking owner is ${ownerAfterSignup}`,
)
if (stranger.ctx) await stranger.ctx.close()

// --- the guest, with the reference from their own confirmation --------------
const guestEmail = `claim-${stamp}-b@example.com`
const guest = await signUp(guestEmail, PHONE)
const guestId = q(`SELECT COALESCE(id::text,'') FROM guests WHERE email='${guestEmail}'`)

if (guest.page && guestId) {
  const page = guest.page
  await page.goto(`${base}/en/booking`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.locator('input[name="reference"], #reference').first().fill(VICTIM_REF)
  const ph = page.locator('input[type="tel"], input[name*="phone" i]').first()
  if (await ph.count()) await ph.fill(PHONE)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(3500)

  const owner = q(`SELECT COALESCE(guest_id::text,'none') FROM bookings WHERE reference='${VICTIM_REF}'`)
  ok(
    'producing the reference joins the stay to the account',
    owner === guestId,
    `owner ${owner}, guest ${guestId}`,
  )

  await page.goto(`${base}/en/account`, { waitUntil: 'networkidle', timeout: 60000 })
  const listed = await page.evaluate(() => document.body.innerText)
  ok('and the stay is listed in their account', listed.includes(VICTIM_REF))
} else {
  ok('an account could be opened for the reference check', false, 'sign-up did not land')
  ok('and the stay is listed in their account', false, 'no account')
}
if (guest.ctx) await guest.ctx.close()

// --- a booking already owned cannot be moved -------------------------------
const thief = await signUp(`claim-${stamp}-c@example.com`, PHONE)
if (thief.page) {
  await thief.page.goto(`${base}/en/booking`, { waitUntil: 'networkidle', timeout: 60000 })
  await thief.page.locator('input[name="reference"], #reference').first().fill(VICTIM_REF)
  const ph = thief.page.locator('input[type="tel"], input[name*="phone" i]').first()
  if (await ph.count()) await ph.fill(PHONE)
  await thief.page.locator('button[type="submit"]').first().click()
  await thief.page.waitForTimeout(3500)
}
const stillOwner = q(`SELECT COALESCE(guest_id::text,'none') FROM bookings WHERE reference='${VICTIM_REF}'`)
ok(
  'a stay already on an account cannot be moved to another',
  stillOwner === guestId,
  `owner is ${stillOwner}, should still be ${guestId}`,
)
if (thief.ctx) await thief.ctx.close()

wipe()
await browser.close()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
