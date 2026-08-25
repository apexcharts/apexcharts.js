/**
 * Trellis (#22, P2) virtualization lifecycle, in jsdom.
 *
 * jsdom has no layout, so the IntersectionObserver mock DECLARES which cells
 * intersect; these tests cover the reconcile contract (mount only what is
 * wanted, stash on unmount, restore on remount); scrolling physics and frame
 * budgets live in tests/interaction/specs/trellis.spec.js.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import IntersectionObserver from './__mocks__/IntersectionObserver.js'
import ApexCharts from '../../src/entries/full.js'
// Trellis is Tier 2: `entries/full.js` no longer registers it, so the feature
// has to be imported the same way an application imports it.
import '../../src/features/trellis.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

beforeEach(() => {
  document.body.innerHTML = ''
  IntersectionObserver.instances.length = 0
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const walk = (n, base) =>
  Array.from({ length: n }, (_, i) => [
    Date.UTC(2025, 0, 1) + i * 86400000,
    base + i,
  ])

function manySeries(count) {
  return Array.from({ length: count }, (_, i) => ({
    name: 'Metric',
    region: `R${i}`,
    data: walk(4, i),
  }))
}

async function renderVirtualTrellis({ panels = 6, trellis = {}, options = {} } = {}) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: true, ...trellis },
    series: manySeries(panels),
    xaxis: { type: 'datetime' },
    ...options,
  })
  await chart.render()
  return { chart, el }
}

/** Poll until fn() is truthy (the drain is rAF/timeout batched). */
async function until(fn, what = 'condition', timeout = 5000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (fn()) return
    await new Promise((r) => setTimeout(r, 20))
  }
  throw new Error(`timed out waiting for ${what}`)
}

const io = () => IntersectionObserver.instances.at(-1)
const cells = (el) => Array.from(el.querySelectorAll('.apexcharts-trellis-cell'))
const mountedCount = (chart) =>
  chart.getPanels().filter((p) => p.chart !== null).length

describe('virtualization activation', () => {
  it("'auto' virtualizes above 64 panels: cells and headers exist, charts do not", async () => {
    const { chart, el } = await renderVirtualTrellis({
      panels: 70,
      trellis: { virtualize: 'auto' },
    })
    expect(chart.trellis._virtualActive).toBe(true)
    expect(cells(el)).toHaveLength(70)
    expect(el.querySelectorAll('.apexcharts-trellis-header')).toHaveLength(70)
    expect(el.querySelectorAll('.apexcharts-canvas')).toHaveLength(0)
    const mounts = el.querySelectorAll('.apexcharts-trellis-skeleton')
    expect(mounts).toHaveLength(70)
    // The skeleton reserves the panel height, so page height cannot shift.
    expect(mounts[0].style.minHeight).toMatch(/px$/)
    chart.destroy()
  })

  it("'auto' stays eager at or below 64 panels", async () => {
    const { chart } = await renderVirtualTrellis({
      panels: 6,
      trellis: { virtualize: 'auto' },
    })
    expect(chart.trellis._virtualActive).toBe(false)
    expect(mountedCount(chart)).toBe(6)
    chart.destroy()
  })

  // The heaviest test in the suite by a wide margin: it opts OUT of
  // virtualization at 70 panels, so it mounts 70 real chart instances in
  // jsdom. ~1.5s alone, ~3.3s under full-suite parallelism, and roughly 8x
  // that on the publish runner — which is how it timed out in CI and blocked
  // the 7.0.0-rc.1 publish. Its own budget, rather than dragging the global
  // one up to fit it.
  it(
    'virtualize: false renders 70 panels eagerly, with a warning',
    async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { chart } = await renderVirtualTrellis({
        panels: 70,
        trellis: { virtualize: false },
      })
      expect(chart.trellis._virtualActive).toBe(false)
      expect(mountedCount(chart)).toBe(70)
      expect(
        warn.mock.calls.some((c) => String(c[0]).includes('renders eagerly')),
      ).toBe(true)
      warn.mockRestore()
      chart.destroy()
    },
    60000,
  )

  it('virtualize: true virtualizes even a small grid', async () => {
    const { chart } = await renderVirtualTrellis({ panels: 6 })
    expect(chart.trellis._virtualActive).toBe(true)
    expect(mountedCount(chart)).toBe(0)
    chart.destroy()
  })
})

