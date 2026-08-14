import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import { createHmac } from 'node:crypto'

/**
 * The printable confirmation, and the signature that guards it.
 *
 * The forged-link cases matter more than the happy path: a booking carries a
 * guest's name, telephone number and dates, and the whole reason this page can
 * skip the reference-and-phone form is that the link proves it was issued here.
 */
const sql = (q) =>
  execFileSync('psql', [process.env.DATABASE_URI, '-Atc', q], { encoding: 'utf8' }).trim()

let failed = 0
const ok = (name, cond, note = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`)
  if (!cond) failed++
}

const sign = (ref) =>
  createHmac('sha256', process.env.PAYLOAD_SECRET)
    .update(`booking:${ref.toUpperCase()}`)
    .digest('hex')
    .slice(0, 16)

const base = process.env.BASE_URL || 'http://localhost:3000'
const ref = 'MF-PASS99'
sql(`delete from bookings where guest_name = 'Pass Test'`)
sql(`insert into bookings (reference, guest_name, guest_phone, guest_email, branch_id, room_id,
  check_in, check_out, guests, nights, total_amount, currency, status, notes, locale)
  select '${ref}','Pass Test','+964 750 111 2222','p@q.com', r.branch_id, r.id,
  '2026-11-10','2026-11-13',2,3,300000,'IQD','confirmed','Quiet room if possible.','en'
  from rooms r where r.branch_id=1 order by r.id limit 1`)

const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const good = sign(ref)

{
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  const r = await p.goto(`${base}/en/booking/pass?ref=${ref}&t=${good}`, { waitUntil: 'load', timeout: 90000 })
  ok('a signed link opens the confirmation', r.status() === 200, `HTTP ${r.status()}`)
  const text = (await p.locator('body').innerText()).replace(/\s+/g, ' ')
  ok('it shows the reference', text.includes(ref))
  ok('and the hotel', /My Flower 1/.test(text))
  ok('and the dates written out', /Tuesday, 10 November 2026/.test(text))
  ok('and the guest', /Pass Test/.test(text))
  ok('and the total, marked payable at the hotel', /Payable at the hotel/i.test(text))
  ok('it fits a phone', (await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1)
  await p.close()
}

for (const [name, url] of [
  ['no signature at all', `${base}/en/booking/pass?ref=${ref}`],
  ['a wrong signature', `${base}/en/booking/pass?ref=${ref}&t=${'0'.repeat(16)}`],
  ['another booking’s signature', `${base}/en/booking/pass?ref=${ref}&t=${sign('MF-OTHER1')}`],
  ['a signature one character short', `${base}/en/booking/pass?ref=${ref}&t=${good.slice(0, 15)}`],
]) {
  const p = await b.newPage()
  const r = await p.goto(url, { waitUntil: 'load', timeout: 60000 })
  const text = await p.locator('body').innerText()
  ok(`${name} is refused`, r.status() === 404 || !text.includes('Pass Test'), `HTTP ${r.status()}`)
  await p.close()
}

{
  const p = await b.newPage({ viewport: { width: 794, height: 1123 } })
  await p.goto(`${base}/en/booking/pass?ref=${ref}&t=${good}`, { waitUntil: 'load' })
  const robots = await p.locator('meta[name="robots"]').getAttribute('content').catch(() => '')
  ok('search engines are told to stay out', /noindex/.test(robots || ''), robots || '(none)')
  await p.emulateMedia({ media: 'print' })
  await p.waitForTimeout(400)
  const printed = await p.evaluate(() => ({
    buttons: [...document.querySelectorAll('.print\\:hidden')].every((e) => getComputedStyle(e).display === 'none'),
    masthead: !!document.querySelector('main article header'),
  }))
  ok('the buttons are left off the printed page', printed.buttons)
  ok('but the confirmation keeps its own masthead', printed.masthead)
  await p.close()
}

{
  sql(`update bookings set status='cancelled' where reference='${ref}'`)
  const p = await b.newPage()
  await p.goto(`${base}/en/booking/pass?ref=${ref}&t=${good}`, { waitUntil: 'load' })
  ok('a cancelled booking is marked cancelled', /cancelled/i.test(await p.locator('body').innerText()))
  await p.close()
}

sql(`delete from bookings where guest_name = 'Pass Test'`)
await b.close()
console.log(`\n${failed} failed`)
process.exit(failed ? 1 : 0)
