import { chromium } from 'playwright-core'

/**
 * That the page the browser ends up with is the page the server sent.
 *
 * This suite exists because of one bug and would have caught it on the day it
 * shipped. Dates and prices were formatted by asking Intl for the locale —
 * `ckb-IQ` for Kurdish — which works on the server, because Node carries the
 * full ICU database and knows Central Kurdish, and does not work in a browser,
 * because Chromium ships no `ckb` data at all. The server sent "شەممە، 05
 * ئەیلوول 2026", React hydrated, the browser produced "Saturday, September 05,
 * 2026", and every Kurdish page on the site threw a hydration mismatch.
 *
 * The error was the small half of it. React resolves a mismatch by keeping
 * what the client rendered, so a guest reading the site in Kurdish was shown
 * English dates and "IQD" where the price should have said د.ع. — on every
 * page, quietly, with nothing failing.
 *
 * So the test is not "does this format correctly", which is a unit test that
 * would have passed on the server. It is: does the browser agree with the
 * server. Anything that formats by asking the runtime what a language looks
 * like will break this again, and it will break it in Kurdish first, because
 * Kurdish is the locale every engine is most likely to be missing.
 */

let failed = 0
const ok = (name, cond, note = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`)
  if (!cond) failed++
}

const base = process.env.BASE_URL || 'http://localhost:3000'
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})

// Kurdish first and deliberately: it is the locale that broke, and the one
// least likely to be present in whatever engine a guest is using.
const paths = []
for (const locale of ['ku', 'ar', 'en']) {
  paths.push(`/${locale}`, `/${locale}/branches`, `/${locale}/rooms`, `/${locale}/branches/my-flower-3`)
}

for (const path of paths) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  p.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 100))
  })
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

  await p.goto(base + path, { waitUntil: 'load', timeout: 60000 })
  // Hydration happens after load; a mismatch is reported during it.
  await p.waitForTimeout(1200)
  await p.close()

  // 418 and 425 are the hydration mismatch codes in a production React build,
  // where the message itself is minified away.
  const mismatch = errors.filter((e) => /418|425|hydrat/i.test(e))
  ok(`${path} hydrates cleanly`, mismatch.length === 0, mismatch[0] ?? '')
  ok(`${path} has no console errors`, errors.length === 0, errors[0] ?? '')
}

// The formatting itself, compared across the wire rather than trusted on one
// side of it. Both sides run the same module; the point is that its answer
// does not depend on which engine is running it.
{
  const p = await b.newPage()
  await p.goto(base + '/en', { waitUntil: 'load' })
  const inBrowser = await p.evaluate(() => {
    const g = (n) => new Intl.NumberFormat('en-GB').format(n)
    return { grouped: g(1558), big: g(100000) }
  })
  await p.close()

  const { formatDateLong, formatPrice, formatNumber } = await import('../../src/utilities/format.ts')

  ok('grouping agrees across engines', inBrowser.grouped === formatNumber(1558, 'ku'), `${inBrowser.grouped} vs ${formatNumber(1558, 'ku')}`)
  ok('and on larger numbers', inBrowser.big === formatNumber(100000, 'ar'))

  // Written down rather than looked up, so these are the same in any runtime.
  ok('Kurdish dates are Kurdish', formatDateLong('2026-09-05', 'ku') === 'شەممە، 05 ئەیلوول 2026', formatDateLong('2026-09-05', 'ku'))
  ok('Arabic dates are Arabic', formatDateLong('2026-09-05', 'ar') === 'السبت، 05 أيلول 2026', formatDateLong('2026-09-05', 'ar'))
  ok('English dates carry the comma', formatDateLong('2026-09-05', 'en') === 'Saturday, 05 September 2026', formatDateLong('2026-09-05', 'en'))
  ok('the dinar is named in Kurdish', formatPrice(100000, 'IQD', 'ku') === '100,000 د.ع.', formatPrice(100000, 'IQD', 'ku'))
  ok('and in English', formatPrice(100000, 'IQD', 'en') === 'IQD 100,000', formatPrice(100000, 'IQD', 'en'))
  // A calendar day must not drift with the reader's timezone: a night booked
  // is a date, not a moment.
  ok('dates are read in UTC', formatDateLong('2026-09-05T23:30:00Z', 'en').startsWith('Saturday, 05'))
  ok('an unknown currency still prints', formatPrice(500, 'EUR', 'en') === 'EUR 500', formatPrice(500, 'EUR', 'en'))
  ok('nothing is printed for nothing', formatPrice(null, 'IQD', 'en') === '' && formatDateLong(null, 'en') === '')
}

await b.close()
console.log(`\n${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
