import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A dashboard that turns on treemap click-to-zoom for every treemap gave the
// flat ones an empty strip above the tiles: the layout reserved the
// breadcrumb band whenever `zoom.enabled` was set, while the renderer only
// makes tiles clickable when there are parent groups to zoom into.

const FLAT = () => [
  {
    data: [
      { x: 'A', y: 10 },
      { x: 'B', y: 20 },
      { x: 'C', y: 5 },
    ],
  },
]
const NESTED = () => [
  {
    data: [
      {
        x: 'Tech',
        children: [
          { x: 'MSFT', y: 300 },
          { x: 'AAPL', y: 280 },
        ],
      },
      {
        x: 'Energy',
        children: [
          { x: 'XOM', y: 200 },
          { x: 'CVX', y: 150 },
        ],
      },
    ],
  },
]

const top = (series, treemap) =>
  createChartWithOptions({
    chart: { type: 'treemap', width: 400, height: 300 },
    plotOptions: { treemap },
    series,
  }).w.layout.translateY

describe('treemap breadcrumb band follows whether zoom is live', () => {
  it('a flat treemap with zoom on lays out like one with zoom off', () => {
    expect(top(FLAT(), { zoom: { enabled: true } })).toBe(
      top(FLAT(), { zoom: { enabled: false } }),
    )
  })

  it('a nested treemap with zoom on still reserves the band', () => {
    expect(top(NESTED(), { zoom: { enabled: true } })).toBeGreaterThan(
      top(NESTED(), { zoom: { enabled: false } }),
    )
  })

  it('a flat treemap that shows parents can zoom, so it keeps the band', () => {
    expect(
      top(FLAT(), { zoom: { enabled: true }, parents: { show: true } }),
    ).toBeGreaterThan(top(FLAT(), { zoom: { enabled: false } }))
  })
})
