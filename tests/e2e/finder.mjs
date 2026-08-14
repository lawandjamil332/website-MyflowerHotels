import { chromium } from 'playwright-core'

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
const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

// ---------- pressing it with no dates says so, in place ----------
const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
await p.goto(base + '/en', { waitUntil: 'networkidle', timeout: 90000 })
await p.getByRole('button', { name: /Check availability/i }).click()
await p.waitForTimeout(1200)

ok('pressing it with no dates stays on the page', new URL(p.url()).pathname === '/en')
const alert = p.locator('p[role=alert]')
ok('and says what it needs', (await alert.count()) > 0 && /choose the nights/i.test(await alert.innerText()))
ok(
  'the arriving field is marked and focused',
  (await p.locator('#finder-in').getAttribute('aria-invalid')) === 'true' &&
    (await p.evaluate(() => document.activeElement?.id)) === 'finder-in',
)
ok('the pill did not change shape', (await p.locator('form[aria-label]').boundingBox()).height < 400)

// once a date is typed the search runs — the message is not a dead end
await p.locator('#finder-in').fill(d(40))
await p.locator('#finder-out').fill(d(43))
await p.getByRole('button', { name: /Check availability/i }).click()
await p.waitForURL(/\/book\?/, { timeout: 15000 })
ok('filling them in then works', true, p.url().replace(base, ''))

// ---------- no hotel searches every hotel ----------
await p.waitForTimeout(2500)
let body = await p.locator('body').innerText()
const named = ['My Flower 1', 'My Flower 2', 'My Flower 3'].filter((h) => body.includes(h))
ok('a search with no hotel returns rooms from more than one hotel', named.length >= 2, named.join(', '))
ok('each hotel is named over its own rooms', (await p.locator('h2').count()) >= 2)
ok('and there are rooms to reserve', (await p.getByRole('link', { name: /Reserve/i }).count()) > 0)

// ---------- booking from a group search knows which hotel ----------
await p.getByRole('link', { name: /Reserve/i }).first().click()
await p.waitForURL((u) => u.searchParams.has('room'), { timeout: 15000 })
await p.waitForTimeout(1500)
body = await p.locator('body').innerText()
const hotelShown = ['My Flower 1', 'My Flower 2', 'My Flower 3', 'My Flower 4'].find((h) =>
  body.includes(h),
)
ok('the confirm step names the hotel', Boolean(hotelShown), hotelShown)

await p.locator('#booking-name').fill('Group Search')
await p.locator('#booking-phone').fill('+964 750 222 3333')
await p.getByRole('button', { name: /Confirm booking/i }).click()
await p.waitForTimeout(4000)
const ref = ((await p.locator('body').innerText()).match(/MF-[A-Z2-9]{6}/) || [])[0]
ok('a room found without naming a hotel can still be booked', Boolean(ref), ref)
await p.close()

// ---------- sign in is visible without hunting ----------
for (const [w, h, where] of [
  [1280, 900, 'desktop'],
  [820, 1180, 'tablet'],
]) {
  const q = await b.newPage({ viewport: { width: w, height: h } })
  await q.goto(base + '/en', { waitUntil: 'networkidle' })
  const link = q.locator('header a[href="/en/account"]:has(svg)')
  const visible = (await link.count()) > 0 && (await link.first().isVisible())
  const label = visible ? (await link.first().innerText()).trim() : ''
  ok(`sign in is on the bar (${where})`, visible && /sign in/i.test(label), label)
  await q.close()
}

// on a phone it lives in the menu
const m = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
await m.goto(base + '/en', { waitUntil: 'networkidle' })
await m.getByRole('button', { name: /menu/i }).click()
await m.waitForTimeout(900)
const menuLink = m.locator('#site-menu a[href="/en/account"]')
ok(
  'sign in is in the phone menu',
  (await menuLink.count()) > 0 && (await menuLink.first().isVisible()),
  (await menuLink.first().innerText().catch(() => '')).trim(),
)
await m.close()

// ---------- the account page says what it is ----------
const a = await b.newPage({ viewport: { width: 1280, height: 950 } })
await a.goto(base + '/en/account', { waitUntil: 'networkidle' })
const h1 = await a.locator('h1').first().innerText()
ok('the signed-out account page is named for signing in', /sign in/i.test(h1), h1)

// signing in changes the bar to the guest's name
const email = `bar${Date.now()}@example.com`
await a.locator('#up-name').fill('Lawand Jamil')
await a.locator('#up-email').fill(email)
await a.locator('#up-pass').fill('a-good-password')
await a.getByRole('button', { name: /Create an account/i }).click()
await a.waitForTimeout(4500)
const barLabel = (
  await a.locator('header a[href="/en/account"]:has(svg)').first().innerText()
).trim()
ok('once signed in the bar shows their name', /Lawand/.test(barLabel), barLabel)
await a.close()

await b.close()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
