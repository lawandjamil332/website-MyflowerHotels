import { cache } from 'react'

import { countWord } from '@/i18n/count'
import type { Locale } from '@/i18n/config'
import { getAllRooms, getBranches } from '@/utilities/branches'
import { getSettings } from '@/utilities/getSettings'
import { roomsAcross, roomsPerBranch } from '@/utilities/roomCount'
import type { Branch, Room } from '@/payload-types'

/**
 * The facts the three guide pages fill themselves in from.
 *
 * Not one number on those pages is typed into their text. The count of hotels,
 * the number of rooms, the year the first one opened, each address and each
 * telephone number come from the database every time the page is served — so a
 * fifth hotel, or fifteen more rooms, corrects three pages in three languages
 * without anybody remembering they exist.
 *
 * That is not tidiness. The whole argument of those pages is that everything
 * on them can be checked, and a number written into a sentence in three
 * languages is a number that will be wrong in at least one of them within a
 * year.
 */

export type GuideFacts = {
  branches: Branch[]
  rooms: Room[]
  /** Hotels open to guests — the number the pages speak about. */
  openBranches: Branch[]
  roomsByBranch: Map<number, number>
  totalRooms: number
  establishedYear?: number | null
  siteName: string
  /**
   * Fills `{count}`, `{countWord}`, `{rooms}` and `{year}` in a guide string.
   *
   * `{count}` is the number spelled out in the page's own language, because it
   * lands mid-sentence ("four hotels in Erbil"); `{countWord}` is the same word
   * capitalised, for a sentence that opens with it.
   */
  fill: (text: string) => string
}

/**
 * The founding year to fall back on when Site settings has none.
 *
 * Named rather than written into the sentence, because it is the one fact on
 * these pages that is not read from the database and it should be obvious to
 * anybody grepping for it. It matches what the About copy and the seeded
 * records already say, so a blank field cannot make three pages disagree with
 * the rest of the site — but the field is the source, and this is the floor.
 */
const FOUNDED_FALLBACK = 2012

/**
 * Wrapped in React's `cache`, which deduplicates it within one request.
 *
 * Every guide page calls this twice — once in `generateMetadata` for the title
 * and description, once in the page itself — and each call was four database
 * queries, so nine URLs were each doing eight where four would do. `cache`
 * makes the second call return the first one's result. Deliberately not
 * `unstable_cache`: that would hold the answer between requests, and these
 * pages quote prices and room counts that have to be live.
 */
export const getGuideFacts = cache(async (locale: Locale): Promise<GuideFacts> => {
  const [branches, rooms, settings] = await Promise.all([
    getBranches(locale),
    getAllRooms(locale),
    getSettings(locale),
  ])

  // A hotel still being built has no rooms anybody can sleep in and no price to
  // quote, so it is not part of "four hotels, fifty-seven rooms". All four are
  // open today; this is what keeps the sentences true on the day a fifth is
  // added to the panel before it opens.
  const openBranches = branches.filter((b) => b.status !== 'openingSoon')
  const openIds = openBranches.map((b) => Number(b.id))
  const totalRooms = roomsAcross(rooms, openIds)

  const word = countWord(openBranches.length, locale)
  // Lower-cased for mid-sentence use. Kurdish and Arabic have no case, so this
  // changes nothing in either — the argument is only passed for English.
  const lower = word.toLocaleLowerCase(locale === 'en' ? 'en' : undefined)

  const fill = (text: string): string =>
    text
      .replaceAll('{countWord}', word)
      .replaceAll('{count}', lower)
      .replaceAll('{rooms}', String(totalRooms))
      .replaceAll(
        '{year}',
        String(settings.establishedYear || FOUNDED_FALLBACK),
      )

  return {
    branches,
    rooms,
    openBranches,
    roomsByBranch: roomsPerBranch(rooms),
    totalRooms,
    establishedYear: settings.establishedYear,
    siteName: settings.siteName || 'My Flower Hotels',
    fill,
  }
})
