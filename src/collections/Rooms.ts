import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { roomAmenityOptions } from '../fields/amenities'

export const Rooms: CollectionConfig = {
  slug: 'rooms',
  labels: {
    singular: 'Room',
    plural: 'Rooms',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'branch', 'priceFrom', 'isAvailable'],
    description: 'Room types. Each one belongs to a branch.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField({ useAsSlug: 'name' }),
    {
      name: 'branch',
      type: 'relationship',
      relationTo: 'branches',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      // A multi-select upload rather than a list of one-photo rows. As rows,
      // adding ten pictures meant ten separate add-then-upload cycles; here
      // the whole selection goes in at once and can be dragged into order.
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      minRows: 3,
      admin: {
        description:
          'Select or drag in several at once. At least three. The first is the cover — drag to reorder.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      type: 'collapsible',
      label: 'Price and capacity',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'priceFrom',
              type: 'number',
              min: 0,
              admin: { width: '50%', description: 'Nightly rate to show as "from".' },
            },
            {
              name: 'currency',
              type: 'select',
              defaultValue: 'IQD',
              options: [
                { label: 'IQD', value: 'IQD' },
                { label: 'USD', value: 'USD' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'maxGuests',
              type: 'number',
              min: 1,
              admin: { width: '33%' },
            },
            {
              name: 'bedType',
              type: 'select',
              options: [
                { label: 'Single', value: 'single' },
                { label: 'Double', value: 'double' },
                { label: 'Twin', value: 'twin' },
                { label: 'King', value: 'king' },
                { label: 'Suite', value: 'suite' },
              ],
              admin: { width: '33%' },
            },
            {
              name: 'sizeSqm',
              type: 'number',
              label: 'Size (m²)',
              min: 0,
              admin: { width: '33%' },
            },
          ],
        },
      ],
    },
    {
      name: 'amenities',
      type: 'select',
      hasMany: true,
      options: roomAmenityOptions,
    },
    {
      name: 'isAvailable',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to hide this room from the website without deleting it.',
      },
    },
  ],
}
