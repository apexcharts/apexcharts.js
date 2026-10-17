/**
 * Legend-hidden state across a rebuild (teardown + render).
 *
 * The rule is the plain chart's: a series hidden from the legend stays
 * hidden across updateOptions and updateSeries, so the rebuilt legend,
 * every rebuilt panel and the sync all keep it. A zoom window does not
 * outlive a rebuild (every domain is re-derived), so the sync record is
 * cleared with it.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})
beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const day = (i) => Date.UTC(2025, 0, 1) + i * 86400000
const rows = (base) => Array.from({ length: 4 }, (_, i) => [day(i), base + i])
const series = (regions, k = 1) =>
  regions.flatMap((region, j) => [
    { name: 'Revenue', region, data: rows((10 + j) * k) },
    { name: 'Cost', region, data: rows((5 + j) * k) },
  ])

function mk(extra = {}, s = series(['North', 'South'])) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: s,
    xaxis: { type: 'datetime' },
    ...extra,
  })
  return { chart, el }
}

const legendItem = (el, name) =>
  [...el.querySelectorAll('.apexcharts-trellis-legend-item')].find(
    (n) => n.textContent === name,
  )
const inactive = (item) => item.classList.contains('apexcharts-inactive-legend')
const collapsed = (chart) =>
  chart.trellis.panels.map((p) => p.chart.w.globals.collapsedSeriesIndices)

describe('legend-hidden state across a rebuild (p2-trellis-misc-3, p2-trellis-7)', () => {
  it('updateOptions({ title }) rebuilds with the hidden series still hidden everywhere', async () => {
    const { chart, el } = mk()
    await chart.render()
    const before = chart.trellis.panels[0].chart
    legendItem(el, 'Cost').click()
    expect(collapsed(chart)).toEqual([[1], [1]])

    await chart.updateOptions({ title: { text: 'Q2' } })
    expect(chart.trellis.panels[0].chart).not.toBe(before) // a rebuild
    // legend, sync and every panel agree: Cost is hidden
    expect(inactive(legendItem(el, 'Cost'))).toBe(true)
    expect(chart.trellis.sync.isHidden('Cost')).toBe(true)
    expect(collapsed(chart)).toEqual([[1], [1]])

    // ... so one click shows it again
    legendItem(el, 'Cost').click()
    expect(inactive(legendItem(el, 'Cost'))).toBe(false)
    expect(collapsed(chart)).toEqual([[], []])
    chart.destroy()
  })

  it('a new facet key set (updateSeries rebuild) keeps the agreement, and one click toggles', async () => {
    const { chart, el } = mk()
    await chart.render()
    legendItem(el, 'Cost').click()

    await chart.updateSeries(series(['North', 'South', 'East']))
    expect(inactive(legendItem(el, 'Cost'))).toBe(true)
    expect(collapsed(chart)).toEqual([[1], [1], [1]])
    legendItem(el, 'Cost').click()
    expect(chart.trellis.sync.isHidden('Cost')).toBe(false)
    expect(collapsed(chart)).toEqual([[], [], []])
    chart.destroy()
  })

  it('a zoom window does not outlive a rebuild', async () => {
    const { chart } = mk()
    await chart.render()
    const t = chart.trellis
    t.panels[0].chart.zoomX(day(1), day(2))
    await new Promise((r) => setTimeout(r, 20))
    expect(t.sync.currentWindow).toBeTruthy()

    await chart.updateOptions({ title: { text: 'Q2' } })
    expect(t.sync.currentWindow).toBe(null)
    t.panels.forEach((p) => {
      expect(p.chart.w.globals.minX).toBe(day(0))
      expect(p.chart.w.interact.zoomed).toBe(false)
    })
    chart.destroy()
  })

  it('an in-place updateSeries keeps a hidden series hidden in the legend and the panels', async () => {
    const { chart, el } = mk()
    await chart.render()
    legendItem(el, 'Cost').click()
    await chart.updateSeries(series(['North', 'South'], 2))
    expect(inactive(legendItem(el, 'Cost'))).toBe(true)
    expect(collapsed(chart)).toEqual([[1], [1]])
    chart.destroy()
  })
})
