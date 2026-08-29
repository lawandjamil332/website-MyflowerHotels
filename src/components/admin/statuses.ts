/**
 * What a status looks like when somebody is scanning a list of forty of them.
 *
 * Payload prints the raw stored value — `noShow`, `completed` — in the same
 * grey as every other cell, so telling a cancelled booking from a stayed one
 * means reading the word. An extranet does not make you read: cancelled is
 * red, confirmed is green, and you find the one row that matters by colour
 * from across the desk.
 *
 * The labels are the ones already written in the collections, kept in step by
 * hand rather than derived, because a select field's options live inside a
 * server config a client cell cannot import.
 */

export type Tone =
  /** Everything is as it should be. */
  | 'ok'
  /** Needs somebody to do something. */
  | 'warn'
  /** Money that did not arrive. */
  | 'bad'
  /** Finished, and nothing more to do. */
  | 'done'
  /** True but unremarkable. */
  | 'quiet'

export type StatusLook = { label: string; tone: Tone }

export const BOOKING_STATUS: Record<string, StatusLook> = {
  held: { label: 'Held', tone: 'warn' },
  confirmed: { label: 'Confirmed', tone: 'ok' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
  completed: { label: 'Stayed', tone: 'done' },
  noShow: { label: 'No-show', tone: 'bad' },
}

export const ENQUIRY_STATUS: Record<string, StatusLook> = {
  new: { label: 'New', tone: 'warn' },
  contacted: { label: 'Contacted', tone: 'ok' },
  closed: { label: 'Closed', tone: 'quiet' },
}

export const BRANCH_STATUS: Record<string, StatusLook> = {
  open: { label: 'Open', tone: 'ok' },
  openingSoon: { label: 'Opening soon', tone: 'warn' },
}

/**
 * A status nobody wrote down here still gets a pill rather than nothing —
 * a value added to a collection and forgotten here reads as itself, in grey,
 * instead of disappearing out of the column.
 */
export const look = (
  table: Record<string, StatusLook>,
  value?: string | null,
): StatusLook | null => {
  if (!value) return null
  return table[value] ?? { label: value, tone: 'quiet' }
}
