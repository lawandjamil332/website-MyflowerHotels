import type { Endpoint, Where } from 'payload'

import { formatDateShort } from '../utilities/format'

/**
 * The reservations list, as a spreadsheet.
 *
 * Every extranet has this and every hotel uses it, for the things a screen is
 * bad at: handing the week's arrivals to somebody who does not have a login,
 * reconciling a month against what the bank received, or just counting
 * something nobody thought to put a column in for.
 *
 * It honours the filter that is on the screen, because an export that ignores
 * the search you just ran is a download of four thousand rows and a second
 * job. The query string the list view is already using is passed straight
 * through, so "cancelled in September" exports cancelled in September.
 *
 * Excel decides a file's encoding by sniffing, and gets Arabic and Kurdish
 * names wrong unless the file opens with a byte-order mark. Guest names here
 * are frequently in both. Hence the BOM, which looks like a mistake and is the
 * difference between "Ahmed" and mojibake.
 */

const CAP = 5000

/** One CSV field: quoted always, because a hotel name with a comma is normal. */
const cell = (value: unknown): string => {
  if (value === null || value === undefined) return '""'
  return `"${String(value).replace(/"/g, '""')}"`
}

const name = (value: unknown): string => {
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as { name: unknown }).name ?? '')
  }
  return value === null || value === undefined ? '' : String(value)
}

export const exportBookings: Omit<Endpoint, 'root'> = {
  path: '/export',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ errors: [{ message: 'Not allowed' }] }, { status: 403 })

    // Already parsed out of the query string by Payload. Cast rather than
    // re-validated: `find` sanitises the shape itself and refuses what it
    // cannot read, so a second check here would only be a second thing to
    // keep in step with it.
    const where = (req.query?.where ?? undefined) as undefined | Where
    const sort = typeof req.query?.sort === 'string' ? req.query.sort : '-createdAt'

    const { docs } = await req.payload.find({
      collection: 'bookings',
      depth: 1,
      limit: CAP,
      pagination: false,
      sort,
      where,
    })

    const header = [
      'Reference', 'Guest', 'Phone', 'Email', 'Hotel', 'Room',
      'Arriving', 'Leaving', 'Nights', 'Guests', 'Status', 'Total', 'Currency',
      'Booked on', 'Booked in', 'Notes',
    ]

    const rows = docs.map((booking) =>
      [
        booking.reference,
        booking.guestName,
        booking.guestPhone,
        booking.guestEmail,
        name(booking.branch),
        name(booking.room),
        formatDateShort(booking.checkIn),
        formatDateShort(booking.checkOut),
        booking.nights,
        booking.guests,
        booking.status,
        booking.totalAmount,
        booking.currency,
        formatDateShort(booking.createdAt),
        booking.locale,
        booking.notes,
      ]
        .map(cell)
        .join(','),
    )

    const today = new Date().toISOString().slice(0, 10)

    return new Response(`﻿${[header.map(cell).join(','), ...rows].join('\r\n')}\r\n`, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="reservations-${today}.csv"`,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    })
  },
}
