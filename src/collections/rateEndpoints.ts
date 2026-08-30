import type { Endpoint, PayloadRequest } from 'payload'

import { dbPool } from '../utilities/db'

/**
 * Writing to the calendar.
 *
 * Two endpoints, because a hotel edits rates two ways and only two. One night
 * of one room, typed into a cell — which is what the extranet's grid does when
 * you click a price. And a range: "every Friday and Saturday in September,
 * 180,000" — which is what its Bulk edit does, and which is the only reason
 * anybody would use a calendar rather than a spreadsheet.
 *
 * They are collection endpoints rather than route handlers so that Payload has
 * already resolved the session by the time they run: `req.user` is the logged
 * in member of staff or nothing, and nothing is refused. A route of my own
 * under /api would have needed that written again, and written again is
 * written differently.
 *
 * Both upsert against the unique index on (room_id, date), so editing the 14th
 * twice replaces it rather than adding a second answer, and two people editing
 * September at the same time cannot leave the room with two prices.
 *
 * A field left out of the body is left alone. A field sent as null is cleared,
 * which is how a night goes back to costing the room's ordinary price — and
 * why "clear" has to be sayable at all rather than being the absence of a
 * value.
 */

/** Midnight UTC of a yyyy-mm-dd. A night is a calendar day, everywhere. */
const night = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

const positive = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : undefined
}

const refuse = (message: string, status = 400) =>
  Response.json({ errors: [{ message }] }, { status })

/** The panel is the only caller, and only staff reach the panel. */
const staffOnly = (req: PayloadRequest) => (req.user ? null : refuse('Not allowed', 403))

type Edit = {
  price?: number | null
  roomsToSell?: number | null
  minStay?: number | null
  closed?: boolean
}

const readEdit = (body: Record<string, unknown>): Edit | string => {
  const edit: Edit = {}

  if ('price' in body) {
    const price = positive(body.price)
    if (price === undefined) return 'That price is not a number'
    edit.price = price
  }
  if ('roomsToSell' in body) {
    const rooms = positive(body.roomsToSell)
    if (rooms === undefined) return 'That number of rooms is not a number'
    edit.roomsToSell = rooms
  }
  if ('minStay' in body) {
    const minStay = positive(body.minStay)
    if (minStay === undefined) return 'That minimum stay is not a number'
    edit.minStay = minStay === 0 ? null : minStay
  }
  if ('closed' in body) {
    if (typeof body.closed !== 'boolean') return 'Open or closed, nothing else'
    edit.closed = body.closed
  }

  return Object.keys(edit).length === 0 ? 'Nothing to change' : edit
}

/**
 * One upsert per room per night.
 *
 * COALESCE on the excluded row keeps a column that was not sent — so setting a
 * price does not wipe the rooms-to-sell somebody set last week. `closed` has
 * no "leave alone" value of its own, so it carries the old row's value when it
 * was not sent, which is what the CASE is doing.
 */
const write = async (
  req: PayloadRequest,
  roomIds: number[],
  dates: Date[],
  edit: Edit,
): Promise<number> => {
  if (roomIds.length === 0 || dates.length === 0) return 0

  const pool = dbPool(req.payload)
  const { rowCount } = await pool.query(
    `INSERT INTO room_rates
       (room_id, date, price, rooms_to_sell, min_stay, closed, created_at, updated_at)
     SELECT room.id, night.day, $3, $4, $5, COALESCE($6::boolean, false), now(), now()
       FROM unnest($1::int[])               AS room(id)
      CROSS JOIN unnest($2::timestamptz[])  AS night(day)
     ON CONFLICT (room_id, date) DO UPDATE
        SET price         = CASE WHEN $7  THEN $3 ELSE room_rates.price END,
            rooms_to_sell = CASE WHEN $8  THEN $4 ELSE room_rates.rooms_to_sell END,
            min_stay      = CASE WHEN $9  THEN $5 ELSE room_rates.min_stay END,
            closed        = CASE WHEN $10 THEN COALESCE($6::boolean, false)
                                 ELSE room_rates.closed END,
            updated_at    = now()`,
    [
      roomIds,
      dates,
      edit.price ?? null,
      edit.roomsToSell ?? null,
      edit.minStay ?? null,
      edit.closed ?? null,
      'price' in edit,
      'roomsToSell' in edit,
      'minStay' in edit,
      'closed' in edit,
    ],
  )

  // A row that now says nothing — no price, no room count, open — is the same
  // as no row at all, and leaving it behind would slowly fill the table with
  // nights somebody once touched and then undid.
  await pool.query(
    `DELETE FROM room_rates
      WHERE room_id = ANY($1::int[]) AND date = ANY($2::timestamptz[])
        AND price IS NULL AND rooms_to_sell IS NULL AND min_stay IS NULL
        AND closed IS NOT TRUE`,
    [roomIds, dates],
  )

  return rowCount ?? 0
}

/** One night of one room: the cell you clicked. */
export const setRate: Omit<Endpoint, 'root'> = {
  path: '/set',
  method: 'post',
  handler: async (req) => {
    const denied = staffOnly(req)
    if (denied) return denied

    const body = ((await req.json?.()) ?? {}) as Record<string, unknown>
    const roomId = Number(body.roomId)
    const date = night(body.date)

    if (!Number.isInteger(roomId) || roomId <= 0) return refuse('Which room?')
    if (!date) return refuse('Which night?')

    const edit = readEdit(body)
    if (typeof edit === 'string') return refuse(edit)

    await write(req, [roomId], [date], edit)
    return Response.json({ ok: true, nights: 1 })
  },
}

/**
 * A range of nights across any number of rooms, optionally only on certain
 * days of the week — "every Friday and Saturday in September".
 *
 * Capped at a year. Not because anything breaks above it, but because a typo
 * in a date is how somebody sets a price on forty thousand nights and finds
 * out in the morning.
 */
export const bulkRates: Omit<Endpoint, 'root'> = {
  path: '/bulk',
  method: 'post',
  handler: async (req) => {
    const denied = staffOnly(req)
    if (denied) return denied

    const body = ((await req.json?.()) ?? {}) as Record<string, unknown>
    const from = night(body.from)
    const to = night(body.to)
    const roomIds = Array.isArray(body.roomIds)
      ? body.roomIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
      : []

    if (!from || !to) return refuse('Which nights?')
    if (to < from) return refuse('That range ends before it starts')
    if (roomIds.length === 0) return refuse('Which rooms?')

    const span = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
    if (span > 366) return refuse('That is more than a year at once')

    // Empty means every day; otherwise 0 is Sunday, as JavaScript counts.
    const weekdays = Array.isArray(body.weekdays)
      ? body.weekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      : []

    const dates: Date[] = []
    for (let i = 0; i < span; i++) {
      const date = new Date(from.getTime() + i * 86_400_000)
      if (weekdays.length === 0 || weekdays.includes(date.getUTCDay())) dates.push(date)
    }

    const edit = readEdit(body)
    if (typeof edit === 'string') return refuse(edit)

    await write(req, roomIds, dates, edit)
    return Response.json({ ok: true, nights: dates.length, rooms: roomIds.length })
  },
}
