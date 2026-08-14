import { chromium } from 'playwright-core'
import { execSync } from 'node:child_process'

const DB = 'postgresql://postgres@127.0.0.1:5432/myflower'
const q = (sql) =>
  execSync(`psql "${DB}" -t -A -c ${JSON.stringify(sql.replace(/\s+/g, ' '))}`)
    .toString()
    .trim()

let fails = 0
const ok = (l, c, d = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${d ? '  — ' + d : ''}`)
  if (!c) fails++
}
const base = 'http://localhost:3000'
const stamp = String(Date.now()).slice(-6)
const PHONE = `+964 750 ${stamp.slice(0, 3)} ${stamp.slice(3)}`
const REF = `MF-RV${stamp.slice(0, 4)}`
const room = q(`SELECT id FROM rooms WHERE branch_id=1 ORDER BY id LIMIT 1`)

q(`DELETE FROM reviews WHERE guest_name LIKE 'Review Test%'`)
q(`DELETE FROM bookings WHERE reference='${REF}'`)

// A stay that finished yesterday.
const past = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
const arrived = new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10)
q(`INSERT INTO bookings (reference, guest_name, guest_phone, branch_id, room_id,
     check_in, check_out, nights, total_amount, currency, status)
   VALUES ('${REF}','Review Test','${PHONE}',1,${room},
     '${arrived}','${past}',3,300000,'IQD','completed')`)

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } })

const open = async (ref, phone) => {
  await p.goto(base + '/en/booking', { waitUntil: 'networkidle', timeout: 90000 })
  await p.locator('#mb-ref').fill(ref)
  await p.locator('#mb-phone').fill(phone)
  await p.getByRole('button', { name: /Find booking/i }).click()
  await p.waitForTimeout(2500)
  return p.locator('body').innerText()
}

// ---------- a finished stay is offered the form ----------
let body = await open(REF, PHONE)
ok('a finished stay is asked how it went', /How was your stay/i.test(body))
ok('and told the review will be verified', /verified mark/i.test(body))

// ---------- the button will not fire without a rating ----------
const send = p.getByRole('button', { name: /Send my review/i })
ok('the send button is dead until stars are chosen', await send.isDisabled())

// ---------- leave one ----------
await p.getByRole('button', { name: '5', exact: true }).click()
await p.locator('#mb-comment').fill('Clean, quiet, and the staff were kind. Would stay again.')
ok('choosing stars enables it', !(await send.isDisabled()))
await send.click()
await p.waitForTimeout(3500)
body = await p.locator('body').innerText()
ok('it thanks them', /Thank you/i.test(body), body.split('\n').filter(Boolean).slice(-1)[0])

const row = q(
  `SELECT rating||'|'||approved||'|'||verified||'|'||COALESCE(branch_id::text,'-')
     FROM reviews WHERE booking_id=(SELECT id FROM bookings WHERE reference='${REF}')`,
)
ok('it is stored with the right rating', row.startsWith('5|'), row)
ok('unapproved, so it is invisible until read', row.includes('|false|'), row)
ok('and marked verified by the site, not by hand', row.includes('|true|'), row)

// ---------- invisible until approved ----------
await p.goto(base + '/en/branches/my-flower-1', { waitUntil: 'networkidle' })
body = await p.locator('body').innerText()
ok('an unapproved review is nowhere on the hotel page', !/Would stay again/.test(body))
let html = await p.content()
ok('and produces no star rating for Google', !/aggregateRating/.test(html))

// ---------- approve it ----------
q(`UPDATE reviews SET approved=true WHERE booking_id=(SELECT id FROM bookings WHERE reference='${REF}')`)
await p.goto(base + '/en/branches/my-flower-1', { waitUntil: 'networkidle' })
body = await p.locator('body').innerText()
ok('once approved it appears', /Would stay again/.test(body))
ok('with the verified mark', /Verified stay/i.test(body))
ok('and the average beside it', /from 1 reviews?|5\b/.test(body))

html = await p.content()
ok('Google now gets a star rating', /aggregateRating/.test(html))
const m = html.match(/"ratingValue":(\d+(\.\d+)?),"reviewCount":(\d+)/)
ok('and it matches what the page shows', m && m[1] === '5' && m[3] === '1', m ? m[0] : 'not found')

// ---------- the same stay cannot be reviewed twice ----------
body = await open(REF, PHONE)
ok('the form is gone for a stay already reviewed', !/How was your stay/i.test(body))

// ---------- a stay that has not finished cannot be reviewed ----------
const futureRef = `MF-FU${stamp.slice(0, 4)}`
q(`DELETE FROM bookings WHERE reference='${futureRef}'`)
const soon = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)
const later = new Date(Date.now() + 13 * 86400000).toISOString().slice(0, 10)
q(`INSERT INTO bookings (reference, guest_name, guest_phone, branch_id, room_id,
     check_in, check_out, nights, status)
   VALUES ('${futureRef}','Review Test Future','${PHONE}',1,${room},'${soon}','${later}',3,'confirmed')`)
body = await open(futureRef, PHONE)
ok('a stay that has not happened is not asked to review it', !/How was your stay/i.test(body))

// ---------- averages are computed, not stored ----------
q(`INSERT INTO reviews (guest_name, rating, comment, branch_id, approved, verified)
   VALUES ('Review Test Two', 4, 'Good value.', 1, true, false)`)
await p.goto(base + '/en/branches/my-flower-1', { waitUntil: 'networkidle' })
html = await p.content()
const m2 = html.match(/"ratingValue":(\d+(\.\d+)?),"reviewCount":(\d+)/)
ok('a second review moves the average', m2 && m2[1] === '4.5' && m2[3] === '2', m2 ? m2[0] : 'none')

// ---------- other languages ----------
for (const [loc, word] of [
  ['ar', 'إقامة موثقة'],
  ['ku', 'مانەوەی پشتڕاستکراو'],
]) {
  await p.goto(`${base}/${loc}/branches/my-flower-1`, { waitUntil: 'networkidle' })
  const t = await p.locator('body').innerText()
  ok(`the verified mark is written in ${loc}`, t.includes(word), word)
}

q(`DELETE FROM reviews WHERE guest_name LIKE 'Review Test%'`)
q(`DELETE FROM bookings WHERE reference IN ('${REF}','${futureRef}')`)
await b.close()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
