import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

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

/**
 * True only when all four bucket variables are present. Without them Payload
 * writes uploads into the container's own filesystem, which the host erases on
 * every deploy — the pictures look fine for hours and are gone by the next
 * release, with nothing in the interface to explain it.
 */
const bucketConnected = (): boolean =>
  Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  )

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  hooks: {
    beforeValidate: [
      ({ req }) => {
        // Only a person uploading through the admin panel is stopped. Seeds
        // and migrations run without a signed-in user and are left alone, and
        // local development has no bucket by design.
        const isPerson = Boolean(req?.user) && Boolean(req?.file)
        if (!isPerson) return
        if (process.env.NODE_ENV !== 'production') return
        if (bucketConnected()) return

        throw new APIError(
          'Photo storage is not connected yet, so this picture would be deleted the next time the site updates. ' +
            'In Railway: + Create → Storage Bucket, then copy its four values into this service\'s Variables as ' +
            'S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and S3_BUCKET, and redeploy. Then upload again.',
          400,
        )
      },
    ],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      // Required and localized: screen readers and Google both depend on this,
      // and a photo described only in English is no use on the Kurdish and
      // Arabic versions of the site.
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
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
