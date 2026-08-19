import { chromium } from 'playwright-core'

/**
 * The things Safari on an iPhone does differently, and that nothing else will
 * catch.
 *
 * There is no WebKit in this container, so none of this is a Safari rendering
 * test — it cannot be, and pretending otherwise would be worse than not
 * testing. What it checks instead are the deterministic rules: the font size
 * below which iOS zooms a page, the viewport unit that lies about how tall a
 * phone screen is, and whether anything pinned to the bottom edge has been
 * told about the home indicator. All three are decided by CSS readable in any
 * engine, and all three were wrong.
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

/**
 * Safari zooms the page whenever a guest focuses a control set below 16px, and
 * does not zoom back out. On the search widget that meant tapping "Arriving"
 * magnified the homepage, on the first thing anybody touches.
 */
{
  const small = []
  for (const path of ['/en', '/en/book', '/en/contact', '/en/account', '/en/booking', '/ar/book']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } })
    await p.goto(base + path, { waitUntil: 'load', timeout: 60000 })
    await p.waitForTimeout(600)
    const found = await p.evaluate(() =>
      [...document.querySelectorAll('input, select, textarea')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 || r.height > 0
        })
        .map((el) => ({
          what: `${el.tagName}${el.type ? `[${el.type}]` : ''}#${el.id || '-'}`,
          px: parseFloat(getComputedStyle(el).fontSize),
        }))
        .filter((x) => x.px < 16),
    )
    await p.close()
    for (const f of found) small.push(`${path} ${f.what} ${f.px}px`)
  }
  ok('no form control is small enough to zoom iOS', small.length === 0, small.join(', '))
}

{
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(base + '/en/branches/my-flower-3', { waitUntil: 'load' })
  await p.evaluate(() => window.scrollTo(0, 1400))
  await p.waitForTimeout(1100)

  const r = await p.evaluate(() => {
    const bar = document.querySelector('.fixed.inset-x-0.bottom-0')
    const inner = bar?.querySelector('div')
    return {
      minHeight: getComputedStyle(document.body).minHeight,
      viewport: window.innerHeight,
      tap: getComputedStyle(document.querySelector('a')).webkitTapHighlightColor,
      barStyle: inner?.getAttribute('style') ?? '',
      dockStyle:
        document.querySelector('[class*="fixed"][class*="end-5"]')?.getAttribute('style') ?? '',
    }
  })
  await p.close()

  // 100vh on iOS is the viewport with the toolbars hidden — taller than what
  // is on screen — so a page with nothing below the fold still scrolls.
  ok(
    'the body is as tall as the screen actually is',
    parseFloat(r.minHeight) <= r.viewport + 1,
    `${r.minHeight} vs ${r.viewport}px`,
  )
  ok('taps do not flash a grey box', /rgba\(0, 0, 0, 0\)|transparent/.test(r.tap), r.tap)

  // Anything fixed to the bottom edge sits under the home indicator on every
  // iPhone since the X unless it says otherwise.
  ok('the reserve bar clears the home indicator', r.barStyle.includes('safe-area-inset-bottom'), r.barStyle)
  ok('and so does the contact dock', r.dockStyle.includes('safe-area-inset-bottom'), r.dockStyle)
}

// The home-screen icon, and the colour iOS paints behind the status bar.
{
  const html = await (await fetch(base + '/en')).text()
  ok('there is an apple touch icon', /rel="apple-touch-icon"/.test(html))
  ok('and a theme colour for the status bar', /name="theme-color"/.test(html))
  // width=device-width is what stops iOS rendering at 980px and scaling down.
  ok('the viewport is the device width', /name="viewport"[^>]*width=device-width/.test(html))
  // Never user-scalable=no: pinch zoom is how a guest reads a phone number.
  ok('and pinch zoom is not disabled', !/user-scalable\s*=\s*no|maximum-scale=1/.test(html))
}

await b.close()
console.log(`\n${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
