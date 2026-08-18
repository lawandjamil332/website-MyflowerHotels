import { chromium } from 'playwright-core'

/**
 * That somebody can use this site with a keyboard.
 *
 * Written after tabbing through the homepage and finding the arrival date
 * field invisible: it carried `focus:outline-none focus:ring-0` and nothing
 * put the indicator back, so a guest moving through the booking form with a
 * keyboard had no way of telling which field they were in. On the one form
 * this site exists to get filled in.
 *
 * The check allows the indicator to sit on an ancestor rather than on the
 * control itself, because that is the correct answer for some of them: a date
 * input stretches its calendar picker invisibly across the whole cell, so the
 * ring belongs on the cell. What is not allowed is no indicator anywhere.
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

const walk = async (path, presses = 24) => {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
  await p.goto(base + path, { waitUntil: 'load', timeout: 60000 })
  await p.waitForTimeout(800)
  const stops = []
  for (let i = 0; i < presses; i++) {
    await p.keyboard.press('Tab')
    const stop = await p.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      let node = el
      let depth = 0
      let where = null
      while (node && depth < 4) {
        const s = getComputedStyle(node)
        const ring =
          (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none'
        if (ring) {
          where = node === el ? 'self' : 'ancestor'
          break
        }
        node = node.parentElement
        depth++
      }
      return {
        tag: el.tagName,
        id: el.id,
        label: (el.textContent || el.getAttribute('aria-label') || el.id || '').trim().slice(0, 24),
        ring: where,
      }
    })
    if (stop) stops.push(stop)
  }
  await p.close()
  return stops
}

{
  const stops = await walk('/en')
  ok('the keyboard reaches things at all', stops.length > 12, `${stops.length} stops`)

  const blind = stops.filter((s) => !s.ring)
  ok(
    'every stop shows where it is',
    blind.length === 0,
    blind.map((s) => `${s.tag}#${s.id || s.label}`).join(', '),
  )

  // The first stop must be the way past the navigation, or a keyboard user
  // walks the whole header on every page of the site.
  ok('the first stop is the skip link', /skip/i.test(stops[0]?.label ?? ''), stops[0]?.label)

  // The booking form is reachable without a mouse, and its date fields — the
  // ones that were invisible — are among the stops.
  const ids = stops.map((s) => s.id)
  ok('the arrival date is reachable', ids.includes('finder-in'))
  ok('and the departure date', ids.includes('finder-out'))
}

// The same on a right-to-left page, where the finder is mirrored.
{
  const stops = await walk('/ar')
  const blind = stops.filter((s) => !s.ring)
  ok('right-to-left keyboards see focus too', blind.length === 0, blind.map((s) => s.tag + '#' + s.id).join(', '))
}

await b.close()
console.log(`\n${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
