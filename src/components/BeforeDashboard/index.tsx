import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { runChecks } from './checks'
import './index.scss'

const baseClass = 'before-dashboard'

/**
 * The first thing the owner sees after logging in.
 *
 * It used to be a fixed welcome explaining how to set the site up for the
 * first time — advice that stopped being true the day it was followed, and
 * then sat there for months describing work already done.
 *
 * What replaces it is the one thing a fixed message cannot be: current. Every
 * line is counted from the database when the page opens, so a gap disappears
 * off the list the moment it is filled, and a hotel added next year arrives on
 * it without anybody remembering to update this file.
 *
 * Only things a person has to supply — addresses, landmarks, photographs,
 * reviews, IDs. None of it can be written by code, which is exactly why it
 * needs somewhere to be seen. When there is nothing left, it says so.
 */
const BeforeDashboard: React.FC = async () => {
  const checks = await runChecks()

  // Null means the check itself could not run — no database, most likely.
  // Better to show nothing than to tell the owner his site is empty.
  if (checks === null) return null

  if (checks.length === 0) {
    return (
      <div className={baseClass}>
        <Banner className={`${baseClass}__banner`} type="success">
          <h4>Everything is filled in</h4>
        </Banner>
        Every hotel has its address, landmarks, reviews and listings. Nothing is waiting on you.
      </div>
    )
  }

  const high = checks.filter((c) => c.weight === 'high').length

  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type={high > 0 ? 'error' : 'default'}>
        <h4>
          {checks.length} thing{checks.length > 1 ? 's' : ''} worth filling in
        </h4>
      </Banner>

      <p className={`${baseClass}__lead`}>
        Counted from the site just now. None of these can be written for you — they are facts only
        the hotels know. Each one closes itself off this list once it is filled in.
      </p>

      <ul className={`${baseClass}__checks`}>
        {checks.map((check) => (
          <li key={check.title} className={`${baseClass}__check`} data-weight={check.weight}>
            <strong>
              {check.href ? <a href={check.href}>{check.title}</a> : check.title}
            </strong>
            <span className={`${baseClass}__why`}>{check.why}</span>
            {check.detail && <span className={`${baseClass}__detail`}>{check.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default BeforeDashboard
