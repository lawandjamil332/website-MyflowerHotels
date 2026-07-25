import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { branchAmenityOptions } from '../fields/amenities'

/**
 * The three properties. Prose is localized so each branch reads naturally in
 * English, Kurdish and Arabic; identifiers and contact details are not,
 * because a phone number is the same in every language and asking staff to
 * retype it three times only invites mistakes.
 */
export const Branches: CollectionConfig = {
  slug: 'branches',
  labels: {
    singular: 'Branch',
    plural: 'Branches',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'order'],
    description: 'Each hotel in the group. The homepage lists these in the order set below.',
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField({ useAsSlug: 'name' }),
    {
      name: 'tagline',
      type: 'text',
      localized: true,
      admin: {
        description: 'One line, shown under the name on the branch card.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'The full-width photo at the top of the branch page. Landscape works best.',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: {
        description: 'Exterior, lobby, restaurant, views.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Location',
      fields: [
        {
          name: 'address',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'city',
          type: 'text',
          localized: true,
          defaultValue: 'Erbil',
        },
        {
          name: 'neighbourhood',
          type: 'text',
          localized: true,
          admin: {
            description:
              'The street or landmark, e.g. "100m Street — beside Today Restaurant". Shown under the hotel name, and it is what guests actually choose between when the hotels are numbered.',
          },
        },
        {
          // Two plain numbers rather than Payload's `point` type: `point`
          // compiles to a PostGIS `geometry` column, and Railway's Postgres
          // does not ship PostGIS. A map pin only needs these two values.
          type: 'row',
          fields: [
            {
              name: 'latitude',
              type: 'number',
              admin: {
                width: '50%',
                placeholder: '36.191',
                description: 'In Google Maps, right-click the spot and click the numbers to copy.',
              },
            },
            {
              name: 'longitude',
              type: 'number',
              admin: { width: '50%', placeholder: '44.009' },
            },
          ],
        },
        {
          name: 'googleMapsUrl',
          type: 'text',
          label: 'Google Maps URL',
          admin: {
            description: 'Opens the pin directly. Paste the share link from Google Maps.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Contact',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'phone',
              type: 'text',
              admin: { width: '50%', placeholder: '+964 772 541 9898' },
            },
            {
              // Every hotel in the group advertises two lines; one field
              // forced staff to drop a number the guest may be dialling.
              name: 'phoneAlt',
              type: 'text',
              label: 'Second phone',
              admin: { width: '50%', placeholder: '+964 750 668 9090' },
            },
          ],
        },
        {
          name: 'whatsapp',
          type: 'text',
          label: 'WhatsApp',
          admin: {
            description: 'Full international format, e.g. +9647501234567.',
          },
        },
        {
          name: 'email',
          type: 'email',
        },
        {
          type: 'row',
          fields: [
            {
              // Each hotel runs its own Facebook page, so these cannot live
              // only on the group-wide settings.
              name: 'facebook',
              type: 'text',
              admin: { width: '50%', description: 'This hotel\'s own page.' },
            },
            {
              name: 'instagram',
              type: 'text',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Stay details',
      fields: [
        {
          name: 'amenities',
          type: 'select',
          hasMany: true,
          options: branchAmenityOptions,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'checkInTime',
              type: 'text',
              admin: { width: '50%', placeholder: '14:00' },
            },
            {
              name: 'checkOutTime',
              type: 'text',
              admin: { width: '50%', placeholder: '12:00' },
            },
          ],
        },
        {
          name: 'bookingComUrl',
          type: 'text',
          label: 'Booking.com URL',
          admin: {
            description: 'Optional. Shows an "instant reservation" button when filled in.',
          },
        },
      ],
    },
    {
      // A hotel that is announced but not yet taking guests still belongs on
      // the site — it is the strongest thing a growing group can show. It
      // just must not offer a phone number nobody is answering.
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Opening soon', value: 'openingSoon' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Set to "Opening soon" and the hotel is shown with its photo and a notice instead of phone numbers and rooms.',
      },
    },
    {
      name: 'openingNote',
      type: 'text',
      localized: true,
      admin: {
        position: 'sidebar',
        placeholder: 'Opening spring 2026',
        condition: (data) => data?.status === 'openingSoon',
        description: 'Optional. Replaces the default "Opening soon" wording.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first on the homepage.',
      },
    },
  ],
}
