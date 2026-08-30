import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { bulkRates, setRate } from './rateEndpoints'

/**
 * One night of one room type: what it costs, how many are for sale, and
 * whether it is on sale at all.
 *
 * A room used to carry a single price and a single count, which is what a
 * brochure carries. A hotel does not sell that way. Eid weekend is not
 * Tuesday's price; the night before a conference is not the night after it;
 * and "we keep two back for walk-ins in high season" is a real thing a
 * manager does. Booking.com's extranet is built around exactly this table,
 * which is why its calendar has a price in every cell and this one did not.
 *
 * Every column is an override and every one may be empty. A night with no row
 * here — which is almost every night — costs the room's own price and sells
 * the room's own quantity. So four hotels with 57 rooms and no special dates
 * hold nothing at all in this table, and nothing changes until somebody types
 * a number into the calendar.
 *
 * It is a Payload collection rather than a table of its own so Payload knows
 * the schema it is looking at. `npm run dev` pushes the config's schema to the
 * database, and a table Payload has never heard of is one it may decide to
 * drop.
 *
 * Hidden from the panel's navigation on purpose: this is edited in the
 * calendar, a fortnight at a time, not row by row in a list. The list view
 * still exists at /admin/collections/room-rates for anyone who needs to see
 * what is actually stored.
 */
export const RoomRates: CollectionConfig = {
  slug: 'room-rates',
  labels: { singular: 'Rate', plural: 'Rates & availability' },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    // Edited through the calendar. See the note above.
    hidden: true,
    useAsTitle: 'date',
    defaultColumns: ['room', 'date', 'price', 'roomsToSell', 'closed'],
    group: 'Property',
  },
  defaultSort: 'date',
  /**
   * How the calendar writes. Both are POSTs under /api/room-rates, so Payload
   * has already resolved the session before either runs.
   */
  endpoints: [setRate, bulkRates],
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'room',
          type: 'relationship',
          relationTo: 'rooms',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'date',
          type: 'date',
          required: true,
          index: true,
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayOnly' },
            description: 'The night, not the day of arrival.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          min: 0,
          admin: {
            width: '33%',
            description: "Leave empty to charge the room's own price that night.",
          },
        },
        {
          name: 'roomsToSell',
          type: 'number',
          min: 0,
          admin: {
            width: '33%',
            description: 'Leave empty to sell as many as the hotel has.',
          },
        },
        {
          name: 'closed',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '33%',
            description: 'Nothing is sold that night, whatever is free.',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
