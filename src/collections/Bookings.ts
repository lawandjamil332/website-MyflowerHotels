import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { awardPointsForBooking } from '../utilities/points'

/**
 * A reservation. One row per stay.
 *
 * Not localised: a booking is a record of something that happened, not copy to
 * be read in three languages. The guest's name is whatever they typed.
 *
 * Payment is taken at the hotel, which is why there is no payment state here
 * and no half-finished booking to reconcile — a booking is either made or it is
 * not. `held` exists for the seconds a booking is being written, and for a
 * future where a deposit is taken; `confirmed` is what a guest ends up with
 * today.
 *
 * Rows are created through `createBooking`, never through the admin panel's
 * ordinary create, because only that path takes the lock that stops two guests
 * being sold the same last room. Staff can still edit and cancel here.
 */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Booking', plural: 'Bookings' },
  access: {
    // Guests create bookings from the website; only staff can read them, so
    // one guest can never read another's stay.
    create: anyone,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'guestName', 'branch', 'checkIn', 'checkOut', 'status'],
    description: 'Reservations made on the website. Newest first.',
  },
  defaultSort: '-createdAt',
  hooks: {
    afterChange: [
      async ({ doc, req, previousDoc }) => {
        // Points land when a stay is marked as having happened, and only on the
        // change into that state — not on every later edit of a completed
        // booking. The award is idempotent regardless, but there is no reason
        // to ask it the same question every time staff touch a row.
        if (doc.status === 'completed' && previousDoc?.status !== 'completed') {
          void awardPointsForBooking(req.payload, doc.id).catch(() => {})
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        description: 'What the guest quotes at the desk.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'guestName', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'guestPhone', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    { name: 'guestEmail', type: 'email' },
    {
      // Set when the booking was made while signed in, or when a guest opened
      // an account straight afterwards and kept it. Empty is the normal case
      // and always will be — an account is never required to book.
      name: 'guest',
      type: 'relationship',
      relationTo: 'guests',
      admin: {
        position: 'sidebar',
        description: 'The account this stay belongs to, if the guest has one.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'branch',
          type: 'relationship',
          relationTo: 'branches',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'room',
          type: 'relationship',
          relationTo: 'rooms',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'checkIn',
          type: 'date',
          required: true,
          admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'checkOut',
          type: 'date',
          required: true,
          admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } },
        },
        { name: 'guests', type: 'number', min: 1, admin: { width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nights',
          type: 'number',
          admin: { width: '33%', readOnly: true },
        },
        {
          name: 'totalAmount',
          type: 'number',
          min: 0,
          admin: {
            width: '33%',
            description: 'What the guest was quoted, at the time of booking.',
          },
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'IQD',
          options: [
            { label: 'IQD', value: 'IQD' },
            { label: 'USD', value: 'USD' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'confirmed',
      required: true,
      options: [
        { label: 'Held', value: 'held' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Stayed', value: 'completed' },
        { label: 'No-show', value: 'noShow' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Held and Confirmed take a room out of stock. Cancelled and No-show give it back.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Anything the guest asked for, or anything staff need to remember.' },
    },
  ],
  timestamps: true,
}
