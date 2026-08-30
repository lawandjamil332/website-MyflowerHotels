import { createServer } from 'node:http'
import { execSync } from 'node:child_process'

/**
 * A price typed into the calendar has to reach Google in the same minute.
 *
 * The feed at /google/rates.xml was always built from the live calendar, so
 * there was never a second price list to keep — but a document you serve is
 * collected when Google decides to, and the whole value of setting Friday to
 * 180,000 at nine is that Friday costs 180,000 from nine. So every write now
 * pushes the nights it touched.
 *
 * This suite stands a small HTTP server in Google's place and reads what
 * actually arrives. Not that a function was called — what was in the envelope,
 * and whether the number in it is the number the calendar holds.
 *
 * It runs in process rather than over HTTP, because the credentials are read
 * from the environment at the moment of sending and a test cannot reach into
 * the running site's environment to set them.
 */

const DB = process.env.DATABASE_URI
const q = (sql) =>
  execSync(`psql "${DB}" -t -A -c ${JSON.stringify(sql.replace(/\s+/g, ' '))}`).toString().trim()

let fails = 0
const ok = (label, condition, detail = '') => {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!condition) fails++
}

// ---- Something to push at ------------------------------------------------
const received = []
const google = createServer((req, res) => {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    received.push({ auth: req.headers.authorization ?? '', body })
    res.writeHead(200, { 'Content-Type': 'application/xml' })
    res.end('<Transaction/>')
  })
})
await new Promise((resolve) => google.listen(0, '127.0.0.1', resolve))
const port = google.address().port

process.env.GOOGLE_ARI_ENDPOINT = `http://127.0.0.1:${port}/ari`
process.env.GOOGLE_ARI_USERNAME = 'myflower'
process.env.GOOGLE_ARI_PASSWORD = 'secret'

const { getPayload } = await import('payload')
const configPromise = (await import('@payload-config')).default
const { pushNights } = await import('@/utilities/googlePush')

const payload = await getPayload({ config: configPromise })

// Sellable on the night below, for the reason written out in google.mjs: a
// room the booking suites have filled answers NoVacancy, not a price.
const room = Number(q(`
  SELECT r.id FROM rooms r
    JOIN branches b ON b.id = r.branch_id
   WHERE b.status IS DISTINCT FROM 'openingSoon'
     AND r.quantity > 0
     AND r.price_from IS NOT NULL
     AND (SELECT COUNT(*) FROM bookings bk
           WHERE bk.room_id = r.id AND bk.status <> 'cancelled'
             AND bk.check_in <= '${new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10)}'
             AND bk.check_out > '${new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10)}') < r.quantity
   ORDER BY r.id LIMIT 1`))
const basePrice = Number(q(`SELECT COALESCE(price_from, 0) FROM rooms WHERE id = ${room}`))
const was = q(`SELECT COALESCE(google_feed, false) FROM settings LIMIT 1`)

const day = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
const NIGHT = day(45)
const PAST = day(-10)

const clean = () => q(`DELETE FROM room_rates WHERE room_id = ${room}`)
const restore = () => q(`UPDATE settings SET google_feed = ${was === 't' ? 'true' : 'false'}`)
const rate = (date, price) =>
  q(`INSERT INTO room_rates (room_id, date, price) VALUES (${room}, '${date}T00:00:00Z', ${price})
     ON CONFLICT (room_id, date) DO UPDATE SET price = EXCLUDED.price`)

clean()

// ---- Nothing is sent while the switch is off -----------------------------
{
  q(`UPDATE settings SET google_feed = false`)
  received.length = 0
  rate(NIGHT, basePrice + 90_000)
  await pushNights(payload, [{ date: NIGHT, roomId: room }])
  ok('with the switch off, Google is told nothing at all', received.length === 0)
}

q(`UPDATE settings SET google_feed = true`)

// ---- The price typed is the price sent -----------------------------------
{
  const special = basePrice + 90_000
  received.length = 0
  rate(NIGHT, special)
  await pushNights(payload, [{ date: NIGHT, roomId: room }])

  ok('one edited night sends one message', received.length === 1, `${received.length} sent`)
  const sent = received[0]?.body ?? ''
  ok('carrying that night', sent.includes(`<Checkin>${NIGHT}</Checkin>`))
  ok('and that room', sent.includes(`<RoomID>${room}</RoomID>`))
  ok('and the price the calendar holds', sent.includes(`>${special}<`), `expected ${special}`)
  ok('and only that one night', (sent.match(/<Result>/g) || []).length === 1)
  ok('signed with the Hotel Center credentials', received[0]?.auth.startsWith('Basic '))
}

// ---- Closing a night sends a refusal, not a price ------------------------
{
  received.length = 0
  q(`UPDATE room_rates SET closed = true WHERE room_id = ${room} AND date = '${NIGHT}T00:00:00Z'`)
  await pushNights(payload, [{ date: NIGHT, roomId: room }])
  const sent = received[0]?.body ?? ''
  ok('a closed night is sent as unavailable', sent.includes('<NoVacancy/>'))
  ok('with no price attached', !sent.includes('<Baserate'))
  clean()
}

// ---- Yesterday is not Google's business ----------------------------------
{
  received.length = 0
  rate(PAST, basePrice + 10_000)
  await pushNights(payload, [{ date: PAST, roomId: room }])
  ok('a night that has already passed is not sent', received.length === 0)
  clean()
}

// ---- A dead endpoint must not break anything -----------------------------
{
  const good = process.env.GOOGLE_ARI_ENDPOINT
  process.env.GOOGLE_ARI_ENDPOINT = 'http://127.0.0.1:1/nothing-here'
  received.length = 0
  rate(NIGHT, basePrice + 5_000)

  let threw = false
  try {
    await pushNights(payload, [{ date: NIGHT, roomId: room }])
  } catch {
    threw = true
  }
  ok('Google being unreachable does not throw at the caller', !threw)
  ok(
    'and the price is still in the calendar regardless',
    Number(q(`SELECT price FROM room_rates WHERE room_id = ${room} AND date = '${NIGHT}T00:00:00Z'`)) ===
      basePrice + 5_000,
  )
  process.env.GOOGLE_ARI_ENDPOINT = good
  clean()
}

clean()
restore()
google.close()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
