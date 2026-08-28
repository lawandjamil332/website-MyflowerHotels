import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Rooms for the suites to run against.
 *
 * Twelve of the eighteen suites need a bookable room — they book one, oversell
 * it, cancel it, review it, print its pass. None of them creates one, because
 * on the live database eighteen rooms have existed since before these suites
 * were written, typed into the admin panel by hand.
 *
 * No migration creates a room either. So on any database but that one, the
 * whole suite collapsed at the first `room.id` with "cannot read properties of
 * undefined" — and that is what it did the first time it was ever run outside
 * the live environment, which was today. A regression suite that only runs
 * where the data already happens to be right is not protecting anything.
 *
 * This makes the fixture explicit. It runs before the suites and does nothing
 * at all unless the rooms table is completely empty.
 *
 * That guard is the important part, and it is deliberately blunt. These suites
 * write real rows to whatever database they are pointed at, so the one thing
 * this must never do is add stock to a hotel that is really selling it. "No
 * rooms anywhere" is a condition no live database can satisfy, so pointing the
 * suite at production leaves this a no-op — it can only ever populate an empty
 * one.
 */

/**
 * Sizes and layouts are filled in, not left blank.
 *
 * The room FAQ writes "sleeps two, one bedroom and a living room, 45 m²" from
 * these fields and says nothing where they are empty — so a fixture without
 * them produces a site that is behaving correctly and a suite that fails.
 * One room is deliberately plain, because the suite also checks that a room
 * with nothing filled in still describes itself.
 */
const ROOMS = [
  {
    name: 'Deluxe Double',
    bedType: 'double',
    maxGuests: 2,
    priceFrom: 100000,
    quantity: 6,
    sizeSqm: 28,
    bedrooms: 1,
    bathrooms: 1,
  },
  // Deliberately plain — a size and nothing else. The room-FAQ suite uses this
  // one to prove a room with no layout entered still describes itself and does
  // not borrow the apartment's. Its numbers match what the suite expects,
  // because the suites were written against the eighteen real rooms and this
  // fixture exists to stand in for them, not to invent a different world.
  {
    name: 'Executive King',
    bedType: 'king',
    maxGuests: 3,
    priceFrom: 150000,
    quantity: 4,
    sizeSqm: 30,
  },
  // Nothing beyond the essentials, so the "a plain room still describes
  // itself" check has something plain to describe.
  { name: 'Twin Room', bedType: 'twin', maxGuests: 2, priceFrom: 110000, quantity: 4, sizeSqm: 26 },
  // Deliberately down to one: the low-stock suite needs a room that can be
  // taken to the threshold, and the oversell path needs one that runs out.
  {
    name: 'Garden Suite',
    bedType: 'suite',
    maxGuests: 2,
    priceFrom: 250000,
    quantity: 1,
    sizeSqm: 60,
    bedrooms: 2,
    livingRooms: 1,
    bathrooms: 2,
    hasKitchen: true,
  },
]

/**
 * A room needs at least three photographs — the collection requires it, and
 * that rule is worth keeping rather than relaxing for tests, because it is
 * the reason no hotel on this site ships with an empty gallery.
 *
 * The three exterior shots that ship in the repository are used, so the
 * fixture needs no network and no bucket.
 */
const ensurePhotos = async (payload) => {
  const existing = await payload.find({ collection: 'media', limit: 3 })
  if (existing.docs.length >= 3) return existing.docs.map((d) => d.id)

  const here = dirname(fileURLToPath(import.meta.url))
  const shipped = ['my-flower-1.jpg', 'my-flower-2.jpg', 'my-flower-3.jpg']

  const ids = []
  for (const file of shipped) {
    const doc = await payload.create({
      collection: 'media',
      data: { alt: `My Flower Hotels, Erbil — ${file.replace(/\.jpg$/, '')}` },
      filePath: join(here, '..', 'public', 'hotels', file),
      overrideAccess: true,
    })
    ids.push(doc.id)
  }
  return ids
}

export const ensureRooms = async () => {
  const payload = await getPayload({ config })

  const existing = await payload.count({ collection: 'rooms' })
  if (existing.totalDocs > 0) {
    return { created: 0, reason: `${existing.totalDocs} room(s) already present` }
  }

  const branches = await payload.find({ collection: 'branches', limit: 50, sort: 'order' })
  if (branches.docs.length === 0) {
    return { created: 0, reason: 'no hotels — run the migrations first' }
  }

  const images = await ensurePhotos(payload)

  let created = 0
  for (const branch of branches.docs) {
    for (const room of ROOMS) {
      await payload.create({
        collection: 'rooms',
        data: {
          name: `${room.name} — ${branch.name}`,
          branch: branch.id,
          images,
          bedType: room.bedType,
          maxGuests: room.maxGuests,
          priceFrom: room.priceFrom,
          currency: 'IQD',
          quantity: room.quantity,
          sizeSqm: room.sizeSqm,
          bedrooms: room.bedrooms,
          livingRooms: room.livingRooms,
          bathrooms: room.bathrooms,
          hasKitchen: room.hasKitchen,
          isAvailable: true,
          amenities: ['wifi', 'air_conditioning'],
        },
        overrideAccess: true,
      })
      created++
    }
  }
  return { created, reason: `seeded ${created} rooms across ${branches.docs.length} hotels` }
}

// Run directly, the way the suites are, so the @payload-config alias resolves
// through tsx. run.mjs invokes this as a subprocess rather than importing it:
// the runner itself is plain node and cannot resolve that alias.
const result = await ensureRooms()
process.stdout.write(`Fixture: ${result.reason}\n`)
if (result.created > 0) {
  process.stdout.write('These rows stay behind; drop the database to clear them.\n')
}

// Exit explicitly. Payload holds its Postgres pool open, so this script never
// ends on its own — and the runner waits for it with execFileSync, so without
// this the whole suite hangs after the fixture and before the first test, with
// nothing printed to say why. It looked exactly like a stuck browser.
process.exit(0)
