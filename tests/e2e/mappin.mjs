import { execSync } from 'node:child_process'

/**
 * A hotel's map has to be fixable from the hotel's own screen.
 *
 * Two of the four hotels had a Google Maps link in the box and no map on the
 * page for a month. The link was a short "maps.app.goo.gl" one, which hides
 * the position behind a redirect the server has to follow, and when that
 * follow fails the save still succeeds — so the box looks right, the page has
 * no map, and nobody is told.
 *
 * The fix is that the same box takes the numbers themselves, which is what
 * Google Maps' right-click menu copies. Nothing to resolve, nothing to fail.
 * This suite holds that path open: a pasted pair becomes a pin, becomes a
 * working link, and a pair from the wrong city is still refused.
 *
 * It runs in process, because it is the save hook being tested rather than a
 * page. It puts the hotel back exactly as it found it.
 */

const DB = process.env.DATABASE_URI
const q = (sql) =>
  execSync(`psql "${DB}" -t -A -c ${JSON.stringify(sql.replace(/\s+/g, ' '))}`).toString().trim()

let fails = 0
const ok = (label, condition, detail = '') => {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!condition) fails++
}

const { getPayload } = await import('payload')
const configPromise = (await import('@payload-config')).default
const { coordsFromPaste, ERBIL, mapsSearchUrl } = await import('@/utilities/mapsUrl')

const payload = await getPayload({ config: configPromise })

// ---- Reading a pasted pair ------------------------------------------------
{
  ok(
    'the numbers Google Maps copies are read as they are pasted',
    JSON.stringify(coordsFromPaste('36.191100, 44.009200', ERBIL)) ===
      JSON.stringify({ latitude: 36.1911, longitude: 44.0092 }),
  )
  ok('a pair with no space is read too', Boolean(coordsFromPaste('36.1911,44.0092', ERBIL)))
  ok('and one pasted with spaces around it', Boolean(coordsFromPaste('  36.1911, 44.0092  ', ERBIL)))
  ok('a pair from another city is refused', coordsFromPaste('51.5074, -0.1278', ERBIL) === null)
  ok('and the Atlantic, which is what a failed read looks like', coordsFromPaste('0,0', ERBIL) === null)
  ok('a link is not mistaken for a pair', coordsFromPaste('https://maps.app.goo.gl/abc', ERBIL) === null)
  ok(
    'and neither is a viewport buried in one',
    coordsFromPaste('https://www.google.com/maps/@36.1911,44.0092,17z', ERBIL) === null,
  )
}

// ---- Pasting one into a hotel --------------------------------------------
{
  const id = Number(q(`SELECT id FROM branches ORDER BY id LIMIT 1`))
  const was = q(
    `SELECT COALESCE(latitude::text,'') || '|' || COALESCE(longitude::text,'') || '|' ||
            COALESCE(google_maps_url,'') FROM branches WHERE id = ${id}`,
  ).split('|')

  const restore = () =>
    q(`UPDATE branches SET latitude = ${was[0] || 'NULL'}, longitude = ${was[1] || 'NULL'},
          google_maps_url = ${was[2] ? `'${was[2]}'` : 'NULL'} WHERE id = ${id}`)

  try {
    // A pin somewhere else in Erbil, so it cannot be confused with what was there.
    const moved = { latitude: 36.2, longitude: 44.05 }
    await payload.update({
      collection: 'branches',
      id,
      data: { googleMapsUrl: `${moved.latitude}, ${moved.longitude}` },
    })

    const after = q(
      `SELECT latitude::float || '|' || longitude::float || '|' || google_maps_url
         FROM branches WHERE id = ${id}`,
    ).split('|')

    ok('pasting the numbers pins the hotel', Number(after[0]) === moved.latitude && Number(after[1]) === moved.longitude,
      `${after[0]}, ${after[1]}`)
    ok('and the box is left holding a link that works, not two numbers',
      after[2] === mapsSearchUrl(moved), after[2])

    // The point of taking a pair at all: correcting a pin that is already set.
    const corrected = { latitude: 36.21, longitude: 44.06 }
    await payload.update({
      collection: 'branches',
      id,
      data: { googleMapsUrl: `${corrected.latitude},${corrected.longitude}` },
    })
    const again = q(`SELECT latitude::float FROM branches WHERE id = ${id}`)
    ok('a second paste corrects a pin that was already there', Number(again) === corrected.latitude, again)

    // And a pair from the wrong city changes nothing.
    await payload.update({
      collection: 'branches',
      id,
      data: { googleMapsUrl: 'https://maps.google.com/?q=51.5074,-0.1278' },
    })
    const kept = q(`SELECT latitude::float FROM branches WHERE id = ${id}`)
    ok('a position outside Erbil never becomes the pin', Number(kept) === corrected.latitude, kept)
  } finally {
    restore()
  }

  const back = q(`SELECT COALESCE(google_maps_url,'') FROM branches WHERE id = ${id}`)
  ok('and the hotel is put back as it was found', back === was[2], back)
}

console.log(`\n${fails} failed`)
process.exit(fails ? 1 : 0)
