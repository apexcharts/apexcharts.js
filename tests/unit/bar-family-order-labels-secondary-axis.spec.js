import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/entries/violin.js'

// Three bar-family defects users saw:
// - newest-first datetime data (the usual API order) drew every column many
//   days wide, so all of them overlapped;
// - a bar label was measured from a different value than the one drawn: a
//   rangeBar formatter got a scalar and threw, a 100% stack was measured from
//   the raw value, and the formatter ran twice per label;
// - candles, violins and range bars on a secondary y axis were drawn against
//   the first axis's baseline, far off the plot.

const DAY = 86400000
const T0 = Date.UTC(2026, 0, 1)

const daily = (seed, desc) => {
  const pts = Array.from({ length: 30 }, (_, i) => ({
    x: T0 + i * DAY,
    y: 10 + ((i * seed) % 17),
  }))
  return desc ? pts.reverse() : pts
}

const barWidth = (desc, stacked) =>
  createChartWithOptions({
    chart: { type: 'bar', width: 800, height: 300, stacked },
    dataLabels: { enabled: false },
    xaxis: { type: 'datetime' },
    series: [
      { name: 'A', data: daily(3, desc) },
      { name: 'B', data: daily(5, desc) },
    ],
  }).w.globals.barWidth

const formatted = (opts) => {
  const seen = []
  createChartWithOptions({
    ...opts,
    chart: { width: 600, height: 300, ...opts.chart },
    dataLabels: {
      enabled: true,
      formatter: (val) => {
        seen.push(val)
        return Array.isArray(val) ? val.join('-') : Math.round(val) + '%'
      },
    },
  })
  return seen
}

// y extent of every path of a series group, in plot px
const yExtent = (selector) => {
  let lo = Infinity
  let hi = -Infinity
  document.querySelectorAll(`${selector} path[j]`).forEach((p) => {
    const nums = p
      .getAttribute('d')
      .match(/-?[\d.]+(e-?\d+)?/g)
      .map(Number)
    nums.forEach((n, k) => {
      if (k % 2) {
        lo = Math.min(lo, n)
        hi = Math.max(hi, n)
      }
    })
  })
  return { lo, hi }
}

// series b sits on an opposite axis running from bMin to bMin + 40
const secondAxis = (type, a, b, bMin = 20) =>
  createChartWithOptions({
    chart: { type, width: 600, height: 400 },
    xaxis: { type: a.data[0].x > 1e9 ? 'datetime' : 'category' },
    yaxis: [
      { seriesName: 'a', min: 0, max: 1000 },
      { seriesName: 'b', opposite: true, min: bMin, max: bMin + 40 },
    ],
    series: [
      { name: 'a', ...a },
      { name: 'b', ...b },
    ],
  }).w.layout.gridHeight

describe('bar slot width ignores x order', () => {
  it('newest-first data gets the same columns as oldest-first', () => {
    for (const stacked of [false, true]) {
      const asc = barWidth(false, stacked)
      expect(asc).toBeGreaterThan(0)
      expect(barWidth(true, stacked)).toBeCloseTo(asc, 1)
    }
  })
})

describe('bar labels format the drawn value once', () => {
  it.each([true, false])(
    'rangeBar hands the formatter the [start, end] pair (horizontal: %s)',
    (horizontal) => {
      const seen = formatted({
        chart: { type: 'rangeBar' },
        plotOptions: { bar: { horizontal } },
        series: [
          {
            data: [
              { x: 'A', y: [10, 250] },
              { x: 'B', y: [300, 900] },
            ],
          },
        ],
      })
      expect(seen).toEqual([
        [10, 250],
        [300, 900],
      ])
    },
  )

  it('a 100% stack hands the formatter the percentage', () => {
    const seen = formatted({
      chart: { type: 'bar', stacked: true, stackType: '100%' },
      plotOptions: { bar: { horizontal: true } },
      xaxis: { categories: ['X', 'Y'] },
      series: [
        { name: 'A', data: [900, 500] },
        { name: 'B', data: [100, 9500] },
      ],
    })
    expect(seen.map(Math.round).sort((a, b) => a - b)).toEqual([5, 10, 90, 95])
  })
})

describe('bar family on a secondary y axis', () => {
  it('candles span their own axis, 20 at the bottom and 60 at the top', () => {
    const gridH = secondAxis(
      'line',
      {
        type: 'line',
        data: [100, 500, 900].map((y, j) => ({ x: T0 + j * DAY, y })),
      },
      {
        type: 'candlestick',
        data: [
          { x: T0, y: [30, 50, 20, 40] },
          { x: T0 + DAY, y: [40, 45, 25, 30] },
          { x: T0 + 2 * DAY, y: [30, 60, 28, 55] },
        ],
      },
    )
    const { lo, hi } = yExtent('.apexcharts-candlestick-series')
    expect(lo).toBeCloseTo(0, 0)
    expect(hi).toBeCloseTo(gridH, 0)
  })

  it('vertical range bars span their own axis', () => {
    const gridH = secondAxis(
      'rangeBar',
      {
        data: [
          { x: 'P', y: [100, 500] },
          { x: 'Q', y: [200, 900] },
        ],
      },
      {
        data: [
          { x: 'P', y: [20, 40] },
          { x: 'Q', y: [30, 60] },
        ],
      },
    )
    const { lo, hi } = yExtent('.apexcharts-series[seriesName="b"]')
    expect(lo).toBeCloseTo(0, 0)
    expect(hi).toBeCloseTo(gridH, 0)
  })

  it('violins stay on the plot', () => {
    // was drawn thousands of px above the chart
    const obs = (m) => Array.from({ length: 40 }, (_, k) => m - 3 + (k % 7))
    const gridH = secondAxis(
      'violin',
      { data: [{ x: 'P', y: obs(500) }] },
      { data: [{ x: 'P', y: obs(120) }] },
      100,
    )
    const { lo, hi } = yExtent('.apexcharts-series[seriesName="b"]')
    expect(lo).toBeGreaterThan(-1)
    expect(hi).toBeLessThan(gridH + 1)
  })
})
