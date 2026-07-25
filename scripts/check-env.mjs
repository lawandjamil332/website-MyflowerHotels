/**
 * Fails fast with a readable message when required environment variables are
 * missing or malformed, instead of a stack trace from inside node_modules.
 */

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

// Not fatal: the site runs perfectly well without a bucket. Photographs just
// silently disappear on the next rebuild, which is far worse than a loud
// warning here at start-up.
const bucketVars = ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET']
const missingBucket = bucketVars.filter((name) => !process.env[name])

if (missingBucket.length > 0) {
  console.warn(
    [
      '',
      '  WARNING: photo storage is not connected.',
      '',
      `  Missing: ${missingBucket.join(', ')}`,
      '',
      '  Photos uploaded in the admin panel will be written to this',
      "  container's disk, and Railway erases that on every redeploy —",
      '  so the pictures will vanish and the site will show empty frames.',
      '',
      '  Fix: Railway -> + Create -> Storage Bucket, then copy its four',
      '  values into this service\'s Variables and redeploy.',
      '',
    ].join('\n'),
  )
}

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
