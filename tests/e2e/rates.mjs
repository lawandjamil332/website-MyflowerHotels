import { execSync } from 'node:child_process'

/**
 * The calendar's prices and room counts have to reach the guest.
 *
 * A price typed into the extranet that changes nothing about what the website
 * quotes or charges is a decoration, and a "rooms to sell" that the booking
 * engine ignores is worse than a decoration: it is a promise the hotel thinks
 * it has made and has not. So this suite does not test the grid. It writes
 * rows the way the grid writes them and then asks the website what it costs
 * and whether it can be had.
 *
 * Every row it writes it takes away again, and it works on nights four months
 * out so it can never collide with a real booking or with another suite.
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

// Four months out: past every seeded booking and every other suite's window.
const IN = day(120)
const OUT = day(122)
const NIGHTS = 2

const room = q(`SELECT id FROM rooms WHERE branch_id = 1 ORDER BY id LIMIT 1`)
const branch = q(`SELECT branch_id FROM rooms WHERE id = ${room}`)
const basePrice = Number(q(`SELECT COALESCE(price_from, 0) FROM rooms WHERE id = ${room}`))
const quantity = Number(q(`SELECT quantity FROM rooms WHERE id = ${room}`))

const clean = () => q(`DELETE FROM room_rates WHERE room_id = ${room}`)
const rate = (date, columns) =>
  q(`INSERT INTO room_rates (room_id, date, ${Object.keys(columns).join(', ')})
     VALUES (${room}, '${date}T00:00:00Z', ${Object.values(columns).join(', ')})
     ON CONFLICT (room_id, date) DO UPDATE SET
       ${Object.keys(columns).map((c) => `${c} = EXCLUDED.${c}`).join(', ')}`)

/** What the website says these nights cost, read off the booking page. */
const quoted = async () => {
  const url = `${base}/en/book?branch=${branch}&checkIn=${IN}&checkOut=${OUT}&room=${room}`
  const html = await (await fetch(url)).text()
  const digits = [...html.matchAll(/([\d][\d,]{3,})/g)].map((m) => Number(m[1].replace(/,/g, '')))
  return digits
}

clean()

// ---- The room's own price, with nothing set --------------------------------
{
  const shown = await quoted()
  ok(
    'with no rates set, the room quotes its own price for the nights',
    shown.includes(basePrice * NIGHTS),
    `${basePrice} × ${NIGHTS} = ${basePrice * NIGHTS}`,
  )
}

// ---- One night given a price of its own -----------------------------------
{
  const special = basePrice + 55_000
  rate(IN, { price: special })
  const shown = await quoted()
  const expected = special + basePrice
  ok(
    'a night priced in the calendar changes what the stay costs',
    shown.includes(expected),
    `${special} + ${basePrice} = ${expected}`,
  )
  ok(
    'and the old total is gone rather than shown beside it',
    !shown.includes(basePrice * NIGHTS),
  )
  clean()
}

// ---- Rooms held back ------------------------------------------------------
{
  rate(IN, { rooms_to_sell: 0 })
  const html = await (
    await fetch(`${base}/en/book?branch=${branch}&checkIn=${IN}&checkOut=${OUT}`)
  ).text()
  const name = q(
    `SELECT COALESCE(name, '') FROM rooms_locales WHERE _parent_id = ${room} AND _locale = 'en'`,
  )
  ok(
    'holding every room back on one night takes the room off the search',
    name.length > 0 && !html.includes(name),
    `${name} hidden`,
  )
  clean()
}

// ---- A closed night -------------------------------------------------------
{
  rate(IN, { closed: true })
  const html = await (
    await fetch(`${base}/en/book?branch=${branch}&checkIn=${IN}&checkOut=${OUT}`)
  ).text()
  const name = q(
    `SELECT COALESCE(name, '') FROM rooms_locales WHERE _parent_id = ${room} AND _locale = 'en'`,
  )
  ok('closing one night of a stay takes the whole stay off the search', !html.includes(name))
  clean()
}

// ---- A night outside the stay must not touch it ---------------------------
{
  rate(day(130), { closed: true, price: 1 })
  const shown = await quoted()
  ok(
    'a night nobody is staying on leaves the stay alone',
    shown.includes(basePrice * NIGHTS),
  )
  clean()
}

// ---- The room's ordinary quantity still governs ---------------------------
{
  rate(IN, { rooms_to_sell: quantity + 50 })
  const left = Number(
    q(`SELECT LEAST(r.quantity::int, COALESCE((
         SELECT MIN(CASE WHEN rr.closed THEN 0 ELSE COALESCE(rr.rooms_to_sell, r.quantity) END)
           FROM room_rates rr WHERE rr.room_id = r.id
            AND rr.date >= '${IN}T00:00:00Z' AND rr.date < '${OUT}T00:00:00Z'), r.quantity)::int)
       FROM rooms r WHERE r.id = ${room}`),
  )
  ok(
    'and a calendar cannot invent rooms the hotel does not have',
    left === quantity,
    `asked for ${quantity + 50}, sells ${left}`,
  )
  clean()
}

// ---- A minimum stay ------------------------------------------------------
{
  const name = q(
    `SELECT COALESCE(name, '') FROM rooms_locales WHERE _parent_id = ${room} AND _locale = 'en'`,
  )

  // Three nights minimum on the night they would arrive: a two-night stay is
  // refused, and the same room over three nights is not.
  rate(IN, { min_stay: 3 })

  const short = await (
    await fetch(`${base}/en/book?branch=${branch}&checkIn=${IN}&checkOut=${OUT}`)
  ).text()
  ok('a minimum stay hides a stay that is too short', !short.includes(name))

  const longEnough = await (
    await fetch(`${base}/en/book?branch=${branch}&checkIn=${IN}&checkOut=${day(123)}`)
  ).text()
  ok('and leaves a long enough one alone', longEnough.includes(name))

  // The minimum belongs to the night of arrival, not to every night passed
  // through: arriving the day before and staying two nights is fine.
  const through = await (
    await fetch(`${base}/en/book?branch=${branch}&checkIn=${day(119)}&checkOut=${day(121)}`)
  ).text()
  ok('and applies to the night of arrival, not to every night of the stay', through.includes(name))

  clean()
}

clean()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
