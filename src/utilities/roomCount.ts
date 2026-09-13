/**
 * How many rooms each hotel has, counted from the rooms themselves.
 *
 * A room *type* is not a room. "Double room" with a quantity of nine is nine
 * rooms in the building and one row in the admin panel, so counting rows gives
 * a hotel of four rooms and counting quantities gives the truth.
 *
 * Every room count the site publishes comes through here: the figure on each
 * hotel's own page, the `numberOfRooms` in its structured data, the group total
 * in the organisation block, the totals the guide pages open with, and the line
 * in llms-full.txt. One routine, so those five can never disagree — they did
 * before it existed, when one of them counted a room type with no quantity as
 * zero and another as one.
 *
 * SCOPE. Counted from the rooms the site actually sells: `getAllRooms` and
 * `getRoomsForBranch` both filter on `isAvailable`, so a room type withdrawn
 * from sale is not counted. That makes every number here a floor rather than a
 * boast — it can be lower than the building's true total, never higher.
 *
 * This is only ever the room count. The homepage's guests-welcomed figure is
 * the owner's own, written by hand in the dictionary, and is not derived from
 * anything here — see `creditGuestsValue` in src/i18n/dictionaries.ts.
 */

/** Shape enough of a room to count it, without needing Payload's full type. */
type Countable = { branch?: unknown; quantity?: number | null }

/**
 * Rooms in a list of room types.
 *
 * For a caller that already holds one hotel's rooms and does not need them
 * grouped — the hotel page, and the group total, which is every room in the
 * list regardless of which hotel it belongs to.
 */
export const countRooms = (rooms: Countable[]): number =>
  rooms.reduce((sum, room) => {
    const q = Number(room.quantity)
    // Zero counts as zero. This used to fall back to 1 for "a room type with no
    // quantity set", which sounded reasonable and was exactly wrong: the field
    // is required, with a minimum of 0 and a default of 1, so there is no such
    // thing as unset — the only value that fallback could ever fire on was a
    // deliberate 0, which is somebody withdrawing a room type. Rounding that up
    // published a room the hotel does not have, on the hotel page, in both
    // numberOfRooms blocks, in the guide totals and in llms-full.txt.
    //
    // A value that is not a number at all is a broken record rather than a
    // hotel, and is skipped as zero: understating is the safe direction for
    // every figure this feeds.
    return sum + (Number.isFinite(q) && q > 0 ? Math.floor(q) : 0)
  }, 0)

/** Branch id → rooms in that hotel. */
export const roomsPerBranch = (rooms: Countable[]): Map<number, number> => {
  const out = new Map<number, number>()

  for (const room of rooms) {
    const branch = room.branch as { id?: number | string } | number | string | null | undefined
    const raw = typeof branch === 'object' && branch !== null ? branch.id : branch
    // Coerced rather than type-checked. Payload returns a relationship as the
    // id when it is shallow and as the document when it is populated, and the
    // id's own type depends on the database adapter — so a strict `typeof ===
    // 'number'` silently counted nothing at all the first time this met a
    // string id, which looks exactly like a hotel with no rooms.
    const id = Number(raw)
    if (!Number.isFinite(id)) continue

    out.set(id, (out.get(id) ?? 0) + countRooms([room]))
  }

  return out
}

/**
 * Rooms across a given set of hotels.
 *
 * Pass the hotels being counted rather than summing the whole map. The guide
 * pages say "four hotels, fifty-seven rooms", and a hotel still being built has
 * no rooms anybody can sleep in — counting those would put two different scopes
 * in one sentence.
 */
export const roomsAcross = (rooms: Countable[], branchIds: number[]): number => {
  const per = roomsPerBranch(rooms)
  const wanted = new Set(branchIds)
  let total = 0
  for (const [id, count] of per) if (wanted.has(id)) total += count
  return total
}
