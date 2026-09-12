/**
 * How many rooms each hotel has, counted from the rooms themselves.
 *
 * A room *type* is not a room. "Double room" with a quantity of nine is nine
 * rooms in the building and one row in the admin panel, so counting rows gives
 * a hotel of four rooms and counting quantities gives the truth. Every figure
 * the site publishes about its own size — the homepage tile, the
 * `numberOfRooms` in each hotel's structured data — comes through here, so
 * there is one number and nobody types it anywhere.
 *
 * This matters more than it sounds. The homepage used to claim two million
 * guests. Fifty-seven rooms, full every single night since 2012, is about
 * 291,000 room-nights — the figure was three and a half times what the
 * buildings can physically hold, and an assistant asked about this group can
 * do that arithmetic in one line. A number a reader can check and finds wrong
 * costs the page every other number on it.
 *
 * Counted from the rooms the site actually sells (`isAvailable` is what
 * `getAllRooms` filters on), which is the honest scope: it is the rooms a
 * guest could book, and it can only ever be lower than the true total, never
 * higher.
 */

/** Shape enough of a room to count it, without needing Payload's full type. */
type Countable = { branch?: unknown; quantity?: number | null }

/** Branch id → rooms in that hotel. */
export const roomsPerBranch = (rooms: Countable[]): Map<number, number> => {
  const out = new Map<number, number>()

  for (const room of rooms) {
    const branch = room.branch as { id?: number } | number | null | undefined
    const id = typeof branch === 'number' ? branch : branch?.id
    if (typeof id !== 'number') continue

    // A room type with no quantity set is at least one room — it exists, it is
    // on sale, and counting it as zero would understate the hotel. Anything
    // that is not a sane positive number falls back the same way.
    const quantity =
      typeof room.quantity === 'number' && Number.isFinite(room.quantity) && room.quantity > 0
        ? Math.floor(room.quantity)
        : 1

    out.set(id, (out.get(id) ?? 0) + quantity)
  }

  return out
}

/**
 * Rooms across a given set of hotels.
 *
 * Pass the hotels being counted rather than summing the whole map: the
 * homepage's tile says "across our three hotels", and the one still being
 * built has no rooms anybody can sleep in yet.
 */
export const roomsAcross = (rooms: Countable[], branchIds: number[]): number => {
  const per = roomsPerBranch(rooms)
  const wanted = new Set(branchIds)
  let total = 0
  for (const [id, count] of per) if (wanted.has(id)) total += count
  return total
}
