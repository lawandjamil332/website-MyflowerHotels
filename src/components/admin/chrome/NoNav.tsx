import React from 'react'

/**
 * No sidebar.
 *
 * Payload's template always renders a nav; this is what it renders instead of
 * one. The navigation moved to the top of the screen, where every extranet in
 * the trade puts it and where it does not cost the tables 275px of width.
 *
 * A component that renders nothing rather than a config flag, because Payload
 * has no flag for "no nav" — and this way the sidebar is one file away from
 * coming back if the top bar ever turns out to be a mistake.
 */
const NoNav: React.FC = () => null

export default NoNav
