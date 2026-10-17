/**
 * What a virtualized panel must already know when it mounts after the fact:
 * the legend-hidden set (as the rebuilt legend shows it, and in its first
 * paint rather than by a second render), the tool armed on the shared
 * toolbar, and the domains of the CURRENT data rather than a window stashed
 * before a host updateSeries.
 *
 * jsdom has no layout, so the IntersectionObserver mock declares which cells
 * intersect (see trellis-virtual.spec.js).
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

async function mk(extra = {}, series) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: true },
    series:
      series ||
      ['R0', 'R1', 'R2'].flatMap((region, j) => [
        { name: 'Revenue', region, data: rows(10 + j) },
        { name: 'Cost', region, data: rows(5 + j) },
      ]),
    xaxis: { type: 'datetime' },
    ...extra,
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

const io = () => IntersectionObserver.instances.at(-1)
const cells = (el) => [...el.querySelectorAll('.apexcharts-trellis-cell')]
const mounted = (chart) => chart.trellis.panels.filter((p) => p.chart).length
const costItem = (el) =>
  [...el.querySelectorAll('.apexcharts-trellis-legend-item')].find(
    (n) => n.textContent === 'Cost',
  )

describe('legend-hidden state on a rebuilt virtual grid (p2-trellis-split-5)', () => {
  it('panels scrolled in after a rebuild agree with the rebuilt legend', async () => {
    const { chart, el } = await mk()
    io().trigger(cells(el))
    await until(() => mounted(chart) === 3, 'all mounted')
    costItem(el).click()

    await chart.updateOptions({ title: { text: 'Q2' } })
    io().trigger(cells(el))
    await until(() => mounted(chart) === 3, 'all remounted')
    expect(costItem(el).classList.contains('apexcharts-inactive-legend')).toBe(
      true,
    )
    chart.trellis.panels.forEach((p) =>
      expect(p.chart.w.globals.collapsedSeriesIndices).toEqual([1]),
    )
    chart.destroy()
  })
})

describe('a panel mounted after a legend toggle (p2-trellis-misc-6)', () => {
  it('comes up with the hidden series already hidden, in one render', async () => {
    let updates = 0
    const { chart, el } = await mk({
      chart: {
        type: 'line',
        height: 400,
        animations: { enabled: false },
        // counts re-renders of the panel under test (R0) only
        events: {
          updated: (c) => {
            if (/-tp0$/.test(c.w.config.chart.id)) updates++
          },
        },
      },
    })
    io().trigger(cells(el).slice(1))
    await until(() => mounted(chart) === 2, 'two mounted')
    costItem(el).click()

    updates = 0
    io().trigger(cells(el))
    await until(() => chart.getPanel('R0') !== null, 'R0 mounted')
    const p = chart.getPanel('R0')
    expect(p.w.globals.collapsedSeriesIndices).toEqual([1])
    expect(p.w.config.series[1].hidden).toBe(true)
    expect(updates).toBe(0) // no second render to hide it
    chart.destroy()
  })
})

describe('the shared toolbar tool reaches panels mounted later (p2-trellis-split-6)', () => {
  it('Pan armed with one panel mounted: panels scrolled in later pan too', async () => {
    const { chart, el } = await mk()
    io().trigger(cells(el).slice(0, 1))
    await until(() => mounted(chart) === 1, 'one mounted')
    el.querySelector('.apexcharts-trellis-tool-pan').click()

    io().trigger(cells(el))
    await until(() => mounted(chart) === 3, 'all mounted')
    chart.trellis.panels.forEach((p) => {
      expect(p.chart.w.interact.panEnabled).toBe(true)
      expect(p.chart.w.interact.zoomEnabled).toBeFalsy()
    })
    chart.destroy()
  })
})

describe('a remount after a host updateSeries draws the new domain (p2-trellis-misc-4)', () => {
  it("'independent-row': the scrolled-back panel matches its live row sibling", async () => {
    const cellSeries = (k) =>
      ['North', 'South'].flatMap((region, r) =>
        ['A', 'B'].map((product, c) => ({
          name: 'Sales',
          region,
          product,
          data: rows((10 + r * 50 + c) * k),
        })),
      )
    const { chart, el } = await mk(
      {
        trellis: {
          row: 'region',
          column: 'product',
          scales: { y: 'independent-row' },
          virtualize: true,
        },
      },
      cellSeries(1),
    )
    const all = cells(el)
    io().trigger(all)
    await until(() => mounted(chart) === 4, 'all mounted')
    // the first cell scrolls away with the old row window stashed
    io().trigger(all.slice(1))
    await until(() => chart.trellis.panels[0].chart === null, 'cell 0 unmounted')

    await chart.updateSeries(cellSeries(10))
    io().trigger(all)
    await until(() => mounted(chart) === 4, 'cell 0 remounted')
    const y = (i) => chart.trellis.panels[i].chart.w.config.yaxis[0]
    expect(y(0).max).toBe(y(1).max)
    expect(y(0).max).toBeGreaterThanOrEqual(110)
    chart.destroy()
  })
})
