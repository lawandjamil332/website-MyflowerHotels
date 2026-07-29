/**
 * The things that must be right before anything reads the database.
 *
 * Site name and address are needed in places that cannot wait for a query —
 * robots.txt, the sitemap, the share card on a page that failed to load — so
 * they are constants rather than settings. The admin panel's Site name still
 * wins everywhere a query is possible; this is the floor, not the ceiling.
 */
export const SITE_NAME = 'My Flower Hotels'

/**
 * The real address, as the fallback rather than localhost.
 *
 * NEXT_PUBLIC_SERVER_URL still wins when it is set, and setting it on the
 * server is still the right thing to do. But the old fallback was
 * http://localhost:3000, and because that variable was never set on the deploy
 * it is what went into the live robots.txt and sitemap — a machine told the
 * whole web that this hotel group lives on a laptop. A wrong default that is
 * merely stale beats a wrong default that is impossible.
 */
export const SITE_URL = 'https://myflowerhotels.com'

/**
 * Google Search Console's proof that this site belongs to its owner.
 *
 * Public by design — it proves nothing on its own, it only matches a value
 * Google already holds. Kept here rather than in an environment variable so it
 * cannot go missing from a deploy and quietly un-verify the property months
 * later, which is the failure nobody notices until they need the data.
 *
 * There is a second proof beside this one: public/google6d13b2b6bf038d72.html,
 * the file method. Either alone is enough. Both are kept because they fail
 * differently — a tag can be lost to a layout change, a file to a build that
 * stops copying public/ — and Search Console drops a property that can no
 * longer prove itself.
 */
export const GOOGLE_SITE_VERIFICATION = '5FtrThzn115CgCmt_cubesRkeP3XW4rJG-6Z6paj77g'

export const SITE_DESCRIPTION =
  'Four hotels in Erbil, Kurdistan Region of Iraq. One standard of hospitality. Book direct and pay at the hotel.'
