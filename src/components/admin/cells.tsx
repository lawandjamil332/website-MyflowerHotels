'use client'

import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

import { formatDateShort, formatPrice } from '@/utilities/format'

import { StatusPill } from './StatusPill'
import { BOOKING_STATUS, BRANCH_STATUS, ENQUIRY_STATUS, look } from './statuses'
import './cells.scss'

/**
 * The cells that make a Payload list read like a reservations screen.
 *
 * Payload's default cell prints whatever is stored: `noShow`, an ISO
 * timestamp, `45000`. Correct, and unreadable at the speed somebody scans a
 * list looking for tonight's arrivals. These print the same values the way the
 * extranet does — a coloured status, a weekday, a price with its currency.
 *
 * Every one of them is only a way of drawing an existing column. Nothing here
 * changes what is stored, so a cell that ever misbehaves can be deleted from
 * the collection and the data is untouched.
 */

const Empty = () => <span className="mf-cell__empty">—</span>

/** Midnight today, UTC — the same day boundary the booking engine keeps. */
const todayUtc = () => {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

export const BookingStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = look(BOOKING_STATUS, cellData as string)
  if (!status) return <Empty />
  return <StatusPill label={status.label} tone={status.tone} />
}

export const EnquiryStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = look(ENQUIRY_STATUS, cellData as string)
  if (!status) return <Empty />
  return <StatusPill label={status.label} tone={status.tone} />
}

export const BranchStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = look(BRANCH_STATUS, cellData as string)
  if (!status) return <Empty />
  return <StatusPill label={status.label} tone={status.tone} />
}

/**
 * A stay date: "Sat 5 Sep", with today and tomorrow said in words.
 *
 * A hotel's whole day is decided by which of these two rows is today, and
 * finding that out by comparing five dates against the wall calendar is how a
 * check-in gets missed.
 */
export const StayDateCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  if (!cellData) return <Empty />

  const date = new Date(cellData as string)
  if (Number.isNaN(date.getTime())) return <Empty />

  const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const away = Math.round((day - todayUtc()) / 86_400_000)

  const relative = away === 0 ? 'Today' : away === 1 ? 'Tomorrow' : away === -1 ? 'Yesterday' : null

  return (
    <span className="mf-cell__date" data-near={relative ? 'true' : undefined}>
      {formatDateShort(date)}
      {relative && <em className="mf-cell__relative">{relative}</em>}
    </span>
  )
}

/**
 * Money, written the way the confirmation email writes it, with the currency
 * attached. A column of bare numbers where two currencies are taken is a
 * column nobody can add up.
 */
export const MoneyCell: React.FC<DefaultCellComponentProps> = ({ cellData, rowData }) => {
  if (typeof cellData !== 'number') return <Empty />
  const currency = (rowData?.currency as string) || 'IQD'
  return <span className="mf-cell__money">{formatPrice(cellData, currency)}</span>
}

/*
 * There is no RoomCell, and the reason is worth writing down.
 *
 * The rooms in this group are named per hotel — "Executive King — My Flower 3"
 * — so beside a Hotel column the name says it twice, and a cell that trimmed
 * the repetition looked like an easy win. It is not possible: Payload gives a
 * relationship cell only the row's foreign key, and resolves the titles itself
 * afterwards, in one batched request for the whole page. A custom cell sees
 * `11`, not a room. Reading the name back would mean a query per row to save a
 * few words in one column.
 *
 * So the trimming happens where this file is not involved and the name is
 * already in hand — the dashboard's arrival lists and the calendar's left
 * column, through `shortRoomName`.
 */