describe('mount / unmount reconcile', () => {
  it('mounts exactly the intersecting cells, in rAF batches', async () => {
    const { chart, el } = await renderVirtualTrellis({ panels: 12 })
    const visible = cells(el).slice(0, 6)
    io().trigger(visible)
    await until(() => mountedCount(chart) === 6, '6 mounted panels')
    // Only the intersecting cells carry a chart; the rest keep the skeleton.
    chart.getPanels().forEach((p, i) => {
      if (i < 6) {
        expect(p.chart).toBeTruthy()
        expect(
          p.el.querySelector('.apexcharts-trellis-panel').classList.contains(
            'apexcharts-trellis-skeleton',
          ),
        ).toBe(false)
      } else {
        expect(p.chart).toBeNull()
      }
    })
    // Every mounted panel joined the shared group.
    expect(chart.getPanel('R0').getSyncedCharts()).toHaveLength(6)
    chart.destroy()
  })

  it('a panel scrolling out is destroyed and stashed; scrolling back restores its zoom window', async () => {
    const { chart, el } = await renderVirtualTrellis({ panels: 6 })
    io().trigger(cells(el))
    await until(() => mountedCount(chart) === 6, 'all panels mounted')

    // Zoom every mounted panel (what the group's native x sync would do).
    const zoomMin = Date.UTC(2025, 0, 2)
    const zoomMax = Date.UTC(2025, 0, 3)
    for (const p of chart.getPanels()) {
      await p.chart.updateOptions(
        { xaxis: { min: zoomMin, max: zoomMax } },
        false,
        false,
        false,
      )
      p.chart.w.interact.zoomed = true
    }

    // All cells leave the viewport: every panel unmounts, stash captured.
    io().trigger([])
    await until(() => mountedCount(chart) === 0, 'all panels unmounted')
    const rec = chart.trellis.panels[0]
    expect(rec.viewStash).toBeTruthy()
    expect(rec.viewStash.window.xaxis).toEqual({ min: zoomMin, max: zoomMax })
    expect(rec.viewStash.zoomed).toBe(true)
    expect(
      el.querySelectorAll('.apexcharts-trellis-skeleton'),
    ).toHaveLength(6)

    // Panel 0 re-enters with NO mounted sibling: the stash is the source.
    io().trigger([cells(el)[0]])
    await until(() => chart.getPanel('R0') !== null, 'panel 0 remounted')
    const remounted = chart.getPanel('R0')
    expect(remounted.w.config.xaxis.min).toBe(zoomMin)
    expect(remounted.w.config.xaxis.max).toBe(zoomMax)
    expect(remounted.w.interact.zoomed).toBe(true)
    chart.destroy()
  })

  it('a live sibling wins over a stale stash (pushes miss unmounted panels)', async () => {
    const { chart, el } = await renderVirtualTrellis({ panels: 6 })
    io().trigger(cells(el))
    await until(() => mountedCount(chart) === 6, 'all panels mounted')

    // Panel 0 leaves, carrying an UNZOOMED stash.
    io().trigger(cells(el).slice(1))
    await until(() => chart.getPanel('R0') === null, 'panel 0 unmounted')

    // The grid zooms while panel 0 is away (reaches only mounted panels).
    const zoomMin = Date.UTC(2025, 0, 2)
    const zoomMax = Date.UTC(2025, 0, 4)
    for (const p of chart.getPanels()) {
      if (!p.chart) continue
      await p.chart.updateOptions(
        { xaxis: { min: zoomMin, max: zoomMax } },
        false,
        false,
        false,
      )
      p.chart.w.interact.zoomed = true
    }

    io().trigger(cells(el))
    await until(() => chart.getPanel('R0') !== null, 'panel 0 remounted')
    expect(chart.getPanel('R0').w.config.xaxis.min).toBe(zoomMin)
    expect(chart.getPanel('R0').w.config.xaxis.max).toBe(zoomMax)
    expect(chart.getPanel('R0').w.interact.zoomed).toBe(true)
    chart.destroy()
  })

  it('a remount respects the shared legend hidden set', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'region', virtualize: true },
      series: [
        ...manySeries(3),
        { name: 'Target', data: walk(4, 50) }, // keyless: repeats everywhere
      ],
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    io().trigger(cells(el))
    await until(() => mountedCount(chart) === 3, 'all panels mounted')

    chart.trellis.sync.toggleSeries('Target')
    io().trigger([])
    await until(() => mountedCount(chart) === 0, 'all panels unmounted')
    io().trigger([cells(el)[0]])
    await until(() => chart.getPanel('R0') !== null, 'panel 0 remounted')
    expect(
      chart.getPanel('R0').w.globals.collapsedSeriesIndices.length,
    ).toBe(1)
    chart.destroy()
  })

  it('remounts never replay the mount animation', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      // Animations EXPLICITLY on: the remount must still come up static.
      chart: { type: 'line', height: 400, animations: { enabled: true } },
      trellis: { by: 'region', virtualize: true },
      series: manySeries(3),
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    io().trigger(cells(el))
    await until(() => mountedCount(chart) === 3, 'all panels mounted')
    expect(chart.getPanel('R0').w.config.chart.animations.enabled).toBe(true)

    io().trigger([])
    await until(() => mountedCount(chart) === 0, 'all panels unmounted')
    io().trigger(cells(el))
    await until(() => mountedCount(chart) === 3, 'all panels remounted')
    expect(chart.getPanel('R0').w.config.chart.animations.enabled).toBe(false)
    chart.destroy()
  })
})

describe('teardown hygiene', () => {
  it('destroy() with mounted and unmounted panels leaves a clean registry and observer', async () => {
    const { chart, el } = await renderVirtualTrellis({ panels: 12 })
    io().trigger(cells(el).slice(0, 4))
    await until(() => mountedCount(chart) === 4, '4 mounted panels')
    const observer = io()
    const virtual = chart.trellis.virtual // destroy() nulls ctx.trellis
    chart.destroy()
    expect(Apex._chartInstances.length).toBe(0)
    expect(observer.elements.size).toBe(0)
    expect(virtual._io).toBeNull()
    expect(virtual.active).toBe(false)
    expect(document.querySelectorAll('.apexcharts-trellis')).toHaveLength(0)
  })
})
