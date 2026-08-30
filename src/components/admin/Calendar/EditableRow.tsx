'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

import { formatNumber } from '@/utilities/format'

/**
 * A row of the calendar you can type into.
 *
 * This is the thing the grid was missing and the reason it read as a report
 * rather than as an extranet: you could see that the 14th was nearly full and
 * you could do nothing about it without leaving the screen, opening the room,
 * and changing a price that applies to every night of the year.
 *
 * One click puts an input in the cell, Enter saves it, Escape abandons it, and
 * Tab moves to the next night — because setting a weekend is two cells and
 * reaching for the mouse between them is the difference between a tool and a
 * form. Emptying the box clears the night back to the room's ordinary price,
 * which is why "clear" has to be a thing you can type rather than the absence
 * of typing.
 *
 * The save is a POST and then `router.refresh()`, which re-runs the server
 * component and redraws the whole grid from the database. Slower than patching
 * the number in place, and right: a price change moves what is left to sell,
 * what the hotel band says, and the totals at the bottom, and a screen that
 * updated only the cell you touched would be quietly wrong everywhere else.
 */

export type EditableNight = {
  date: string
  /** What the night is worth now — the override, or the room's own value. */
  value: number | null
  /** True when a person set this night, rather than it coming from the room. */
  set: boolean
  closed: boolean
}

type Props = {
  /**
   * The room's name cell, which spans all four of its rows and therefore has
   * to be rendered inside the first of them. Passed in from the server
   * component so the name, its price and its link stay where they are written.
   */
  leading?: React.ReactNode
  roomId: number
  label: string
  field: 'minStay' | 'price' | 'roomsToSell'
  nights: EditableNight[]
  todayKey: string
  /**
   * How to draw the number: grouped like money, or bare like a count.
   *
   * A word rather than the formatting function itself, because a function
   * cannot cross from a server component into a client one — React refuses to
   * serialise it, and the whole page 500s with "Functions cannot be passed
   * directly to Client Components". Worth knowing before reaching for a
   * `render` prop anywhere else in this panel.
   */
  kind: 'count' | 'money' | 'nights'
}

const draw = (value: number | null, kind: 'count' | 'money' | 'nights'): string => {
  // A minimum of none is the ordinary case and says nothing, rather than "0",
  // which reads as a rule rather than as the absence of one.
  if (value === null) return kind === 'nights' ? '·' : '—'
  return kind === 'money' ? formatNumber(Math.round(value)) : String(value)
}

const isWeekend = (iso: string) => {
  const day = new Date(iso).getUTCDay()
  return day === 5 || day === 6
}

export const EditableRow: React.FC<Props> = ({
  leading,
  roomId,
  label,
  field,
  nights,
  todayKey,
  kind,
}) => {
  const router = useRouter()
  const [editing, setEditing] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState('')
  const [saving, setSaving] = React.useState<string | null>(null)
  const [failed, setFailed] = React.useState<string | null>(null)

  const open = (nightDate: string, current: number | null) => {
    setEditing(nightDate)
    setDraft(current === null ? '' : String(current))
    setFailed(null)
  }

  const save = async (nightDate: string) => {
    const trimmed = draft.trim()
    const value = trimmed === '' ? null : Number(trimmed)
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setFailed(nightDate)
      return
    }

    setEditing(null)
    setSaving(nightDate)

    try {
      const response = await fetch('/api/room-rates/set', {
        body: JSON.stringify({ roomId, date: nightDate.slice(0, 10), [field]: value }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) throw new Error(String(response.status))
      router.refresh()
    } catch {
      // The number goes back to whatever the server last said, because the
      // alternative is a cell showing a price the hotel is not charging.
      setFailed(nightDate)
    } finally {
      setSaving(null)
    }
  }

  return (
    <tr className="mf-calendar__row">
      {leading}
      <th className="mf-calendar__metric" scope="row">
        {label}
      </th>

      {nights.map((night) => {
        const key = night.date
        const today = key.slice(0, 10) === todayKey

        return (
          <td
            className="mf-calendar__edit"
            data-closed={night.closed ? 'true' : undefined}
            data-failed={failed === key ? 'true' : undefined}
            data-saving={saving === key ? 'true' : undefined}
            data-set={night.set ? 'true' : undefined}
            data-today={today ? 'true' : undefined}
            data-weekend={isWeekend(key) ? 'true' : undefined}
            key={key}
          >
            {editing === key ? (
              <input
                autoFocus
                className="mf-calendar__input"
                inputMode="numeric"
                onBlur={() => save(key)}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void save(key)
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    setEditing(null)
                  }
                }}
                value={draft}
              />
            ) : (
              <button
                className="mf-calendar__edit-btn"
                onClick={() => open(key, night.value)}
                title={`${label} · ${key.slice(0, 10)}${night.set ? ' · set for this night' : ' · from the room'}`}
                type="button"
              >
                {night.closed && field === 'roomsToSell' ? 'shut' : draw(night.value, kind)}
              </button>
            )}
          </td>
        )
      })}
    </tr>
  )
}
