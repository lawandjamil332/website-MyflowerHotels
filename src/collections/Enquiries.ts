import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

/**
 * Reservation enquiries submitted from the website. Anyone may create one
 * (that is the public form), but only staff can read or change them.
 */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: {
    singular: 'Enquiry',
    plural: 'Enquiries',
  },
  access: {
    create: anyone,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'branch', 'checkIn', 'guests', 'status', 'createdAt'],
    description: 'Enquiries sent from the website. Newest first.',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'phone', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'branch',
      type: 'relationship',
      relationTo: 'branches',
      admin: {
        description: 'Which hotel the guest is asking about.',
      },
    },
    {
      name: 'room',
      type: 'relationship',
      relationTo: 'rooms',
      admin: {
        description: 'Set automatically when the enquiry comes from a room page.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'checkIn',
          type: 'date',
          admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'checkOut',
          type: 'date',
          admin: { width: '33%', date: { pickerAppearance: 'dayOnly' } },
        },
        { name: 'guests', type: 'number', min: 1, admin: { width: '33%' } },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
