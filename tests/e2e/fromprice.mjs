import { execSync } from 'node:child_process'

/**
 * The price a guest is shown before picking dates has to come from the
 * calendar.
 *
 * It did not. Every "from" price on the site — room cards, the room page, the
 * cheapest-room line on the hotels index, and the price published in the
 * structured data Google reads — came from the room's own `Price from` field,
 * and the calendar was consulted only once dates were chosen. So the owner
 * could raise every night of a season and watch the site go on advertising the
 * old figure, while charging the new one at checkout.
 *
 * That is the exact mismatch the free booking links programme removes hotels
 * for, and nothing failed while it was wrong, which is why this suite exists.
 *
 * "From" means the cheapest night actually bookable in the next ninety days.
 * The third check below is the one that looks like a bug and is not: raising a
 * single Friday must NOT move the from-price, because the other nights are
 * still available at the old rate and quoting the Friday would be a lie.
 *
 * Every row it writes is deleted again, whatever happens.
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

const room = Number(q(`SELECT id FROM rooms WHERE price_from IS NOT NULL ORDER BY id LIMIT 1`))
const slug = q(`SELECT slug FROM rooms WHERE id = ${room}`)
const basePrice = Number(q(`SELECT price_from::int FROM rooms WHERE id = ${room}`))

const clean = () => q(`DELETE FROM room_rates WHERE room_id = ${room}`)
const fillWindow = (price, extra = '') =>
  q(`INSERT INTO room_rates (room_id, date, price ${extra ? ', ' + extra.split('=')[0] : ''})
     SELECT ${room}, CURRENT_DATE + g, ${price} ${extra ? ', ' + extra.split('=')[1] : ''}
       FROM generate_series(0, 89) g`)

/** Every price printed on the room's own page. */
const shown = async () => {
  const html = await (await fetch(`${base}/en/rooms/${slug}`)).text()
  return {
    text: [...html.matchAll(/([\d][\d,]{4,})/g)].map((m) => Number(m[1].replace(/,/g, ''))),
    schema: [...html.matchAll(/"price":(\d+)/g)].map((m) => Number(m[1])),
  }
}

try {
  // ---- Nothing in the calendar: the room's own rate stands ----------------
  {
    clean()
    const { text } = await shown()
    ok('with an empty calendar the room quotes its standing rate',
      text.includes(basePrice), `expected ${basePrice}`)
  }

  // ---- A season repriced: the site follows -------------------------------
  {
    clean()
    const raised = basePrice + 455_000
    fillWindow(raised)
    const { text, schema } = await shown()
    ok('pricing every night moves the advertised price', text.includes(raised), `expected ${raised}`)
    ok('and the old standing rate is no longer quoted', !text.includes(basePrice))
    ok('and the structured data Google reads agrees', schema.includes(raised),
      `schema says ${schema.join(', ') || 'nothing'}`)
  }

  // ---- One night repriced: the floor has not moved -----------------------
  {
    clean()
    q(`INSERT INTO room_rates (room_id, date, price)
       VALUES (${room}, CURRENT_DATE + 30, ${basePrice + 677_000})`)
    const { text } = await shown()
    ok('raising one night does NOT move the from-price', text.includes(basePrice),
      'the other nights are still sellable at the standing rate')
    ok('and the raised night is not advertised as the price',
      !text.includes(basePrice + 677_000))
  }

  // ---- A night the calendar closed is not an offer ------------------------
  {
    clean()
    // Cheap, but closed: it must not become the price the site advertises.
    fillWindow(1000, 'closed=true')
    const { text } = await shown()
    ok('a closed night never becomes the advertised price', !text.includes(1000))
    ok('and the room falls back to its standing rate', text.includes(basePrice))
  }

  // ---- Held back to nothing is the same thing -----------------------------
  {
    clean()
    fillWindow(2000, 'rooms_to_sell=0')
    const { text } = await shown()
    ok('nor does a night with no rooms left to sell', !text.includes(2000))
  }
} finally {
  clean()
}

console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
