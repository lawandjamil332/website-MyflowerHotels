import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

/**
 * What guests said, after they stayed.
 *
 * The one thing Booking.com has that a hotel's own site usually does not, and
 * the reason a guest who found this hotel here still goes there to decide. Two
 * hundred reviews is not a feature list, it is the whole argument — and every
 * booking it wins on Booking.com costs this group fifteen per cent.
 *
 * Nothing appears until somebody approves it. A hotel's own website is not a
 * public forum and cannot be one: an unmoderated form on a small business's
 * site is a target within the week. Approval is also what makes the star rating
 * in Google's results honest — it is computed from the same rows the page
 * shows, so the number is never one a visitor cannot go and read.
 *
 * `verified` is set by the site, never by hand, and only when the review came
 * through a real booking reference for a stay that actually finished. It is the
 * only claim here that has to be true, so it is the only one a person cannot
 * type.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Review', plural: 'Reviews' },
  access: {
    // Anyone may leave one; the action behind the form is what decides whether
    // it is allowed to claim a stay. Reading is open because approved reviews
    // are the point — the queries that fetch them filter on `approved`.
    create: anyone,
    read: anyone,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'guestName',
    defaultColumns: ['guestName', 'branch', 'rating', 'approved', 'createdAt'],
    description:
      'Guest reviews. Nothing shows on the website until "Approved" is ticked. Ticking it also changes the star rating Google prints beside your search result.',
    group: 'Guests',
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'guestName', type: 'text', required: true, admin: { width: '50%' } },
        {
          name: 'rating',
          type: 'number',
          required: true,
          min: 1,
          max: 5,
          admin: { width: '50%', description: '1 to 5.' },
        },
      ],
    },
    {
      name: 'comment',
      type: 'textarea',
      admin: {
        description:
          'Optional. A rating on its own still counts towards the average and still shows.',
      },
    },
    {
      name: 'branch',
      type: 'relationship',
      relationTo: 'branches',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Until this is ticked the review is invisible and counts towards nothing.',
      },
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Set by the website when the review arrived through a real booking reference for a stay that had finished. Not editable — that is what makes it worth printing.',
      },
    },
    {
      name: 'stayedOn',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      // Kept so the booking cannot be reviewed twice, and so a disputed review
      // can be traced back to a real stay.
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  timestamps: true,
}
