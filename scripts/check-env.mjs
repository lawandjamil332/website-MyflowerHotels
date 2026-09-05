/**
 * Fails fast with a readable message when required environment variables are
 * missing or malformed, instead of a stack trace from inside node_modules.
 */

import { existsSync, readdirSync } from 'node:fs'

const problems = []

const secret = process.env.PAYLOAD_SECRET
if (!secret) {
  problems.push({
    name: 'PAYLOAD_SECRET',
    why: 'Signs login sessions. Any long random string; keep it the same once set, or everyone gets logged out.',
  })
}

const dbUrl = process.env.DATABASE_URI || process.env.DATABASE_URL

if (!dbUrl) {
  problems.push({
    name: 'DATABASE_URI (or DATABASE_URL)',
    why: 'The Postgres connection string, e.g. postgresql://user:password@host:5432/railway',
    hint: [
      'On Railway this is usually one of two things:',
      '  a) There is no Postgres database in the project yet.',
      '     Add one with + Create -> Database -> PostgreSQL.',
      '  b) A reference like ${{Postgres.DATABASE_URL}} did not resolve,',
      '     because the database service is named something else. Open the',
      '     Postgres service, copy the DATABASE_URL value it shows, and',
      '     paste that value in directly.',
    ],
  })
} else if (dbUrl.includes('${{') || dbUrl.includes('${')) {
  // Railway passes the reference through verbatim when it cannot resolve it.
  problems.push({
    name: 'DATABASE_URI (or DATABASE_URL)',
    why: `Still contains an unresolved reference: ${dbUrl}`,
    hint: [
      'The service name inside ${{ ... }} does not match any service in the',
      'project. Check the exact name of the database in the Railway sidebar,',
      'or open the Postgres service, copy its DATABASE_URL value, and paste',
      'that value in directly instead of a reference.',
    ],
  })
} else if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
  problems.push({
    name: 'DATABASE_URI (or DATABASE_URL)',
    why: `Does not look like a Postgres connection string: ${dbUrl.slice(0, 40)}...`,
    hint: ['It should begin with postgresql:// or postgres://'],
  })
}

// Where uploaded photographs are kept. This is a statement of fact at
// start-up, not a warning: there is nothing here that needs fixing either way.
//
// It used to warn that photographs would "vanish on the next redeploy" and
// tell the reader to go and create a bucket. That stopped being true the day
// uploads started going into Postgres, and the message was never updated — so
// the logs kept insisting a solved problem was unsolved. It also only looked
// for the four S3_* names, so attaching Railway's own bucket, which uses its
// own names, would not have silenced it.
//
// The name lists below mirror src/utilities/storageEnv.ts, which is the source
// of truth the application itself uses. This file is plain JavaScript and
// cannot import it; if a name is added there, add it here too.
const anyOf = (...names) => names.some((name) => process.env[name]?.trim())

const bucketConfigured =
  anyOf(
    'S3_ENDPOINT',
    'BUCKET_ENDPOINT',
    'BUCKET_ENDPOINT_URL',
    'STORAGE_ENDPOINT',
    'AWS_ENDPOINT_URL_S3',
    'AWS_ENDPOINT_URL',
    'AWS_S3_ENDPOINT',
    'RAILWAY_BUCKET_ENDPOINT',
  ) &&
  anyOf(
    'S3_BUCKET',
    'BUCKET_NAME',
    'BUCKET',
    'STORAGE_BUCKET',
    'AWS_S3_BUCKET_NAME',
    'AWS_S3_BUCKET',
    'AWS_BUCKET_NAME',
    'AWS_BUCKET',
    'RAILWAY_BUCKET_NAME',
  ) &&
  anyOf(
    'S3_ACCESS_KEY_ID',
    'BUCKET_ACCESS_KEY_ID',
    'STORAGE_ACCESS_KEY_ID',
    'AWS_ACCESS_KEY_ID',
    'RAILWAY_BUCKET_ACCESS_KEY_ID',
  ) &&
  anyOf(
    'S3_SECRET_ACCESS_KEY',
    'BUCKET_SECRET_ACCESS_KEY',
    'BUCKET_SECRET_KEY',
    'STORAGE_SECRET_ACCESS_KEY',
    'AWS_SECRET_ACCESS_KEY',
    'RAILWAY_BUCKET_SECRET_ACCESS_KEY',
  )

console.log(
  bucketConfigured
    ? '  Photo storage: storage bucket (uploads go to the bucket).\n'
    : [
        '  Photo storage: the database.',
        '',
        '  No storage bucket is configured, so uploaded photographs are stored',
        '  in Postgres, which keeps its own permanent volume. They survive a',
        '  redeploy. Nothing needs doing.',
        '',
        '  A bucket is optional: it would hand the serving of images off to the',
        '  storage service instead of this app. If one is ever attached, the',
        '  site switches to it on the next start with no code change.',
        '',
      ].join('\n'),
)

// Whether a booking can actually be posted, said out loud at start-up.
//
// This is the one thing about the site that could be entirely broken while
// every page worked perfectly, and until now nothing said so. Bookings are
// made, written to the database and shown in the admin panel whether or not a
// letter can leave the building; with no transport configured the site writes
// the booking into the log and carries on. So the owner saw a working site,
// took bookings, and received nothing — with no line anywhere telling him why.
//
// A statement of fact like the storage line above, not a warning: a site with
// no mail configured still runs, and saying "cannot start" over it would be a
// lie. The names mirror src/payload.config.ts, which chooses between them in
// the same order.
const mailGmailApi = anyOf('GMAIL_CLIENT_ID') && anyOf('GMAIL_CLIENT_SECRET') &&
  anyOf('GMAIL_REFRESH_TOKEN') && anyOf('GMAIL_FROM_ADDRESS')
