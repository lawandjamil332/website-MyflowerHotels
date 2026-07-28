import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      // Localized, so a photo described in English is not read out in English
      // to somebody using the Kurdish site — but not required.
      //
      // Requiring it sounds like the accessible choice and is the opposite of
      // one. Nobody uploading two hundred hotel photographs writes two hundred
      // real descriptions; they write "1", "photo", "aaa", and a screen reader
      // announcing "photo, photo, photo" down a gallery is worse than one with
      // something sensible to fall back on. Every place this site renders an
      // image already falls back to the hotel's name, the room's name or the
      // site's name, so a blank here is never a blank on the page.
      name: 'alt',
      type: 'text',
      localized: true,
      admin: {
        description:
          'What is in the photo, in a few words — "Double room with balcony". ' +
          'Read aloud to guests who cannot see it, and used by Google. ' +
          'Leave it empty and the hotel or room name is used instead.',
      },
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
