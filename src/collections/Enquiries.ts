import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { sendEnquiryEmail } from '../utilities/enquiryEmail'
import type { Branch, Room } from '../payload-types'

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
    group: 'Reservations',
  },
  defaultSort: '-createdAt',
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc

        // Deliberately not awaited. The guest is waiting on this response, and
        // a slow or unreachable mail server must not hold up the "thank you" —
        // the enquiry is already saved by the time this runs, so the send has
        // nothing left to protect.
        void (async () => {
          try {
            const branch =
              typeof doc.branch === 'object'
                ? doc.branch
                : doc.branch
                  ? await req.payload.findByID({
                      collection: 'branches',
                      id: doc.branch,
                      depth: 0,
                    })
                  : null

            const room =
              typeof doc.room === 'object'
                ? doc.room
                : doc.room
                  ? await req.payload.findByID({ collection: 'rooms', id: doc.room, depth: 0 })
                  : null

            const settings = await req.payload.findGlobal({ slug: 'settings', depth: 0 })

            await sendEnquiryEmail({
              payload: req.payload,
              enquiry: doc,
              branch: branch as Branch | null,
              room: room as Room | null,
              groupEmail: (settings as { email?: string | null })?.email,
              siteUrl: process.env.NEXT_PUBLIC_SERVER_URL,
            })
          } catch (error) {
            req.payload.logger.error(`Enquiry ${doc.id}: could not be announced — ${error}`)
          }
        })()

        return doc
      },
    ],
  },
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
