/**
 * Horizontal-overflow audit.
 *
 * Loads each page inside an iframe of the target width, because headless
 * Chrome refuses a viewport narrower than ~500px and would silently audit
 * the wrong width. Media queries answer to the frame's own width, so this
 * measures what a real phone gets.
 */
import { chromium } from 'playwright-core'

const BASE = 'http://localhost:3000'
const WIDTHS = [320, 360, 390, 414, 600, 768, 1024, 1280, 1920]

const PAGES = [
  '/en/about',
  '/ku/about',
  '/ar/about',
  '/en/branches/my-flower-1',
  '/ku/branches/my-flower-1',
  '/ar/branches/my-flower-1',
  '/en/rooms/deluxe-double--my-flower-1',
  '/ku/rooms/deluxe-double--my-flower-1',
  '/ar/rooms/deluxe-double--my-flower-1',
  '/en',
  '/en/rooms',
  '/en/contact',
  '/en/book?checkIn=2027-03-01&checkOut=2027-03-04',
  '/ar/book?checkIn=2027-03-01&checkOut=2027-03-04',
  '/en/account',
  '/en/account/reset?token=demo',
  '/ar/account/reset?token=demo',
  '/ar/account',
  '/en/booking',
  '/ku/booking',
  '/ar/booking',
]

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})

const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

let failures = 0
let checks = 0

for (const path of PAGES) {
  const row = []
  for (const width of WIDTHS) {
    await page.setContent(
      `<style>html,body{margin:0}iframe{width:${width}px;height:900px;border:0;display:block}</style>
       <iframe src="${BASE}${path}"></iframe>`,
    )
    // Driven through the frame handle rather than contentDocument: the parent
    // document is about:blank, so a same-origin reach into the frame is null.
    await page.frameLocator('iframe').locator('body').waitFor({ state: 'attached', timeout: 60000 })
    await page.waitForTimeout(700)
    const frame = await (await page.$('iframe')).contentFrame()

    const result = await frame.evaluate(() => {
      const doc = document
      const de = doc.documentElement
      const overflow = de.scrollWidth - de.clientWidth
      let culprits = []
      if (overflow > 1) {
        const limit = de.clientWidth
        culprits = [...doc.querySelectorAll('*')]
          .filter((el) => {
            const r = el.getBoundingClientRect()
            return r.right > limit + 1 || r.left < -1
          })
          .slice(0, 6)
          .map((el) => {
            const r = el.getBoundingClientRect()
            return `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')} [${Math.round(r.left)},${Math.round(r.right)}]`
          })
      }
      return { overflow, culprits }
    })

    checks++
    if (result.overflow > 1) {
      failures++
      row.push(`${width}:OVERFLOW+${result.overflow}`)
      console.log(`  FAIL ${path} @${width}px  overflow ${result.overflow}px`)
      result.culprits.forEach((c) => console.log(`        ${c}`))
    } else {
      row.push(`${width}:ok`)
    }
  }
  console.log(`${failures === 0 ? 'PASS' : '    '} ${path}  ${row.join(' ')}`)
}

console.log(`\n${checks} checks, ${failures} overflowing`)
await browser.close()
process.exit(failures > 0 ? 1 : 0)
