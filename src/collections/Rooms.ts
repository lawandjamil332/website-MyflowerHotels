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
    group: 'Hotels',
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
              label: 'Main bed',
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
      // What the unit actually consists of.
      //
      // Some of these hotels let apartments — two bedrooms and a hall — and
      // there was nowhere to say so. "Max guests 6, bed: suite" describes that
      // no better than it describes one large room with six beds in it, and the
      // difference is the entire reason a family picks one over the other.
      //
      // Counts rather than a written description, so the site can put them in a
      // line in three languages without anybody writing that line three times.
      type: 'collapsible',
      label: 'Layout',
      admin: {
        description:
          'Leave these blank for an ordinary single room. Fill them in for apartments and suites.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'bedrooms',
              type: 'number',
              min: 0,
              admin: { width: '25%', description: 'Separate sleeping rooms.' },
            },
            {
              name: 'livingRooms',
              type: 'number',
              label: 'Halls / living rooms',
              min: 0,
              admin: { width: '25%', description: 'A hall counts here.' },
            },
            {
              name: 'bathrooms',
              type: 'number',
              min: 0,
              admin: { width: '25%' },
            },
            {
              name: 'hasKitchen',
              type: 'checkbox',
              label: 'Kitchen',
              admin: { width: '25%' },
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
      // How many rooms of this type the hotel actually has. Without it the
      // site knows a "Deluxe Double" exists but not whether the ninth guest
      // asking for one in August can have it, which is the whole question a
      // booking system exists to answer.
      name: 'quantity',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 1,
      admin: {
        position: 'sidebar',
        description:
          'How many rooms of this type this hotel has. Nine identical doubles is one room type with a quantity of 9 — not nine room types.',
      },
    },
    {
      name: 'isAvailable',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Uncheck to take this room type off the website entirely — it stops being bookable and stops being listed.',
      },
    },
  ],
}
