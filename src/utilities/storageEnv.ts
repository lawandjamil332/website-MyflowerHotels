/**
 * Finds the storage bucket's credentials whatever they happen to be called.
 *
 * Railway's "Add to Service" button injects the bucket's details into the
 * website automatically, which is far easier than copying five values across
 * by hand on a phone — but it names them its own way, and the names differ
 * between Railway's own bucket, S3, R2 and MinIO. Insisting on one spelling
 * turns a one-tap action into a transcription exercise, and a typo in a secret
 * key is invisible until an upload fails.
 *
 * So each value is looked up under every name it is plausibly given, in order
 * of preference. Anything set by hand as S3_* still wins.
 */
const first = (...names: string[]): string | undefined => {
  for (const name of names) {
    const value = process.env[name]
    if (value && value.trim()) return value.trim()
  }
  return undefined
}

export const storageEndpoint = (): string | undefined =>
  first(
    'S3_ENDPOINT',
    'BUCKET_ENDPOINT',
    'BUCKET_ENDPOINT_URL',
    'STORAGE_ENDPOINT',
    'AWS_ENDPOINT_URL_S3',
    'AWS_ENDPOINT_URL',
    'AWS_S3_ENDPOINT',
    'RAILWAY_BUCKET_ENDPOINT',
  )

export const storageBucket = (): string | undefined =>
  first(
    'S3_BUCKET',
    'BUCKET_NAME',
    'BUCKET',
    'STORAGE_BUCKET',
    // Railway's "AWS SDK (Generic)" style writes the bucket name here.
    'AWS_S3_BUCKET_NAME',
    'AWS_S3_BUCKET',
    'AWS_BUCKET_NAME',
    'AWS_BUCKET',
    'RAILWAY_BUCKET_NAME',
  )

export const storageAccessKeyId = (): string | undefined =>
  first(
    'S3_ACCESS_KEY_ID',
    'BUCKET_ACCESS_KEY_ID',
    'STORAGE_ACCESS_KEY_ID',
    'AWS_ACCESS_KEY_ID',
    'RAILWAY_BUCKET_ACCESS_KEY_ID',
  )

export const storageSecretKey = (): string | undefined =>
  first(
    'S3_SECRET_ACCESS_KEY',
    'BUCKET_SECRET_ACCESS_KEY',
    'BUCKET_SECRET_KEY',
    'STORAGE_SECRET_ACCESS_KEY',
    'AWS_SECRET_ACCESS_KEY',
    'RAILWAY_BUCKET_SECRET_ACCESS_KEY',
  )

export const storageRegion = (): string =>
  first(
    'S3_REGION',
    'BUCKET_REGION',
    'STORAGE_REGION',
    'AWS_DEFAULT_REGION',
    'AWS_REGION',
    'AWS_S3_REGION',
  ) || 'auto'

/** A bucket is only usable when all four parts are present. */
export const bucketConfigured = (): boolean =>
  Boolean(storageEndpoint() && storageBucket() && storageAccessKeyId() && storageSecretKey())

/** Which of the four are missing, for a message that says what to fix. */
export const missingBucketParts = (): string[] =>
  [
    !storageEndpoint() && 'endpoint URL',
    !storageBucket() && 'bucket name',
    !storageAccessKeyId() && 'access key ID',
    !storageSecretKey() && 'secret access key',
  ].filter(Boolean) as string[]
