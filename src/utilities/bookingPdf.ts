import { access } from 'node:fs/promises'
import type { Payload } from 'payload'

/**
 * The confirmation, as a file a guest can keep.
 *
 * Until now the guest's email carried a link to the booking pass and the pass
 * page carried a "Save as PDF" button, which works and asks the guest to do
 * something. A hotel confirmation is a document: it gets forwarded to whoever
 * is paying, shown at a border, printed and put in a folder. That wants a file
 * attached to the email, not a page behind a link the guest has to remember to
 * turn into one.
 *
 * It is rendered by printing the pass page itself, in a headless browser, and
 * that choice is the whole reason this file is short.
 *
 * Two thirds of this site's guests read Kurdish or Arabic. Both are written
 * right to left, and both join their letters — the shape of a letter depends on
 * what sits either side of it. An ordinary PDF library places glyphs; it does
 * not shape them and it does not reorder a mixed line of Arabic and Latin. Fed
 * "ماي فلاور 1" it produces disconnected letters running the wrong way with the
 * number in the wrong place: a document that looks like a mistake, sent by a
 * hotel, to a guest who has just paid it money. Worse than no PDF at all.
 *
 * A browser already does this correctly — it is doing it on the pass page in
 * front of the guest. Printing that page is therefore the only way to get a
 * PDF that is right in all three languages without carrying a text-shaping
 * engine, and it has the second advantage that the document and the page can
 * never drift apart: there is one design, not two.
 *
 * Nothing here is allowed to matter. Every failure returns null, the email goes
 * out exactly as it did before with the link in it, and the booking — which was
 * committed long before this runs — is untouched.
 */

/** Fixed places a browser might be, in the order worth trying. */
const CANDIDATES = [
  process.env.PDF_BROWSER_PATH,
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
]

/** Names it goes by, for the search along PATH. */
const NAMES = ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Finds a browser, and looks along PATH as well as at the usual addresses.
 *
 * The PATH search is not belt and braces — it is the only thing that finds the
 * browser on the deployment this site actually runs on. Nix installs into a
 * store under a hashed directory name and puts a link on PATH; there is no
 * `/usr/bin/chromium` to check for. The fixed list is what covers a Debian
 * image, a developer's laptop and this repository's own test browser.
 */
export const findBrowser = async (): Promise<string | null> => {
  for (const path of CANDIDATES) {
    if (path && (await exists(path))) return path
  }
  for (const dir of (process.env.PATH ?? '').split(':')) {
    if (!dir) continue
    for (const name of NAMES) {
      const path = `${dir}/${name}`
      if (await exists(path)) return path
    }
  }
  return null
}

/**
 * The same search, reported rather than performed — every place looked and
 * what was found there.
 *
 * It exists because "the PDF did not arrive" has several causes that look
 * identical from an inbox: the deployment has no browser, the browser is there
 * but will not start, the page it prints did not load, or the code that does
 * any of it is not deployed at all. `/next/pdf-check` reads this and says which
 * one it is, from inside the running container, the way `/next/mail-check` did
 * for SMTP.
 */
export const browserSearch = async (): Promise<{
  found: string | null
  fixedPaths: { path: string; exists: boolean }[]
  onPath: string[]
}> => {
  const fixedPaths = []
  for (const path of CANDIDATES) {
    if (path) fixedPaths.push({ path, exists: await exists(path) })
  }

  const onPath: string[] = []
  for (const dir of (process.env.PATH ?? '').split(':')) {
    if (!dir) continue
    for (const name of NAMES) {
      const path = `${dir}/${name}`
      if (await exists(path)) onPath.push(path)
    }
  }

  return { found: await findBrowser(), fixedPaths, onPath }
}

/** A4 with the margins a hotel letter is printed at. */
const PAGE = {
  format: 'A4' as const,
  printBackground: true,
  margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
}

export type BookingPdf = { filename: string; content: Buffer }

/**
 * Prints the pass page for one booking.
 *
 * `url` must be the signed pass address — the same one the email links to — so
 * the browser sees exactly what the guest would see, with no session and no
 * privileged access of its own.
 */
export const renderBookingPdf = async (
  payload: Payload,
  reference: string,
  url: string,
): Promise<BookingPdf | null> => {
  const executablePath = await findBrowser()
  if (!executablePath) {
    payload.logger.info(
      `Booking ${reference}: no browser available, so the confirmation goes out with a link ` +
        `rather than an attached PDF. Install chromium and the attachment starts working on ` +
        `its own — see nixpacks.toml.`,
    )
    return null
  }

  let browser
  try {
    // Imported here rather than at the top of the file, so a deployment with no
    // browser never pays for loading the driver — and so that a missing package
    // degrades to "no attachment" instead of breaking the module that sends the
    // email.
    const { chromium } = await import('playwright-core')
    browser = await chromium.launch({
      executablePath,
      // Railway's container has no user namespaces, which is what the sandbox
      // needs. It is a browser opening one page this server generated itself.
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
    const page = await browser.newPage()
    // `networkidle` would wait on anything slow the page happens to load; the
    // pass carries its own type and needs only the fonts.
    await page.goto(url, { waitUntil: 'load', timeout: 20_000 })
    await page.emulateMedia({ media: 'print' })
    // Web fonts decide the shape of every Arabic word on the page. Printing
    // before they arrive gives a document set in a fallback face, which is the
    // one failure that produces a *plausible* wrong answer rather than an
    // obvious one.
    await page.evaluate(() => document.fonts.ready)
    const content = await page.pdf(PAGE)
    payload.logger.info(`Booking ${reference}: confirmation rendered, ${content.length} bytes`)
    return { filename: `${reference}.pdf`, content }
  } catch (error) {
    payload.logger.warn(
      `Booking ${reference}: the confirmation PDF could not be rendered, so the email goes ` +
        `out with a link instead — ${error}`,
    )
    return null
  } finally {
    await browser?.close().catch(() => {})
  }
}
