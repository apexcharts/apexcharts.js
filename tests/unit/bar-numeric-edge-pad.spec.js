// On a numeric or datetime x axis the first and last bar slots are centred
// on the first and last x, so half of each sits past the plot. The pad that
// leaves room for them was a whole bar group measured on the grid BEFORE the
// pad came off, from within-series gaps: three daily bars got 197px a side
// and were bunched into the middle 30% of a 600px chart. The pad now is half
// a slot on the padded grid, from the union slot (#4885): the margin a
// category axis gives its edge columns.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const DAY = 86400000
const t0 = Date.UTC(2026, 0, 5)

const bars = (chart) =>
  [...chart.el.querySelectorAll('.apexcharts-bar-area')].map((p) => {
    const xs = p
      .getAttribute('d')
      .match(/-?\d+(\.\d+)?/g)
      .map(Number)
      .filter((_, i) => i % 2 === 0)
    return { left: Math.min(...xs), right: Math.max(...xs) }
  })

const render = (options) =>
  createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 300 },
    ...options,
  })

// the pad is half of one slot, in px on the final grid
const halfSlotPx = (chart, slotX) => {
  const { minX, maxX } = chart.w.globals
  return (slotX * chart.w.layout.gridWidth) / (maxX - minX) / 2
}

const expectEdgeGroupsInsideClip = (chart) => {
  const pad = chart.w.globals.barPadForNumericAxis
  const gw = chart.w.layout.gridWidth
  const bs = bars(chart)
  expect(bs.length).toBeGreaterThan(0)
  expect(Math.min(...bs.map((b) => b.left))).toBeGreaterThanOrEqual(-pad - 0.5)
  expect(Math.max(...bs.map((b) => b.right))).toBeLessThanOrEqual(
    gw + pad + 0.5,
  )
}

describe('numeric bar edge pad', () => {
  it('three daily bars at 600px: half a slot a side', () => {
    const chart = render({
      xaxis: { type: 'datetime' },
      series: [
        {
          name: 'A',
          data: [0, 1, 2].map((i) => ({ x: t0 + i * DAY, y: 10 + i })),
        },
      ],
    })
    expect(chart.w.globals.barPadForNumericAxis).toBeCloseTo(
      halfSlotPx(chart, DAY),
      3,
    )
    expect(chart.w.layout.gridWidth).toBeGreaterThan(350)
    expectEdgeGroupsInsideClip(chart)
  })

  it('interleaved series: the slot is the union gap, not minXDiff', () => {
    const chart = render({
      xaxis: { type: 'datetime' },
      series: [
        {
          name: 'A',
          data: [
            { x: t0, y: 3 },
            { x: t0 + 3 * DAY, y: 5 },
          ],
        },
        { name: 'B', data: [{ x: t0 + DAY, y: 4 }] },
      ],
    })
    expect(chart.w.globals.barPadForNumericAxis).toBeCloseTo(
      halfSlotPx(chart, DAY),
      3,
    )
    expectEdgeGroupsInsideClip(chart)
  })

  it('grouped numeric columns stay inside the clip', () => {
    const chart = render({
      xaxis: { type: 'numeric' },
      plotOptions: { bar: { columnWidth: '50%' } },
      series: [
        { name: 'A', data: [1, 2, 3, 4].map((x) => ({ x, y: x })) },
        { name: 'B', data: [1, 2, 3, 4].map((x) => ({ x, y: 5 - x })) },
      ],
    })
    expect(chart.w.globals.barPadForNumericAxis).toBeCloseTo(
      halfSlotPx(chart, 1),
      3,
    )
    expectEdgeGroupsInsideClip(chart)
  })

  it('a columnWidth over 100% reserves half of every slot it spans', () => {
    const chart = render({
      xaxis: { type: 'numeric' },
      plotOptions: { bar: { columnWidth: '150%' } },
      series: [{ name: 'A', data: [1, 2, 3, 4].map((x) => ({ x, y: x })) }],
    })
    expect(chart.w.globals.barPadForNumericAxis).toBeCloseTo(
      1.5 * halfSlotPx(chart, 1),
      3,
    )
    expectEdgeGroupsInsideClip(chart)
  })

  it('a px group wider than the slot reserves half the group', () => {
    const chart = render({
      xaxis: { type: 'datetime' },
      plotOptions: { bar: { columnWidth: '200' } },
      series: [
        {
          name: 'A',
          data: [0, 1, 2, 3].map((i) => ({ x: t0 + i * DAY, y: 10 + i })),
        },
      ],
    })
    expect(chart.w.globals.barPadForNumericAxis).toBeCloseTo(100, 3)
    expectEdgeGroupsInsideClip(chart)
  })
})
