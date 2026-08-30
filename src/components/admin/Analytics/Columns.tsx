import React from 'react'

/**
 * One column chart, drawn as SVG on the server.
 *
 * Every chart on the analytics screen is the same shape of question — compare
 * magnitude across a handful of labelled slots — so there is one component and
 * no charting library. A library would ship a few hundred kilobytes to the
 * browser to draw twelve rectangles, and it would draw them its way.
 *
 * One hue, because every one of these is a single series. Colour here carries
 * magnitude, not identity: there is nothing to tell apart, so a second colour
 * could only mislead. It follows that no legend is needed either — the heading
 * above the chart already says what is plotted, and a box with one swatch in it
 * would just repeat the heading.
 *
 * Only the tallest column is labelled. A number on all twelve is a wall of
 * digits nobody reads; the axis carries the rest and the table underneath
 * carries all of it exactly.
 *
 * Hover is a `<title>` inside each column, which every browser and screen
 * reader already knows how to announce — no JavaScript, and it survives the
 * page being server-rendered. The `<details>` table below is the accessible
 * path proper: a chart nobody can read is not an accessible chart with a
 * caption, it is a chart plus an apology.
 */

export type Column = { label: string; value: number; note?: string }

type Props = {
  columns: Column[]
  /** Drawn beside the tallest column and in the table. */
  format?: (value: number) => string
  /** What the numbers are, for the table's own column heading. */
  measure: string
  /** Ticks and the tallest column are read against this, when given. */
  max?: number
  /** Appended to the axis ticks: "%" for a share, nothing for a count. */
  unit?: string
  /**
   * How wide the drawing is in its own coordinates.
   *
   * An SVG scales its text along with everything else, so "11px" here is not
   * 11px on screen — it is 11 multiplied by however far the drawing had to
   * stretch to fill its box. A full-width panel stretches a 720-wide drawing to
   * about 1.85 and lands on 20px; the same drawing in a panel sharing a row
   * shrinks to 0.89 and lands on 10. Same chart, half the type.
   *
   * So a chart that shares a row gets its own narrower drawing rather than a
   * scaled copy of the wide one, which brings the two to 16 and 20 — close
   * enough to read as one screen.
   *
   * (Measured in the browser. Guessed at first from a screenshot, which was
   * itself scaled down for viewing, so the labels looked half the size they
   * were — a screenshot is not a ruler.)
   */
  size?: 'half' | 'wide'
}

const HEIGHT = 190
const PAD = { bottom: 28, left: 44, right: 12, top: 16 }

/**
 * Axis ticks a person would say out loud.
 *
 * Written first as "anything over a thousand gets a k", which turned twenty
 * million into "20000k" — five digits and a unit, on an axis whose whole job is
 * to be read at a glance. Money in dinars is routinely in the millions here, so
 * millions need their own step.
 */
const tickLabel = (value: number, unit: string): string => {
  const rounded = Math.round(value)
  if (Math.abs(rounded) >= 1_000_000) return `${Math.round(rounded / 100_000) / 10}m${unit}`
  if (Math.abs(rounded) >= 1_000) return `${Math.round(rounded / 100) / 10}k${unit}`
  return `${rounded}${unit}`
}

/** Ticks a person would have chosen: 0, 25, 50 — never 0, 23.7, 47.4. */
const ticksFor = (max: number): number[] => {
  if (max <= 0) return [0]
  const rough = max / 3
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? power * 10

  const out: number[] = []
  for (let value = 0; value <= max + step / 2; value += step) out.push(value)
  return out
}

export const Columns: React.FC<Props> = ({
  columns,
  format,
  measure,
  max,
  size = 'wide',
  unit = '',
}) => {
  const WIDTH = size === 'half' ? 430 : 720
  const PLOT = {
    height: HEIGHT - PAD.top - PAD.bottom,
    width: WIDTH - PAD.left - PAD.right,
  }
  const draw = format ?? ((value: number) => value.toLocaleString('en-GB'))
  const peak = Math.max(max ?? 0, ...columns.map((column) => column.value), 0)
  const ticks = ticksFor(peak)
  const ceiling = Math.max(ticks[ticks.length - 1], 1)

  const slot = PLOT.width / Math.max(columns.length, 1)
  // Capped, and never filling its slot: the leftover is the air between bars,
  // which is what separates them. A border round each bar would be ink that is
  // not data.
  const barWidth = Math.min(24, Math.max(6, slot - 10))
  const tallest = columns.reduce(
    (best, column, i) => (column.value > (columns[best]?.value ?? -1) ? i : best),
    0,
  )

  const y = (value: number) => PAD.top + PLOT.height - (value / ceiling) * PLOT.height

  return (
    <figure className="mf-chart">
      <svg
        className="mf-chart__svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className="mf-chart__grid"
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text className="mf-chart__tick" x={PAD.left - 8} y={y(tick) + 4}>
              {tickLabel(tick, unit)}
            </text>
          </g>
        ))}

        {columns.map((column, i) => {
          const height = Math.max(0, PAD.top + PLOT.height - y(column.value))
          const x = PAD.left + i * slot + (slot - barWidth) / 2
          const top = PAD.top + PLOT.height - height
          const radius = Math.min(4, height)

          return (
            <g key={column.label}>
              {height > 0 && (
                <path
                  className="mf-chart__bar"
                  d={`M${x},${PAD.top + PLOT.height} V${top + radius} Q${x},${top} ${x + radius},${top} H${x + barWidth - radius} Q${x + barWidth},${top} ${x + barWidth},${top + radius} V${PAD.top + PLOT.height} Z`}
                >
                  <title>{`${column.label}: ${draw(column.value)}${column.note ? ` · ${column.note}` : ''}`}</title>
                </path>
              )}

              {i === tallest && column.value > 0 && (
                <text
                  className="mf-chart__peak"
                  textAnchor="middle"
                  x={x + barWidth / 2}
                  y={top - 5}
                >
                  {draw(column.value)}
                </text>
              )}

              <text
                className="mf-chart__label"
                textAnchor="middle"
                x={x + barWidth / 2}
                y={HEIGHT - 9}
              >
                {column.label}
              </text>
            </g>
          )
        })}

        <line
          className="mf-chart__axis"
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + PLOT.height}
          y2={PAD.top + PLOT.height}
        />
      </svg>

      <details className="mf-chart__table">
        <summary>The numbers</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">&nbsp;</th>
              <th scope="col">{measure}</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr key={column.label}>
                <th scope="row">{column.label}</th>
                <td>
                  {draw(column.value)}
                  {column.note && <span className="mf-chart__note"> {column.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
