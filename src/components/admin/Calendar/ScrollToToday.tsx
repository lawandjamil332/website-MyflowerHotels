'use client'

import React from 'react'

/**
 * Puts today on screen when the calendar opens.
 *
 * The grid is a calendar month, which is the unit a hotel thinks in — but open
 * it on the 29th and the first twenty-eight columns are history, so the screen
 * you land on is a month that has already happened. Booking.com's opens on
 * today for the same reason.
 *
 * Scrolling rather than starting the month at today: the month stays a month,
 * so the columns line up with the calendar on the wall and with the same
 * screen looked at yesterday. Only the viewport moves.
 *
 * It runs once, on mount, and does nothing at all if the month on screen has
 * no today in it — paging back to July should stay where it was put.
 */
export const ScrollToToday: React.FC = () => {
  React.useEffect(() => {
    const scroller = document.querySelector<HTMLElement>('.mf-calendar__scroll')
    const today = scroller?.querySelector<HTMLElement>('.mf-calendar__day[data-today="true"]')
    if (!scroller || !today) return

    // Measured rather than added up: the two frozen columns and the table's
    // own padding all sit between the scroller's edge and the first date, and
    // a number written here would be wrong the next time one of them changes.
    const gap = today.getBoundingClientRect().left - scroller.getBoundingClientRect().left
    const frozen = 292 + 24

    scroller.scrollLeft = Math.max(0, scroller.scrollLeft + gap - frozen)
  }, [])

  return null
}
