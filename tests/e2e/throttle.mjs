import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'

/**
 * A booking here costs nothing to make — no card, no account, no deposit —
 * which is the point for a guest and the whole problem for everybody else.
 * Left unguarded, a loop against the confirmation form takes every room in the
 * group out of stock for any date it likes, and the front desk finds out on
 * the day, from a book full of names that never arrive.
 *
 * This proves the guard exists by behaving like the attack: book the same room
 * over and over from one address and check that the site stops answering yes.
 */
const sql = (q) =>
  execFileSync('psql', [process.env.DATABASE_URI, '-Atc', q], { encoding: 'utf8' }).trim()

let failed = 0
const ok = (name, cond, note = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`)
  if (!cond) failed++
}

const base = process.env.BASE_URL || 'http://localhost:3000'
const NAME = 'Throttle Test'
sql(`delete from bookings where guest_name = '${NAME}'`)

// Far enough out that no other suite is competing for the same nights, and
// stocked deep enough that running out of rooms cannot be mistaken for the
// throttle doing its job.
sql(`update rooms set quantity = 40 where branch_id = 1`)

const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})

const LIMIT = 20
const ATTEMPTS = LIMIT + 4
let accepted = 0
let firstRefusalAt = 0

/**
 * Its own address, so its own allowance.
 *
 * The limit is counted per caller, and by the time this suite runs the other
 * seventeen have already spent most of one run's worth of bookings from this
 * machine. So it opened with the bucket nearly empty, every attempt was
 * refused, and it reported "0 accepted" — the guard working perfectly, read as
 * the site being broken. The project's own notes tell you to restart the
 * server between runs because of this; that is a workaround for a suite that
 * cannot be run twice, not a property worth keeping.
 *
 * The throttle keys on x-forwarded-for, so declaring one puts this suite in a
 * bucket nothing else touches. A fresh address each time also means the suite
 * no longer poisons its own next run. 203.0.113.x is TEST-NET-3, reserved for
 * documentation and never routable.
 */
const context = await b.newContext({
  viewport: { width: 390, height: 844 },
  extraHTTPHeaders: {
    'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 200) + 20}`,
  },
})
const page = await context.newPage()
for (let i = 1; i <= ATTEMPTS; i++) {
  await page.goto(`${base}/en/book?hotel=my-flower-1&checkIn=2027-03-0${(i % 7) + 1}&checkOut=2027-03-0${(i % 7) + 2}`, {
    waitUntil: 'load',
    timeout: 90000,
  })
  const reserve = page.locator('a[href*="room="]').first()
  if ((await reserve.count()) === 0) break
  await reserve.click()
  await page.waitForURL((u) => u.searchParams.has('room'), { timeout: 30000 })

  await page.locator('input[name="guestName"]').fill(NAME)
  await page.locator('input[name="guestPhone"]').fill('+964 750 000 0000')
  await page.locator('form button[type="submit"], form button:not([type])').last().click()
  await page.waitForTimeout(2500)

  const body = await page.locator('body').innerText()
  if (/MF-[A-Z2-9]{6}/.test(body)) accepted++
  else if (!firstRefusalAt) firstRefusalAt = i
}
await page.close()
await b.close()

const stored = Number(sql(`select count(*) from bookings where guest_name = '${NAME}'`))

ok('the site stops accepting before the attempts run out', firstRefusalAt > 0, firstRefusalAt ? `refused on attempt ${firstRefusalAt}` : 'never refused — every booking went through')
// Deliberately not asserting an exact count: this suite runs last, after the
// others have each made bookings from the same address, so the allowance is
// partly spent before it starts. What must hold is that ordinary booking works
// and that the site eventually says no.
ok('it allows ordinary booking first', accepted >= 1, `${accepted} accepted`)
ok('it does not accept every attempt', accepted < ATTEMPTS, `${accepted} of ${ATTEMPTS}`)
ok('and the database agrees with what the page said', stored === accepted, `${stored} rows vs ${accepted} references`)

sql(`delete from bookings where guest_name = '${NAME}'`)
sql(`update rooms set quantity = 3 where branch_id = 1`)

// ---------------------------------------------------------------------------
// Opening accounts, which was not limited at all.
//
// Every turn of a loop here was a real guest row in the admin panel. It lives
// in this suite rather than beside the rest of the account checks because
// proving a per-address allowance means spending it, and a suite that spends
// one starves every suite that runs after it. This one runs last.
// ---------------------------------------------------------------------------
const stamp = Date.now()
const flood = await chromium.launch({
  args: ['--no-sandbox'],
  executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
for (let i = 0; i < 26; i++) {
  const ctx = await flood.newContext()
  const pg = await ctx.newPage()
  try {
    await pg.goto(`${base}/en/account`, { waitUntil: 'networkidle', timeout: 60000 })
    const form = pg.locator('form').filter({ has: pg.locator('input[name="name"]') }).first()
    if ((await form.count()) > 0) {
      await form.locator('input[name="name"]').fill('Flood')
      await form.locator('input[type="email"]').fill(`flood-${stamp}-${i}@example.com`)
      const ph = form.locator('input[name="phone"], input[type="tel"]').first()
      if (await ph.count()) await ph.fill(`+9647700${2000 + i}`)
      await form.locator('input[type="password"]').first().fill('Str0ngPassw0rd!x')
      await form.locator('button[type="submit"]').first().click()
      await pg.waitForTimeout(1600)
    }
  } catch {
    // A refused attempt is the point; it must not stop the loop.
  }
  await ctx.close()
}
await flood.close()

const opened = Number(
  sql(`select count(*) from guests where email like 'flood-${stamp}-%@example.com'`),
)
// Deliberately not asserting that some of them succeed, for the same reason
// the booking checks above do not: this suite runs last, and the suites before
// it have each opened accounts from the same address, so the allowance may be
// spent before the loop even starts. That ordinary sign-up works is proved
// several times over by the account, claim and finder suites. What must hold
// here — the only thing this suite can honestly claim — is that a loop does
// not get twenty-six of them.
//
// The count comes from the database rather than from the page: a refused
// sign-up leaves the browser on the same address as a successful one, so the
// URL cannot tell them apart and reported twenty-six "landed" while none had.
ok(
  'opening accounts in a loop is refused',
  opened < 26,
  `${opened} accounts created out of 26 attempts`,
)
sql(`delete from guests where email like 'flood-${stamp}-%@example.com'`)

console.log(`\n${failed} failed`)
process.exit(failed ? 1 : 0)
