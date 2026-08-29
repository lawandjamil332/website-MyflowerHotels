/**
 * A room's name, with the hotel taken off the end of it.
 *
 * Rooms are named per hotel and there are four hotels, so the names in the
 * database read "Executive King — My Flower 3". That is right in a list of
 * every room in the group and wrong everywhere the hotel is already in the
 * row: the calendar files rooms under a hotel heading, and the arrivals list
 * prints the hotel beside the room. Both were saying it twice, and on the
 * dashboard it wrapped every stay onto a second line.
 *
 * Only an exact match at the end is removed, and only if something is left, so
 * a room genuinely called "My Flower 3" keeps its name.
 */
export const shortRoomName = (
  room?: string | null,
  hotel?: string | null,
): string | null | undefined => {
  if (!room || !hotel || !room.endsWith(hotel)) return room

  const stem = room.slice(0, room.length - hotel.length).replace(/[\s—–-]+$/u, '')
  return stem || room
}
