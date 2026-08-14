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
const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const IN = d(120)
const OUT = d(123)

const room = q(`SELECT id FROM rooms WHERE branch_id=1 ORDER BY id LIMIT 1`)
const name = q(`SELECT COALESCE(name,'') FROM rooms_locales WHERE _parent_id=${room} AND _locale='en'`)
q(`UPDATE settings SET low_stock_at = 3`)
// "Left" is quantity minus whatever is already holding these nights, so the
// window has to start empty for the numbers below to mean what they say.
const clear = () =>
  q(`DELETE FROM bookings WHERE room_id=${room} AND check_in < '${OUT}' AND check_out > '${IN}'`)
clear()

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } })

const lineFor = async () => {
  await p.goto(`${base}/en/book?hotel=my-flower-1&checkIn=${IN}&checkOut=${OUT}`, {
    waitUntil: 'networkidle',
    timeout: 90000,
  })
  const card = p.locator('li').filter({ hasText: name }).first()
  return (await card.innerText().catch(() => '')).replace(/\n/g, ' | ')
}

// ---------- plenty free: say nothing ----------
clear(); q(`UPDATE rooms SET quantity = 9 WHERE id=${room}`)
let line = await lineFor()
ok('with 9 free it does not talk about how many are left', !/left|Only/i.test(line), line.slice(0, 90))

// ---------- genuinely low: say so, and say the true number ----------
clear(); q(`UPDATE rooms SET quantity = 2 WHERE id=${room}`)
line = await lineFor()
ok('with 2 free it says exactly that', /Only 2 left/i.test(line), line.slice(0, 90))

clear(); q(`UPDATE rooms SET quantity = 1 WHERE id=${room}`)
line = await lineFor()
ok('with 1 free it says 1, not 2', /Only 1 left/i.test(line), line.slice(0, 90))

clear(); q(`UPDATE rooms SET quantity = 3 WHERE id=${room}`)
line = await lineFor()
ok('3 is on the threshold and still counts as low', /Only 3 left/i.test(line), line.slice(0, 90))

clear(); q(`UPDATE rooms SET quantity = 4 WHERE id=${room}`)
line = await lineFor()
ok('4 is above it and stays quiet', !/Only/i.test(line), line.slice(0, 90))

// ---------- the owner can move the line ----------
q(`UPDATE settings SET low_stock_at = 5`)
line = await lineFor()
ok('raising the setting to 5 makes 4 count as low', /Only 4 left/i.test(line), line.slice(0, 90))

q(`UPDATE settings SET low_stock_at = 0`)
line = await lineFor()
ok('setting it to 0 turns the line off entirely', !/Only|left/i.test(line), line.slice(0, 90))

// ---------- and it is real: a booking moves it ----------
q(`UPDATE settings SET low_stock_at = 3`)
clear(); q(`UPDATE rooms SET quantity = 2 WHERE id=${room}`)
ok('two free before booking', /Only 2 left/i.test(await lineFor()))

await p.getByRole('link', { name: /Reserve this room/i }).first().click()
await p.waitForURL((u) => u.searchParams.has('room'), { timeout: 20000 })
await p.locator('#booking-name').fill('Scarcity Test')
await p.locator('#booking-phone').fill('+964 750 606 0606')
await p.getByRole('button', { name: /Confirm booking/i }).click()
await p.waitForTimeout(4500)

line = await lineFor()
ok('after one is taken it says 1, because it is counting', /Only 1 left/i.test(line), line.slice(0, 90))

// ---------- translated ----------
q(`UPDATE rooms SET quantity = 3 WHERE id=${room}`)
for (const [loc, word] of [
  ['ar', 'فقط'],
  ['ku', 'تەنها'],
]) {
  await p.goto(`${base}/${loc}/book?hotel=my-flower-1&checkIn=${IN}&checkOut=${OUT}`, {
    waitUntil: 'networkidle',
  })
  const t = await p.locator('body').innerText()
  ok(`it is written in ${loc}`, /(فقط|تەنها)/.test(t) && !/Only/i.test(t), (t.match(/[^\n]*(فقط|تەنها)[^\n]*/) || [''])[0].slice(0,40))
}

clear(); q(`UPDATE rooms SET quantity = 3 WHERE id=${room}`)
await b.close()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
