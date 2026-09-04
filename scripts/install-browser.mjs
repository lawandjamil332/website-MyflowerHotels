/**
 * Makes sure a browser exists for printing booking confirmations, whoever
 * built the image.
 *
 * The confirmation PDF is the booking pass printed in headless Chromium — see
 * src/utilities/bookingPdf.ts for why it has to be a real browser and not a
 * PDF library. Until now that browser came from nixpacks.toml, which is a
 * request to one particular build system. That turned out to be a single point
 * of failure of a kind that is invisible from outside: if the host does not
 * read that file — a different builder, a renamed package, a build step that
 * quietly did not run — the site deploys perfectly, sends every email, and
 * simply never attaches anything. Which is what happened.
 *
 * So the browser is fetched here instead, from the build script in
 * package.json, which runs no matter what built the image. It is Playwright's
 * own download of the exact build `playwright-core` drives, so there is no
 * system package name to get wrong on somebody else's base image.
 *
 * Two rules:
 *
 *  - If the machine already has a browser, this does nothing. A developer's
 *    laptop, this repository's test container and a Nix image that installed
 *    chromium all keep the one they have, and nothing is downloaded.
 *  - It can never fail the build. A hotel website that does not deploy is a
 *    real problem; a confirmation email that carries a link instead of an
 *    attachment is a small one. Every failure here is reported and shrugged
 *    off.
 *
 * The download goes into .playwright/ inside the project rather than the
 * user's home cache, because the deploy image is built from the project
 * directory and a cache outside it does not survive into the container that
 * runs the site.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const browsersPath = join(root, '.playwright')

/** The same addresses findBrowser() checks, in the same order. */
const systemBrowser = () => {
  const fixed = [
    process.env.PDF_BROWSER_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ].filter(Boolean)
  for (const path of fixed) {
    if (existsSync(path)) return path
  }
  for (const dir of (process.env.PATH ?? '').split(':')) {
    if (!dir) continue
    for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
      if (existsSync(join(dir, name))) return join(dir, name)
    }
  }
  return null
}

/**
 * A browser Playwright downloaded — here by an earlier build, or wherever
 * PLAYWRIGHT_BROWSERS_PATH points on a machine that keeps one.
 *
 * Both spellings of the directory inside are checked. Chromium builds used to
 * unpack to `chrome-linux`; the Chrome for Testing builds Playwright now
 * downloads unpack to `chrome-linux64`. Looking for only one of them means
 * downloading a browser on every single build and never finding it afterwards.
 */
const downloaded = () => {
  for (const dir of [browsersPath, process.env.PLAYWRIGHT_BROWSERS_PATH]) {
    if (!dir) continue
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      continue // No directory yet, which is the ordinary first-build case.
    }
    for (const entry of entries) {
      for (const inside of [['chrome-linux', 'chrome'], ['chrome-linux64', 'chrome']]) {
        const candidate = join(dir, entry, ...inside)
        if (existsSync(candidate)) return candidate
      }
    }
  }
  return null
}

const already = systemBrowser() ?? downloaded()
if (already) {
  console.log(`  Confirmation PDF: browser already present at ${already}, nothing to download.`)
  process.exit(0)
}

console.log('  Confirmation PDF: no browser on this machine, fetching one for it...')

try {
  execFileSync('npx', ['--yes', 'playwright-core', 'install', 'chromium'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
      // Set in nixpacks.toml to stop npm's postinstall duplicating a browser
      // the Nix image already had. This is the deliberate download, so the
      // flag that suppresses the accidental one has to come off.
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '',
    },
  })

  const found = downloaded()
  console.log(
    found
      ? `  Confirmation PDF: browser installed at ${found}.`
      : '  Confirmation PDF: the download reported success but left nothing findable. ' +
          'Confirmations will go out with a link and no attachment.',
  )
} catch (error) {
  // Deliberately not a failure. See the note at the top.
  console.log(
    `  Confirmation PDF: could not fetch a browser (${error}). The site is unaffected — ` +
      'confirmations go out with a link rather than an attached PDF.',
  )
}