const mailResend = anyOf('RESEND_API_KEY')
const mailSmtp = anyOf('SMTP_HOST') && anyOf('SMTP_USER') && anyOf('SMTP_PASS')

const smtpPort = process.env.SMTP_PORT?.trim() || '587'
const mailLines = mailGmailApi
  ? [`  Mail: the Gmail API, as ${process.env.GMAIL_FROM_ADDRESS}.`, '']
  : mailResend
    ? ['  Mail: Resend.', '']
    : mailSmtp
      ? [
          `  Mail: SMTP, ${process.env.SMTP_HOST} port ${smtpPort}, as ${process.env.SMTP_USER}.`,
          '',
          '  If bookings are made and no letter arrives, the likeliest cause is',
          '  the host blocking outbound SMTP rather than anything here. Open',
          '  /next/mail-check on the running site — it dials the port and says',
          '  whether it is reachable.',
          '',
        ]
      : [
          '  Mail: NOT CONFIGURED. Bookings will be taken and nobody told.',
          '',
          '  A guest can book, the booking is saved and appears in the admin',
          '  panel, and no letter goes to the guest or to reservations. The',
          '  booking is written into this log instead, which nobody reads.',
          '',
          '  To send through the reservations Gmail account, set these three:',
          '',
          '    SMTP_HOST = smtp.gmail.com',
          '    SMTP_USER = the Gmail address',
          '    SMTP_PASS = a Google app password, not the account password',
          '',
          '  An app password is made at myaccount.google.com > Security >',
          '  2-Step Verification > App passwords, and is sixteen letters.',
          '',
          '  Then open /next/mail-check on the running site: it says whether',
          '  the host lets SMTP out at all. Some do not, and if this one does',
          '  not, GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN/FROM_ADDRESS sends',
          '  through the same mailbox over HTTPS instead.',
          '',
        ]

console.log(mailLines.join('\n'))

// Whether the confirmation can be attached as a PDF, said out loud for the
// same reason as the block above: it is invisible from the outside. Both
// letters still go out without it, carrying the link they always did, so a
// deployment with no browser looks completely healthy right up until somebody
// notices that no attachment has ever arrived.
//
// The list and the order must match CANDIDATES and NAMES in
// src/utilities/bookingPdf.ts. They are written twice because this file is
// plain JavaScript run before the app exists and that one is TypeScript inside
// it, and two lists that are meant to agree will eventually not — so if you
// add an address to one, add it to the other. A boot line claiming no browser
// while the app happily prints is worse than no line at all.
const browserPath = (() => {
  const fixed = [
    process.env.PDF_BROWSER_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  ].filter(Boolean)
  for (const path of fixed) {
    if (existsSync(path)) return path
  }
  for (const dir of (process.env.PATH ?? '').split(':')) {
    if (!dir) continue
    for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
      if (existsSync(`${dir}/${name}`)) return `${dir}/${name}`
    }
  }
  // Last, one Playwright downloaded — .playwright is where
  // scripts/install-browser.mjs puts it during the build when the image
  // arrived without a browser of its own. Both spellings of the directory
  // inside are checked: older builds unpack to chrome-linux, current ones to
  // chrome-linux64.
  for (const dir of [process.env.PLAYWRIGHT_BROWSERS_PATH, '.playwright']) {
    if (!dir) continue
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      continue
    }
    for (const entry of entries) {
      for (const inside of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
        if (existsSync(`${dir}/${entry}/${inside}`)) return `${dir}/${entry}/${inside}`
      }
    }
  }
  return null
})()

console.log(
  browserPath
    ? [`  Confirmation PDF: yes, printed by ${browserPath}.`, ''].join('\n')
    : [
        '  Confirmation PDF: NO BROWSER. Confirmations go out with a link and',
        '  no attachment. Everything else about them is unaffected.',
        '',
        '  Two things try to provide one: nixpacks.toml asks the host to install',
        '  chromium, and failing that scripts/install-browser.mjs downloads one',
        '  during the build. Both have run by the time this prints, so if it',
        '  still says no, the build log will say which of them could not.',
        '',
        '  /next/pdf-check on the running site, signed in to the admin panel,',
        '  says exactly which step fails.',
        '',
      ].join('\n'),
)

// Whether visitors are being counted, on the same principle as the two blocks
// above: it is invisible from the outside, and the cost of it being off is
// paid silently in months of figures nobody can ever get back.
const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
console.log(
  ga
    ? [`  Visitors: counted, Google Analytics ${ga}.`, ''].join('\n')
    : [
        '  Visitors: NOT COUNTED. Nobody is measuring who visits the site.',
        '',
        '  Bookings are still recorded and the Analytics tab in the admin panel',
        '  still works — that measures what was sold, not who came. To count',
        '  visitors, set NEXT_PUBLIC_GA_MEASUREMENT_ID to the Google Analytics',
        '  measurement ID, which looks like G-XXXXXXXXXX.',
        '',
        '  Search Console needs nothing set: the site is already verified with',
        '  Google and shows the last 16 months at search.google.com/search-console.',
        '',
      ].join('\n'),
)

if (problems.length > 0) {
  const lines = [
    '',
    '  Cannot start: problem with the environment variables.',
    '',
    ...problems.flatMap(({ name, why, hint }) => [
      `  - ${name}`,
      `      ${why}`,
      ...(hint ? hint.map((h) => `      ${h}`) : []),
      '',
    ]),
    '  On Railway: open the service, go to Variables, fix them, then redeploy.',
    '  Locally: copy .env.example to .env and fill it in.',
    '',
  ]
  console.error(lines.join('\n'))
  process.exit(1)
}
