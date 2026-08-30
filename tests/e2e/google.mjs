import { execSync } from 'node:child_process'

/**
 * The Google feed must say what the website says.
 *
 * Google price-checks a feed against the page a guest lands on and removes a
 * property whose numbers disagree, so the dangerous failure here is not a
 * missing feed — it is a feed that quotes 100,000 for a night the site sells
 * at 180,000, or offers a room the site has closed. Both would be invisible
 * until Google suspended the listing.
 *
 * So this suite does not check that the XML parses. It sets a rate through the
 * same table the calendar writes, then reads the feed and the website and
 * insists they agree.
 *
 * It leaves the switch as it found it, and cleans up every row it writes.
 */

const DB = process.env.DATABASE_URI
const q = (sql) =>
  execSync(`psql "${DB}" -t -A -c ${JSON.stringify(sql.replace(/\s+/g, ' '))}`).toString().trim()

let fails = 0
const ok = (label, condition, detail = '') => {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!condition) fails++
}

const base = process.env.BASE_URL || 'http://localhost:3000'
const day = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

const NIGHT = day(40)

/**
 * A room that can actually be sold on the night this suite tests.
 *
 * It used to take the first room of the first hotel, which worked exactly
 * once. The booking and throttle suites leave their reservations behind, and
 * on the second run against the same database that room is sold out — so the
 * feed correctly answered NoVacancy and the price checks failed, saying the
 * feed had the wrong price when what it had was no price, rightly. A test that
 * fails on its second run is a test nobody trusts on its first.
 */
const room = q(`
  SELECT r.id FROM rooms r
    JOIN branches b ON b.id = r.branch_id
   WHERE b.status IS DISTINCT FROM 'openingSoon'
     AND r.quantity > 0
     AND r.price_from IS NOT NULL
     AND (SELECT COUNT(*) FROM bookings bk
           WHERE bk.room_id = r.id AND bk.status <> 'cancelled'
             AND bk.check_in <= '${NIGHT}' AND bk.check_out > '${NIGHT}') < r.quantity
   ORDER BY r.id LIMIT 1`)

if (!room) {
  console.error('No room is sellable on ' + NIGHT + '. Clear the test bookings and retry.')
  process.exit(1)
}

const branch = q(`SELECT branch_id FROM rooms WHERE id = ${room}`)
const basePrice = Number(q(`SELECT COALESCE(price_from, 0) FROM rooms WHERE id = ${room}`))
const was = q(`SELECT COALESCE(google_feed, false) FROM settings LIMIT 1`)

const clean = () => q(`DELETE FROM room_rates WHERE room_id = ${room}`)
const feed = () => q(`UPDATE settings SET google_feed = ${'true'}`)
const restore = () => q(`UPDATE settings SET google_feed = ${was === 't' ? 'true' : 'false'}`)

// ---- Off by default -------------------------------------------------------
{
  q(`UPDATE settings SET google_feed = false`)
  const hotels = await fetch(`${base}/google/hotels.xml`)
  ok('with the switch off the feed is not served at all', hotels.status === 404, `HTTP ${hotels.status}`)
}

feed()
clean()

// ---- The property list ----------------------------------------------------
{
  const xml = await (await fetch(`${base}/google/hotels.xml`)).text()
  ok('the property list is served once the switch is on', xml.includes('<listings>'))
  ok('it is in the shape Google reads', xml.includes('<datum>WGS84</datum>') && xml.includes('<country>IQ</country>'))

  const open = Number(q(`SELECT COUNT(*) FROM branches WHERE status IS DISTINCT FROM 'openingSoon' AND latitude IS NOT NULL`))
  const listed = (xml.match(/<listing>/g) || []).length
  ok('every open hotel with a pin is listed, and nothing else', listed === open, `${listed} of ${open}`)

  const soon = Number(q(`SELECT COUNT(*) FROM branches WHERE status = 'openingSoon'`))
  ok('a hotel that has not opened is left out', soon === 0 || !xml.includes(`<id>${q(`SELECT id FROM branches WHERE status = 'openingSoon' LIMIT 1`)}</id>`))
}

// ---- The price Google is told is the price the site charges ---------------
{
  const special = basePrice + 80_000
  q(`INSERT INTO room_rates (room_id, date, price) VALUES (${room}, '${NIGHT}T00:00:00Z', ${special})
     ON CONFLICT (room_id, date) DO UPDATE SET price = EXCLUDED.price`)

  const xml = await (await fetch(`${base}/google/rates.xml`)).text()
  const block = xml.split('<Result>').find((part) => part.includes(`<Checkin>${NIGHT}</Checkin>`) && part.includes(`<RoomID>${room}</RoomID>`))

  ok('the feed carries that night for that room', Boolean(block), NIGHT)
  ok('and quotes the price the calendar set, not the room default',
    Boolean(block && block.includes(`>${special}<`)),
    `expected ${special}`)
  ok('and does not still carry the old price', !(block || '').includes(`>${basePrice}<`))

  // The website, asked the same question, must agree.
  const page = await (await fetch(`${base}/en/book?branch=${branch}&checkIn=${NIGHT}&checkOut=${day(41)}&room=${room}`)).text()
  const shown = [...page.matchAll(/([\d][\d,]{3,})/g)].map((m) => Number(m[1].replace(/,/g, '')))
  ok('and the website quotes the same number to a guest', shown.includes(special), `page shows ${special}`)

  clean()
}

// ---- A closed night is refused, not quoted --------------------------------
{
  q(`INSERT INTO room_rates (room_id, date, closed) VALUES (${room}, '${NIGHT}T00:00:00Z', true)
     ON CONFLICT (room_id, date) DO UPDATE SET closed = true`)

  const xml = await (await fetch(`${base}/google/rates.xml`)).text()
  const block = xml.split('<Result>').find((part) => part.includes(`<Checkin>${NIGHT}</Checkin>`) && part.includes(`<RoomID>${room}</RoomID>`))

  ok('a night closed in the calendar goes to Google as unavailable',
    Boolean(block && block.includes('<NoVacancy/>')))
  ok('and carries no price at all', !(block || '').includes('<Baserate'))
  clean()
}

// ---- Rooms held back to nothing are unavailable too -----------------------
{
  q(`INSERT INTO room_rates (room_id, date, rooms_to_sell) VALUES (${room}, '${NIGHT}T00:00:00Z', 0)
     ON CONFLICT (room_id, date) DO UPDATE SET rooms_to_sell = 0`)

  const xml = await (await fetch(`${base}/google/rates.xml`)).text()
  const block = xml.split('<Result>').find((part) => part.includes(`<Checkin>${NIGHT}</Checkin>`) && part.includes(`<RoomID>${room}</RoomID>`))
  ok('holding every room back reads as unavailable, not as a price',
    Boolean(block && block.includes('<NoVacancy/>')))
  clean()
}

// ---- Every night in the window is answered one way or the other -----------
{
  const xml = await (await fetch(`${base}/google/rates.xml?days=7`)).text()
  const rooms = Number(q(
    `SELECT COUNT(*) FROM rooms r JOIN branches b ON b.id = r.branch_id
      WHERE b.status IS DISTINCT FROM 'openingSoon'`,
  ))
  const results = (xml.match(/<Result>/g) || []).length
  ok('every room has an answer for every night, with no gaps',
    results === rooms * 7, `${results} results for ${rooms} rooms × 7 nights`)
  ok('and each is either a price or a refusal',
    results === (xml.match(/<Baserate/g) || []).length + (xml.match(/<NoVacancy\/>/g) || []).length)
}

clean()
restore()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
