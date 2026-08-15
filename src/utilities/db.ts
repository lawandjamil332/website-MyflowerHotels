import type { Payload } from 'payload'

/**
 * The connection pool underneath Payload's Postgres adapter.
 *
 * A few things this site does are not worth expressing as Payload queries — a
 * single UPDATE that claims a guest's older bookings, an aggregate over the
 * reviews — and those reach for the pool directly. Two files had each written
 * out the same cast to get at it, both typing `query` as `Function`, which
 * accepts anything callable and returns `any`: no argument checking, and a
 * result whose `.rows` could be read as absolutely anything without complaint.
 *
 * Typed once here instead. `T` is whatever the caller says a row looks like,
 * which is still a promise the caller is making about their own SQL — but it
 * is now a promise made in one place, against a signature that at least checks
 * the shape of the call.
 */
export type DbPool = {
  query: <T = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>
}

export const dbPool = (payload: Payload): DbPool =>
  (payload.db as unknown as { pool: DbPool }).pool
