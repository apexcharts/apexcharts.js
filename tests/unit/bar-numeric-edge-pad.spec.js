import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The numeric/datetime bar edge pad is a whole bar group wide. On a few bars
// that group spans most of a wide slot: three daily bars at 600px reserved
// close to 200px of empty plot a side. It is capped at an eighth of the grid
// (never under the half group the edge bar needs), which denser charts never
// reach, so their layout does not move.

const DAY = 86400000
const daily = (n) =>
  Array.from({ length: n }, (_, i) => ({
    x: Date.UTC(2024, 0, 1) + i * DAY,
    y: 10 + i,
  }))

const pad = (n) => {
  const chart = createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 300 },
    series: [{ name: 'a', data: daily(n) }],
    xaxis: { type: 'datetime' },
  })
  const gl = chart.w.globals
  const p = gl.barPadForNumericAxis
  const grid = chart.w.layout.gridWidth
  // the cap is taken on the grid before the pad comes off
  return { pad: p, grid, cap: (grid + 2 * p) / 8 }
}

describe('numeric bar edge pad', () => {
  it('gives a sparse chart its plot back', () => {
    // three daily bars: the plot was 169px of a 600px chart
    const { pad: p, grid } = pad(3)
    expect(p).toBeLessThan(110)
    expect(grid).toBeGreaterThan(300)
  })

  it('leaves a dense chart under the cap', () => {
    const { pad: p, cap } = pad(12)
    expect(p).toBeGreaterThan(0)
    expect(p).toBeLessThan(cap)
  })
})
