/**
 * Trellis host seams reported from the field (2026-09-30):
 *
 *   - `chart.height: '100%'` was read as 100 PIXELS, so a full-height grid
 *     laid itself out for a 100px box and every panel hit the height floor.
 *   - an update that arrived before the first render settled missed the
 *     trellis branch entirely and drew a stray single chart beside the grid.
 *   - every `updateOptions`, however small, destroyed and rebuilt every panel.
 *   - `panelMounted` / `trellisMounted` only ever reached `addEventListener`,
 *     never the `chart.events` config callbacks every other event honours.
 *   - the HTML chrome (headers, legend) ignored `theme.mode`.
 *
 * The geometry halves (a height-only container resize refitting the panels,
 * the chrome-height reserve) need a real layout engine and live in
 * tests/interaction/specs/trellis.spec.js.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'
import '../../src/features/trellis.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const rows = (base) =>
  Array.from({ length: 4 }, (_, i) => [
    Date.UTC(2025, 0, 1) + i * 86400000,
    base + i,
  ])

const SERIES = [
  { name: 'Revenue', region: 'North', data: rows(10) },
  { name: 'Revenue', region: 'South', data: rows(20) },
]

/** A host inside a parent of a known height, so '%' has something to resolve. */
function mount({ options = {}, trellis = {}, parentHeight = 500 } = {}) {
  const parent = document.createElement('div')
  parent.style.height = `${parentHeight}px`
  document.body.appendChild(parent)
  // jsdom has no layout; the trellis measures through getBoundingClientRect,
  // so stub the one box it reads for a percentage height.
  parent.getBoundingClientRect = () => ({
    width: 900,
    height: parentHeight,
    top: 0,
    left: 0,
    right: 900,
    bottom: parentHeight,
  })

  const el = document.createElement('div')
  parent.appendChild(el)

  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false, ...trellis },
    series: SERIES,
    xaxis: { type: 'datetime' },
    ...options,
  })
  return { chart, el, parent }
}

describe("chart.height: '100%' on a trellis host", () => {
  it('resolves against the container, not as 100 pixels', async () => {
    const { chart } = mount({
      options: { chart: { type: 'line', height: '100%', animations: { enabled: false } } },
      parentHeight: 500,
    })
    await chart.render()
    expect(chart.trellis._hostHeight()).toBe(500)
    chart.destroy()
  })

  it('still reads a plain number, a px string and auto the way it always did', async () => {
    const { chart } = mount()
    await chart.render()
    const t = chart.trellis
    const w = chart.w

    w.config.chart.height = 640
    expect(t._hostHeight()).toBe(640)
    w.config.chart.height = '320px'
    expect(t._hostHeight()).toBe(320)
    w.config.chart.height = 'auto'
    expect(t._hostHeight()).toBeUndefined()
    w.config.chart.height = undefined
    expect(t._hostHeight()).toBeUndefined()
    chart.destroy()
  })

  it('a percentage of an unmeasurable container falls back to the aspect ratio', async () => {
    const { chart } = mount({
      options: { chart: { type: 'line', height: '100%', animations: { enabled: false } } },
      parentHeight: 0,
    })
    await chart.render()
    expect(chart.trellis._hostHeight()).toBeUndefined()
    chart.destroy()
  })
})

describe('an update that lands before the first render settles', () => {
  it('leaves no stray single chart beside the grid', async () => {
    const { chart, el } = mount()
    const rendered = chart.render()
    // Deliberately NOT awaited: this is the race the report describes.
    const updated = chart.updateOptions({ colors: ['#ff0000'] })
    await rendered
    await updated

    expect(el.querySelectorAll('.apexcharts-trellis')).toHaveLength(1)
    expect(el.querySelectorAll(':scope > .apexcharts-canvas')).toHaveLength(0)
    expect(el.querySelectorAll('.apexcharts-trellis-cell')).toHaveLength(2)
    chart.destroy()
  })

  it('the same race through updateSeries', async () => {
    const { chart, el } = mount()
    const rendered = chart.render()
    const updated = chart.updateSeries([
      { name: 'Revenue', region: 'North', data: rows(99) },
      { name: 'Revenue', region: 'South', data: rows(5) },
    ])
    await rendered
    await updated

    expect(el.querySelectorAll(':scope > .apexcharts-canvas')).toHaveLength(0)
    expect(el.querySelectorAll('.apexcharts-trellis-cell')).toHaveLength(2)
    chart.destroy()
  })
})

describe('updateOptions: rebuild only what needs rebuilding', () => {
  it('a paint-only change keeps the live panels (and their state)', async () => {
    const { chart } = mount()
    await chart.render()
    const before = chart.trellis.panels.map((p) => p.chart)

    await chart.updateOptions({ colors: ['#ff0000', '#00aa00'] })

    const after = chart.trellis.panels.map((p) => p.chart)
    // Identity, not equality: the point is that these are the SAME instances,
    // so hover state, focus and each panel's own zoom survived.
    expect(after).toHaveLength(before.length)
    after.forEach((c, i) => expect(c).toBe(before[i]))
    // and the new colour actually reached the panels
    expect(chart.trellis.panels[0].chart.w.config.colors[0]).toBe('#ff0000')
    chart.destroy()
  })

  it('a structural change still rebuilds the grid', async () => {
    const { chart } = mount()
    await chart.render()
    const before = chart.trellis.panels.map((p) => p.chart)

    await chart.updateOptions({ trellis: { by: 'region', columns: 1 } })

    const after = chart.trellis.panels.map((p) => p.chart)
    expect(after.some((c, i) => c !== before[i])).toBe(true)
    expect(chart.trellis.layout.cols).toBe(1)
    chart.destroy()
  })

  it('classifies each option group', async () => {
    const { chart } = mount()
    await chart.render()
    const t = chart.trellis

    for (const opts of [
      { colors: ['#123456'] },
      { dataLabels: { enabled: true } },
      { stroke: { width: 4 } },
      { tooltip: { enabled: false } },
      { markers: { size: 5 } },
      { grid: { show: false } },
    ]) {
      expect(t.canApplyInPlace(opts), JSON.stringify(opts)).toBe(true)
    }

    for (const opts of [
      { trellis: { columns: 2 } },
      { series: SERIES },
      { chart: { type: 'bar' } },
      { xaxis: { type: 'category' } },
      { yaxis: { min: 0 } },
      { theme: { mode: 'dark' } },
      { plotOptions: { bar: { horizontal: true } } },
      { legend: { show: false } },
      { colors: ['#123456'], chart: { height: 300 } },
      {},
    ]) {
      expect(t.canApplyInPlace(opts), JSON.stringify(opts)).toBe(false)
    }
    chart.destroy()
  })

  it('a promoted grid rebuilds, because its heights are not the layout ones', async () => {
    const { chart } = mount({ trellis: { promote: true } })
    await chart.render()
    await chart.promotePanel('South')
    expect(chart.trellis.canApplyInPlace({ colors: ['#123456'] })).toBe(false)
    chart.destroy()
  })
})

