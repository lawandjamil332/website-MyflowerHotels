import type { Payload } from 'payload'

/**
 * Availability, and the one write that is allowed to create a booking.
 *
 * The whole reliability of a booking system comes down to a single question:
 * what happens when two guests press confirm at the same instant on the last
 * room. The usual answer — ask the database how many are left, decide in
 * application code, then insert — is wrong, and it is wrong in the way that is
 * hardest to notice, because it only fails when two requests overlap by
 * milliseconds. It passes every manual test and oversells on a busy night.
 *
 * So the check and the write happen inside one transaction, and the room type's
 * own row is locked first with SELECT ... FOR UPDATE. Two requests for the same
 * room type queue behind that lock: the first counts, decides and inserts; the
 * second cannot begin counting until the first has committed, so it sees the
 * booking that was just made and is refused. Requests for different room types
 * never touch each other's locks and run in parallel.
 *
 * This is why bookings are written here in SQL rather than through
 * `payload.create`: the count and the insert must ride on the same connection
 * as the lock, and Payload's create takes its own.
 */

/** Statuses that hold a room out of stock. The rest give it back. */
const OCCUPYING = ['held', 'confirmed', 'completed'] as const

export class NoAvailabilityError extends Error {
  constructor(message = 'Those dates are no longer available') {
    super(message)
    this.name = 'NoAvailabilityError'
  }
}

export class InvalidDatesError extends Error {
  constructor(message = 'Check-out must be after check-in') {
    super(message)
    this.name = 'InvalidDatesError'
  }
}

const pool = (payload: Payload) => (payload.db as unknown as { pool: any }).pool

/** Nights between two dates, counted the way a hotel counts them. */
export const nightsBetween = (checkIn: Date, checkOut: Date): number =>
  Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000)

/**
 * How many rooms of this type are free for these dates.
 *
 * Two stays overlap when one starts before the other ends and ends after the
 * other starts. Touching stays do not overlap: someone checking out on the 5th
 * and someone checking in on the 5th are the same room, one night apart, and a
 * system that calls that a clash sells a hotel short every single day.
 */
export const roomsLeft = async (
  payload: Payload,
  { roomId, checkIn, checkOut }: { roomId: number; checkIn: Date; checkOut: Date },
): Promise<number> => {
  if (checkOut <= checkIn) throw new InvalidDatesError()

  const { rows } = await pool(payload).query(
    `SELECT r.quantity::int AS quantity,
            COALESCE((
              SELECT COUNT(*) FROM bookings b
              WHERE b.room_id = r.id
                AND b.status = ANY($2)
                AND b.check_in < $4
                AND b.check_out > $3
            ), 0)::int AS taken
       FROM rooms r
      WHERE r.id = $1`,
    [roomId, OCCUPYING, checkIn, checkOut],
  )

  if (rows.length === 0) return 0
  return Math.max(0, rows[0].quantity - rows[0].taken)
}

/** MF-7KQ2P9 — short enough to read down a phone line, long enough not to collide. */
const makeReference = (): string => {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no I/L/O/0/1
  let out = ''
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `MF-${out}`
}

export type NewBooking = {
  roomId: number
  branchId: number
  checkIn: Date
  checkOut: Date
  guestName: string
  guestPhone: string
  guestEmail?: string | null
  guests?: number | null
  totalAmount?: number | null
  currency?: 'IQD' | 'USD'
  notes?: string | null
}

/**
 * Creates a booking, or refuses. Never oversells.
 */
export const createBooking = async (
  payload: Payload,
  input: NewBooking,
): Promise<{ id: number; reference: string; nights: number }> => {
  if (input.checkOut <= input.checkIn) throw new InvalidDatesError()

  const client = await pool(payload).connect()
  try {
    await client.query('BEGIN')

    // Everything below is serialised per room type by this lock. It is taken
    // before the count, not after, which is the entire point.
    const locked = await client.query(
      `SELECT quantity::int AS quantity, is_available
         FROM rooms WHERE id = $1 FOR UPDATE`,
      [input.roomId],
    )
    if (locked.rows.length === 0) throw new NoAvailabilityError('That room no longer exists')
    if (locked.rows[0].is_available === false) {
      throw new NoAvailabilityError('That room is not currently offered')
    }

    const taken = await client.query(
      `SELECT COUNT(*)::int AS taken FROM bookings
        WHERE room_id = $1 AND status = ANY($2)
          AND check_in < $4 AND check_out > $3`,
      [input.roomId, OCCUPYING, input.checkIn, input.checkOut],
    )

    if (taken.rows[0].taken >= locked.rows[0].quantity) throw new NoAvailabilityError()

    const nights = nightsBetween(input.checkIn, input.checkOut)

    // Retried on the vanishingly rare chance two references collide; the unique
    // index is what makes that detectable rather than silently duplicated.
    let inserted
    for (let attempt = 0; attempt < 5; attempt++) {
      const reference = makeReference()
      try {
        inserted = await client.query(
          `INSERT INTO bookings
             (reference, guest_name, guest_phone, guest_email, branch_id, room_id,
              check_in, check_out, guests, nights, total_amount, currency, status, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'confirmed',$13)
           RETURNING id, reference`,
          [
            reference,
            input.guestName,
            input.guestPhone,
            input.guestEmail ?? null,
            input.branchId,
            input.roomId,
            input.checkIn,
            input.checkOut,
            input.guests ?? null,
            nights,
            input.totalAmount ?? null,
            input.currency ?? 'IQD',
            input.notes ?? null,
          ],
        )
        break
      } catch (error) {
        const code = (error as { code?: string })?.code
        if (code !== '23505') throw error // not a uniqueness clash — real failure
      }
    }

    if (!inserted) throw new Error('Could not allocate a booking reference')

    await client.query('COMMIT')
    return { id: inserted.rows[0].id, reference: inserted.rows[0].reference, nights }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}
