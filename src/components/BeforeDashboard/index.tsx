import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

/**
 * The first thing the owner sees after logging in. Written for someone who
 * runs hotels rather than websites, so it names the actual next steps instead
 * of linking to framework documentation.
 */
const BeforeDashboard: React.FC = () => {
  // Without a bucket, every photo uploaded here is written to the container's
  // disk and erased on the next deploy. The owner would upload an afternoon's
  // work and find blank frames a week later with nothing explaining it, so the
  // warning belongs on the page where the uploading happens.
  const storageConnected = Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  )

  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome</h4>
      </Banner>

      {!storageConnected && (
        <Banner className={`${baseClass}__banner`} type="error">
          <h4>Do not upload photos yet</h4>
          <p>
            Photo storage is not connected, so anything uploaded now is saved onto this server&apos;s
            temporary disk and <strong>deleted the next time the site updates</strong>.
          </p>
          <p>
            In Railway: <strong>+ Create → Storage Bucket</strong>, then copy its four values
            (endpoint, access key id, secret access key, bucket name) into this service&apos;s{' '}
            <strong>Variables</strong> as <code>S3_ENDPOINT</code>, <code>S3_ACCESS_KEY_ID</code>,{' '}
            <code>S3_SECRET_ACCESS_KEY</code> and <code>S3_BUCKET</code>, and redeploy. This message
            disappears once it is done.
          </p>
        </Banner>
      )}
      Here is the order that works best:
      <ul className={`${baseClass}__instructions`}>
        <li>
          Open <strong>Site settings</strong> and add the group name, logo, and the WhatsApp number
          the floating button should use.
        </li>
        <li>
          Add each hotel under <strong>Branches</strong>. Every one needs a hero photo, and the{' '}
          <em>street or landmark</em> field is what guests use to tell them apart. The homepage
          lists them by the <em>order</em> number in the sidebar.
        </li>
        <li>
          Add <strong>Rooms</strong> and attach each one to its branch. Three photos minimum.
        </li>
        <li>
          Use the language selector at the top right to fill in Kurdish and Arabic. Anything left
          empty falls back to English rather than showing blank.
        </li>
      </ul>
      Reservation messages sent from the website arrive under <strong>Enquiries</strong>.
    </div>
  )
}

export default BeforeDashboard
