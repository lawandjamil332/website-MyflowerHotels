import type { GlobalConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

/**
 * Group-wide details that are not specific to any one branch.
 * The header, footer and the sticky WhatsApp button all read from here.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Site settings',
  access: {
    read: anyone,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
    description: 'Logo, group name and the contact details shown site-wide.',
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      localized: true,
      defaultValue: 'My Flower Hotels',
    },
    {
      /**
       * How long the published rates hold.
       *
       * Worth being exact about what this does, because it was first written
       * here claiming more. A price on a hotel page does not reach an ordinary
       * Google result through this markup at all: hotel prices in Google come
       * from Google Hotels, fed by Hotel Center through a connectivity
       * partner, and what schema.org pricing on a hotel page is used for is
       * checking that feed against the site — Google's own term is price
       * accuracy validation. So this field does not switch prices on in
       * search. It makes the room markup complete and correct, and it is one
       * of the things being checked on the day the group does connect.
       *
       * Kept because it costs nothing, is true when set, and is a prerequisite
       * rather than a lever. Left empty, nothing is claimed at all.
       */
      name: 'ratesValidUntil',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
        description:
          'The date the prices on this site are good until — usually the end of the season ' +
          'or the year. It does not by itself put prices into Google: that comes from Google ' +
          'Hotels. It makes the rooms\u2019 data complete for when it does. Safe to leave empty; ' +
          'update it whenever you reprice.',
      },
    },
    {
      /**
       * The date the "no local group runs more" line was last checked.
       *
       * The claim is the owner's, and it is the kind that cannot be proved
       * from a desk: there is no register of Kurdish-owned hotel groups, and
       * the ones with a web presence in English are not all of them. What can
       * be done is the thing this site already does with the Booking.com
       * scores — attribute it, date it, and word it as what the group knows
       * rather than as a fact about the world.
       *
       * So the sentence appears only while this date is set, and it prints the
       * date beside itself. An old date reads as old rather than as wrong,
       * which is the difference between a claim that ages and one that
       * quietly becomes false. Empty, the line does not appear at all and the
       * site says only the part that needs no checking: four hotels, one
       * family, no foreign operator.
       */
      /**
       * Whether Google may have these hotels' prices.
       *
       * The box on a Google listing that reads "Booking.com — IQD 72,421" is
       * Hotel Center, and it reads a feed, not a website: no amount of pages
       * or markup puts a hotel in it. Switching this on serves the two
       * documents Google needs — the property list at /google/hotels.xml and
       * the rates at /google/rates.xml — built from the same rooms and
       * calendar the website sells from, so the feed cannot quote a price the
       * site would not honour.
       *
       * Off by default, and switching it on does not by itself put anything on
       * Google: somebody still has to open a Hotel Center account and point it
       * at those two addresses. This only decides whether the site is willing
       * to answer.
       */
      name: 'googleFeed',
      type: 'checkbox',
      label: 'Offer prices to Google',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Serves the price feed Google Hotel Center reads, so My Flower can appear beside ' +
          'Booking.com and Agoda on the Google listing. Needs a Hotel Center account pointed ' +
          'at /google/hotels.xml as well — this switch only makes the site willing.',
      },
    },
    {
      name: 'localClaimCheckedOn',
      type: 'date',
      label: 'Ownership claim last checked',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
        description:
          'Set this and the About page adds: of every hotel brand in Erbil, none we know of has ' +
          'more branches than we do — with this date beside it. Leave empty and the line does ' +
          'not appear. Re-check it once a year; an out-of-date claim is worse than none.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'establishedYear',
          type: 'number',
          admin: {
            width: '50%',
            placeholder: '2012',
            description: 'Shown as "Since 2012" in the footer. Leave empty to hide it.',
          },
        },
        {
          name: 'stars',
          type: 'select',
          label: 'Star rating',
          options: ['3', '4', '5'],
          admin: {
            width: '50%',
            description: 'Shown beside the hotel name. Leave empty to hide it.',
          },
        },
      ],
    },
    {
      name: 'iqdPerUsd',
      type: 'number',
      label: 'Dinars per US dollar',
      admin: {
        placeholder: '1310',
        description:
          'Lets guests switch prices between dinars and dollars. Put in how many dinars one dollar buys — check it every few months. Leave empty and prices stay in dinars only, with no switch shown.',
      },
    },
    {
      name: 'pointsEnabled',
      type: 'checkbox',
      label: 'Collect points on stays',
      defaultValue: true,
      admin: {
        description: 'Turn the loyalty scheme on or off across the whole site.',
      },
    },
    {
      name: 'pointsPer1000Iqd',
      type: 'number',
      label: 'Points per 1,000 IQD spent',
      min: 0,
      defaultValue: 1,
      admin: {
        description:
          'Points a guest earns for every 1,000 dinars of a completed stay. Change it whenever you like — it only affects stays completed afterwards.',
        condition: (data) => Boolean(data?.pointsEnabled),
      },
    },
    {
      // When to start saying how few are left.
      //
      // Deliberately a threshold and not a fixed number to print. Saying "2
      // left" when nine are free is a false statement of fact to a guest, and
      // it is the exact practice the UK regulator forced Booking.com and five
      // other sites to drop in 2019 — the EU followed. A hotel this size does
      // not need it: with a handful of each room type the real number is
      // usually low anyway, and a true "Only 2 left" is believed, where a
      // permanent one is eventually noticed and believed about nothing else on
      // the site either.
      name: 'lowStockAt',
      type: 'number',
      label: 'Say how many are left when this few remain',
      min: 0,
      defaultValue: 3,
      admin: {
        description:
          'Above this number the site says nothing about how many rooms are free, so the count only ever appears when it is genuinely low. Set to 0 to never show it.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Shown in the header. A transparent PNG or SVG works best.',
      },
    },
    {
      name: 'socialShareImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Used when a link to the site is shared on WhatsApp or Facebook.',
      },
    },
    {
      type: 'collapsible',
      label: 'Primary contact',
      fields: [
        { name: 'phone', type: 'text' },
        {
          name: 'whatsapp',
          type: 'text',
          label: 'WhatsApp',
          admin: {
            description:
              'Full international format, e.g. +9647501234567. Powers the floating WhatsApp button.',
          },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Reservations email',
          admin: {
            description:
              'Where every booking and enquiry from the website is sent. One address for all ' +
              'four hotels — reservations are taken centrally and passed to the branch, so this ' +
              'is the only address that needs filling in. A hotel only needs its own address ' +
              'below if it should receive its bookings directly instead of here.',
          },
        },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: 'Social links',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'tiktok', type: 'text', label: 'TikTok' },
        { name: 'youtube', type: 'text', label: 'YouTube' },
      ],
    },
  ],
}
