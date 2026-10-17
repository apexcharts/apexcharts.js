/**
 * A host updateSeries on a trellis with an unchanged key set pushes each
 * panel its new slice in place. It used to carry its own copy of half the
 * panel assembly, and the copy drifted: the y-label decimals stayed at the
 * first render's, the colour map was never re-pushed, the shared legend and
 * the heatmap gradient strip kept the old names and range, independent-y
 * gutters stopped agreeing, and a 2-D cell that gained data under
 * emptyPanels 'skip' stayed a blank. The update now pushes the same
 * `_panelDataPatch` the first assembly merges, then refreshes the chrome.
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
const rows = (base, scale = 1) =>
  Array.from({ length: 4 }, (_, i) => [day(i), (base + i) * scale])
// exact decimals (rows() at a fractional scale carries float noise)
const tenths = (vals) => vals.map((v, i) => [day(i), v])

function mk(extra = {}, series) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: series || [
      { name: 'Revenue', region: 'North', data: rows(10) },
      { name: 'Revenue', region: 'South', data: rows(20) },
    ],
    xaxis: { type: 'datetime' },
    ...extra,
  })
  return { chart, el }
}

const legendNames = (el) =>
  [...el.querySelectorAll('.apexcharts-trellis-legend-item')].map(
    (e) => e.textContent,
  )

describe('host updateSeries refreshes the y-label decimals (p2-trellis-2)', () => {
  it('a rescale from integers to tenths prints distinct fractional ticks', async () => {
    const { chart } = mk()
    await chart.render()
    const before = chart.trellis.panels[0].chart
    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: tenths([0.1, 0.2, 0.3, 0.4]) },
      { name: 'Revenue', region: 'South', data: tenths([0.2, 0.3, 0.4, 0.5]) },
    ])
    const panel = chart.trellis.panels[0].chart
    expect(panel).toBe(before) // in-place path, not a rebuild
    const f = panel.w.config.yaxis[0].labels.formatter
    expect(f(0.2)).not.toBe(f(0.4))
    // the value, not its spelling: trailing float-noise zeros on the tick
    // step are a separate issue (niceBounds), not this one
    expect(Number(f(0.2))).toBe(0.2)
    chart.destroy()
  })

  it('a user formatter is never replaced by the uniform one', async () => {
    const mine = (v) => `$${v}`
    const { chart } = mk({ yaxis: { labels: { formatter: mine } } })
    await chart.render()
    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: rows(0.1, 0.1) },
      { name: 'Revenue', region: 'South', data: rows(0.2, 0.1) },
    ])
    const f = chart.trellis.panels[0].chart.w.config.yaxis[0].labels.formatter
    expect(f(0.2)).toBe('$0.2')
    chart.destroy()
  })
})

describe('host updateSeries refreshes colours and the shared legend (p2-trellis-3)', () => {
  it('an added series gets its own colour and joins the legend', async () => {
    const { chart, el } = mk()
    await chart.render()
    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: rows(10) },
      { name: 'Cost', region: 'North', data: rows(5) },
      { name: 'Revenue', region: 'South', data: rows(20) },
    ])
    const t = chart.trellis
    const panel = t.panels[0].chart
    expect(panel.w.globals.colors[1]).toBe(t.scales.colorOf('Cost'))
    expect(panel.w.globals.colors[1]).not.toBe(panel.w.globals.colors[0])
    expect(legendNames(el)).toEqual(['Revenue', 'Cost'])
    chart.destroy()
  })

  it('a renamed series renames in the legend and toggles under its new name', async () => {
    const both = (second) => [
      { name: 'Revenue', region: 'North', data: rows(10) },
      { name: second, region: 'North', data: rows(5) },
      { name: 'Revenue', region: 'South', data: rows(20) },
      { name: second, region: 'South', data: rows(6) },
    ]
    const { chart, el } = mk({}, both('Cost'))
    await chart.render()
    const t = chart.trellis
    const item = (n) =>
      [...el.querySelectorAll('.apexcharts-trellis-legend-item')].find(
        (e) => e.textContent === n,
      )
    item('Cost').click()
    expect(t.sync.isHidden('Cost')).toBe(true)

    await chart.updateSeries(both('Margin'))
    expect(legendNames(el)).toEqual(['Revenue', 'Margin'])
    // a name the data lost is let go, so it would come back visible
    expect(t.sync.isHidden('Cost')).toBe(false)
    item('Margin').click()
    expect(t.sync.isHidden('Margin')).toBe(true)
    expect(item('Margin').classList.contains('apexcharts-inactive-legend')).toBe(
      true,
    )
    expect(t.panels[0].chart.w.globals.collapsedSeriesIndices).toEqual([1])
    chart.destroy()
  })

  it('a data update keeps keyboard focus on the legend item and the legend in place', async () => {
    const two = (k, extra = []) => [
      ...['North', 'South'].flatMap((region, j) => [
        { name: 'Revenue', region, data: rows(10 + j, k) },
        { name: 'Cost', region, data: rows(5 + j, k) },
      ]),
      ...extra,
    ]
    const { chart, el } = mk({}, two(1))
    await chart.render()
    const wrap = chart.trellis.elWrap
    const order = () => [...wrap.children].map((n) => n.className.split(' ')[0])
    const before = order()
    const item = (n) =>
      [...el.querySelectorAll('.apexcharts-trellis-legend-item')].find(
        (e) => e.textContent === n,
      )
    item('Cost').focus()
    expect(document.activeElement).toBe(item('Cost'))

    // same names: repainted in place
    await chart.updateSeries(two(2))
    expect(document.activeElement).toBe(item('Cost'))
    expect(order()).toEqual(before)
    await chart.updateOptions({ colors: ['#111111', '#222222'] })
    expect(document.activeElement).toBe(item('Cost'))

    // a new name: rebuilt where it stood
    await chart.updateSeries(
      two(3, [{ name: 'Margin', region: 'North', data: rows(1) }]),
    )
    expect(legendNames(el)).toEqual(['Revenue', 'Cost', 'Margin'])
    expect(order()).toEqual(before)
    chart.destroy()
  })
})

describe('host updateSeries refreshes the heatmap gradient strip (p2-trellis-split-7)', () => {
  const row = (name, site, vals) => ({
    name,
    site,
    data: vals.map((y, i) => ({ x: `c${i}`, y })),
  })
  const data = (k) => [
    row('r1', 'A', [0, 20 * k, 40 * k]),
    row('r1', 'B', [60 * k, 80 * k, 100 * k]),
  ]

  it('the strip range follows the new data when the facet keys are unchanged', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'heatmap', height: 400, animations: { enabled: false } },
      trellis: { by: 'site', virtualize: false },
      series: data(1),
      plotOptions: {
        heatmap: { colorScale: { gradientLegend: { enabled: true } } },
      },
      dataLabels: { enabled: false },
    })
    await chart.render()
    expect(chart.trellis.chrome.gradientLegend._max).toBe(100)
    const before = chart.trellis.panels[0].chart
    await chart.updateSeries(data(5))
    expect(chart.trellis.panels[0].chart).toBe(before) // in-place path
    const cs = before.w.config.plotOptions.heatmap.colorScale
    expect([cs.min, cs.max]).toEqual([0, 500])
    const strip = chart.trellis.chrome.gradientLegend
    expect(strip._max).toBe(500)
    expect(
      el.querySelectorAll('.apexcharts-trellis-gradient-legend'),
    ).toHaveLength(1)
    const labels = Array.from(
      el.querySelectorAll('.apexcharts-trellis-gradient-legend text'),
    ).map((t) => t.textContent)
    expect(labels.some((s) => s.includes('500'))).toBe(true)
    // the old strip's hover wiring left with it: one listener per panel bus
    const handlers = (p) =>
      (p.chart.w.globals.events.dataPointMouseEnter || []).length
    expect(chart.trellis.panels.map(handlers)).toEqual([1, 1])
    chart.destroy()
  })
})

describe('one data path for assembly and update (p2-trellis-10)', () => {
  it('after updateSeries every data-derived key matches a fresh assembly', async () => {
    const { chart } = mk()
    await chart.render()
    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: rows(0.1, 0.1) },
      { name: 'Cost', region: 'North', data: rows(0.05, 0.1) },
      { name: 'Revenue', region: 'South', data: rows(0.2, 0.1) },
    ])
    const t = chart.trellis
    t.panels.forEach((p) => {
      const fresh = t._assemblePanelOptions(p.index)
      const live = p.chart.w.config
      expect(live.colors).toEqual(fresh.colors)
      expect(live.xaxis.min).toBe(fresh.xaxis.min)
      expect(live.xaxis.max).toBe(fresh.xaxis.max)
      expect(live.yaxis[0].min).toBe(fresh.yaxis.min)
      expect(live.yaxis[0].max).toBe(fresh.yaxis.max)
      expect(live.yaxis[0].tickAmount).toBe(fresh.yaxis.tickAmount)
      ;[0, 0.1, 0.2, 0.35].forEach((v) =>
        expect(live.yaxis[0].labels.formatter(v)).toBe(
          fresh.yaxis.labels.formatter(v),
        ),
      )
    })
    chart.destroy()
  })
})
