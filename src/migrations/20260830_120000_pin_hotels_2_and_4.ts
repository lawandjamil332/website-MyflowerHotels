import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Where My Flower 2 and My Flower 4 are.
 *
 * Both have had a maps.app.goo.gl link since July and no map on their page,
 * because a short link carries no position — it is a forwarding address, and
 * the server has to ask Google where it goes. For these two, twice, Google did
 * not answer. The save succeeded, the link sat in the box looking correct, and
 * the page had no map. Nothing said so until the dashboard started counting
 * them.
 *
 * The owner sent the desktop Maps URL for each, which needs nobody's
 * permission to read because the position is written inside it:
 *
 *   .../@36.1690428,44.0150067,170m/data=...!3d36.1689856!4d44.0149091
 *         └── where his screen was ──┘         └──── the hotel ────┘
 *
 * Those two pairs are not the same thing, and taking the wrong one is how a
 * pin ends up on the far side of the street. `@` is the centre of the map
 * view; `!3d!4d` is the place. Google's own sidebar settles it — it prints a
 * plus code, which is a position written as letters, so encoding each
 * candidate and comparing is a check that needs no network and no trust:
 *
 *   My Flower 4, Google shows 5297+HX     My Flower 2, Google shows 524C+MPJ
 *     !3d/!4d  ->  5297+HX   ✓              !3d/!4d  ->  524C+MPJ  ✓
 *     @        ->  5298+J2   ✗                @      ->  5249+RMQ  ✗
 *
 * The viewport would have put My Flower 2 roughly a block away. Both pins fall
 * inside the Erbil box `coordsFromMapsUrl` checks against.
 *
 * My Flower 4 is on Kirkuk Road, opposite the Wlat Hotel — the same road as My
 * Flower 3. My Flower 2 is on Peshawa Qazi, by the Noble and Zahrat al Shams
 * hotels.
 *
 * The short links are replaced at the same time, with the coordinate form
 * Google documents. Two reasons. It opens a pin on the building rather than a
 * listing, which is what somebody pressing "Get directions" wants; and it
 * carries the numbers in its own text, so if a pin is ever cleared again the
 * site can read it back without asking anyone. That is the whole failure this
 * migration exists to end, and leaving the links that caused it in place would
 * be leaving it armed.
 */
const PINS = [
  { slug: 'my-flower-2', latitude: 36.1567193, longitude: 44.0217615, was: 'https://maps.app.goo.gl/XNo4tf3JvG1WDdk37' },
  { slug: 'my-flower-4', latitude: 36.1689856, longitude: 44.0149091, was: 'https://maps.app.goo.gl/Cazd7CTLMFcW6Nrq9' },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const pin of PINS) {
    await db.execute(sql`
      UPDATE "branches" SET
        "latitude" = ${pin.latitude},
        "longitude" = ${pin.longitude},
        "google_maps_url" = ${`https://www.google.com/maps/search/?api=1&query=${pin.latitude},${pin.longitude}`}
      WHERE "slug" = ${pin.slug};
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const pin of PINS) {
    await db.execute(sql`
      UPDATE "branches" SET
        "latitude" = NULL,
        "longitude" = NULL,
        "google_maps_url" = ${pin.was}
      WHERE "slug" = ${pin.slug};
    `)
  }
}
