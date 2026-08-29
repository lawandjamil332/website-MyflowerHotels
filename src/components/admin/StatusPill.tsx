import React from 'react'

import type { Tone } from './statuses'

import './pill.scss'

/**
 * One status, drawn as a pill.
 *
 * No hooks and no state, so the same component serves the dashboard (rendered
 * on the server) and the list cells (rendered in the browser) without either
 * needing its own copy.
 */
export const StatusPill: React.FC<{ label: string; tone: Tone; title?: string }> = ({
  label,
  tone,
  title,
}) => (
  <span className="mf-pill" data-tone={tone} title={title}>
    {label}
  </span>
)
