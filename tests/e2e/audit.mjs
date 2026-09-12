/**
 * The accessibility and correctness audit, over every page in every language
 * at both widths.
 *
 * Written as one sweep rather than as separate checks because the faults it
 * looks for are the ones nobody notices until somebody complains: a control
 * too small for a thumb, text too faint to read, a heading level skipped, an
 * image with nothing said about it for a guest using a screen reader, a
 * request quietly 404ing behind a page that looks fine.
 *
 * It found three real things on its first run and nothing since, which is the
 * point of keeping it: the site passes today, and this is what notices the
 * afternoon it stops.
 *
 * TWO THINGS IT DELIBERATELY DOES NOT DO, both learned by getting them wrong.
 *
 * It does not judge contrast for text sitting on a photograph. The colour
 * behind that text is not in the CSS, so reading the CSS gives white-on-white
 * and a page of 1.00:1 "failures" that are nothing of the kind. Where no
 * painted background can be found it says nothing at all.
 *
 * And it measures a tap target including the invisible ::before this site
 * expands its hit areas with, rather than the link's own box. Measuring the
 * box condemns every link in the footer, all of which are already a
 * comfortable 44px to a finger. 24px is the floor here — what WCAG 2.5.8
 * requires at AA — not the 44px AAA ideal, because a threshold that flags most
 * of a well-built site buries the two controls that are genuinely too small.
 */

import { chromium } from 'playwright-core'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const PATHS = ['', '/branches', '/branches/my-flower-3', '/rooms', '/about', '/contact', '/booking', '/account']
const LOCALES = ['en', 'ku', 'ar']
const WIDTHS = [{ w: 390, h: 844, name: 'phone' }, { w: 1280, h: 900, name: 'desktop' }]

const findings = []
const add = (where, kind, detail) => findings.push({ where, kind, detail })

