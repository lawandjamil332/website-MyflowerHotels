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

const page = await b.newPage({ viewport: { width: 390, height: 844 } })
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
console.log(`\n${failed} failed`)
process.exit(failed ? 1 : 0)
