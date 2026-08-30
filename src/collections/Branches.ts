import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { branchAmenityOptions } from '../fields/amenities'
import {
  ERBIL,
  coordsFromMapsUrl,
  coordsFromPaste,
  isShortMapsLink,
  mapsSearchUrl,
  placeIdFrom,
  resolveShortMapsLink,
} from '../utilities/mapsUrl'

/**
 * The three properties. Prose is localized so each branch reads naturally in
 * English, Kurdish and Arabic; identifiers and contact details are not,
 * because a phone number is the same in every language and asking staff to
 * retype it three times only invites mistakes.
 */
export const Branches: CollectionConfig = {
  slug: 'branches',
  labels: {
    singular: 'Hotel',
    plural: 'Hotels',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'status', 'order'],
    group: 'Property',
    description: 'Each hotel in the group. The homepage lists these in the order set below.',
  },
  defaultSort: 'order',
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // The map on the branch page is drawn from latitude and longitude, but
        // what staff have to hand is whatever Google's Share button copied.
        // Read the numbers out of the link so pasting it is enough, and never
        // overwrite coordinates somebody has entered deliberately.
        // Whatever was pasted into the Place ID box, reduced to the ID
        // itself. The owner may paste the bare ID or a whole URL with it
        // buried in a parameter; both are the same fact, and which one he
        // happened to copy is our problem rather than his. Anything
        // unrecognisable is cleared rather than stored, so a half-pasted link
        // cannot end up in the markup claiming to identify a business.
        if (typeof data?.googlePlaceId === 'string') {
          data.googlePlaceId = placeIdFrom(data.googlePlaceId) ?? null
        }

        if (!data?.googleMapsUrl) return data

        // A coordinate pair pasted into the link box, handled before anything
        // else and even when a pin is already stored. It is the only paste
        // that carries no ambiguity — somebody typing two numbers into this
        // box is correcting the pin, and that has to win over the pin already
        // there or a wrong map could never be fixed from this screen.
        const pasted = coordsFromPaste(data.googleMapsUrl, ERBIL)
        if (pasted) {
          data.latitude = pasted.latitude
          data.longitude = pasted.longitude
          data.googleMapsUrl = mapsSearchUrl(pasted)
          return data
        }

        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') return data

        // Bounded to Erbil: a link that reads as somewhere else was misread,
        // and leaving the map empty is better than pinning the wrong city.
        let coords = coordsFromMapsUrl(data.googleMapsUrl, ERBIL)
        if (!coords && isShortMapsLink(data.googleMapsUrl)) {
          coords = await resolveShortMapsLink(data.googleMapsUrl, ERBIL)
        }
        if (coords) {
          data.latitude = coords.latitude
          data.longitude = coords.longitude
        }
        return data
      },
    ],
  },
  fields: [
    /**
     * Three screens, and no right-hand column.
     *
     * It was five tabs with a sidebar beside them, which is a filing
     * system rather than a way of working. Somebody opening a hotel wants
     * three things: the building, its rooms, and how to be reached — so
     * that is what there is. Location folded into the building it
     * describes; contact and facilities into one, because both answer
     * "what does this place offer a guest".
     *
     * Status, the opening note and the running order came out of the
     * sidebar and sit with the hotel now. That was the last thing in the
     * right-hand column, so the column is gone and the form has the whole
     * width. Three fields hidden in a second column is exactly the kind of
     * thing somebody never finds.
     *
     * Unnamed tabs, so none of this changes how a hotel is stored.
     */
    {
      type: 'tabs',
      tabs: [
        {
          label: 'The hotel',
          description: 'Its name, its photographs, and where it is.',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'tagline',
              type: 'text',
              localized: true,
              admin: {
                description: 'One line, shown under the name on the branch card.',
              },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
            },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'The full-width photo at the top of the branch page. Landscape works best.',
              },
            },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description:
                  'Exterior, lobby, restaurant, views. Select or drag in several at once, and drag to reorder.',
              },
            },
            {
              name: 'address',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'city',
              type: 'text',
              localized: true,
              defaultValue: 'Erbil',
            },
            {
              name: 'neighbourhood',
              type: 'text',
              localized: true,
              admin: {
                description:
                  'The street or landmark, e.g. "100m Street — beside Today Restaurant". Shown under the hotel name, and it is what guests actually choose between when the hotels are numbered.',
              },
            },
            {
              name: 'nearby',
              type: 'textarea',
              localized: true,
              admin: {
                description:
                  'What this hotel is near, in a sentence or two — "Ten minutes from the Citadel and the bazaar, five from Family Mall, twenty from the airport." Guests search for a hotel near a place far more often than by name, and this is the only thing on the page that can answer them. Write it the way you would say it on the phone.',
              },
            },
            {
              name: 'googleMapsUrl',
              type: 'text',
              label: 'Google Maps link or coordinates',
              admin: {
                description:
                  'Paste the Share link from Google Maps — or, better, right-click the hotel on ' +
                  'Google Maps and click the numbers at the top of the menu to copy them, then ' +
                  'paste those. The numbers always work; a short share link sometimes cannot be ' +
                  "read. Either way the map on the hotel's page appears by itself when you save.",
              },
            },
            {
              // The sentence that says whether the paste above actually
              // produced a map, so a hotel cannot sit without one unnoticed.
              name: 'mapPin',
              type: 'ui',
              admin: {
                components: { Field: '@/components/admin/MapPin' },
              },
            },
            {
              // A hotel that is announced but not yet taking guests still belongs on
              // the site — it is the strongest thing a growing group can show. It
              // just must not offer a phone number nobody is answering.
              name: 'status',
              type: 'select',
              defaultValue: 'open',
              options: [
                { label: 'Open', value: 'open' },
                { label: 'Opening soon', value: 'openingSoon' },
              ],
              admin: {
                description:
                  'Set to "Opening soon" and the hotel is shown with its photo and a notice instead of phone numbers and rooms.',
                components: { Cell: '@/components/admin/cells#BranchStatusCell' },
              },
            },
            {
              name: 'openingNote',
              type: 'text',
              localized: true,
              admin: {
                placeholder: 'Opening spring 2026',
                condition: (data) => data?.status === 'openingSoon',
                description: 'Optional. Replaces the default "Opening soon" wording.',
              },
            },
            {
              /**
               * The plumbing, folded shut.
               *
               * Six of the seventeen fields on this screen were things a hotel
               * manager never touches: the web address built from the name, two
               * coordinates the site reads out of the map link by itself, a
               * postcode that is 44001 for every hotel in this city, an ID
               * pasted once when a Google profile is linked, and a running
               * order set the day a hotel opens. None is wrong to have. All of
               * them sat between the photographs and the address, which is
               * where the work actually happens.
               *
               * Folded rather than hidden: hiding them would mean nobody could
               * correct a bad map pin or paste a Place ID without a developer.
               * Shut by default, one click to open.
               */
              type: 'collapsible',
              label: 'Technical — normally left alone',
              admin: {
                initCollapsed: true,
                description:
                  'The site fills these in by itself. Open it only to correct a map pin or to ' +
                  'paste a Google Place ID.',
              },
              fields: [
                slugField({ useAsSlug: 'name' }),
                {
                  // Two plain numbers rather than Payload's `point` type: `point`
                  // compiles to a PostGIS `geometry` column, and Railway's Postgres
                  // does not ship PostGIS. A map pin only needs these two values.
                  type: 'row',
                  fields: [
                    {
                      name: 'latitude',
                      type: 'number',
                      admin: {
                        width: '50%',
                        placeholder: '36.191',
                        description:
                          'Filled in automatically from the Google Maps link above. Only type these in by hand if the map does not appear.',
                      },
                    },
                    {
                      name: 'longitude',
                      type: 'number',
                      admin: { width: '50%', placeholder: '44.009' },
                    },
                  ],
                },
                {
                  /**
                   * The postcode, which Booking.com has been publishing for these
                   * hotels all along and this site has not.
                   *
                   * A PostalAddress without one is an address a machine can only
                   * partly match. It is one of the fields Google uses to decide
                   * that the hotel on this page and a business it already knows
                   * about are the same place — the same job as the Place ID, from
                   * the other direction — and every address block on this site was
                   * emitting locality, region and country and stopping there.
                   */
                  name: 'postalCode',
                  type: 'text',
                  label: 'Postcode',
                  admin: {
                    placeholder: '44001',
                    description:
                      'Erbil is 44001. It never appears on the page — it goes to search engines, ' +
                      'to help them match this hotel to the business they already know.',
                  },
                },
                {
                  /**
                   * The hotel's verified Google Business Profile, named exactly.
                   *
                   * All four hotels have a verified profile, and the site was
                   * pointing at them only through share links — which to anything
                   * reading the page are opaque redirects that could lead
                   * anywhere. A Place ID names one verified business and never
                   * moves, so this is the difference between the site hinting at
                   * a Maps pin and stating that the hotel on this page and that
                   * profile are the same business. For a group whose four hotels
                   * read as four unrelated companies, that statement is the fix.
                   *
                   * The map on the page still comes from the coordinates. This is
                   * for the machines.
                   */
                  name: 'googlePlaceId',
                  type: 'text',
                  label: 'Google Place ID',
                  admin: {
                    placeholder: 'ChIJ…',
                    description:
                      'This hotel’s Google Business Profile ID. Find it at ' +
                      'developers.google.com/maps/documentation/places/web-service/place-id — ' +
                      'search the hotel and copy what it shows. Pasting the whole link works too. ' +
                      'It tells Google the hotel on this page and that verified profile are one place.',
                  },
                },
                {
                  name: 'order',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Lower numbers appear first on the homepage.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Rooms',
          description:
            'Every room here. Open one to change its photographs, price or how many there are.',
          fields: [
            {
              name: 'rooms',
              type: 'join',
              collection: 'rooms',
              on: 'branch',
              /**
               * No defaultSort here, and that is not an oversight.
               *
               * Sorting a join on `name` reads naturally and breaks the whole
               * Branches list: room names are translated, so Payload builds a
               * join to rooms_locales, aliases the rooms table, and then still
               * refers to it by its real name in the join condition. Postgres
               * rejects the query outright — "invalid reference to FROM-clause
               * entry for table rooms" — and the list view renders nothing at
               * all, so no hotel can be opened.
               *
               * It compiles, it builds, and it fails only when the page is
               * actually loaded. Sorting is left to Payload's own default,
               * which does not touch the translated table.
               */
              admin: {
                allowCreate: true,
                /**
                 * One line per room.
                 *
                 * The photographs were a column here for a while, on the
                 * reasoning that "which rooms have no pictures" is worth
                 * seeing. It is — but each room stacked three thumbnails and
                 * three filenames, so four rooms filled the screen and the
                 * table stopped being something you could take in. The
                 * pictures are one click away inside the room, and the
                 * dashboard already says when any are missing or too small.
                 *
                 * Name, price, how many, and whether it is on sale. That is
                 * what a room list is for.
                 */
                defaultColumns: ['name', 'priceFrom', 'quantity', 'isAvailable'],
              },
            },
          ],
        },
        {
          label: 'Contact & facilities',
          description: 'How guests reach you, what the hotel offers, and where else it is listed.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'phone',
                  type: 'text',
                  admin: { width: '50%', placeholder: '+964 772 541 9898' },
                },
                {
                  // Every hotel in the group advertises two lines; one field
                  // forced staff to drop a number the guest may be dialling.
                  name: 'phoneAlt',
                  type: 'text',
                  label: 'Second phone',
                  admin: { width: '50%', placeholder: '+964 750 668 9090' },
                },
              ],
            },
            {
              name: 'whatsapp',
              type: 'text',
              label: 'WhatsApp',
              admin: {
                description: 'Full international format, e.g. +9647501234567.',
              },
            },
            {
              name: 'email',
              type: 'email',
            },
            {
              type: 'row',
              fields: [
                {
                  // Each hotel runs its own Facebook page, so these cannot live
                  // only on the group-wide settings.
                  name: 'facebook',
                  type: 'text',
                  admin: { width: '50%', description: "This hotel's own page." },
                },
                {
                  name: 'instagram',
                  type: 'text',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'amenities',
              type: 'select',
              hasMany: true,
              options: branchAmenityOptions,
            },
            {
              // Reception here is staffed around the clock, which is worth saying
              // plainly. It cannot be a time typed into a text box: the field is
              // not localized, so "24 hours" would appear in English on the
              // Kurdish and Arabic pages. A checkbox lets the site say it in
              // whichever language the guest is reading.
              name: 'checkInAnyTime',
              type: 'checkbox',
              label: 'Check-in at any hour (24-hour reception)',
              defaultValue: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'checkInTime',
                  type: 'text',
                  admin: {
                    width: '50%',
                    placeholder: '14:00',
                    condition: (data) => !data?.checkInAnyTime,
                    description: 'Only needed when check-in is not available around the clock.',
                  },
                },
                {
                  name: 'checkOutTime',
                  type: 'text',
                  admin: {
                    width: '50%',
                    placeholder: '12:00',
                    description: 'On a 24-hour clock, so midday is 12:00 and midnight is 00:00.',
                  },
                },
              ],
            },
            {
              name: 'bookingComUrl',
              type: 'text',
              label: 'Booking.com URL',
              admin: {
                description: 'Optional. Shows an "instant reservation" button when filled in.',
              },
            },
            {
              // Nothing on the page changes when this is filled in, which is the
              // whole point of it.
              //
              // A search engine has no way to know that this hotel, its Booking
              // listing, its Google Maps pin and its TripAdvisor page are one
              // building — the names are spelled four different ways and none of
              // the four links to the others. Every listing that gets named here
              // is one more rope tying them together, and TripAdvisor is the one
              // this site could not name because there was nowhere to put it.
              name: 'tripadvisorUrl',
              type: 'text',
              label: 'TripAdvisor URL',
              admin: {
                description:
                  'Optional, and nothing appears on the page. It tells search engines that the ' +
                  'TripAdvisor listing and this hotel are the same building.',
              },
            },
            {
              // Typed in, not fetched. A score read live from another site is a
              // dependency that can fail or change shape on a page that has to
              // render; three numbers checked now and then are enough, and the
              // date is what keeps them honest.
              type: 'row',
              fields: [
                {
                  name: 'bookingComScore',
                  type: 'number',
                  label: 'Booking.com score',
                  min: 0,
                  max: 10,
                  admin: { width: '33%', placeholder: '7.3', description: 'Out of 10.' },
                },
                {
                  name: 'bookingComReviews',
                  type: 'number',
                  label: 'Booking.com reviews',
                  min: 0,
                  admin: { width: '33%', placeholder: '1558' },
                },
                {
                  name: 'bookingComChecked',
                  type: 'date',
                  label: 'Checked on',
                  admin: {
                    width: '33%',
                    date: { pickerAppearance: 'dayOnly' },
                    description:
                      'The page says this date, so an old score reads as old rather than wrong.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
