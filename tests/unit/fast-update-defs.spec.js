import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The fast update path (data-only updateSeries)
// redraws series into the existing SVG, and every redraw appends fresh
// gradients / filters / patterns to <defs> without removing the previous
// generation. The defs count must stay stable across same-shape updates.

const defsCount = (chart) => {
  const svg = chart.w.dom.Paper.node
  return svg.querySelectorAll('linearGradient, radialGradient, filter, pattern')
    .length
}

const series = (k) => [
  { name: 'A', data: [1, 2, 3, 4, 5].map((v) => v * 10 + k) },
  { name: 'B', data: [5, 4, 3, 2, 1].map((v) => v * 10 + k) },
]

const cases = {
  'area defaults (gradient fill)': { chart: { type: 'area' } },
  'bar with gradient fill': {
    chart: { type: 'bar' },
    fill: { type: 'gradient' },
  },
  'line with dropShadow': {
    chart: { type: 'line', dropShadow: { enabled: true } },
  },
  'bar with pattern fill': {
    chart: { type: 'bar' },
    fill: { type: 'pattern' },
  },
  'plain bar': { chart: { type: 'bar' } },
}

describe('fastUpdate does not leak <defs>', () => {
  for (const [label, opts] of Object.entries(cases)) {
    it(label, async () => {
      const chart = createChartWithOptions({
        ...opts,
        series: series(0),
        xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
      })
      // one update first so any lazily created chrome defs exist
      await chart.updateSeries(series(1))
      const before = defsCount(chart)
      for (let k = 2; k < 12; k++) await chart.updateSeries(series(k))
      const stats = chart._updateStats
      // sanity: the updates went through the fast path
      expect(stats.full).toBe(0)
      const after = defsCount(chart)
      expect(after).toBe(before)
      chart.destroy()
    })
  }
})
