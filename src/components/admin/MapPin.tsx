import type { UIFieldServerProps } from 'payload'

import React from 'react'

import { toMapsHref } from '@/utilities/contact'

import './mapPin.scss'

const baseClass = 'mf-pin'

/**
 * Whether this hotel's map is actually working, said on the hotel's own screen.
 *
 * The map is drawn from two numbers the site reads out of the pasted Google
 * Maps link. When that reading fails — and for a `maps.app.goo.gl` share link
 * it can, because the numbers are behind a redirect the server has to follow
 * and Google does not always answer — the save succeeds, the link sits in the
 * box looking correct, and the map is simply absent from the hotel's page. Two
 * of the four hotels were in that state and nothing on this screen said so.
 *
 * The dashboard counts them, which is the right place to notice. This is the
 * right place to fix it: the sentence sits under the link box, says which of
 * the two states this hotel is in, and if the pin is missing it says the one
 * thing to do about it. If the pin is there it offers the link back to Google,
 * because the other way a map goes wrong is by being right about the wrong
 * building, and only somebody who knows the city can tell.
 *
 * A server component, rendered with the hotel as it was last saved. It does
 * not follow along as the box is typed into — the pin is only worked out when
 * the hotel is saved, so a sentence that changed before the save would be
 * describing something that has not happened yet.
 */

const MapPin: React.FC<UIFieldServerProps> = ({ data }) => {
  const latitude = typeof data?.latitude === 'number' ? data.latitude : null
  const longitude = typeof data?.longitude === 'number' ? data.longitude : null
  const link = typeof data?.googleMapsUrl === 'string' ? data.googleMapsUrl : ''

  // A hotel being created has neither, and has not been asked for one yet.
  if (!data?.id && !link) return null

  const pinned = latitude !== null && longitude !== null
  const href = toMapsHref(link, latitude, longitude)

  return (
    <div className={`${baseClass} ${baseClass}--${pinned ? 'ok' : 'missing'}`}>
      {pinned ? (
        <p className={`${baseClass}__line`}>
          <strong>The map is showing on this hotel&rsquo;s page.</strong> It is pinned at{' '}
          <span className={`${baseClass}__coords`}>
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
          .{' '}
          {href && (
            <a href={href} rel="noreferrer noopener" target="_blank">
              Open it in Google Maps
            </a>
          )}{' '}
          to check it is the right building. If it is not, paste the correct coordinates into the
          box above.
        </p>
      ) : (
        <p className={`${baseClass}__line`}>
          <strong>The map is not showing on this hotel&rsquo;s page.</strong>{' '}
          {link
            ? 'The link above could not be turned into a position — that happens with short "maps.app.goo.gl" links, which hide the position behind a redirect.'
            : 'Nothing has been pasted in yet.'}{' '}
          The way that always works: open Google Maps, right-click the hotel, and click the
          numbers at the top of the menu that appears — that copies them. Paste them straight
          into the box above and press Save.
        </p>
      )}
    </div>
  )
}

export default MapPin