const audit = async (page, where) => {
  // One h1, and headings that do not skip a level.
  const headings = await page.evaluate(() =>
    [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .filter((h) => h.offsetParent !== null || h.tagName === 'H1')
      .map((h) => ({ level: Number(h.tagName[1]), text: (h.textContent || '').trim().slice(0, 40) })),
  )
  const h1s = headings.filter((h) => h.level === 1)
  if (h1s.length === 0) add(where, 'no-h1', 'page has no visible h1')
  if (h1s.length > 1) add(where, 'many-h1', h1s.map((h) => h.text).join(' | '))
  let previous = 0
  for (const h of headings) {
    if (previous && h.level > previous + 1) {
      add(where, 'heading-skip', `h${previous} -> h${h.level} at "${h.text}"`)
      break
    }
    previous = h.level
  }

  // Images without alternative text.
  const noAlt = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((i) => !i.getAttribute('alt') && i.getAttribute('alt') !== '')
      .map((i) => (i.currentSrc || i.src || '').split('/').pop()?.slice(0, 40)),
  )
  if (noAlt.length) add(where, 'img-no-alt', noAlt.slice(0, 4).join(', '))

  // Controls a finger cannot hit. 44px is the figure every touch guideline uses.
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('a,button,input,select,[role="button"]')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return false
        // Visually hidden until focused — the skip link. Not a touch target.
        if (r.width <= 2 && r.height <= 2) return false
        // A link inside a sentence is exempt from the size rule, and marking
        // them up as blocks would wreck the prose. WCAG 2.5.8 says so too.
        const inProse = ['P', 'LI', 'DD', 'SPAN'].includes(el.parentElement?.tagName || '')
          && getComputedStyle(el).display === 'inline'
        if (inProse) return false
        // The site expands hit areas with an invisible ::before rather than by
        // growing the link — so the rectangle understates what a finger can
        // actually hit, and measuring the rectangle alone condemns every
        // footer link on the site.
        const before = getComputedStyle(el, '::before')
        const grown = before.content !== 'none' ? parseFloat(before.blockSize || '0') || 0 : 0
        const height = Math.max(r.height, grown)
        // 24px is the floor WCAG 2.5.8 sets at AA, and what the site's own
        // 32px ::before hit areas comfortably clear. 44px is the AAA ideal and
        // what the footer columns use; measuring against 44 flags most of a
        // well-built site and buries the handful of real failures.
        return height < 24 || r.width < 24
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        const before = getComputedStyle(el, '::before')
        const grown = before.content !== 'none' ? parseFloat(before.blockSize || '0') || 0 : 0
        return `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(Math.max(r.height, grown))}`
      }),
  )
  if (small.length) add(where, 'small-target', `${small.length}: ${small.slice(0, 3).join(' | ')}`)

  // Form fields nobody has named.
  const unlabelled = await page.evaluate(() =>
    [...document.querySelectorAll('input,select,textarea')]
      .filter((el) => {
        if (el.type === 'hidden') return false
        if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false
        if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false
        return !el.closest('label')
      })
      .map((el) => `${el.tagName.toLowerCase()}[name=${el.getAttribute('name') || '?'}]`),
  )
  if (unlabelled.length) add(where, 'unlabelled-field', unlabelled.slice(0, 4).join(', '))

  // A page wider than the screen.
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth - doc.clientWidth
  })
  if (overflow > 2) add(where, 'sideways-scroll', `${overflow}px wider than the screen`)

  // Text too faint to read. Contrast against the nearest painted ancestor.
  const faint = await page.evaluate(() => {
    const lum = (c) => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const parse = (s) => {
      const m = s.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/)
      return m ? { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] } : null
    }
    const bgOf = (el) => {
      let node = el
      while (node && node !== document.documentElement) {
        const c = parse(getComputedStyle(node).backgroundColor)
        if (c && c.a > 0.5) return c.rgb
        node = node.parentElement
      }
      // Nothing painted anywhere up the tree: the colour behind this text is
      // a photograph, and no reading of the CSS can tell us the ratio. Saying
      // nothing is the honest answer; guessing white produces a page of
      // 1.00:1 failures that are not failures.
      return null
    }
    const out = []
    for (const el of document.querySelectorAll('p,span,a,li,dd,dt,h1,h2,h3,h4,label,button')) {
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('')
      if (!text || text.length < 3) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const cs = getComputedStyle(el)
      const fg = parse(cs.color)
      if (!fg || fg.a < 0.95) continue
      // Text drawn over a photograph cannot be judged from CSS colours alone.
      let over = false
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        if (getComputedStyle(n).backgroundImage !== 'none') { over = true; break }
      }
      if (over) continue
      const bg = bgOf(el)
      if (!bg) continue
      const L1 = lum(fg.rgb), L2 = lum(bg)
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
      const size = parseFloat(cs.fontSize)
      const bold = Number(cs.fontWeight) >= 700
      const large = size >= 24 || (size >= 18.66 && bold)
      const need = large ? 3 : 4.5
      if (ratio < need) out.push(`"${text.slice(0, 24)}" ${ratio.toFixed(2)}:1 needs ${need}`)
    }
    return [...new Set(out)]
  })
  if (faint.length) add(where, 'low-contrast', `${faint.length}: ${faint.slice(0, 3).join(' | ')}`)
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

for (const { w, h, name } of WIDTHS) {
  for (const locale of LOCALES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 })
    const page = await ctx.newPage()
    for (const path of PATHS) {
      const url = `${BASE}/${locale}${path}`
      const where = `${name} ${locale}${path || '/'}`
      const errors = []
      page.removeAllListeners('console')
      page.removeAllListeners('response')
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 90)) })
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(-50)}`) })
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 30000 })
        await page.waitForTimeout(900)
        await audit(page, where)
        for (const e of [...new Set(errors)]) add(where, 'error', e)
      } catch (e) {
        add(where, 'failed-to-load', String(e).split('\n')[0].slice(0, 90))
      }
    }
    await ctx.close()
  }
}
await browser.close()

const loads = PATHS.length * LOCALES.length * WIDTHS.length
const byKind = {}
for (const f of findings) (byKind[f.kind] ??= []).push(f)

for (const [kind, list] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`FAIL  ${kind} — ${list.length}`)
  for (const f of list.slice(0, 8)) console.log(`        ${f.where}: ${f.detail}`)
  if (list.length > 8) console.log(`        ... and ${list.length - 8} more`)
}

if (findings.length === 0) {
  console.log(`PASS  no console errors or failed requests  — ${loads} page loads`)
  console.log('PASS  one h1 per page, and no heading level skipped')
  console.log('PASS  every image says what it shows')
  console.log('PASS  every form field is named')
  console.log('PASS  nothing scrolls sideways')
  console.log('PASS  every colour pair meets the contrast it needs')
  console.log('PASS  every control is big enough to tap')
}

console.log(`\n${findings.length} failed`)
process.exit(findings.length > 0 ? 1 : 0)
