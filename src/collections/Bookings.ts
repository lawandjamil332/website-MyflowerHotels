import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { exportBookings } from './bookingExport'
import { authenticated } from '../access/authenticated'
import { awardPointsForBooking } from '../utilities/points'
import { sendReviewRequest } from '../utilities/reviewEmail'

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
    /**
     * The columns an extranet shows, in the order it shows them: who, where,
     * when, and how it stands. The reference came first here and is now found
     * through the search box instead — it is what a guest quotes at the desk,
     * not what staff scan a list by.
     *
     * Payload remembers each person's chosen columns, so this order is what a
     * new account sees rather than what an old one gets back.
     */
    defaultColumns: ['guestName', 'branch', 'room', 'checkIn', 'checkOut', 'status', 'totalAmount'],
    group: 'Reservations',
    description: 'Every stay booked on the website.',
    components: {
      beforeListTable: ['@/components/admin/ReservationSearch#ReservationSearch'],
    },
  },
  defaultSort: '-createdAt',
  /** The list, as a spreadsheet, honouring whatever filter is on the screen. */
  endpoints: [exportBookings],
  hooks: {
    afterChange: [
      async ({ doc, req, previousDoc }) => {
        // Points land when a stay is marked as having happened, and only on the
        // change into that state — not on every later edit of a completed
        // booking. The award is idempotent regardless, but there is no reason
        // to ask it the same question every time staff touch a row.
        if (doc.status === 'completed' && previousDoc?.status !== 'completed') {
          void awardPointsForBooking(req.payload, doc.id).catch(() => {})

          // And ask them how it went. This is the only moment the site knows a
          // guest has something to review, and until now it was the moment
          // nothing happened — which is the entire reason this hotel group has
          // no reviews, no star rating in Google, and nothing an assistant can
          // say about whether the rooms are any good.
          //
          // The context flag stops the loop: sending stamps reviewRequestedAt
          // on this same booking, which fires this hook again.
          if (!req.context?.skipReviewRequest) {
            void sendReviewRequest(req.payload, doc.id).catch(() => {})
          }
        }
        return doc
      },
    ],
  },
  fields: [
    /**
     * The reservation, said once at the top, before the form that edits it.
     * A UI field: it stores nothing and validates nothing, it only draws.
     */
    {
      name: 'summary',
      type: 'ui',
      admin: {
        components: { Field: '@/components/admin/Reservation/Card' },
      },
    },
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
          label: 'Hotel',
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
          admin: {
            width: '33%',
            date: { pickerAppearance: 'dayOnly' },
            components: { Cell: '@/components/admin/cells#StayDateCell' },
          },
        },
        {
          name: 'checkOut',
          type: 'date',
          required: true,
          admin: {
            width: '33%',
            date: { pickerAppearance: 'dayOnly' },
            components: { Cell: '@/components/admin/cells#StayDateCell' },
          },
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
          label: 'Total',
          type: 'number',
          min: 0,
          admin: {
            width: '33%',
            description: 'What the guest was quoted, at the time of booking.',
            components: { Cell: '@/components/admin/cells#MoneyCell' },
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
        components: {
          Cell: '@/components/admin/cells#BookingStatusCell',
        },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Anything the guest asked for, or anything staff need to remember.' },
    },
    {
      name: 'locale',
      type: 'select',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Kurdish', value: 'ku' },
        { label: 'Arabic', value: 'ar' },
      ],
      admin: {
        readOnly: true,
        description:
          'The language this guest booked in. Their confirmation is written in it — useful to know before you ring them.',
      },
    },
    {
      name: 'reviewRequestedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description:
          'When this guest was asked to review their stay. Set once, automatically, when you mark the booking as Stayed — nobody is asked twice.',
      },
    },
  ],
  timestamps: true,
}
