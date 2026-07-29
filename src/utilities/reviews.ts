import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

export type Review = {
  id: number
  guestName: string
  rating: number
  comment: string | null
  verified: boolean
  branchId: number | null
  stayedOn: string | null
  createdAt: string
}

export type Rating = { average: number; count: number }

const pool = (payload: Payload) => (payload.db as unknown as { pool: { query: Function } }).pool

/**
 * Approved reviews, newest first.
 *
 * `approved` is in the WHERE clause of everything in this file rather than in
 * the callers. A component that forgets it would put an unread review under the
 * hotel's name, and there is no version of that which is only a little wrong.
 */
export const getReviews = async (branchId?: number, limit = 12): Promise<Review[]> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { rows } = await pool(payload).query(
      `SELECT id, guest_name, rating::float AS rating, comment, verified,
              branch_id, stayed_on, created_at
         FROM reviews
        WHERE approved IS TRUE ${branchId ? 'AND branch_id = $2' : ''}
        ORDER BY created_at DESC
        LIMIT $1`,
      branchId ? [limit, branchId] : [limit],
    )
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as number,
      guestName: (r.guest_name as string) ?? '',
      rating: Math.round(r.rating as number),
      comment: (r.comment as string) || null,
      verified: Boolean(r.verified),
      branchId: (r.branch_id as number) ?? null,
      stayedOn: r.stayed_on ? String(r.stayed_on) : null,
      createdAt: String(r.created_at ?? ''),
    }))
  } catch {
    // A review section that cannot load must not take the hotel page with it.
    return []
  }
}

/**
 * The average and the count, for one hotel or for the group.
 *
 * Computed from the same rows the page prints, every time, rather than stored
 * on the branch and updated by a hook. A stored average drifts the first time a
 * review is deleted straight from the database, and the number it drifts into
 * is the one Google shows beside the hotel's name — which is the one number on
 * this site that has to be defensible.
 */
export const getRating = async (branchId?: number): Promise<Rating> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { rows } = await pool(payload).query(
      `SELECT COALESCE(AVG(rating), 0)::float AS average, COUNT(*)::int AS count
         FROM reviews
        WHERE approved IS TRUE ${branchId ? 'AND branch_id = $1' : ''}`,
      branchId ? [branchId] : [],
    )
    const row = rows[0] ?? {}
    return {
      // One decimal. "4.6" is a rating; "4.5999999" is a bug report.
      average: Math.round(((row.average as number) ?? 0) * 10) / 10,
      count: (row.count as number) ?? 0,
    }
  } catch {
    return { average: 0, count: 0 }
  }
}

/** Every hotel's rating at once, so a list of four costs one query, not four. */
export const getRatingsByBranch = async (): Promise<Record<number, Rating>> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const { rows } = await pool(payload).query(
      `SELECT branch_id, COALESCE(AVG(rating), 0)::float AS average, COUNT(*)::int AS count
         FROM reviews
        WHERE approved IS TRUE AND branch_id IS NOT NULL
        GROUP BY branch_id`,
    )
    return Object.fromEntries(
      rows.map((r: Record<string, unknown>) => [
        r.branch_id as number,
        {
          average: Math.round(((r.average as number) ?? 0) * 10) / 10,
          count: (r.count as number) ?? 0,
        },
      ]),
    )
  } catch {
    return {}
  }
}
