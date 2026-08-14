import { chromium } from 'playwright-core'

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
let failed = 0
const ok = (name, cond, note = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`)
  if (!cond) failed++
}

const text = async (url) => {
  const p = await b.newPage()
  await p.goto(url, { waitUntil: 'load', timeout: 90000 })
  // textContent, not innerText: the answers behind a closed <details> are in
  // the page and are read by a crawler, but innerText leaves them out — so
  // asserting on innerText would fail every answer except the first.
  // ...and the JSON-LD scripts come out too, so they are cut: the structured
  // data repeats the amenities by design, and counting it as page copy made
  // "is this written twice?" unanswerable.
  const main = (
    await p.locator('main').evaluate((el) => {
      const clone = el.cloneNode(true)
      clone.querySelectorAll('script').forEach((s) => s.remove())
      return clone.textContent
    })
  ).replace(/\s+/g, ' ')
  const ld = await p.evaluate(() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
  )
  await p.close()
  return { main, ld: ld.join('\n') }
}

const base = 'http://localhost:3000'

// The apartment: every clause has data behind it.
{
  const { main, ld } = await text(`${base}/en/rooms/deluxe-double--my-flower-1`)
  ok('the apartment describes itself', /sleeps up to 2, in a double bed/i.test(main), main.match(/Deluxe Double[^.]*sleeps up to 2[^.]*\./i)?.[0])
  ok('and says how it is laid out', /layout is 2 bedrooms · 1 hall · 2 bathrooms · Kitchen/i.test(main))
  ok('and where the hotel is', /It is at My Flower 1,.*in Erbil/i.test(main))
  ok(
    'but does not list the amenities twice over',
    (main.match(/Flat-screen TV/g) || []).length <= 2,
    `${(main.match(/Flat-screen TV/g) || []).length} mentions`,
  )
  ok('and that no card is taken', /no card is taken to hold the room/i.test(main))
  ok('the room questions are asked', /Questions about this room/i.test(main))
  ok('how many it takes, with the layout', /takes up to 2, and is laid out as 2 bedrooms/i.test(main))
  ok('what it costs', /Deluxe Double.*starts from.*a night/i.test(main))
  ok('how to book it', /How do I book Deluxe Double/i.test(main))
  ok('the answers are given to Google too', /"@type":"FAQPage"/.test(ld))
  ok('and the same number of them', (ld.match(/"@type":"Question"/g) || []).length === 6, `${(ld.match(/"@type":"Question"/g) || []).length} questions`)
}

// A plain room: no bedrooms, no halls, no size entered.
{
  const { main } = await text(`${base}/en/rooms/executive-king--my-flower-1`)
  ok('a plain room still describes itself', /sleeps up to 3, in a king bed/i.test(main))
  ok('and invents no layout for it', !/layout is/i.test(main))
  ok('and gives its real size, not the other room’s', /It measures 30 m²/.test(main))
  ok('but still answers how many it takes', /takes up to 3\./i.test(main))
  ok('without pretending it is an apartment', !/laid out as/i.test(main))
}

// A suite: "in a suite bed" is not a thing anybody says.
{
  const { main } = await text(`${base}/en/rooms/garden-suite--my-flower-1`)
  ok('a suite is not called a suite bed', !/suite bed/i.test(main), main.match(/Garden Suite[^.]*sleeps up to[^.]*\./i)?.[0])
  ok('it just says who it sleeps', /Garden Suite.*sleeps up to 2\./i.test(main))
}

// Written in the other two languages, not left in English.
{
  const { main } = await text(`${base}/ar/rooms/deluxe-double--my-flower-1`)
  ok('the room paragraph is written in ar', /تتسع/.test(main) && !/sleeps up to/i.test(main))
  ok('the room questions are written in ar', /أسئلة عن هذه الغرفة/.test(main))
  ok('and the booking answer too', /كيف أحجز/.test(main))
}
{
  const { main } = await text(`${base}/ku/rooms/deluxe-double--my-flower-1`)
  ok('the room paragraph is written in ku', /وەردەگرێت/.test(main) && !/sleeps up to/i.test(main))
  ok('the room questions are written in ku', /پرسیار دەربارەی ئەم ژوورە/.test(main))
}

// The About page: built from the branches, so it cannot go stale.
{
  const { main, ld } = await text(`${base}/en/about`)
  ok('the group questions are asked', /Questions about the group/i.test(main))
  ok('it counts the hotels correctly', /There are 4, all in Erbil/i.test(main), main.match(/There are \d+, all in Erbil[^.]*\./i)?.[0])
  ok('and names where each one is', /My Flower 1 \(100m Street/i.test(main))
  ok('a hotel not open yet is marked, not given an address', /My Flower 4 \(opening soon\)/i.test(main))
  ok('it says which to choose', /Which one should I stay at/i.test(main))
  ok('and how to reach them', /How do I reach you/i.test(main))
  ok('Google gets the answers too', /"@type":"FAQPage"/.test(ld))
}
{
  const { main } = await text(`${base}/ar/about`)
  ok('the group questions are written in ar', /أسئلة عن المجموعة/.test(main) && !/There are/i.test(main))
}

// The contact page had no way out of it.
{
  const p = await b.newPage()
  await p.goto(`${base}/en/contact`, { waitUntil: 'load', timeout: 90000 })
  const hrefs = await p.$$eval('main a[href^="/en/branches/"]', (as) => as.map((a) => a.getAttribute('href')))
  ok('each hotel on contact links to its page', hrefs.length >= 3, hrefs.join(' '))
  await p.getByRole('link', { name: 'My Flower 2', exact: true }).first().click()
  await p.waitForURL(/branches\/my-flower-2/, { timeout: 30000 })
  ok('and the link goes where it says', /branches\/my-flower-2/.test(p.url()), p.url())
  await p.close()
}

console.log(`\n${failed} failed`)
await b.close()
process.exit(failed ? 1 : 0)
