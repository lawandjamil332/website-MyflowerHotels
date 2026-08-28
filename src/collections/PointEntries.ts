import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * The points ledger. Every movement, never a running total.
 *
 * A balance stored as a number drifts: one failed write, one double-run hook,
 * and it no longer matches what the guest earned, with nothing to check it
 * against. A ledger cannot drift, because the balance is not stored at all —
 * it is the sum of these rows, and every point in it can be traced to the
 * stay that produced it.
 *
 * Written only by the code that awards points. Staff can add a correcting row
 * — which is also how a goodwill gesture is made — but nothing is ever edited
 * or deleted, so the history stays a history.
 */
export const PointEntries: CollectionConfig = {
  slug: 'point-entries',
  labels: { singular: 'Points entry', plural: 'Points' },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['guest', 'points', 'reason', 'booking', 'createdAt'],
    description: 'Every points movement. A guest’s balance is the sum of their rows.',
    group: 'Bookings & guests',
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'guest', type: 'relationship', relationTo: 'guests', required: true },
    {
      name: 'points',
      type: 'number',
      required: true,
      admin: { description: 'Negative to deduct — a redemption, or a correction.' },
    },
    { name: 'reason', type: 'text', required: true },
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      admin: { description: 'The stay that earned them, where there is one.' },
    },
  ],
  timestamps: true,
}
