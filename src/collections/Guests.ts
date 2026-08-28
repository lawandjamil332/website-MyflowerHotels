import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

/**
 * A guest's own account. Separate from `users`, which is staff.
 *
 * Two auth collections rather than one with a role, because the blast radius
 * of getting a role check wrong is the whole admin panel. A guest signing in
 * here cannot reach the admin panel at all — not because a check says no, but
 * because this collection is not admitted to it.
 *
 * An account is never required to book. It is offered after the room is
 * already held, which is the only order that does not cost bookings.
 */
export const Guests: CollectionConfig = {
  slug: 'guests',
  labels: { singular: 'Guest', plural: 'Guests' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // a month; a guest should not be signed out between stays
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    // Anyone may open an account. Reading and editing is staff-only through
    // this API — a guest reads their own record through the session, never by
    // asking for another guest's id.
    create: anyone,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'phone', 'createdAt'],
    description: 'Guests who opened an account on the website.',
    group: 'Bookings & guests',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text' },
  ],
  timestamps: true,
}
