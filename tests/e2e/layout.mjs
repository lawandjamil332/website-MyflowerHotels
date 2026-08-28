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

let fails = 0
const ok = (l, c, d = '') => {
  console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${d ? '  — ' + d : ''}`)
  if (!c) fails++
}
const base = 'http://localhost:3000'
const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

// Make one room an apartment: two bedrooms, a hall, two bathrooms, a kitchen.
const apt = q(`SELECT id FROM rooms WHERE branch_id=1 ORDER BY id LIMIT 1`)
const aptSlug = q(`SELECT slug FROM rooms WHERE id=${apt}`)
const plain = q(`SELECT id FROM rooms WHERE branch_id=1 AND id<>${apt} ORDER BY id LIMIT 1`)
const plainSlug = q(`SELECT slug FROM rooms WHERE id=${plain}`)
q(`UPDATE rooms SET bedrooms=2, living_rooms=1, bathrooms=2, has_kitchen=true WHERE id=${apt}`)
q(`UPDATE rooms SET bedrooms=NULL, living_rooms=NULL, bathrooms=NULL, has_kitchen=NULL WHERE id=${plain}`)

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } })

// ---------- the room's own page ----------
await p.goto(`${base}/en/rooms/${aptSlug}`, { waitUntil: 'networkidle', timeout: 90000 })
let body = await p.locator('body').innerText()
ok('the apartment page says what it consists of', /2 bedrooms/.test(body) && /1 hall/.test(body),
  (body.match(/Layout[\s\S]{0,60}/) || [''])[0].replace(/\n/g, ' ').trim())
ok('including the bathrooms', /2 bathrooms/.test(body))
ok('and the kitchen', /Kitchen/.test(body))

// ---------- an ordinary room says nothing ----------
await p.goto(`${base}/en/rooms/${plainSlug}`, { waitUntil: 'networkidle' })
// Its own facts band only. The rail at the foot of the page shows sibling
// rooms, and the apartment appearing there is correct.
const band = async () => (await p.locator('section').first().innerText().catch(() => ''))
ok('an ordinary room prints no layout line at all', !/bedroom|hall|Layout/i.test(await band()),
  (await band()).replace(/\n/g, ' ').slice(0, 60))

// ---------- one bedroom is not worth saying either ----------
q(`UPDATE rooms SET bedrooms=1, living_rooms=0, bathrooms=1, has_kitchen=false WHERE id=${plain}`)
await p.goto(`${base}/en/rooms/${plainSlug}`, { waitUntil: 'networkidle' })
ok('"1 bedroom, 1 bathroom" stays silent — true of every room', !/bedroom|Layout/i.test(await band()))

// but a kitchen on its own is worth saying
q(`UPDATE rooms SET has_kitchen=true WHERE id=${plain}`)
await p.goto(`${base}/en/rooms/${plainSlug}`, { waitUntil: 'networkidle' })
ok('a kitchen alone is still announced', /Kitchen/.test(await p.locator('body').innerText()))
q(`UPDATE rooms SET bedrooms=NULL, living_rooms=NULL, bathrooms=NULL, has_kitchen=NULL WHERE id=${plain}`)

// ---------- the lists a guest chooses from ----------
await p.goto(`${base}/en/rooms`, { waitUntil: 'networkidle' })
body = await p.locator('body').innerText()
ok('the rooms list shows it on the card', /2 bedrooms/i.test(body),
  (body.match(/[^\n]*2 bedrooms[^\n]*/i) || [''])[0].trim().slice(0, 90))

await p.goto(`${base}/en/book?hotel=my-flower-1&checkIn=${d(75)}&checkOut=${d(78)}`, {
  waitUntil: 'networkidle',
})
body = await p.locator('body').innerText()
ok('the booking results show it too', /2 bedrooms/.test(body) && /1 hall/.test(body),
  (body.match(/[^\n]*2 bedrooms[^\n]*/) || [''])[0].trim())

// ---------- and in the other two languages ----------
for (const [loc, word] of [
  ['ar', 'غرف نوم'],
  ['ku', 'ژووری نوستن'],
]) {
  await p.goto(`${base}/${loc}/rooms/${aptSlug}`, { waitUntil: 'networkidle' })
  const t = await p.locator('body').innerText()
  ok(`it is written in ${loc}, not left in English`, t.includes(word) && !/2 bedrooms/i.test(t), word)
}

await b.close()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
