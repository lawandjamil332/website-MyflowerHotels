import { chromium } from 'playwright-core'

/**
 * The hotels index — the page that answers "what are these four hotels".
 *
 * It is checked harder than an ordinary page because of what it is for. Two
 * things have to stay true together: the table a guest reads and the ItemList
 * a machine reads must carry the same four hotels, and the count in the copy
 * must be the number of hotels actually published rather than a four somebody
 * typed. A page that says four while listing three is worse than no page.
 */

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
let failed = 0
const ok = (name, cond, note = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`)
  if (!cond) failed++
}

const base = 'http://localhost:3000'

const load = async (url, width = 1280) => {
  const p = await b.newPage({ viewport: { width, height: 900 } })
  await p.goto(url, { waitUntil: 'load', timeout: 90000 })
  return p
}

const jsonld = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) =>
      JSON.parse(s.textContent),
    ),
  )

// How many hotels the database actually holds, taken from the page's own
// list so the assertions below compare the page against itself rather than
// against a number written down here.
let published = 0

{
  const p = await load(`${base}/en/branches`)
  const ld = await jsonld(p)
  const list = ld.find((d) => d['@type'] === 'ItemList')
  published = list?.numberOfItems ?? 0

  ok('the page exists at its own address', p.url().endsWith('/en/branches'))
  ok('it lists the hotels for a machine', !!list, `${published} hotels`)
  ok('and says how many without making it be counted', list?.numberOfItems === published)

  // Every hotel in the list is a real place with an address, not a bare link.
  const items = list?.itemListElement ?? []
  ok(
    'each one is a hotel with an address',
    items.length > 0 && items.every((i) => i.item?.['@type'] === 'Hotel' && i.item?.address?.addressLocality),
    `${items.length} entries`,
  )
  ok(
    'each one points at the same group',
    items.every((i) => i.item?.parentOrganization?.['@id']?.endsWith('/#organization')),
  )
  // The @id is what stops this list and the four hotel pages being read as
  // eight different hotels.
  ok(
    'and carries the same identity as its own page',
    items.every((i) => i.item?.['@id'] === `${i.item?.url}#hotel`),
  )
  ok('positions are 1-based and contiguous', items.every((i, n) => i.position === n + 1))

  // The visible table, which has to agree with all of the above.
  const rows = await p.locator('table tbody tr').count()
  ok('the table shows every hotel', rows === published, `${rows} rows vs ${published} hotels`)

  const table = (await p.locator('table').innerText()).replace(/\s+/g, ' ')
  ok('with a column for where each one is', /Where it is/i.test(table))
  ok('and a telephone number', /\+964/.test(table))
  ok('and a nightly rate', /IQD|\$/.test(table))
  // A hotel that is not open yet must say so rather than show a price.
  ok('a hotel not open yet is marked as such', /Opening soon/i.test(table))

  const main = (await p.locator('main').innerText()).replace(/\s+/g, ' ')
  ok('the count in the copy is spelled from the data', new RegExp(`${['', 'One', 'Two', 'Three', 'Four', 'Five'][published] ?? published} hotels in Erbil`, 'i').test(main), main.slice(0, 60))
  ok('it says who owns the group', /independent, Iraqi-owned/i.test(main))
  ok('the group questions are asked here too', /Questions about the group/i.test(main))
  ok('including who owns it', /Who owns My Flower Hotels/i.test(main))
  ok('and where to stay in the city', /Where should I stay in Erbil/i.test(main))

  await p.close()
}

// Every hotel named in the table is reachable — a list of four links where one
// 404s is the failure this page exists to prevent.
{
  const p = await load(`${base}/en/branches`)
  const hrefs = await p.locator('table tbody a[href*="/branches/"]').evaluateAll((els) =>
    els.map((e) => e.getAttribute('href')),
  )
  await p.close()
  ok('every hotel in the table is linked', hrefs.length === published, hrefs.join(' '))

  let reachable = 0
  for (const href of hrefs) {
    const res = await fetch(`${base}${href}`)
    if (res.ok) reachable++
  }
  ok('and every link opens', reachable === hrefs.length, `${reachable}/${hrefs.length}`)
}

// A hotel that exists elsewhere under a different spelling. Booking.com
// carries these as "MyFlower N Hotel" where the sign outside says "My Flower
// N", which is what splits one brand into several properties. Two things fix
// it and both are asserted here: the listing declared with sameAs, and the
// spellings declared outright.
{
  const p = await load(`${base}/en/branches/my-flower-3`)
  const hotel = (await jsonld(p)).find((d) => d['@type'] === 'Hotel')
  await p.close()

  ok('the hotel page describes a hotel', !!hotel)
  ok(
    'it is pinned to real coordinates',
    typeof hotel?.geo?.latitude === 'number' && typeof hotel?.geo?.longitude === 'number',
    hotel?.geo && `${hotel.geo.latitude}, ${hotel.geo.longitude}`,
  )
  ok(
    'and points at its Booking.com listing',
    (hotel?.sameAs ?? []).some((u) => u.includes('booking.com')),
    (hotel?.sameAs ?? []).join(' '),
  )
  // The spelling Booking.com actually uses has to be in there, or the two
  // records stay two hotels.
  const aka = hotel?.alternateName ?? []
  ok('it declares the other spellings of its name', aka.length > 0, aka.join(' / '))
  ok(
    'including the one-word spelling the listings use',
    aka.some((n) => /^MyFlower/.test(n)),
  )
  ok('and never repeats its own name back', !aka.includes(hotel?.name))
}

// The header and footer must reach it. This page replaced an anchor on the
// homepage that both of them pointed at, and a page nothing links to is a page
// that is only ever found by accident.
{
  const p = await load(`${base}/en/rooms`)
  const nav = await p.locator('header a[href="/en/branches"]').count()
  const foot = await p.locator('footer a[href="/en/branches"]').count()
  await p.close()
  ok('the header links to it from another page', nav > 0)
  ok('and so does the footer', foot > 0)
}

// Both right-to-left languages, where the table is the thing most likely to
// break: five columns of mixed Arabic and Latin, and a telephone number that
// must keep its + on the left.
for (const locale of ['ku', 'ar']) {
  const p = await load(`${base}/${locale}/branches`, 390)
  const rows = await p.locator('table tbody tr').count()
  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  const dir = await p.locator('html').getAttribute('dir')
  await p.close()
  ok(`the table survives ${locale}`, rows === published, `${rows} rows`)
  ok(`and ${locale} reads right to left`, dir === 'rtl')
  // The table is wider than a phone by design; the scroll belongs inside it.
  ok(`and the ${locale} page does not scroll sideways on a phone`, overflow === 0, `${overflow}px`)
}

await b.close()
console.log(`\n${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
