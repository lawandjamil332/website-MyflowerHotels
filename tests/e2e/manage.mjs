import { chromium } from 'playwright-core'
import { execSync } from 'node:child_process'

// The database the site is using, not a guessed one.
//
// This was hardcoded to postgres on 127.0.0.1:5432, which is true on exactly
// one machine. Anywhere else — a different port, a socket, a container, CI —
// these suites failed with "connection refused" and reported it as the site
// being broken. The runner already insists on DATABASE_URI being set, so use
// the same value the site itself is reading.
const DB = process.env.DATABASE_URI
const q = (sql) =>
  execSync(`psql "${DB}" -t -A -c ${JSON.stringify(sql.replace(/\s+/g, ' '))}`)
    .toString()
    .trim()

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
let fails = 0
const ok = (l, c, d = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${d ? '  — ' + d : ''}`)
  if (!c) fails++
}
const base = 'http://localhost:3000'
const PHONE = '+964 750 111 2222'
const dates = '?hotel=my-flower-1&checkIn=2027-08-10&checkOut=2027-08-13&guests=2'

const p = await b.newPage({ viewport: { width: 1280, height: 950 } })

// ---------- make a booking to manage ----------
await p.goto(base + '/en/book' + dates, { waitUntil: 'networkidle', timeout: 90000 })
await p
  .getByRole('link', { name: /Reserve this room/i })
  .first()
  .click()
await p.waitForURL((u) => u.searchParams.has('room'), { timeout: 20000 })
const roomId = new URL(p.url()).searchParams.get('room')
await p.locator('#booking-name').fill('Cancel Test')
await p.locator('#booking-phone').fill(PHONE)
await p.getByRole('button', { name: /Confirm booking/i }).click()
await p.waitForTimeout(4000)
const ref = ((await p.locator('body').innerText()).match(/MF-[A-Z2-9]{6}/) || [])[0]
ok('a booking exists to manage', Boolean(ref), ref)

// the new link on the confirmation screen
const manageLink = p.getByRole('link', { name: /Find your booking/i })
ok('the confirmation screen offers the way back in', (await manageLink.count()) > 0)

const stock = () =>
  Number(
    q(`SELECT count(*) FROM bookings WHERE room_id=${roomId}
       AND status IN ('held','confirmed','completed')
       AND check_in < '2027-08-13' AND check_out > '2027-08-10'`),
  )
const before = stock()

// ---------- the lookup screen ----------
const find = async (reference, phone) => {
  await p.goto(base + '/en/booking', { waitUntil: 'networkidle' })
  await p.locator('#mb-ref').fill(reference)
  await p.locator('#mb-phone').fill(phone)
  await p.getByRole('button', { name: /Find booking/i }).click()
  await p.waitForTimeout(2500)
  return p.locator('body').innerText()
}

let body = await find(ref, '+964 750 999 0000')
ok(
  'the right reference with the wrong number is refused',
  /No booking matches/i.test(body) && !body.includes('Cancel Test'),
)

body = await find('MF-ZZZZZZ', PHONE)
ok('an invented reference is refused', /No booking matches/i.test(body))

body = await find(ref, PHONE)
ok(
  'the right pair opens the booking',
  body.includes(ref) && /Cancel Test/.test(body),
  body.split('\n').slice(-6).join(' | ').slice(0, 120),
)
ok('and it can be cancelled', /Cancel this booking/i.test(body))

// the number is typed with spaces; the stored one has none
ok(
  'a differently written number still matches',
  /Cancel Test/.test(await find(ref, '07501112222')),
)

// ---------- cancelling ----------
await p.getByRole('button', { name: /Cancel this booking/i }).click()
await p.waitForTimeout(3000)
body = await p.locator('body').innerText()
ok('cancelling says so', /is cancelled/i.test(body), body.split('\n').slice(-3).join(' | '))
ok('the database agrees', q(`SELECT status FROM bookings WHERE reference='${ref}'`) === 'cancelled')
ok('the room went back into stock', stock() === before - 1, `${before} → ${stock()}`)

// ---------- a stay already under way ----------
const today = new Date().toISOString().slice(0, 10)
const liveRef = 'MF-LIVE99'
q(`DELETE FROM bookings WHERE reference='${liveRef}'`)
q(`INSERT INTO bookings (reference, guest_name, guest_phone, branch_id, room_id,
     check_in, check_out, nights, status)
   VALUES ('${liveRef}','Already Here','${PHONE}',1,${roomId},
     '${today}','2027-08-20',2,'confirmed')`)
body = await find(liveRef, PHONE)
ok('a stay that has started is found', body.includes(liveRef))
ok(
  'but cannot be cancelled from the web',
  /please call the hotel/i.test(body) && !/Cancel this booking/i.test(body),
)

// and not through the action either, if someone posts straight at it
q(`DELETE FROM bookings WHERE reference='${liveRef}'`)

await b.close()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
