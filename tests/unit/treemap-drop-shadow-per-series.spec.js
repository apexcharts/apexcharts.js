import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// chart.dropShadow on a multi-series treemap was applied to the whole chart
// group once per series, so the last series' pass won: enabledOnSeries [0]
// removed the shadow entirely instead of keeping it on series 0.

const FLAT = [
  { name: 'A', data: [{ x: 'a1', y: 10 }, { x: 'a2', y: 20 }] },
  { name: 'B', data: [{ x: 'b1', y: 30 }, { x: 'b2', y: 5 }] },
]

const shadowed = (dropShadow) => {
  const c = createChartWithOptions({
    chart: { type: 'treemap', height: 400, width: 600, dropShadow },
    series: FLAT,
  })
  return [...c.el.querySelectorAll('.apexcharts-treemap-series')].map((s) => s.hasAttribute('filter'))
}

describe('treemap dropShadow', () => {
  it('shadows each series', () => {
    expect(shadowed({ enabled: true })).toEqual([true, true])
  })

  it('shadows only the series enabledOnSeries names', () => {
    expect(shadowed({ enabled: true, enabledOnSeries: [0] })).toEqual([true, false])
  })
})
