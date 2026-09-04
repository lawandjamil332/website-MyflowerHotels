import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { browserSearch } from '@/utilities/bookingPdf'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Why the confirmation PDF is or is not attached, measured from inside the
 * running deployment.
 *
 * Written for the same reason as `/next/mail-check` next door. "No PDF
 * arrived" has four causes that are indistinguishable from an inbox, and they
 * have four different fixes:
 *
 *  1. This code is not deployed. Then this endpoint 404s, which is the answer.
 *  2. The deployment has no browser — the nixpacks build did not install
 *     chromium, or installed it somewhere nothing looks.
 *  3. The browser is there and will not start, usually the sandbox.
 *  4. Everything starts and the page it prints will not load, which on a
 *     hosted deployment is normally the container being unable to reach its
 *     own public address.
 *
 * Nothing here can affect a booking. It opens a browser, prints one page of
 * its own making, throws the result away and reports what happened.
 *
 * Staff-only, like its neighbour: it reveals nothing secret, but it starts a
 * browser on request and an endpoint that does that should not be anonymous.
 */

export const dynamic = 'force-dynamic'

/** Long enough for a cold browser start, short enough to answer a page load. */
const LAUNCH_TIMEOUT_MS = 30_000
const LOAD_TIMEOUT_MS = 20_000

/** English, Kurdish and Arabic — the three the confirmation is printed in. */
const SAMPLE = `<!doctype html>
<meta charset="utf-8">
<style>body{font:16px system-ui;margin:24px}</style>
<p>My Flower Hotels — booking confirmation</p>
<p dir="rtl">هۆتێلی ماي فلاوەر ١ — پشتڕاستکردنەوەی چاوپێکەوتن</p>
<p dir="rtl">فندق ماي فلاور ١ — تأكيد الحجز</p>`

type Stage = { stage: string; ok: boolean; ms: number; detail?: string }

const timed = async (stage: string, fn: () => Promise<string | void>): Promise<Stage> => {
  const started = Date.now()
  try {
    const detail = await fn()
    return { stage, ok: true, ms: Date.now() - started, ...(detail ? { detail } : {}) }
  } catch (error) {
    return { stage, ok: false, ms: Date.now() - started, detail: String(error) }
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  let user
  try {
    const auth = await payload.auth({ req: req as unknown as PayloadRequest, headers: req.headers })
    user = auth.user
  } catch {
    user = null
  }

  if (!user || user.collection !== 'users') {
    return new Response('Sign in to the admin panel first, then reload this page.', { status: 403 })
  }

  const search = await browserSearch()
  const stages: Stage[] = []

  let pdfBytes: number | null = null
  const homeUrl = getServerSideURL()

  if (search.found) {
    const executablePath = search.found

    // Whether the driver is installed at all. It is an ordinary dependency, so
    // this only fails on a deployment that installed production packages from a
    // package.json older than the one that added it.
    let launcher: typeof import('playwright-core').chromium | undefined
    stages.push(
      await timed('load playwright-core', async () => {
        launcher = (await import('playwright-core')).chromium
        return 'the driver is installed'
      }),
    )

    if (launcher) {
      const chromium = launcher
      let browser: import('playwright-core').Browser | undefined

      stages.push(
        await timed('start the browser', async () => {
          browser = await chromium.launch({
            executablePath,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
            timeout: LAUNCH_TIMEOUT_MS,
          })
          return browser.version()
        }),
      )

      if (browser) {
        const open = browser

        stages.push(
          await timed('print a page in all three languages', async () => {
            const page = await open.newPage()
            try {
              await page.setContent(SAMPLE, { waitUntil: 'load' })
              await page.evaluate(() => document.fonts.ready)
              const pdf = await page.pdf({ format: 'A4', printBackground: true })
              pdfBytes = pdf.length
              return `${pdf.length} bytes`
            } finally {
              await page.close().catch(() => {})
            }
          }),
        )

        // The step that fails when everything else is healthy. Printing a real
        // confirmation means loading the booking pass over the public address,
        // and a container that cannot reach its own domain gets this far and
        // no further.
        stages.push(
          await timed('load this site over its public address', async () => {
            const page = await open.newPage()
            try {
              const res = await page.goto(homeUrl, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS })
              return `${homeUrl} → HTTP ${res?.status() ?? 'no response'}`
            } finally {
              await page.close().catch(() => {})
            }
          }),
        )

        await open.close().catch(() => {})
      }
    }
  }

  const failed = stages.find((s) => !s.ok)
  const verdict = !search.found
    ? 'No browser on this deployment, so confirmations go out with a link and no attachment. ' +
      'The build did not install chromium — check that nixpacks.toml is in the deployed commit ' +
      'and that the build log does not show it failing.'
    : failed
      ? `A browser is installed at ${search.found}, but "${failed.stage}" failed. The detail below is the reason.`
      : `Working. A ${pdfBytes}-byte PDF was produced here, so a booking made now should arrive with one attached.`

  return Response.json(
    {
      verdict,
      browser: search,
      stages,
      // Which commit is actually running. The usual cause of "the fix did not
      // work" is that the fix is not deployed, and this is the one line that
      // settles it without reading a build log.
      deployment: {
        commit: process.env.RAILWAY_GIT_COMMIT_SHA ?? '(unknown)',
        publicUrl: homeUrl,
        node: process.version,
      },
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}
