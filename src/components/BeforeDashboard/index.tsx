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
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome</h4>
      </Banner>

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
