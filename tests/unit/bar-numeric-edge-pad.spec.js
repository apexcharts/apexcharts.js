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

describe('numeric bar edge pad with xaxis min / max', () => {
  const grid = (xaxis) =>
    createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      series: [{ name: 'a', data: daily(3) }],
      xaxis: { type: 'datetime', ...xaxis },
    })

  it('sizes the pad on the window the axis shows, not the data (#4833)', () => {
    // three daily bars in a 12 day window: the pad was measured on the 2 day
    // data span, a slot the bars never get, and squeezed them mid-plot
    const chart = grid({
      min: Date.UTC(2023, 11, 27),
      max: Date.UTC(2024, 0, 8),
    })
    const { gridWidth } = chart.w.layout
    const pad = chart.w.globals.barPadForNumericAxis
    expect(gridWidth).toBeGreaterThan(480)
    // the edge bars still fit: half a group is under the pad
    const slot = gridWidth / 12
    expect((slot * 0.7) / 2).toBeLessThan(pad)
  })

  it('keeps the plot size while zooming', () => {
    const chart = grid({
      min: Date.UTC(2023, 11, 27),
      max: Date.UTC(2024, 0, 8),
    })
    const before = chart.w.layout.gridWidth
    chart.zoomX(Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 3))
    expect(chart.w.layout.gridWidth).toBeCloseTo(before, 6)
  })
})
