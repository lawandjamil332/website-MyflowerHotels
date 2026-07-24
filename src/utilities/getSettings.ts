import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Locale } from '@/i18n/config'
import type { Setting } from '@/payload-types'

export type SiteSettings = Partial<Setting>

/**
 * Site-wide settings, tolerant of an unreachable database.
 *
 * The deploy build runs without one, and before anyone has opened Site
 * settings in the admin panel the global has no stored values — neither case
 * should take the page down, so both fall back to empty.
 */
export const getSettings = async (locale?: Locale): Promise<SiteSettings> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = await payload.findGlobal({
      slug: 'settings',
      locale,
      depth: 1,
      overrideAccess: false,
    })
    return (settings ?? {}) as SiteSettings
  } catch {
    return {}
  }
}
