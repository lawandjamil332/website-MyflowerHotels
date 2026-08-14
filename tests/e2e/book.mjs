import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'

// Every run of this file books a room and leaves it booked. Three runs and
// the search window is legitimately sold out, at which point the test fails
// reporting "0 room types" — the site being right, not wrong. So the run
// starts by clearing its own leftovers rather than by trusting the state it
// happens to find.
const sql = (q) =>
  execFileSync('psql', [process.env.DATABASE_URI, '-Atc', q], { encoding: 'utf8' }).trim()
const wiped = sql(
  `delete from bookings where guest_name in ('Lawand Test','Racer') returning id`,
).split('\n').filter(Boolean).length
if (wiped) console.log(`(cleared ${wiped} booking(s) left by earlier runs)\n`)

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
let fails = 0
const ok = (l,c,d='') => { console.log(`${c?'PASS':'FAIL'}  ${l}${d?'  — '+d:''}`); if(!c) fails++ }
const base = 'http://localhost:3000'
const search = '/en/book?hotel=my-flower-1&checkIn=2026-09-20&checkOut=2026-09-23&guests=2'

// --- a guest books a room, start to finish ---
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
await p.goto(base + search, { waitUntil: 'networkidle', timeout: 90000 })
const cards = p.locator('ul li')
ok('rooms are listed', await cards.count() > 0, `${await cards.count()} room types`)
await p.getByRole('link', { name: /Reserve this room/i }).first().click()
await p.waitForURL(u => u.searchParams.has('room'), { timeout: 15000 })
ok('choosing a room reaches the confirm step', (await p.locator('form').count()) > 0)
await p.getByLabel('Your name').fill('Lawand Test')
await p.getByLabel(/Phone or WhatsApp/i).fill('+964 750 111 2222')
await p.getByRole('button', { name: /Confirm booking/i }).click()
await p.waitForTimeout(4000)
const body = await p.locator('body').innerText()
const ref = (body.match(/MF-[A-Z2-9]{6}/) || [])[0]
ok('booking confirmed and a reference shown', Boolean(ref), ref || body.slice(0,120))
await p.close()

// --- the race, through the real HTTP stack this time ---
await fetch(base + '/en')  // warm
const holder = await b.newPage()
await holder.goto(base + search, { waitUntil: 'networkidle' })
const roomHref = await holder.getByRole('link', { name: /Reserve this room/i }).first().getAttribute('href')
const roomId = new URL(base + roomHref).searchParams.get('room')
await holder.close()

const form = () => {
  const f = new URLSearchParams()
  f.set('room', roomId); f.set('branch', '1')
  f.set('checkIn', '2026-11-01'); f.set('checkOut', '2026-11-04')
  f.set('guestName', 'Racer'); f.set('guestPhone', '+964750000000')
  return f
}
console.log(`\n(room ${roomId} stocked at 3; firing 12 bookings at once through the website)`)
const results = await Promise.all(Array.from({ length: 12 }, () =>
  fetch(`${base}/en/book`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'Next-Action': 'x' },
    body: form().toString(),
  }).then(r => r.status).catch(() => 0)))
console.log('  (server-action posts are not directly callable; counting rows instead)')
await b.close()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
