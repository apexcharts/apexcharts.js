/**
 * Trellis (#22) lifecycle, in jsdom.
 *
 * jsdom has no layout engine, so these tests cover the ORCHESTRATION contract
 * (panels exist, group wiring, registry hygiene, teardown) — the pixel
 * alignment invariants live in tests/interaction/specs/trellis.spec.js where
 * a real browser measures them.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'
import InitCtxVariables from '../../src/modules/helpers/InitCtxVariables.js'
import { choosePanelRenderer } from '../../src/modules/trellis/Trellis.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

const walk = (n, base) =>
  Array.from({ length: n }, (_, i) => [
    Date.UTC(2025, 0, 1) + i * 86400000,
    base + i,
  ])

function trellisOptions(extra = {}) {
  return {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', ...extra.trellis },
    series: [
      { name: 'Revenue', region: 'North', data: walk(6, 10) },
      { name: 'Revenue', region: 'South', data: walk(6, 20) },
      { name: 'Revenue', region: 'East', data: walk(6, 30) },
    ],
    xaxis: { type: 'datetime' },
    ...extra.options,
  }
}

async function renderTrellis(extra = {}, elId = 'trellis-host') {
  const el = document.createElement('div')
  el.id = elId
  document.body.appendChild(el)
  const chart = new ApexCharts(el, trellisOptions(extra))
  await chart.render()
  return { chart, el }
}

beforeEach(() => {
  document.body.innerHTML = ''
  // Every spec asserts against a clean instance registry.
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

describe('trellis lifecycle', () => {
  it('renders one panel per facet key, each a real chart', async () => {
    const { chart, el } = await renderTrellis()
    const panels = chart.getPanels()
    expect(panels.map((p) => p.key)).toEqual(['North', 'South', 'East'])
    panels.forEach((p) => {
      expect(p.chart).toBeTruthy()
      expect(p.chart.w.config.chart.type).toBe('line')
    })
    expect(el.querySelectorAll('.apexcharts-trellis-cell')).toHaveLength(3)
    expect(el.querySelectorAll('.apexcharts-trellis-header')).toHaveLength(3)
    expect(
      el.querySelectorAll('.apexcharts-trellis-cell .apexcharts-canvas'),
    ).toHaveLength(3)
  })

  it('joins every panel into one namespaced group with both redraw flags off', async () => {
    const { chart } = await renderTrellis()
    const groups = chart.getPanels().map((p) => p.chart.w.config.chart.group)
    expect(new Set(groups).size).toBe(1)
    expect(groups[0]).toContain('-tg')
    chart.getPanels().forEach((p) => {
      expect(p.chart.w.config.chart.redrawOnParentResize).toBe(false)
      expect(p.chart.w.config.chart.redrawOnWindowResize).toBe(false)
      expect(p.chart.w.config.chart.toolbar.show).toBe(false)
    })
    // Group sync works through the panels themselves.
    const synced = chart.getPanels()[0].chart.getSyncedCharts()
    expect(synced).toHaveLength(3)
  })

  it('pushes identical shared scale bounds into every panel', async () => {
    const { chart } = await renderTrellis()
    const yaxes = chart.getPanels().map((p) => p.chart.w.config.yaxis[0])
    const first = yaxes[0]
    expect(first.min).toBeDefined()
    expect(first.max).toBeDefined()
    expect(first.tickAmount).toBeGreaterThan(0)
    yaxes.forEach((y) => {
      expect(y.min).toBe(first.min)
      expect(y.max).toBe(first.max)
      expect(y.tickAmount).toBe(first.tickAmount)
    })
    const xaxes = chart.getPanels().map((p) => p.chart.w.config.xaxis)
    xaxes.forEach((x) => {
      expect(x.min).toBe(xaxes[0].min)
      expect(x.max).toBe(xaxes[0].max)
    })
  })

  it('maps color by series name across panels regardless of per-panel order', async () => {
    const { chart } = await renderTrellis({
      options: {
        series: [
          { name: 'Rev', region: 'N', data: walk(3, 1) },
          { name: 'Cost', region: 'N', data: walk(3, 2) },
          // opposite declaration order in the second panel:
          { name: 'Cost', region: 'S', data: walk(3, 3) },
          { name: 'Rev', region: 'S', data: walk(3, 4) },
        ],
      },
    })
    const [n, s] = chart.getPanels().map((p) => p.chart.w.config.colors)
    // North is [Rev, Cost]; South is [Cost, Rev] — the color follows the NAME.
    expect(n[0]).toBe(s[1])
    expect(n[1]).toBe(s[0])
    expect(n[0]).not.toBe(n[1])
  })

  it('getPanel(key) returns the instance; unknown keys return null', async () => {
    const { chart } = await renderTrellis()
    expect(chart.getPanel('South')).toBe(chart.getPanels()[1].chart)
    expect(chart.getPanel('nope')).toBeNull()
  })

  it('destroy() leaves Apex._chartInstances empty and removes the DOM', async () => {
    const { chart, el } = await renderTrellis()
    // 3 panels registered (host has no chart.id, so only panels register).
    expect(Apex._chartInstances.length).toBe(3)
    chart.destroy()
    expect(Apex._chartInstances.length).toBe(0)
    expect(el.querySelector('.apexcharts-trellis')).toBeNull()
    expect(chart.getPanels()).toHaveLength(0)
  })

  it('two trellises on one page never join each other\'s group', async () => {
    const a = await renderTrellis({}, 'host-a')
    const b = await renderTrellis({}, 'host-b')
    const groupA = a.chart.getPanels()[0].chart.w.config.chart.group
    const groupB = b.chart.getPanels()[0].chart.w.config.chart.group
    expect(groupA).not.toBe(groupB)
    expect(a.chart.getPanels()[0].chart.getSyncedCharts()).toHaveLength(3)
    a.chart.destroy()
    b.chart.destroy()
  })

  it('updateSeries with the same key set updates panels in place', async () => {
    const { chart } = await renderTrellis()
    const before = chart.getPanels().map((p) => p.chart)
    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: walk(6, 100) },
      { name: 'Revenue', region: 'South', data: walk(6, 200) },
      { name: 'Revenue', region: 'East', data: walk(6, 300) },
    ])
    const after = chart.getPanels().map((p) => p.chart)
    // Same instances: no teardown happened.
    expect(after).toEqual(before)
    // New shared bounds reached every panel.
    const yaxes = chart.getPanels().map((p) => p.chart.w.config.yaxis[0])
    yaxes.forEach((y) => expect(y.max).toBe(yaxes[0].max))
    expect(yaxes[0].max).toBeGreaterThanOrEqual(300)
  })

  it('updateSeries with a changed key set re-renders the trellis', async () => {
    const { chart } = await renderTrellis()
    await chart.updateSeries([
      { name: 'Revenue', region: 'North', data: walk(6, 1) },
      { name: 'Revenue', region: 'West', data: walk(6, 2) }, // new key
    ])
    expect(chart.getPanels().map((p) => p.key)).toEqual(['North', 'West'])
    expect(Apex._chartInstances.length).toBe(2)
  })

  it('shared legend toggle hides that series name in every panel', async () => {
    const { chart, el } = await renderTrellis({
      options: {
        series: [
          { name: 'Rev', region: 'N', data: walk(3, 1) },
          { name: 'Target', region: 'N', data: walk(3, 2) },
          { name: 'Rev', region: 'S', data: walk(3, 3) },
          { name: 'Target', region: 'S', data: walk(3, 4) },
        ],
      },
    })
    const legendItems = el.querySelectorAll('.apexcharts-trellis-legend-item')
    expect(legendItems).toHaveLength(2)
    legendItems[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    chart.getPanels().forEach((p) => {
      expect(p.chart.w.globals.collapsedSeriesIndices).toContain(1)
    })
    expect(legendItems[1].classList.contains('apexcharts-inactive-legend')).toBe(
      true,
    )
  })

  it('warns and renders a single normal chart when the feature is not registered', async () => {
    const registry = InitCtxVariables._featureRegistry
    const saved = registry.get('trellis')
    registry.delete('trellis')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const chart = new ApexCharts(el, trellisOptions())
      await chart.render()
      expect(
        warn.mock.calls.some((c) => String(c[0]).includes('trellis feature')),
      ).toBe(true)
      // Fell through to the normal single-chart pipeline.
      expect(el.querySelector('.apexcharts-trellis')).toBeNull()
      expect(el.querySelector('.apexcharts-canvas')).toBeTruthy()
      expect(chart.getPanels()).toHaveLength(0)
      chart.destroy()
    } finally {
      registry.set('trellis', saved)
      warn.mockRestore()
    }
  })

  it('a chart without trellis config is untouched (isActive false, no panels)', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', animations: { enabled: false } },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    await chart.render()
    expect(chart.trellis).toBeTruthy() // module instantiated (full bundle)
    expect(chart.trellis.isActive()).toBe(false)
    expect(chart.getPanels()).toHaveLength(0)
    expect(el.querySelector('.apexcharts-trellis')).toBeNull()
    chart.destroy()
  })

  it('trellis.panel(key) override is applied last', async () => {
    const { chart } = await renderTrellis({
      trellis: {
        panel: (key) =>
          key === 'South' ? { stroke: { dashArray: 5 } } : {},
      },
    })
    expect(chart.getPanel('South').w.config.stroke.dashArray).toBe(5)
    expect(chart.getPanel('North').w.config.stroke.dashArray).toBe(0)
  })

  it('static ApexCharts.trellis creates and mounts a host', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = ApexCharts.trellis(el, trellisOptions())
    expect(chart).toBeTruthy()
    await chart.render() // idempotent: settles with the in-flight mount
    expect(chart.getPanels()).toHaveLength(3)
    chart.destroy()
  })
})

describe('animation policy (P2)', () => {
  const bigSeries = (n) =>
    Array.from({ length: n }, (_, i) => ({
      name: 'M',
      region: `R${i}`,
      data: walk(3, i),
    }))

  it('defaults animations OFF above 16 panels when the user left them unset', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400 }, // no animations key at all
      trellis: { by: 'region' },
      series: bigSeries(20),
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    chart.getPanels().forEach((p) => {
      expect(p.chart.w.config.chart.animations.enabled).toBe(false)
    })
    chart.destroy()
  })

  it('an EXPLICIT user animations.enabled: true wins over the panel budget', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: true } },
      trellis: { by: 'region' },
      series: bigSeries(20),
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    chart.getPanels().forEach((p) => {
      expect(p.chart.w.config.chart.animations.enabled).toBe(true)
    })
    chart.destroy()
  })

  it('keeps the library default (on) at or below 16 panels', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400 },
      trellis: { by: 'region' },
      series: bigSeries(4),
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    chart.getPanels().forEach((p) => {
      expect(p.chart.w.config.chart.animations.enabled).toBe(true)
    })
    chart.destroy()
  })
})

describe('grid-level canvas auto-selection (P2)', () => {
  const scatterSplit = (panels, pointsPerPanel) => ({
    panels: Array.from({ length: panels }, () => ({
      series: [{ name: 'S', data: new Array(pointsPerPanel).fill([1, 2]) }],
    })),
  })
  const hostConfig = (over = {}) => ({
    chart: { type: 'scatter', ...over.chart },
    markers: over.markers || {},
    dataLabels: over.dataLabels || { enabled: false },
    fill: over.fill || {},
    plotOptions: over.plotOptions || {},
    states: over.states || {},
  })

  it('promotes a dense scatter grid to canvas (total marks, not per panel)', () => {
    // 40 panels x 500 points = 20k marks: far past the 8k default threshold,
    // while any single panel (500) never is.
    expect(
      choosePanelRenderer(scatterSplit(40, 500), hostConfig(), {}, true),
    ).toBe('canvas')
    expect(
      choosePanelRenderer(scatterSplit(4, 500), hostConfig(), {}, true),
    ).toBeNull()
  })

  it('respects an explicit user chart.renderer', () => {
    expect(
      choosePanelRenderer(
        scatterSplit(40, 500),
        hostConfig(),
        { chart: { renderer: 'svg' } },
        true,
      ),
    ).toBeNull()
  })

  it('declines when the canvas feature is not registered', () => {
    expect(
      choosePanelRenderer(scatterSplit(40, 500), hostConfig(), {}, false),
    ).toBeNull()
  })

  it('declines a markerless line grid (paths are O(1) nodes, SVG is fine)', () => {
    expect(
      choosePanelRenderer(
        scatterSplit(40, 500),
        hostConfig({ chart: { type: 'line' }, markers: { size: 0 } }),
        {},
        true,
      ),
    ).toBeNull()
  })

  it('declines a canvas-unsupported feature (gradient fill)', () => {
    expect(
      choosePanelRenderer(
        scatterSplit(40, 500),
        hostConfig({ fill: { type: 'gradient' } }),
        {},
        true,
      ),
    ).toBeNull()
  })

  it('honors the chart.rendererThreshold knob at grid level', () => {
    expect(
      choosePanelRenderer(
        scatterSplit(4, 100),
        hostConfig({ chart: { type: 'scatter', rendererThreshold: 300 } }),
        {},
        true,
      ),
    ).toBe('canvas')
  })
})

describe('tidy-row input (P2)', () => {
  const rows = []
  for (const region of ['North', 'South']) {
    for (let m = 0; m < 3; m++) {
      rows.push({
        region,
        month: `M${m}`,
        revenue: region === 'North' ? 10 + m : 20 + m,
      })
    }
  }

  it('renders a trellis from trellis.data rows, no series needed', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'region', data: rows, x: 'month', y: 'revenue' },
      series: [],
    })
    await chart.render()
    expect(chart.getPanels().map((p) => p.key)).toEqual(['North', 'South'])
    expect(chart.getPanel('North').w.config.series[0].name).toBe('revenue')
    expect(
      chart.getPanel('North').w.config.series[0].data.map((d) => d.y),
    ).toEqual([10, 11, 12])
    chart.destroy()
  })

  it('rows win over series when both are given, with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'region', data: rows, x: 'month', y: 'revenue' },
      series: [{ name: 'Ignored', region: 'Z', data: [1, 2, 3] }],
    })
    await chart.render()
    expect(chart.getPanels().map((p) => p.key)).toEqual(['North', 'South'])
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('using trellis.data')),
    ).toBe(true)
    warn.mockRestore()
    chart.destroy()
  })

  it('updateSeries on a tidy trellis warns and points at updateOptions', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'region', data: rows, x: 'month', y: 'revenue' },
    })
    await chart.render()
    const before = chart.getPanels().length
    await chart.updateSeries([{ name: 'X', region: 'Q', data: [1] }])
    expect(chart.getPanels()).toHaveLength(before)
    expect(
      warn.mock.calls.some((c) =>
        String(c[0]).includes('renders from trellis.data'),
      ),
    ).toBe(true)
    warn.mockRestore()
    chart.destroy()
  })

  it('updating rows through updateOptions({ trellis: { data } }) re-renders the grid', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'region', data: rows, x: 'month', y: 'revenue' },
    })
    await chart.render()
    const more = rows.concat([
      { region: 'East', month: 'M0', revenue: 5 },
      { region: 'East', month: 'M1', revenue: 6 },
    ])
    await chart.updateOptions({ trellis: { data: more } })
    expect(chart.getPanels().map((p) => p.key)).toEqual([
      'North',
      'South',
      'East',
    ])
    chart.destroy()
  })
})
