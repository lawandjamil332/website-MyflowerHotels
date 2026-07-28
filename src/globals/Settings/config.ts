import type { GlobalConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

/**
 * Group-wide details that are not specific to any one branch.
 * The header, footer and the sticky WhatsApp button all read from here.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Site settings',
  access: {
    read: anyone,
    update: authenticated,
  },
  admin: {
    description: 'Logo, group name and the contact details shown site-wide.',
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      localized: true,
      defaultValue: 'My Flower Hotels',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'establishedYear',
          type: 'number',
          admin: {
            width: '50%',
            placeholder: '2012',
            description: 'Shown as "Since 2012" in the footer. Leave empty to hide it.',
          },
        },
        {
          name: 'stars',
          type: 'select',
          label: 'Star rating',
          options: ['3', '4', '5'],
          admin: {
            width: '50%',
            description: 'Shown beside the hotel name. Leave empty to hide it.',
          },
        },
      ],
    },
    {
      name: 'iqdPerUsd',
      type: 'number',
      label: 'Dinars per US dollar',
      admin: {
        placeholder: '1310',
        description:
          'Lets guests switch prices between dinars and dollars. Put in how many dinars one dollar buys — check it every few months. Leave empty and prices stay in dinars only, with no switch shown.',
      },
    },
    {
      name: 'pointsEnabled',
      type: 'checkbox',
      label: 'Collect points on stays',
      defaultValue: true,
      admin: {
        description: 'Turn the loyalty scheme on or off across the whole site.',
      },
    },
    {
      name: 'pointsPer1000Iqd',
      type: 'number',
      label: 'Points per 1,000 IQD spent',
      min: 0,
      defaultValue: 1,
      admin: {
        description:
          'Points a guest earns for every 1,000 dinars of a completed stay. Change it whenever you like — it only affects stays completed afterwards.',
        condition: (data) => Boolean(data?.pointsEnabled),
      },
    },
    {
      // When to start saying how few are left.
      //
      // Deliberately a threshold and not a fixed number to print. Saying "2
      // left" when nine are free is a false statement of fact to a guest, and
      // it is the exact practice the UK regulator forced Booking.com and five
      // other sites to drop in 2019 — the EU followed. A hotel this size does
      // not need it: with a handful of each room type the real number is
      // usually low anyway, and a true "Only 2 left" is believed, where a
      // permanent one is eventually noticed and believed about nothing else on
      // the site either.
      name: 'lowStockAt',
      type: 'number',
      label: 'Say how many are left when this few remain',
      min: 0,
      defaultValue: 3,
      admin: {
        description:
          'Above this number the site says nothing about how many rooms are free, so the count only ever appears when it is genuinely low. Set to 0 to never show it.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Shown in the header. A transparent PNG or SVG works best.',
      },
    },
    {
      name: 'socialShareImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Used when a link to the site is shared on WhatsApp or Facebook.',
      },
    },
    {
      type: 'collapsible',
      label: 'Primary contact',
      fields: [
        { name: 'phone', type: 'text' },
        {
          name: 'whatsapp',
          type: 'text',
          label: 'WhatsApp',
          admin: {
            description:
              'Full international format, e.g. +9647501234567. Powers the floating WhatsApp button.',
          },
        },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: 'Social links',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'tiktok', type: 'text', label: 'TikTok' },
        { name: 'youtube', type: 'text', label: 'YouTube' },
      ],
    },
  ],
}
