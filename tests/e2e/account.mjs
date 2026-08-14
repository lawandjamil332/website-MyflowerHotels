import { chromium } from 'playwright-core'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] })
let fails = 0
const ok = (l,c,d='') => { console.log(`${c?'PASS':'FAIL'}  ${l}${d?'  — '+d:''}`); if(!c) fails++ }
const base = 'http://localhost:3000'
const email = `guest${Date.now()}@example.com`

const p = await b.newPage({ viewport: { width: 1280, height: 950 } })

// --- sign up ---
await p.goto(base + '/en/account', { waitUntil: 'networkidle', timeout: 90000 })
await p.locator('#up-name').fill('Test Guest')
await p.locator('#up-email').fill(email)
await p.locator('#up-pass').fill('a-good-password')
await p.getByRole('button', { name: /Create an account/i }).click()
await p.waitForTimeout(4000)
let body = await p.locator('body').innerText()
ok('sign-up creates an account and signs in', /Test Guest/.test(body) && /Points/.test(body), body.slice(0,90).replace(/\n/g,' '))
ok('a new account starts at zero points', /\b0\b/.test(body))
ok('and says it has no bookings', /Nothing booked yet/i.test(body))

// --- book while signed in ---
await p.goto(base + '/en/book?hotel=my-flower-1&checkIn=2027-05-01&checkOut=2027-05-04', { waitUntil: 'networkidle' })
await p.getByRole('link', { name: /Reserve this room/i }).first().click()
await p.waitForURL(u => u.searchParams.has('room'))
await p.locator('#booking-name').fill('Test Guest')
await p.locator('#booking-phone').fill('+964750999888')
await p.getByRole('button', { name: /Confirm booking/i }).click()
await p.waitForTimeout(4000)
const ref = ((await p.locator('body').innerText()).match(/MF-[A-Z2-9]{6}/) || [])[0]
ok('a signed-in guest can book', Boolean(ref), ref)

// --- it appears in their account ---
await p.goto(base + '/en/account', { waitUntil: 'networkidle' })
body = await p.locator('body').innerText()
ok('the booking shows in "my bookings"', ref ? body.includes(ref) : false)
ok('it is listed as coming up', /Coming up/i.test(body))

// --- signing out really signs out ---
await p.getByRole('button', { name: /Sign out/i }).click()
await p.waitForTimeout(2500)
await p.goto(base + '/en/account', { waitUntil: 'networkidle' })
body = await p.locator('body').innerText()
ok('signing out returns to the sign-in screen', /Sign in/i.test(body) && !body.includes(ref ?? 'zzz'))

// --- another guest cannot see it ---
const q = await b.newPage({ viewport: { width: 1280, height: 950 } })
await q.goto(base + '/en/account', { waitUntil: 'networkidle' })
await q.locator('#up-name').fill('Other Person')
await q.locator('#up-email').fill(`other${Date.now()}@example.com`)
await q.locator('#up-pass').fill('another-password')
await q.getByRole('button', { name: /Create an account/i }).click()
await q.waitForTimeout(4000)
const otherBody = await q.locator('body').innerText()
ok('another guest cannot see the first guest’s booking', ref ? !otherBody.includes(ref) : true)

console.log(`\nREF=${ref}`)
await b.close()
console.log(`${fails} failed`)
process.exit(fails ? 1 : 0)
