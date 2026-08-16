import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { branchAmenityOptions } from '../fields/amenities'
import {
  ERBIL,
  coordsFromMapsUrl,
  isShortMapsLink,
  resolveShortMapsLink,
} from '../utilities/mapsUrl'

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
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // The map on the branch page is drawn from latitude and longitude, but
        // what staff have to hand is whatever Google's Share button copied.
        // Read the numbers out of the link so pasting it is enough, and never
        // overwrite coordinates somebody has entered deliberately.
        if (!data?.googleMapsUrl) return data
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') return data

        // Bounded to Erbil: a link that reads as somewhere else was misread,
        // and leaving the map empty is better than pinning the wrong city.
        let coords = coordsFromMapsUrl(data.googleMapsUrl, ERBIL)
        if (!coords && isShortMapsLink(data.googleMapsUrl)) {
          coords = await resolveShortMapsLink(data.googleMapsUrl, ERBIL)
        }
        if (coords) {
          data.latitude = coords.latitude
          data.longitude = coords.longitude
        }
        return data
      },
    ],
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
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description:
          'Exterior, lobby, restaurant, views. Select or drag in several at once, and drag to reorder.',
      },
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
          name: 'nearby',
          type: 'textarea',
          localized: true,
          admin: {
            description:
              'What this hotel is near, in a sentence or two — "Ten minutes from the Citadel and the bazaar, five from Family Mall, twenty from the airport." Guests search for a hotel near a place far more often than by name, and this is the only thing on the page that can answer them. Write it the way you would say it on the phone.',
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
                description:
                  'Filled in automatically from the Google Maps link above. Only type these in by hand if the map does not appear.',
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
            description:
              "Paste the Share link from Google Maps. The map on the hotel's page appears by itself — the coordinates below fill in from this link when you save.",
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
              admin: { width: '50%', description: "This hotel's own page." },
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
          // Reception here is staffed around the clock, which is worth saying
          // plainly. It cannot be a time typed into a text box: the field is
          // not localized, so "24 hours" would appear in English on the
          // Kurdish and Arabic pages. A checkbox lets the site say it in
          // whichever language the guest is reading.
          name: 'checkInAnyTime',
          type: 'checkbox',
          label: 'Check-in at any hour (24-hour reception)',
          defaultValue: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'checkInTime',
              type: 'text',
              admin: {
                width: '50%',
                placeholder: '14:00',
                condition: (data) => !data?.checkInAnyTime,
                description: 'Only needed when check-in is not available around the clock.',
              },
            },
            {
              name: 'checkOutTime',
              type: 'text',
              admin: {
                width: '50%',
                placeholder: '12:00',
                description: 'On a 24-hour clock, so midday is 12:00 and midnight is 00:00.',
              },
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
        {
          // Typed in, not fetched. A score read live from another site is a
          // dependency that can fail or change shape on a page that has to
          // render; three numbers checked now and then are enough, and the
          // date is what keeps them honest.
          type: 'row',
          fields: [
            {
              name: 'bookingComScore',
              type: 'number',
              label: 'Booking.com score',
              min: 0,
              max: 10,
              admin: { width: '33%', placeholder: '7.3', description: 'Out of 10.' },
            },
            {
              name: 'bookingComReviews',
              type: 'number',
              label: 'Booking.com reviews',
              min: 0,
              admin: { width: '33%', placeholder: '1558' },
            },
            {
              name: 'bookingComChecked',
              type: 'date',
              label: 'Checked on',
              admin: {
                width: '33%',
                date: { pickerAppearance: 'dayOnly' },
                description: 'The page says this date, so an old score reads as old rather than wrong.',
              },
            },
          ],
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
