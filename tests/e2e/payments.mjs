import { createHmac } from 'node:crypto'
import { execSync } from 'node:child_process'

/**
 * The card-payment connection, checked without a card.
 *
 * This is the one piece of the site that moves money, and until this file
 * existed it was the only piece with no regression test at all — reviewed
 * twice, fixed sixteen times, and proven each time by hand against a throwaway
 * script. Every one of those fixes could have been quietly undone by the next
 * edit and nothing would have said so.
 *
 * WHAT IT CAN AND CANNOT PROVE. It never talks to a real processor, because
 * there is not one yet. What it pins down is the half that is ours: that a
 * forged callback is refused, that a real one is believed exactly once, that a
 * payment still in flight is never written down as a failure, that money is
 * never invented or lost in the conversion, and that the site refuses to charge
 * dinars until somebody has asked the processor which unit they want. Those are
 * the rules that cost real money when they break.
 *
 * It drives the adapter directly rather than through a browser. The browser
 * half — button shown, button hidden, page after paying — is covered by the
 * audit suite loading those pages, and a fake gateway in a test would only be
 * checking that this file's own assumptions match themselves.
 */

const DB = process.env.DATABASE_URI
const SECRET = 'payments-suite-secret'

let failed = 0
const ok = (label, pass, note = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${note ? `  — ${note}` : ''}`)
  if (!pass) failed += 1
}

const sql = (q) =>
  execSync(`psql "${DB}" -t -A -c ${JSON.stringify(q)}`, { encoding: 'utf8' }).trim()

// The adapter reads its configuration from the environment every call, so the
// suite can set it up here without a server restart.
process.env.PAYMENT_API_URL = 'http://127.0.0.1:1/never-called'
process.env.PAYMENT_API_KEY = 'suite-key'
process.env.PAYMENT_WEBHOOK_SECRET = SECRET
delete process.env.PAYMENT_SIGNATURE_ENCODING
delete process.env.PAYMENT_PAID_STATUSES
delete process.env.PAYMENT_FAILED_STATUSES

const { gatewayProvider } = await import('../../src/payments/providers/gateway.ts')
const money = await import('../../src/payments/money.ts')

const sign = (body, enc = 'hex') => createHmac('sha256', SECRET).update(body, 'utf8').digest(enc)
const call = (body, { enc = 'hex', ct = 'application/json', sig } = {}) =>
  gatewayProvider.verifyCallback(
    new Headers({ 'content-type': ct, 'x-signature': sig ?? sign(body, enc) }),
    body,
  )

const json = (o) => JSON.stringify(o)

// ---------------------------------------------------------------------------
// Nothing unsigned is ever believed.
// ---------------------------------------------------------------------------
const paidBody = json({ order_id: 'MF-TEST01', status: 'paid', transaction_id: 'T1', amount: 1000, currency: 'IQD' })

ok('a callback with no signature is refused', !(await call(paidBody, { sig: '' })).ok)
ok('a callback with a wrong signature is refused', !(await call(paidBody, { sig: 'ff'.repeat(32) })).ok)

// The body is signed, not the fields — changing one byte must break it.
const tampered = paidBody.replace('MF-TEST01', 'MF-OTHER1')
ok(
  'a body altered after signing is refused',
  !(await call(tampered, { sig: sign(paidBody) })).ok,
  'signature is over the exact bytes',
)

// ---------------------------------------------------------------------------
// The shapes real processors actually send.
// ---------------------------------------------------------------------------
const hex = await call(paidBody)
ok('JSON with a hex signature is read', hex.ok && hex.paid && hex.reference === 'MF-TEST01')

const b64 = await call(paidBody, { enc: 'base64' })
ok('JSON with a base64 signature is read', b64.ok && b64.paid, 'processors are split between the two')

const formBody = 'order_id=MF-TEST02&status=success&transaction_id=T2&amount=1000&currency=IQD'
const form = await call(formBody, { ct: 'application/x-www-form-urlencoded' })
ok('a form-encoded callback is read', form.ok && form.paid && form.reference === 'MF-TEST02')

// Content types are routinely wrong in both directions.
const formUnderJson = await call(formBody, { ct: 'application/json' })
ok('a form body sent as JSON is still read', formUnderJson.ok && formUnderJson.paid)
const jsonUnderForm = await call(paidBody, { ct: 'application/x-www-form-urlencoded' })
ok('a JSON body sent as a form is still read', jsonUnderForm.ok && jsonUnderForm.paid)

// A status code rather than a word, which plenty of processors send.
const numeric = json({ order_id: 'MF-TEST03', status: 1, amount: 1000, currency: 'IQD' })
const num = await call(numeric)
ok('a numeric status is read rather than dropped', num.ok && num.rawStatus === '1')

// ---------------------------------------------------------------------------
// Three outcomes, not two. This is the one that double-charges a guest.
// ---------------------------------------------------------------------------
const authorized = await call(json({ order_id: 'MF-TEST04', status: 'authorized' }))
ok(
  'a payment still in flight is not paid',
  authorized.ok && !authorized.paid,
  'authorized is not captured',
)
ok(
  'and is not reported as settled either',
  authorized.ok && !authorized.settled,
  'settled=false is what stops it being written down as failed',
)

const declined = await call(json({ order_id: 'MF-TEST05', status: 'declined' }))
ok('a real refusal is settled', declined.ok && !declined.paid && declined.settled)

const unknown = await call(json({ order_id: 'MF-TEST06', status: 'quantum_flux' }))
ok(
  'a word nobody recognises is held, not failed',
  unknown.ok && !unknown.paid && !unknown.settled,
  'the safe reading: a guest told "failed" pays twice',
)

// ---------------------------------------------------------------------------
// Money. The part that cannot be allowed to be approximately right.
// ---------------------------------------------------------------------------
delete process.env.PAYMENT_CURRENCY_EXPONENT_IQD
ok(
  'dinars are refused until the processor has been asked',
  money.toMinorUnits(250000, 'IQD').ok === false,
  'guessing this wrong charges a thousand times too much',
)

process.env.PAYMENT_CURRENCY_EXPONENT_IQD = '0'
const iqd = money.toMinorUnits(250000, 'IQD')
ok('once answered, 250,000 IQD is sent as 250000', iqd.ok && iqd.minor === 250000)

process.env.PAYMENT_CURRENCY_EXPONENT_IQD = '3'
const fils = money.toMinorUnits(250000, 'IQD')
ok('and as 250000000 if they answer the other way', fils.ok && fils.minor === 250000000)
process.env.PAYMENT_CURRENCY_EXPONENT_IQD = '0'

const usd = money.toMinorUnits(80, 'USD')
ok('dollars need no answer — 80 is 8000 cents', usd.ok && usd.minor === 8000)

// A deposit has to land on a whole unit, because that is what the page shows.
for (const [total, pct, cur, expect] of [
  [80, 33, 'USD', 27],
  [200000, 30, 'IQD', 60000],
  [250000, 33, 'IQD', 82500],
]) {
  const charge = money.amountToCharge(total, pct, cur)
  ok(
    `a ${pct}% deposit of ${total} ${cur} is a whole ${charge}`,
    charge === expect && Number.isInteger(charge),
    'what the guest is shown must be what the card is charged',
  )
}

ok('no deposit set means the whole stay', money.amountToCharge(200000, 0, 'IQD') === 200000)
ok('and so does 100%', money.amountToCharge(200000, 100, 'IQD') === 200000)

// ---------------------------------------------------------------------------
// The database guard that stops one payment being recorded twice.
// ---------------------------------------------------------------------------
if (DB) {
  // Single line: the query is passed through a shell, and an embedded newline
  // reaches psql as a literal \n, which it reads as a broken meta-command.
  const idx = sql(
    "select indexdef from pg_indexes where tablename = 'bookings' and indexname = 'bookings_payment_reference_idx'",
  )
  ok(
    'one gateway transaction can only be recorded once',
    idx.includes('UNIQUE') && idx.includes('payment_reference'),
    'gateways retry; the index is what makes that safe',
  )

  const cols = sql(
    "select string_agg(column_name, ',' order by column_name) from information_schema.columns where table_name = 'bookings' and column_name like 'payment%'",
  )
  ok(
    'the booking carries what support needs to trace a charge',
    ['payment_amount', 'payment_currency', 'payment_provider', 'payment_reference', 'payment_status'].every(
      (c) => cols.includes(c),
    ),
    cols,
  )
}

console.log(`\n${failed} failed`)
process.exit(failed ? 1 : 0)
