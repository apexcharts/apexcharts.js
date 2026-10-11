// With yaxis.reversed a heatmap bounded each row by the mirrored row's length,
// dropping cells from one row and drawing phantom cells in the other.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const row = (n, base) =>
  Array.from({ length: n }, (_, k) => ({ x: `c${k}`, y: base + k }))

const cellsBySeries = (chart) => {
  const out = {}
  chart.el.querySelectorAll('.apexcharts-heatmap-series').forEach((g) => {
    out[g.getAttribute('seriesName')] = [
      ...g.querySelectorAll('.apexcharts-heatmap-rect'),
    ].map((r) => Number(r.getAttribute('val')))
  })
  return out
}

describe('heatmap rows of different lengths', () => {
  for (const reversed of [false, true]) {
    it(`reversed: ${reversed}`, () => {
      const chart = createChartWithOptions({
        chart: { type: 'heatmap', width: 600, height: 300 },
        yaxis: { reversed },
        series: [
          { name: 'Short', data: row(2, 10) },
          { name: 'Long', data: row(5, 20) },
        ],
      })
      expect(cellsBySeries(chart)).toEqual({
        Short: [10, 11],
        Long: [20, 21, 22, 23, 24],
      })
    })
  }
})
