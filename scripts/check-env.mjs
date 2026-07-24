/**
 * Fails fast with a readable message when required environment variables are
 * missing, instead of Payload's "missing secret key" stack trace.
 */

const problems = []

if (!process.env.PAYLOAD_SECRET) {
  problems.push({
    name: 'PAYLOAD_SECRET',
    why: 'Signs login sessions. Any long random string; keep it the same once set, or everyone gets logged out.',
  })
}

if (!process.env.DATABASE_URI && !process.env.DATABASE_URL) {
  problems.push({
    name: 'DATABASE_URI (or DATABASE_URL)',
    why: "The Postgres connection string. On Railway, reference the Postgres service's variable.",
  })
}

if (problems.length > 0) {
  const lines = [
    '',
    '  Cannot start: required environment variables are missing.',
    '',
    ...problems.flatMap(({ name, why }) => [`  - ${name}`, `      ${why}`, '']),
    '  On Railway: open the service, go to Variables, add them, then redeploy.',
    '  Locally: copy .env.example to .env and fill it in.',
    '',
  ]
  console.error(lines.join('\n'))
  process.exit(1)
}
