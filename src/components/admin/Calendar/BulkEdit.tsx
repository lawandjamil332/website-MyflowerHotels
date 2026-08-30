'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

/**
 * "Every Friday and Saturday in September, 180,000."
 *
 * The single reason a hotel uses a calendar rather than a spreadsheet. Typing
 * a weekend rate into sixty cells one at a time is not editing, it is data
 * entry, and it is where the extranet's Bulk edit earns its place: a range of
 * dates, the days of the week it applies to, the rooms it applies to, and one
 * number.
 *
 * Shut behind a button because it is the dangerous control on this screen —
 * one press changes hundreds of nights — and an open form invites a stray
 * Enter. The summary line above the button says exactly what will happen and
 * to how many nights before anything is sent.
 */

export type BulkRoom = { id: number; name: string; hotel: string }

const WEEKDAYS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
]

export const BulkEdit: React.FC<{ rooms: BulkRoom[]; from: string; to: string }> = ({
  rooms,
  from,
  to,
}) => {
  const router = useRouter()
  const [showing, setShowing] = React.useState(false)
  const [start, setStart] = React.useState(from)
  const [end, setEnd] = React.useState(to)
  const [weekdays, setWeekdays] = React.useState<number[]>([])
  const [chosen, setChosen] = React.useState<number[]>([])
  const [price, setPrice] = React.useState('')
  const [roomsToSell, setRoomsToSell] = React.useState('')
  const [shut, setShut] = React.useState<'' | 'open' | 'closed'>('')
  const [busy, setBusy] = React.useState(false)
  const [said, setSaid] = React.useState<string | null>(null)

  // Nothing chosen means every room on the screen, which is what somebody
  // setting a season means and saves ticking sixteen boxes to say it.
  const targets = chosen.length ? chosen : rooms.map((room) => room.id)

  const nights = React.useMemo(() => {
    const one = new Date(`${start}T00:00:00.000Z`).getTime()
    const other = new Date(`${end}T00:00:00.000Z`).getTime()
    if (Number.isNaN(one) || Number.isNaN(other) || other < one) return 0

    let count = 0
    for (let t = one; t <= other; t += 86_400_000) {
      if (weekdays.length === 0 || weekdays.includes(new Date(t).getUTCDay())) count += 1
    }
    return count
  }, [start, end, weekdays])

  const changes =
    (price.trim() !== '' || roomsToSell.trim() !== '' || shut !== '') && nights > 0 && targets.length > 0

  const apply = async () => {
    if (!changes) return
    setBusy(true)
    setSaid(null)

    const body: Record<string, unknown> = { from: start, roomIds: targets, to: end, weekdays }
    if (price.trim() !== '') body.price = Number(price)
    if (roomsToSell.trim() !== '') body.roomsToSell = Number(roomsToSell)
    if (shut !== '') body.closed = shut === 'closed'

    try {
      const response = await fetch('/api/room-rates/bulk', {
        body: JSON.stringify(body),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json()) as { errors?: { message: string }[]; nights?: number }
      if (!response.ok) throw new Error(result.errors?.[0]?.message ?? 'That did not save')

      setSaid(
        `Done — ${result.nights ?? nights} night${result.nights === 1 ? '' : 's'} across ${targets.length} room type${targets.length === 1 ? '' : 's'}.`,
      )
      router.refresh()
    } catch (error) {
      setSaid(error instanceof Error ? error.message : 'That did not save')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (list: number[], value: number, set: (next: number[]) => void) =>
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

  if (!showing) {
    return (
      <button className="mf-bulk__open" onClick={() => setShowing(true)} type="button">
        Change many nights at once
      </button>
    )
  }

  return (
    <section className="mf-bulk">
      <header className="mf-bulk__head">
        <h2>Change many nights at once</h2>
        <button className="mf-bulk__close" onClick={() => setShowing(false)} type="button">
          Close
        </button>
      </header>

      <div className="mf-bulk__grid">
        <label className="mf-bulk__field">
          <span>From</span>
          <input onChange={(event) => setStart(event.target.value)} type="date" value={start} />
        </label>

        <label className="mf-bulk__field">
          <span>To</span>
          <input onChange={(event) => setEnd(event.target.value)} type="date" value={end} />
        </label>

        <div className="mf-bulk__field mf-bulk__field--wide">
          <span>Only on these days — leave all off for every day</span>
          <div className="mf-bulk__chips">
            {WEEKDAYS.map((weekday) => (
              <button
                className="mf-bulk__chip"
                data-on={weekdays.includes(weekday.day) ? 'true' : undefined}
                key={weekday.day}
                onClick={() => toggle(weekdays, weekday.day, setWeekdays)}
                type="button"
              >
                {weekday.label}
              </button>
            ))}
          </div>
        </div>

        <label className="mf-bulk__field">
          <span>Price a night</span>
          <input
            inputMode="numeric"
            onChange={(event) => setPrice(event.target.value)}
            placeholder="leave empty to keep"
            value={price}
          />
        </label>

        <label className="mf-bulk__field">
          <span>Rooms to sell</span>
          <input
            inputMode="numeric"
            onChange={(event) => setRoomsToSell(event.target.value)}
            placeholder="leave empty to keep"
            value={roomsToSell}
          />
        </label>

        <label className="mf-bulk__field">
          <span>On sale</span>
          <select
            onChange={(event) => setShut(event.target.value as '' | 'open' | 'closed')}
            value={shut}
          >
            <option value="">Leave as it is</option>
            <option value="open">Open for booking</option>
            <option value="closed">Closed — sell nothing</option>
          </select>
        </label>
      </div>

      <div className="mf-bulk__rooms">
        <span className="mf-bulk__rooms-label">
          Rooms — none ticked means all {rooms.length} on this screen
        </span>
        <div className="mf-bulk__chips">
          {rooms.map((room) => (
            <button
              className="mf-bulk__chip"
              data-on={chosen.includes(room.id) ? 'true' : undefined}
              key={room.id}
              onClick={() => toggle(chosen, room.id, setChosen)}
              type="button"
            >
              {room.name}
              <em>{room.hotel}</em>
            </button>
          ))}
        </div>
      </div>

      <footer className="mf-bulk__foot">
        <p className="mf-bulk__summary">
          {changes
            ? `${nights} night${nights === 1 ? '' : 's'} × ${targets.length} room type${targets.length === 1 ? '' : 's'}`
            : 'Choose dates and at least one thing to change.'}
        </p>
        {said && <p className="mf-bulk__said">{said}</p>}
        <button className="mf-bulk__go" disabled={!changes || busy} onClick={apply} type="button">
          {busy ? 'Saving…' : 'Apply'}
        </button>
      </footer>
    </section>
  )
}
