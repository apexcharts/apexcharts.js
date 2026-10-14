import { afterEach, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'
import Graphics from '../../src/modules/Graphics.js'

// Two unit layouts that let marks or labels leave the chart:
// - an arc (parliament) layout fitted the seat CENTRES into the plot, so
//   with few, large seats the outer row was clipped at the plot edge;
// - the outer-label gutter was measured at regular weight while the labels
//   are drawn semibold, so long labels could be clipped at the SVG edge.

let chart

async function mount(o) {
  document.body.innerHTML = '<div id="chart"></div>'
  o.chart = { type: 'unit', width: 600, height: 400, animations: { enabled: false }, ...o.chart }
  chart = new ApexCharts(document.querySelector('#chart'), o)
  await chart.render()
  return chart
}

afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

it.each([
  [600, 200, [5]],
  [400, 400, [3, 2]],
  [800, 220, [40, 30, 20]],
])('keeps every arc seat inside a %sx%s plot', async (width, height, series) => {
  await mount({
    chart: { width, height },
    series,
    labels: series.map((_, i) => `P${i}`),
    plotOptions: { unit: { layout: 'arc', clusterLabels: { show: false } } },
  })
  const { gridWidth, gridHeight } = chart.w.layout
  chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area').forEach((d) => {
    const x = +d.getAttribute('cx')
    const y = +d.getAttribute('cy')
    const r = +d.getAttribute('r')
    expect(x - r).toBeGreaterThanOrEqual(-0.5)
    expect(y - r).toBeGreaterThanOrEqual(-0.5)
    expect(x + r).toBeLessThanOrEqual(gridWidth + 0.5)
    expect(y + r).toBeLessThanOrEqual(gridHeight + 0.5)
  })
})

it('insets a few-seat arc by its final seat size, not the first guess', async () => {
  await mount({
    series: [5],
    labels: ['P0'],
    plotOptions: { unit: { layout: 'arc', clusterLabels: { show: false } } },
  })
  // Insetting by the seat size of the un-inset radius shrank these to r 56.
  const r = +chart.w.dom.baseEl.querySelector('.apexcharts-unit-area').getAttribute('r')
  expect(r).toBeGreaterThan(62)
})

it('measures the outer-label gutter at the weight the labels are drawn at', async () => {
  const spy = vi.spyOn(Graphics.prototype, 'getTextRects')
  const rows = (objects, rect) =>
    objects.map((o, k) => ({ id: o.id, x: rect.x + 30 + (k % 6) * 40, y: rect.y + 20 + Math.floor(k / 6) * 30 }))
  await mount({
    series: [12, 6],
    labels: ['Customer Success', 'Engineering'],
    plotOptions: {
      unit: {
        layout: 'custom',
        positions: rows,
        clusterLabels: { show: true, fontWeight: 700, external: { show: true } },
      },
    },
  })
  const calls = spy.mock.calls.filter((a) => String(a[0]).includes('Customer Success'))
  expect(calls.length).toBeGreaterThan(0)
  expect(calls.every((a) => String(a[5]) === '700')).toBe(true)
  const drawn = chart.w.dom.baseEl.querySelector('.apexcharts-unit-outer-label')
  expect(drawn.getAttribute('font-weight')).toBe('700')
})
