// A heatmap labels its y axis with series names padded by one empty tick so
// each name sits centred in its row. The padding used to happen inside
// HeatMap.draw, after the updateSeries fast path had already compared and
// repainted the axis from the unpadded list, so n names were spread over
// n-1 intervals and slid off their rows.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const mk = (b) => [
  {
    name: 'Alpha',
    data: [
      { x: 'a', y: 1 + b },
      { x: 'b', y: 2 },
      { x: 'c', y: 3 },
    ],
  },
  {
    name: 'Beta',
    data: [
      { x: 'a', y: 4 },
      { x: 'b', y: 5 + b },
      { x: 'c', y: 6 },
    ],
  },
  {
    name: 'Gamma',
    data: [
      { x: 'a', y: 7 },
      { x: 'b', y: 8 },
      { x: 'c', y: 9 + b },
    ],
  },
]

const namedLabelYs = (chart) =>
  Object.fromEntries(
    [...chart.el.querySelectorAll('.apexcharts-yaxis-label')]
      .filter((t) => t.textContent)
      .map((t) => [t.textContent, Number(t.getAttribute('y')).toFixed(2)]),
  )

describe('heatmap data-only updateSeries keeps the y-axis', () => {
  it('same names, new values: no chrome refresh and labels stay on their rows', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap', width: 600, height: 400 },
      series: mk(0),
    })
    const before = namedLabelYs(chart)
    expect(Object.keys(before).sort()).toEqual(['Alpha', 'Beta', 'Gamma'])

    await chart.updateSeries(mk(1), false)
    expect(chart._updateStats.fastWithAxes).toBe(0)
    expect(namedLabelYs(chart)).toEqual(before)

    await chart.updateSeries(mk(2), false)
    expect(namedLabelYs(chart)).toEqual(before)
  })

  it('reversed y-axis: labels stay on their rows after a data-only update', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap', width: 600, height: 400 },
      yaxis: { reversed: true },
      series: mk(0),
    })
    const before = namedLabelYs(chart)
    await chart.updateSeries(mk(1), false)
    expect(namedLabelYs(chart)).toEqual(before)
  })
})
