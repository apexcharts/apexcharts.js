/**
 * Panel option assembly policy:
 *   - an explicit chart.zoom.enabled: false is respected; trellis.zoom only
 *     decides whether an enabled zoom syncs (and the shared toolbar leaves
 *     out zoom, pan and reset when zoom is off);
 *   - the user's series and trellis.data are never deep-cloned per panel
 *     (and the user's config is never mutated doing so);
 *   - the edge-label policy reads the EFFECTIVE y mode, so a histogram a
 *     type frame forced to a shared y labels only its edge panels.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import Utils from '../../src/utils/Utils.js'

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
const SERIES = [
  { name: 'Revenue', region: 'North', data: rows(10) },
  { name: 'Revenue', region: 'South', data: rows(20) },
]

async function mk(opts) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: SERIES,
    xaxis: { type: 'datetime' },
    ...opts,
  })
  await chart.render()
  return { chart, el }
}

describe('chart.zoom.enabled: false is respected (p2-trellis-5)', () => {
  it('no panel zooms, and the toolbar offers no zoom, pan or reset', async () => {
    const { chart, el } = await mk({
      chart: {
        type: 'line',
        height: 400,
        animations: { enabled: false },
        zoom: { enabled: false },
      },
    })
    chart.trellis.panels.forEach((p) => {
      expect(p.chart.w.config.chart.zoom.enabled).toBe(false)
      expect(p.chart.w.interact.zoomEnabled).toBeFalsy()
    })
    for (const k of ['zoom', 'pan', 'reset'])
      expect(el.querySelector('.apexcharts-trellis-tool-' + k)).toBeNull()
    chart.destroy()
  })

  it("zoom left unset still zooms; trellis.zoom 'none' still turns it off", async () => {
    const on = await mk()
    expect(on.chart.trellis.panels[0].chart.w.config.chart.zoom.enabled).toBe(true)
    expect(on.el.querySelector('.apexcharts-trellis-tool-pan')).toBeTruthy()
    on.chart.destroy()
    const off = await mk({ trellis: { by: 'region', virtualize: false, zoom: 'none' } })
    expect(off.chart.trellis.panels[0].chart.w.config.chart.zoom.enabled).toBe(false)
    expect(off.el.querySelector('.apexcharts-trellis-tool-pan')).toBeNull()
    off.chart.destroy()
  })

  it("a type default that turns zoom off is not the page's explicit false", async () => {
    // histogram defaults chart.zoom.enabled to false; the grid keeps its
    // synced zoom unless the page itself says false
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const obs = (base) => Array.from({ length: 30 }, (_, i) => base + (i % 11))
    const { chart } = await mk({
      chart: { type: 'histogram', height: 400, animations: { enabled: false } },
      series: ['North', 'South'].map((region, i) => ({
        name: 'd',
        region,
        data: obs(i * 3),
      })),
      xaxis: {},
    })
    warn.mockRestore()
    chart.trellis.panels.forEach((p) =>
      expect(p.chart.w.config.chart.zoom.enabled).toBe(true),
    )
    chart.destroy()
  })
})

describe('panels never deep-clone the whole grid (p2-trellis-8)', () => {
  it('assembly clones the user options without series or trellis.data, and leaves them intact', async () => {
    const { chart } = await mk()
    const t = chart.trellis
    const spy = vi.spyOn(Utils, 'clone')
    t._assemblePanelOptions(0)
    const cloned = spy.mock.calls.map((c) => c[0])
    spy.mockRestore()
    cloned.forEach((arg) => {
      expect(arg).not.toBe(chart.opts)
      if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
        expect(Object.prototype.hasOwnProperty.call(arg, 'series')).toBe(false)
        expect(Object.prototype.hasOwnProperty.call(arg, 'trellis')).toBe(false)
      }
    })
    // the user's own option object still carries everything
    expect(chart.opts.series).toBe(SERIES)
    expect(chart.opts.trellis.by).toBe('region')
    chart.destroy()
  })
})

describe('edge labels follow the effective y mode (p2-trellis-misc-12)', () => {
  it('a histogram forced to a shared y mutes the inner y labels', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const obs = (base) => Array.from({ length: 30 }, (_, i) => base + (i % 11))
    const { chart, el } = await mk({
      chart: { type: 'histogram', height: 400, animations: { enabled: false } },
      // a group y mode, which the histogram frame forces back to 'shared'
      trellis: {
        row: 'r',
        column: 'c',
        virtualize: false,
        scales: { y: 'independent-column' },
      },
      series: ['a', 'b'].flatMap((r, i) =>
        ['x', 'y'].map((c, j) => ({ name: 'd', r, c, data: obs(i * 3 + j) })),
      ),
      xaxis: {},
    })
    warn.mockRestore()
    expect(chart.trellis._yMode()).toBe('shared')
    const muted = [...el.querySelectorAll('.apexcharts-trellis-cell')].map((c) =>
      c.classList.contains('apexcharts-trellis-mute-y'),
    )
    expect(muted).toEqual([false, true, false, true])
    chart.destroy()
  })
})