describe('trellis events reach chart.events, not just addEventListener', () => {
  it('fires panelMounted and trellisMounted through both channels', async () => {
    /** @type {string[]} */
    const viaConfig = []
    /** @type {string[]} */
    const viaListener = []

    const { chart } = mount({
      options: {
        chart: {
          type: 'line',
          height: 400,
          animations: { enabled: false },
          events: {
            panelMounted: (_ctx, cfg) => viaConfig.push(`panel:${cfg.key}`),
            trellisMounted: (_ctx, cfg) =>
              viaConfig.push(`grid:${cfg.panels.length}`),
          },
        },
      },
    })
    chart.addEventListener('panelMounted', (_ctx, cfg) =>
      viaListener.push(`panel:${cfg.key}`),
    )
    await chart.render()

    expect(viaConfig).toEqual(['panel:North', 'panel:South', 'grid:2'])
    expect(viaListener).toEqual(['panel:North', 'panel:South'])
    chart.destroy()
  })
})

describe('the HTML chrome follows the theme', () => {
  it("publishes chart.foreColor so headers and legend are not stuck at light grey", async () => {
    const light = mount()
    await light.chart.render()
    expect(
      light.el
        .querySelector('.apexcharts-trellis')
        .style.getPropertyValue('--apx-trellis-fore'),
    ).toBe('#373d3f')
    light.chart.destroy()

    const dark = mount({ options: { theme: { mode: 'dark' } } })
    await dark.chart.render()
    expect(dark.chart.w.config.chart.foreColor).toBe('#f6f7f8')
    expect(
      dark.el
        .querySelector('.apexcharts-trellis')
        .style.getPropertyValue('--apx-trellis-fore'),
    ).toBe('#f6f7f8')
    dark.chart.destroy()
  })

  it('an explicit foreColor wins over both', async () => {
    const { chart, el } = mount({
      options: {
        chart: {
          type: 'line',
          height: 400,
          animations: { enabled: false },
          foreColor: '#ff00ff',
        },
      },
    })
    await chart.render()
    expect(
      el
        .querySelector('.apexcharts-trellis')
        .style.getPropertyValue('--apx-trellis-fore'),
    ).toBe('#ff00ff')
    chart.destroy()
  })
})

// Reported from the field (2026-10-01, with a repro page): a '100%' stacked
// trellis reads 0..100 on the first render and falls back to the raw value
// range as soon as anything updates it.
describe("stackType: '100%' holds its percentage domain across updates", () => {
  const STACKED = [
    { name: 'A', region: 'East', data: [40, 50] },
    { name: 'B', region: 'East', data: [40, 30] },
    { name: 'A', region: 'West', data: [20, 30] },
    { name: 'B', region: 'West', data: [10, 20] },
  ]
  const percentHost = {
    options: {
      chart: {
        type: 'bar',
        height: 400,
        stacked: true,
        stackType: '100%',
        animations: { enabled: false },
      },
      series: STACKED,
      xaxis: { categories: ['Q1', 'Q2'] },
    },
  }
  const domains = (chart) =>
    chart.getPanels().map((p) => {
      const y = Array.isArray(p.chart.w.config.yaxis)
        ? p.chart.w.config.yaxis[0]
        : p.chart.w.config.yaxis
      return [y.min, y.max]
    })

  it('every panel starts at 0..100 and stays there through updateSeries', async () => {
    const { chart } = mount(percentHost)
    await chart.render()
    expect(domains(chart)).toEqual([
      [0, 100],
      [0, 100],
    ])

    // The reported trigger: the same data pushed again.
    await chart.updateSeries(STACKED)
    expect(domains(chart)).toEqual([
      [0, 100],
      [0, 100],
    ])

    // And through an in-place option update, which re-resolves the scales.
    await chart.updateOptions({ colors: ['#ff0000', '#00ff00'] })
    expect(domains(chart)).toEqual([
      [0, 100],
      [0, 100],
    ])
    chart.destroy()
  })

  it('the same data WITHOUT 100% keeps measuring the piles', async () => {
    const { chart } = mount({
      options: {
        ...percentHost.options,
        chart: { ...percentHost.options.chart, stackType: undefined },
      },
    })
    await chart.render()
    // East piles to 80, so the shared domain has to clear 80 (and must not be
    // the 100 the percentage path would hand back regardless of the data).
    domains(chart).forEach(([min, max]) => {
      expect(min).toBe(0)
      expect(max).toBeGreaterThanOrEqual(80)
    })
    chart.destroy()
  })
})
