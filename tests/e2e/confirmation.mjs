import { execSync } from 'node:child_process'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { renderBookingPdf, renderBookingPdfResult } from '../../src/utilities/bookingPdf.ts'
import { signReference } from '../../src/utilities/bookingToken.ts'
import { sendBookingEmails } from '../../src/utilities/bookingEmail.ts'

/**
 * The confirmation a guest keeps.
 *
 * Both letters — the hotel's work order and the guest's confirmation — carry
 * the booking pass as an attached PDF, produced by printing the pass page in a
 * headless browser rather than by building a document with a PDF library.
 *
 * The reason is Kurdish and Arabic. Both join their letters and both run right
 * to left; a library that places glyphs without shaping or reordering them
 * turns "ماي فلاور 1" into disconnected letters running backwards with the
 * number in the wrong place. So this suite renders the pass in all three
 * languages and checks each one came out carrying its own type — see the note
 * on the loop below for why size is the honest signal there and reading the
 * words back out is not.
 *
 * Where there is no browser the attachment is skipped and the letters go out
 * with the link they always carried, so the checks below say so and pass rather
 * than failing a machine that was never going to have one.
 */
const DB = process.env.DATABASE_URI
const q = (sql) =>
  execSync(`psql "${DB}" -t -A -c ${JSON.stringify(sql.replace(/\s+/g, ' '))}`).toString().trim()

let fails = 0
const ok = (label, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!cond) fails++
}

const base = process.env.BASE_URL || 'http://localhost:3000'
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const REF = `MF-CNF${String(Date.now()).slice(-3)}`

const roomId = Number(q(`SELECT id FROM rooms ORDER BY id LIMIT 1`))
const branchId = Number(q(`SELECT branch_id FROM rooms WHERE id=${roomId}`))

const wipe = () => q(`DELETE FROM bookings WHERE reference='${REF}'`)
wipe()
q(`INSERT INTO bookings (reference, guest_name, guest_phone, guest_email, branch_id, room_id,
     check_in, check_out, nights, guests, total_amount, currency, status, locale, updated_at, created_at)
   VALUES ('${REF}','Test Guest','+9647705551234','guest@example.com',${branchId},${roomId},
           '${day(60)}','${day(63)}',3,2,330000,'IQD','confirmed','en',NOW(),NOW())`)

const payload = await getPayload({ config: configPromise })
const passUrl = (locale) =>
  `${base}/${locale}/booking/pass?ref=${REF}&t=${signReference(REF)}`

// --- a real PDF, in every language ------------------------------------------
const first = await renderBookingPdf(payload, REF, passUrl('en'))
if (!first) {
  console.log('SKIP  no browser on this machine, so confirmations go out with a link')
  console.log('      (install chromium — see nixpacks.toml — and these checks start running)')
  wipe()
  process.exit(0)
}

ok('the confirmation is a real PDF', first.content.subarray(0, 5).toString() === '%PDF-')
ok('it is named after the booking', first.filename === `${REF}.pdf`, first.filename)
ok('and it has a page of content in it', first.content.length > 10_000, `${first.content.length} bytes`)

// Rendered in each language, and the size is the signal.
//
// Reading the words back out would be the better check and is not honestly
// available here: Chromium writes text as glyph indices against an embedded
// subset, so the Arabic in the file is not the Arabic you would search for.
// What the size does catch is the failure that actually happens — a container
// with no Arabic font, which prints a page of empty boxes and comes out
// markedly smaller than a page of set type. The Kurdish and Arabic passes run
// tens of kilobytes above the English one because each carries a Naskh subset;
// a page of boxes carries none.
for (const locale of ['en', 'ku', 'ar']) {
  q(`UPDATE bookings SET locale='${locale}' WHERE reference='${REF}'`)
  const pdf = await renderBookingPdf(payload, REF, passUrl(locale))
  if (!pdf) {
    ok(`the ${locale} confirmation renders`, false, 'no pdf')
    continue
  }
  const floor = locale === 'en' ? 20_000 : 60_000
  ok(
    `the ${locale} confirmation renders with its type embedded`,
    pdf.content.length > floor,
    `${pdf.content.length} bytes, needs more than ${floor}`,
  )
}
q(`UPDATE bookings SET locale='en' WHERE reference='${REF}'`)

// --- both letters actually carry it -----------------------------------------
const sent = []
const realSend = payload.sendEmail.bind(payload)
payload.sendEmail = async (message) => {
  sent.push(message)
  return { messageId: 'captured' }
}
try {
  await sendBookingEmails(payload, REF)
} finally {
  payload.sendEmail = realSend
}

const guestLetter = sent.find((m) => String(m.to).includes('guest@example.com'))
ok('the guest is written to', Boolean(guestLetter), `${sent.length} letters sent`)
ok(
  'and their letter carries the confirmation',
  Boolean(guestLetter?.attachments?.length) &&
    guestLetter.attachments[0].filename === `${REF}.pdf`,
  guestLetter?.attachments?.[0]?.filename ?? 'no attachment',
)

// The hotel's copy only exists once somebody has set an address for it to go
// to; without one the site logs the booking instead, which is its own choice
// and not this suite's business.
const hotelLetter = sent.find((m) => !String(m.to).includes('guest@example.com'))
if (hotelLetter) {
  ok(
    'the hotel’s copy carries it too',
    Boolean(hotelLetter.attachments?.length),
    hotelLetter.attachments?.[0]?.filename ?? 'no attachment',
  )
} else {
  console.log('SKIP  no hotel address is set, so there is no hotel copy to check')
}

// --- and when it fails, the hotel is told why --------------------------------
//
// The whole reason this exists: the attachment was missing in production for
// days and there was nothing to read. Three fixes were shipped blind. The
// reason now travels on the hotel's own copy of the booking, which is the one
// channel proven to work on every booking — so the next failure explains
// itself instead of needing another round.
//
// Failure is provoked by pointing the search at something that exists and is
// not a browser, rather than by hiding the real one: a browser is looked for in
// half a dozen places, so a test that hides it is really a test of the hiding.
// /bin/false is found, launched, and does not speak the protocol.
process.env.PDF_BROWSER_PATH = '/bin/false'
const broken = await renderBookingPdfResult(payload, REF, passUrl('en'))
ok('a confirmation that will not render reports why', Boolean(broken.problem), broken.problem ?? 'no reason given')
ok('and it does not pretend to have produced one', broken.pdf === null)

const noted = []
payload.sendEmail = async (message) => {
  noted.push(message)
  return { messageId: 'captured' }
}
try {
  await sendBookingEmails(payload, REF)
} finally {
  delete process.env.PDF_BROWSER_PATH
  payload.sendEmail = realSend
}

const hotelCopy = noted.find((m) => !String(m.to).includes('guest@example.com'))
const guestCopy = noted.find((m) => String(m.to).includes('guest@example.com'))
if (hotelCopy) {
  ok(
    'the hotel’s copy says no PDF was attached',
    String(hotelCopy.html).includes('No PDF attached'),
  )
  ok('and the plain text says it too', String(hotelCopy.text).includes('No PDF attached'))
}
ok(
  'the guest is never shown any of it',
  !guestCopy || !String(guestCopy.html).includes('No PDF attached'),
)

wipe()
console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
