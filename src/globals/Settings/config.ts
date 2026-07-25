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
