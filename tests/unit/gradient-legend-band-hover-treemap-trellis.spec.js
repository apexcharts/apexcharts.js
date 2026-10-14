import { describe, it, expect, beforeAll } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import Graphics from '../../src/modules/Graphics.js'
import { createChartWithOptions } from './utils/utils.js'

// Gradient legend hover defects users saw:
// - on a treemap with colour ranges, hovering a band showed a pointer but
//   highlighted no tile;
// - on a heatmap trellis, hovering a band on the shared strip highlighted
//   the first panel only;
// - on a heatmap trellis, hovering a cell in any other panel moved the
//   strip's arrow and value to the first panel's value at that position.

const ranges = [
  { from: 0, to: 50, color: '#00A100' },
  { from: 51, to: 100, color: '#FF0000' },
]
const dimmed = (els) =>
  els.filter((c) => c.classList.contains('legend-mouseover-inactive')).length
const band = (root, idx) =>
  [...root.querySelectorAll('.apexcharts-heatmap-gradient-band')].find(
    (b) => b.getAttribute('data:range-index') === String(idx),
  )
const move = (el, type = 'mousemove') =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true }))

const row = (name, k, vals) => ({
  name,
  k,
  data: vals.map((y, i) => ({ x: `c${i}`, y })),
})

async function trellisHeatmap(colorScale) {
  document.body.innerHTML = ''
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'heatmap', height: 400, animations: { enabled: false } },
    trellis: { by: 'k' },
    series: [
      row('r1', 'a', [1, 2, 3]),
      row('r2', 'a', [4, 5, 6]),
      row('r1', 'b', [90, 95, 99]),
      row('r2', 'b', [80, 85, 88]),
    ],
    plotOptions: { heatmap: { colorScale } },
    dataLabels: { enabled: false },
  })
  await chart.render()
  const cells = (key) => [
    ...chart.getPanel(key).w.dom.baseEl.querySelectorAll('.apexcharts-heatmap-rect'),
  ]
  return { chart, el, cells }
}

describe('gradient legend band and cell hover', () => {
  beforeAll(() => {
    Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
      writable: true,
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    })
  })

  it('highlights a band on treemap tiles', () => {
    const chart = createChartWithOptions({
      chart: { type: 'treemap', height: 350, width: 500 },
      series: [{ data: [10, 20, 70, 90].map((y, i) => ({ x: `t${i}`, y })) }],
      legend: { show: true },
      plotOptions: {
        treemap: { colorScale: { ranges, gradientLegend: { enabled: true } } },
      },
    })
    const tiles = [...chart.el.querySelectorAll('.apexcharts-treemap-rect')]
    expect(tiles.length).toBe(4)
    move(band(chart.el, 0))
    expect(dimmed(tiles)).toBe(2)
    move(band(chart.el, 0), 'mouseout')
    expect(dimmed(tiles)).toBe(0)
  })

  it('highlights a band in every trellis panel', async () => {
    const { chart, el, cells } = await trellisHeatmap({
      ranges,
      gradientLegend: { enabled: true },
    })
    const strip = el.querySelector('.apexcharts-trellis-gradient-legend')
    move(band(strip, 0))
    expect(dimmed(cells('a'))).toBe(0)
    expect(dimmed(cells('b'))).toBe(cells('b').length)
    move(band(strip, 0), 'mouseout')
    expect(dimmed(cells('b'))).toBe(0)
    chart.destroy()
  })

  it('shows the hovered panel value on the shared strip', async () => {
    const { chart, el } = await trellisHeatmap({
      gradientLegend: { enabled: true, showHoverValue: true },
    })
    const b = chart.getPanel('b')
    Graphics._fireEvent(b.w, 'dataPointMouseEnter', [
      new MouseEvent('mouseenter'),
      b,
      { seriesIndex: 0, dataPointIndex: 2, w: b.w },
    ])
    const value = el.querySelector(
      '.apexcharts-trellis-gradient-legend .apexcharts-heatmap-gradient-legend-value',
    )
    expect(value.textContent).toContain('99')
    chart.destroy()
  })
})
