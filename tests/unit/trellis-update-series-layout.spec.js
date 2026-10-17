/**
 * Layout state a host updateSeries has to re-derive in place: the
 * independent-y label gutters (a panel whose labels widen or shrink pulls
 * every gutter with it) and a 2-D cell's mount state under emptyPanels
 * 'skip'/'hide' (a cell that gains or loses its data is structural).
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
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

describe('independent y re-aligns the label gutters after updateSeries (p2-trellis-9)', () => {
  // jsdom measures nothing; give label text a width so gutters can differ.
  let restore
  beforeEach(() => {
    const proto = window.SVGElement.prototype
    const prev = Object.getOwnPropertyDescriptor(proto, 'getBoundingClientRect')
    Object.defineProperty(proto, 'getBoundingClientRect', {
      configurable: true,
      writable: true,
      value() {
        const n = this.tagName === 'text' ? (this.textContent || '').length : 0
        return { x: 0, y: 0, top: 0, left: 0, right: n * 7, bottom: 12, width: n * 7, height: n ? 12 : 0 }
      },
    })
    restore = () => {
      if (prev) Object.defineProperty(proto, 'getBoundingClientRect', prev)
      else delete proto.getBoundingClientRect
    }
  })
  afterEach(() => restore())

  const gutters = (chart) =>
    chart.trellis.panels.map((p) => p.chart.w.layout.yLabelsCoords[0].width)

  it('a panel whose labels widen pulls every gutter with it; a shrink stays aligned', async () => {
    const { chart } = mk({ trellis: { by: 'region', virtualize: false, scales: { y: 'independent' } } })
    await chart.render()
    const g0 = gutters(chart)
    expect(g0[0]).toBe(g0[1])

    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: rows(10) },
      { name: 'Revenue', region: 'South', data: rows(1, 1000000) },
    ])
    const g1 = gutters(chart)
    expect(g1[0]).toBe(g1[1])
    expect(g1[0]).toBeGreaterThan(g0[0])

    // grow-only, like the virtualized floor: the panels keep sharing one
    // x origin, at the wider gutter
    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: rows(10) },
      { name: 'Revenue', region: 'South', data: rows(20) },
    ])
    const g2 = gutters(chart)
    expect(g2[0]).toBe(g2[1])
    chart.destroy()
  })

  it('an update that widens nothing costs no second gutter pass', async () => {
    const { chart } = mk({ trellis: { by: 'region', virtualize: false, scales: { y: 'independent' } } })
    await chart.render()
    let pushes = 0
    const orig = chart.trellis._pushGutterFloor.bind(chart.trellis)
    chart.trellis._pushGutterFloor = (w) => {
      pushes++
      return orig(w)
    }
    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: rows(11) },
      { name: 'Revenue', region: 'South', data: rows(21) },
    ])
    expect(pushes).toBe(0)
    const g = gutters(chart)
    expect(g[0]).toBe(g[1])
    chart.destroy()
  })
})

describe("2-D emptyPanels 'skip'/'hide' re-evaluate mount state on updateSeries (p2-trellis-6)", () => {
  const cells = (withNorthB) => [
    { name: 'Sales', region: 'North', product: 'A', data: rows(10) },
    ...(withNorthB
      ? [{ name: 'Sales', region: 'North', product: 'B', data: rows(12) }]
      : []),
    { name: 'Sales', region: 'South', product: 'A', data: rows(20) },
    { name: 'Sales', region: 'South', product: 'B', data: rows(22) },
  ]

  for (const mode of ['skip', 'hide']) {
    it(`'${mode}': a cell that gains data mounts a panel, and one that loses it unmounts`, async () => {
      const { chart, el } = mk(
        {
          trellis: {
            row: 'region',
            column: 'product',
            emptyPanels: mode,
            virtualize: false,
          },
        },
        cells(false),
      )
      await chart.render()
      const northB = () => chart.trellis.panels.find((p) => p.key.includes('North') && p.key.includes('B'))
      expect(northB().chart).toBe(null)

      await chart.updateSeries(cells(true))
      expect(northB().chart).toBeTruthy()
      expect(northB().cellEl.classList.contains('apexcharts-trellis-cell-empty')).toBe(false)
      expect(el.querySelectorAll('.apexcharts-trellis-cell .apexcharts-canvas')).toHaveLength(4)

      await chart.updateSeries(cells(false))
      expect(northB().chart).toBe(null)
      expect(el.querySelectorAll('.apexcharts-trellis-cell .apexcharts-canvas')).toHaveLength(3)
      chart.destroy()
    })
  }
})
