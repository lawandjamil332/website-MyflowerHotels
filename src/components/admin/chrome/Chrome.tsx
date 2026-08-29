import React from 'react'

import { ChromeBar } from './ChromeBar'
import { runCounts } from './counts'

/**
 * The chrome, with today's numbers already in it.
 *
 * A server component so the counts are read straight from the database as the
 * page renders — no loading state, no flash of a bar with nothing in it, and
 * no request from the browser to make it right afterwards.
 *
 * Registered as `admin.components.header`, which Payload renders above the
 * whole panel on every screen, and rendered again by the calendar view, which
 * Payload draws without the panel's template.
 */
const Chrome: React.FC = async () => {
  const counts = await runCounts()
  return <ChromeBar counts={counts} />
}

export default Chrome
