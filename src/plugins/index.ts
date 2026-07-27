import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { s3Storage } from '@payloadcms/storage-s3'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { postgresStorage } from '@/storage/postgresStorage'
import {
  bucketConfigured,
  storageAccessKeyId,
  storageBucket,
  storageEndpoint,
  storageRegion,
  storageSecretKey,
} from '@/utilities/storageEnv'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

// Uploads must never land on the container's filesystem: the host replaces it
// on every deploy, so photographs uploaded today are gone by the next release
// and the database is left pointing at files that do not exist.
//
// A storage bucket is the better answer and is used whenever one is
// configured. When none is, the files go into Postgres instead of onto the
// disposable disk — the database already exists, already has a permanent
// volume and is already backed up, so uploads survive with no setup at all.
const storagePlugins: Plugin[] = bucketConfigured()
  ? [
      s3Storage({
        collections: {
          media: true,
        },
        bucket: storageBucket() as string,
        config: {
          endpoint: storageEndpoint(),
          region: storageRegion(),
          credentials: {
            accessKeyId: storageAccessKeyId() || '',
            secretAccessKey: storageSecretKey() || '',
          },
          // Bucket-in-path addressing; required by most S3-compatible stores.
          forcePathStyle: true,
        },
      }),
    ]
  : [
      cloudStoragePlugin({
        collections: {
          media: { adapter: postgresStorage(), disableLocalStorage: true },
        },
      }),
    ]

export const plugins: Plugin[] = [
  ...storagePlugins,
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
]
