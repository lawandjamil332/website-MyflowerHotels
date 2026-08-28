import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Runs every end-to-end suite against a site that is already running, and
 * exits non-zero if any of them fails.
 *
 * These suites existed for weeks as loose files in a temporary folder, which
 * meant the site had no regression protection at all: the checks were rerun
 * only when somebody remembered, against whatever server happened to be up,
 * and they were lost whenever the folder was cleared. Several times that
 * folder was cleared. Kept here, they are part of the project.
 *
 *   npm run start          (in one terminal, with a database reachable)
 *   npm run test:e2e       (in another)
 *
 * BASE_URL overrides the address; DATABASE_URI and PAYLOAD_SECRET are read
 * from the environment, because the suites seed and clean up their own rows
 * rather than depending on whatever is in the database already.
 *
 * One thing to know: the booking form is rate limited per address, and a full
 * pass makes about a dozen bookings from one. Two passes inside ten minutes
 * trips that limit, and the failures look like missing rooms rather than the
 * guard doing its job.
 *
 * Restart the site between runs — the counters live in memory, so a restart
 * clears them. Do NOT raise BOOKING_ATTEMPTS_PER_WINDOW to get around it: the
 * throttle suite exists to prove the limit refuses a flood, so lifting the
 * limit makes that suite fail, and it fails saying "never refused" rather than
 * saying you lifted the limit. This was written down the wrong way round here
 * for a while and cost an afternoon.
 */
const here = dirname(fileURLToPath(import.meta.url))
const only = process.argv[2]
const tsx = join(here, '..', 'node_modules', '.bin', 'tsx')

const suites = readdirSync(join(here, 'e2e'))
  .filter((f) => f.endsWith('.mjs'))
  .filter((f) => !only || f.startsWith(only))
  .sort()

if (suites.length === 0) {
  console.error(only ? `No suite matching "${only}".` : 'No suites found.')
  process.exit(1)
}

const missing = ['DATABASE_URI', 'PAYLOAD_SECRET'].filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(`\nCannot run: ${missing.join(' and ')} not set.`)
  console.error('These suites read and write real rows, so they need the same')
  console.error('database the site is using. Source your .env first.\n')
  process.exit(1)
}

/**
 * Rooms first.
 *
 * Twelve of these suites need a bookable room and none of them makes one, so
 * on any database that has not had rooms typed into it by hand the whole run
 * died at the first `room.id`. Running the fixture here rather than inside
 * each suite keeps that fact in one place, and it does nothing unless the
 * rooms table is completely empty — see tests/fixture.mjs for why that guard
 * is drawn the way it is.
 */
try {
  execFileSync(tsx, [join(here, 'fixture.mjs')], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  })
} catch {
  console.error('\nCould not prepare rooms for the suites.')
  console.error('The booking suites will fail without them.\n')
}

const results = []
for (const file of suites) {
  const name = file.replace(/\.mjs$/, '')
  process.stdout.write(`\n─── ${name} ${'─'.repeat(Math.max(0, 60 - name.length))}\n`)
  try {
    // Run through tsx rather than node: most suites drive the site over HTTP
    // and need neither, but the ones that test a Payload hook have to import
    // the TypeScript config to get a Payload at all, and plain node cannot.
    //
    // NODE_ENV=production for the same reason the server sets it — Payload's
    // Postgres adapter tries to push the schema in development, which against
    // a database that migrations already own fails on the first query.
    execFileSync(tsx, [join(here, 'e2e', file)], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    })
    results.push({ name, ok: true })
  } catch {
    results.push({ name, ok: false })
  }
}

console.log('\n' + '='.repeat(64))
for (const r of results) console.log(`${r.ok ? 'pass' : 'FAIL'}  ${r.name}`)
const failed = results.filter((r) => !r.ok)
console.log(`${results.length - failed.length}/${results.length} suites passed`)
process.exit(failed.length > 0 ? 1 : 0)
