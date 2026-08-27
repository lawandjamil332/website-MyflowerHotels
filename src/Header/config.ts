import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    // The site's header is SiteHeader, which reads Site settings. This global
    // is the template's own header and nothing renders it — editing the links
    // in here changes nothing a guest sees, which is worse than having no
    // control at all. Hidden rather than removed: it holds data, and deleting
    // the global would need a migration for nothing gained.
    hidden: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
