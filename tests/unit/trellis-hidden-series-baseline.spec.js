/**
 * The shared legend's hidden set is the only source of a panel's hidden
 * state. Every panel row states it (true or false) in the first assembly
 * and in every data push, so a panel born with a series hidden (a rebuild,
 * a virtualized scroll-in) does not keep `hidden: true` in its initial
 * series, where a later updateSeries would inherit it and collapse a
 * series the legend shows. A page's own `hidden: true` seeds the set.
 *
 * jsdom has no layout, so the IntersectionObserver mock declares which
 * cells intersect (see trellis-virtual.spec.js).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import IntersectionObserver from './__mocks__/IntersectionObserver.js'
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
  IntersectionObserver.instances.length = 0
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const day = (i) => Date.UTC(2025, 0, 1) + i * 86400000
const rows = (base) => Array.from({ length: 4 }, (_, i) => [day(i), base + i])
const series = (regions, k = 1) =>
  regions.flatMap((region, j) => [
    { name: 'Revenue', region, data: rows((10 + j) * k) },
    { name: 'Cost', region, data: rows((5 + j) * k) },
  ])

async function mk(s, virtualize = false) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize },
    series: s,
    xaxis: { type: 'datetime' },
  })
  await chart.render()
  return { chart, el }
}

async function until(fn, what) {
  const start = Date.now()
  while (Date.now() - start < 3000) {
    if (fn()) return
    await new Promise((r) => setTimeout(r, 10))
  }
  throw new Error(`timed out waiting for ${what}`)
}

const cost = (el) =>
  [...el.querySelectorAll('.apexcharts-trellis-legend-item')].find(
    (n) => n.textContent === 'Cost',
  )
const inactive = (el) =>
  cost(el).classList.contains('apexcharts-inactive-legend')
const collapsed = (chart) =>
  chart.trellis.panels.map((p) => p.chart.w.globals.collapsedSeriesIndices)

describe('a series shown again stays shown across updateSeries', () => {
  it('eager: shown after a rebuild that mounted the panels with it hidden', async () => {
    const { chart, el } = await mk(series(['North', 'South']))
    cost(el).click()
    await chart.updateOptions({ title: { text: 'Q2' } }) // panels born hidden
    cost(el).click() // shown again
    expect(collapsed(chart)).toEqual([[], []])

    await chart.updateSeries(series(['North', 'South'], 2))
    expect(inactive(el)).toBe(false)
    expect(collapsed(chart)).toEqual([[], []])
    chart.trellis.panels.forEach((p) =>
      expect(p.chart.w.config.series.map((s) => !!s.hidden)).toEqual([false, false]),
    )
    chart.destroy()
  })

  it('virtual: shown after a scroll-in that mounted a panel with it hidden', async () => {
    const regions = ['R0', 'R1', 'R2']
    const { chart, el } = await mk(series(regions), true)
    const io = () => IntersectionObserver.instances.at(-1)
    const cells = () => [...el.querySelectorAll('.apexcharts-trellis-cell')]
    io().trigger(cells().slice(1))
    await until(() => chart.trellis.panels.filter((p) => p.chart).length === 2, 'two mounted')
    cost(el).click()
    io().trigger(cells())
    await until(() => chart.getPanel('R0') !== null, 'R0 mounted') // born hidden
    cost(el).click()

    await chart.updateSeries(series(regions, 2))
    expect(inactive(el)).toBe(false)
    expect(collapsed(chart)).toEqual([[], [], []])
    chart.destroy()
  })
})

describe("a page's own hidden: true", () => {
  it('starts hidden in the legend and the panels, and one click shows it', async () => {
    const s = series(['North', 'South']).map((r) =>
      r.name === 'Cost' ? { ...r, hidden: true } : r,
    )
    const { chart, el } = await mk(s)
    expect(inactive(el)).toBe(true)
    expect(collapsed(chart)).toEqual([[1], [1]])
    cost(el).click()
    expect(collapsed(chart)).toEqual([[], []])
    // the same rows again do not re-hide what the viewer showed
    await chart.updateSeries(s)
    expect(inactive(el)).toBe(false)
    expect(collapsed(chart)).toEqual([[], []])
    chart.destroy()
  })
})
