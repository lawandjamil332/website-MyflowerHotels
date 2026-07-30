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
