import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: {
    singular: 'Offer',
    plural: 'Offers',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'branch', 'isActive', 'endsOn'],
    description:
      'Deals and packages shown on the homepage — long-stay rates, weekday prices, anything worth putting in front of a guest. Leave this empty and the section does not appear.',
    group: 'Property',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Short and concrete — "Stay 3 nights, pay for 2".' },
    },
    slugField({ useAsSlug: 'title' }),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional. Without one the offer shows as a plain card.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'A sentence or two. What the guest gets, and any condition attached.',
      },
    },
    {
      // A relationship rather than free text: an offer that names its hotel in
      // prose cannot be filtered, and cannot link to the hotel it belongs to.
      name: 'branch',
      type: 'relationship',
      relationTo: 'branches',
      admin: {
        position: 'sidebar',
        description: 'Leave empty if the offer applies at every hotel.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to take it off the site without deleting it.',
      },
    },
    {
      // Dated rather than remembered. An expired offer left up is worse than
      // no offer: a guest who asks for it and is told no has been misled by
      // the site, so this hides itself on the day it ends.
      name: 'endsOn',
      type: 'date',
      admin: {
        position: 'sidebar',
        description:
          'Optional. After this date the offer disappears from the site on its own. Leave empty if it has no end date.',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers come first.',
      },
    },
  ],
}
