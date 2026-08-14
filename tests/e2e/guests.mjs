import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'

const sql = (q) =>
  execFileSync('psql', [process.env.DATABASE_URI, '-Atc', q], { encoding: 'utf8' }).trim()

let failed = 0
const ok = (name, cond, note = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`)
  if (!cond) failed++
}

sql(`delete from bookings where guest_name = 'Guests Test'`)

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const base = 'http://localhost:3000'

// The path that used to lose the number: straight to a room, no search behind
// it, so nothing carried a guest count into the form.
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
await p.goto(`${base}/en/rooms/deluxe-double--my-flower-1`, { waitUntil: 'load', timeout: 90000 })
await p.getByRole('link', { name: /Reserve|Book/i }).first().click().catch(() => {})

// Fall back to the booking page directly if the room page routes elsewhere.
if (!/\/book/.test(p.url())) {
  await p.goto(
    `${base}/en/book?hotel=my-flower-1&checkIn=2026-12-01&checkOut=2026-12-03`,
    { waitUntil: 'load', timeout: 90000 },
  )
  await p.getByRole('link', { name: /Reserve this room/i }).first().click()
}
await p.waitForURL((u) => u.searchParams.has('room'), { timeout: 30000 })

const select = p.locator('#booking-guests')
ok('the form asks how many guests', await select.count() === 1)

const options = await select.locator('option').allTextContents()
ok('it offers up to what the room sleeps', options.length === 2, `options: ${options.join(', ')}`)
ok('and no more than that', !options.includes('3'), `max offered: ${options.at(-1)}`)

await select.selectOption('2')
await p.getByLabel('Your name').fill('Guests Test')
await p.getByLabel(/Phone or WhatsApp/i).fill('+964 750 555 4444')
await p.getByRole('button', { name: /Confirm booking/i }).click()
await p.waitForTimeout(4000)

const body = await p.locator('body').innerText()
const ref = (body.match(/MF-[A-Z2-9]{6}/) || [])[0]
ok('the booking goes through', Boolean(ref), ref || body.slice(0, 120))

const stored = sql(`select coalesce(guests::text,'NULL') from bookings where reference = '${ref}'`)
ok('and the guest count is stored, not left empty', stored === '2', `guests = ${stored}`)

await b.close()
console.log(`\n${failed} failed`)
process.exit(failed ? 1 : 0)
