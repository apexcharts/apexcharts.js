import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

// The fast path keeps the legend DOM, and the gradient strip's stops, end
// labels and the range its hover arrow maps against are computed only when
// it is drawn. An updateSeries() that moves the colour extent has to redraw
// it, while one inside the same extent keeps the fast path.

const mount = async () => {
  document.body.innerHTML = '<div id="c"></div>'
  const el = document.querySelector('#c')
  const chart = new ApexCharts(el, {
    chart: {
      type: 'heatmap',
      width: 500,
      height: 300,
      animations: { enabled: false },
    },
    series: [
      {
        name: 'R1',
        data: [
          { x: 'a', y: -20 },
          { x: 'b', y: 40 },
        ],
      },
      {
        name: 'R2',
        data: [
          { x: 'a', y: 0 },
          { x: 'b', y: 10 },
        ],
      },
    ],
    plotOptions: {
      heatmap: { colorScale: { gradientLegend: { enabled: true } } },
    },
  })
  await chart.render()
  return chart
}

const extent = (chart) => {
  const g = chart.legend.heatmapGradientLegend
  return [g._min, g._max]
}

describe('heatmap gradient legend after updateSeries', () => {
  it('redraws the strip when the colour extent changes', async () => {
    const chart = await mount()
    expect(extent(chart)).toEqual([-20, 40])
    await chart.updateSeries([
      {
        name: 'R1',
        data: [
          { x: 'a', y: -50 },
          { x: 'b', y: 400 },
        ],
      },
      {
        name: 'R2',
        data: [
          { x: 'a', y: 0 },
          { x: 'b', y: 10 },
        ],
      },
    ])
    expect(extent(chart)).toEqual([-50, 400])
    chart.destroy()
  })

  it('keeps the fast path when the extent is unchanged', async () => {
    const chart = await mount()
    await chart.updateSeries([
      {
        name: 'R1',
        data: [
          { x: 'a', y: -20 },
          { x: 'b', y: 40 },
        ],
      },
      {
        name: 'R2',
        data: [
          { x: 'a', y: 5 },
          { x: 'b', y: 15 },
        ],
      },
    ])
    expect(chart._updateStats.full).toBe(0)
    expect(extent(chart)).toEqual([-20, 40])
    chart.destroy()
  })
})
