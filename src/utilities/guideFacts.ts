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

export const getGuideFacts = async (locale: Locale): Promise<GuideFacts> => {
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
      .replaceAll('{year}', settings.establishedYear ? String(settings.establishedYear) : '2012')

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
}
