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

/**
 * Fixed places a browser might be, in the order worth trying.
 *
 * Read when the search runs rather than when this file is imported, so that
 * PDF_BROWSER_PATH still means something to code that sets it afterwards — a
 * test proving what happens when the browser is wrong, most of all. Captured at
 * import, the variable is only settable by whoever launched the process, which
 * makes the failure path the one thing that cannot be exercised.
 */
const candidates = () => [
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

/**
 * Directories holding browsers Playwright downloaded rather than the system.
 *
 * `.playwright` is where scripts/install-browser.mjs puts one when the image
 * came without: inside the project rather than the user's home cache, because
 * the deploy image is built from the project directory and a cache outside it
 * does not survive into the container that runs the site.
 */
const downloadDirs = () => [process.env.PLAYWRIGHT_BROWSERS_PATH, '.playwright']

/**
 * Where the executable sits inside one of those, and both spellings are
 * needed. Chromium builds used to unpack to `chrome-linux`; the Chrome for
 * Testing builds Playwright now downloads unpack to `chrome-linux64`. Checking
 * only the older one finds the browser on a machine that already had it and
 * misses the one just downloaded — which is a search that works everywhere
 * except the case it was written for.
 */
const INSIDE = ['chrome-linux/chrome', 'chrome-linux64/chrome']

const downloadedBrowser = async (): Promise<string | null> => {
  const { readdir } = await import('node:fs/promises')
  for (const dir of downloadDirs()) {
    if (!dir) continue
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch {
      continue // No such directory, which is the ordinary case.
    }
    for (const entry of entries) {
      for (const inside of INSIDE) {
        const candidate = `${dir}/${entry}/${inside}`
        if (await exists(candidate)) return candidate
      }
    }
  }
  return null
}

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
  for (const path of candidates()) {
    if (path && (await exists(path))) return path
  }
  for (const dir of (process.env.PATH ?? '').split(':')) {
    if (!dir) continue
    for (const name of NAMES) {
      const path = `${dir}/${name}`
      if (await exists(path)) return path
    }
  }
  return await downloadedBrowser()
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
  downloaded: string | null
}> => {
  const fixedPaths = []
  for (const path of candidates()) {
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

  return {
    found: await findBrowser(),
    fixedPaths,
    onPath,
    downloaded: await downloadedBrowser(),
  }
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
): Promise<BookingPdf | null> => (await renderBookingPdfResult(payload, reference, url)).pdf

/**
 * The same, with the reason it failed rather than only the failure.
 *
 * The reason exists because this ran for days in production returning null and
 * there was no way to find out why: the deployment logs are not somewhere the
 * owner reads, the site was healthy, both letters arrived, and the only symptom
 * was a missing attachment. So the reason now travels to the one place known to
 * work — the hotel's own copy of the booking email. See sendBookingEmails.
 */
export const renderBookingPdfResult = async (
  payload: Payload,
  reference: string,
  url: string,
): Promise<{ pdf: BookingPdf | null; problem: string | null }> => {
  const executablePath = await findBrowser()
  if (!executablePath) {
    payload.logger.info(
      `Booking ${reference}: no browser available, so the confirmation goes out with a link ` +
        `rather than an attached PDF. Install chromium and the attachment starts working on ` +
        `its own — see nixpacks.toml.`,
    )
    return { pdf: null, problem: 'No browser is installed on the server.' }
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
    return { pdf: { filename: `${reference}.pdf`, content }, problem: null }
  } catch (error) {
    payload.logger.warn(
      `Booking ${reference}: the confirmation PDF could not be rendered, so the email goes ` +
        `out with a link instead — ${error}`,
    )
    return {
      pdf: null,
      // The browser's own words, trimmed. They name the missing library or the
      // address that would not load, which is the whole value of this line.
      problem: `The browser at ${executablePath} failed: ${String(error).split('\n')[0].slice(0, 300)}`,
    }
  } finally {
    await browser?.close().catch(() => {})
  }
}
