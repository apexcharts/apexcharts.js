import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Drilldown from '../../src/modules/drilldown/Drilldown.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function drilldownOptions(overrides = {}) {
  return {
    chart: { type: 'bar', animations: { enabled: false }, ...overrides.chart },
    series: overrides.series || [
      {
        name: 'Sales',
        data: [
          { x: '2023', y: 100, drilldown: '2023-q' },
          { x: '2024', y: 150, drilldown: '2024-q' },
          { x: '2025', y: 200 }, // no children — not drillable
        ],
      },
    ],
    drilldown: {
      enabled: true,
      series: [
        {
          id: '2023-q',
          name: '2023 by Quarter',
          data: [
            { x: 'Q1', y: 20 },
            { x: 'Q2', y: 30 },
            { x: 'Q3', y: 25 },
            { x: 'Q4', y: 25 },
          ],
        },
        {
          id: '2024-q',
          name: '2024 by Quarter',
          data: [
            { x: 'Q1', y: 35 },
            { x: 'Q2', y: 40, drilldown: '2024-q2-m' },
            { x: 'Q3', y: 38 },
            { x: 'Q4', y: 37 },
          ],
        },
        {
          id: '2024-q2-m',
          name: 'Q2 2024 by Month',
          data: [
            { x: 'Apr', y: 12 },
            { x: 'May', y: 14 },
            { x: 'Jun', y: 14 },
          ],
        },
      ],
      ...overrides.drilldown,
    },
  }
}

function makeChart(overrides = {}) {
  return createChartWithOptions(drilldownOptions(overrides))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Drilldown — feature registration & state', () => {
  it('instantiates ctx.drilldown when the feature is enabled', () => {
    const chart = makeChart()
    expect(chart.drilldown).toBeInstanceOf(Drilldown)
    expect(chart.drilldown.depth).toBe(0)
    expect(chart.drilldown.path).toEqual(['root'])
  })

  it('does not wire listeners when disabled', () => {
    const chart = makeChart({ drilldown: { enabled: false } })
    // Instance still exists (eager), but it never wired itself.
    expect(chart.drilldown).toBeInstanceOf(Drilldown)
    expect(chart.drilldown._wired).toBe(false)
  })
})

describe('Drilldown — drillDown / drillUp / drillToRoot', () => {
  it('drills down into a child level and updates series', async () => {
    const chart = makeChart()
    await chart.drillDown('2024-q')

    expect(chart.drilldown.depth).toBe(1)
    expect(chart.drilldown.path).toEqual(['root', '2024-q'])
    expect(chart.getState().series[0]).toEqual([35, 40, 38, 37])
  })

  it('drills back up to the parent, restoring the root series', async () => {
    const chart = makeChart()
    await chart.drillDown('2024-q')
    await chart.drillUp()

    expect(chart.drilldown.depth).toBe(0)
    expect(chart.drilldown.path).toEqual(['root'])
    expect(chart.getState().series[0]).toEqual([100, 150, 200])
  })

  it('supports nested (recursive) drilldown', async () => {
    const chart = makeChart()
    await chart.drillDown('2024-q')
    await chart.drillDown('2024-q2-m')

    expect(chart.drilldown.depth).toBe(2)
    expect(chart.drilldown.path).toEqual(['root', '2024-q', '2024-q2-m'])
    expect(chart.getState().series[0]).toEqual([12, 14, 14])
  })

  it('drillToRoot jumps back from a deep level in one step', async () => {
    const chart = makeChart()
    await chart.drillDown('2024-q')
    await chart.drillDown('2024-q2-m')
    await chart.drillToRoot()

    expect(chart.drilldown.depth).toBe(0)
    expect(chart.getState().series[0]).toEqual([100, 150, 200])
  })

  it('drillToLevel returns to an intermediate level', async () => {
    const chart = makeChart()
    await chart.drillDown('2024-q')
    await chart.drillDown('2024-q2-m')
    await chart.drilldown.drillToLevel(1)

    expect(chart.drilldown.depth).toBe(1)
    expect(chart.drilldown.path).toEqual(['root', '2024-q'])
    expect(chart.getState().series[0]).toEqual([35, 40, 38, 37])
  })

  it('warns and no-ops on an unknown drilldown id', async () => {
    const chart = makeChart()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await chart.drillDown('does-not-exist')

    expect(warn).toHaveBeenCalled()
    expect(chart.drilldown.depth).toBe(0)
    warn.mockRestore()
  })

  it('drillUp at root is a no-op', async () => {
    const chart = makeChart()
    await chart.drillUp()
    expect(chart.drilldown.depth).toBe(0)
  })
})

describe('Drilldown — click wiring', () => {
  it('drills when a drillable point fires dataPointSelection', async () => {
    const chart = makeChart()
    // Simulate Graphics.pathMouseDown firing the event for point index 1 (2024).
    await chart.ctx.drilldown._onPointSelect(null, chart, {
      seriesIndex: 0,
      dataPointIndex: 1,
    })

    expect(chart.drilldown.depth).toBe(1)
    expect(chart.drilldown.path).toEqual(['root', '2024-q'])
  })

  it('ignores clicks on points without a drilldown field', async () => {
    const chart = makeChart()
    await chart.ctx.drilldown._onPointSelect(null, chart, {
      seriesIndex: 0,
      dataPointIndex: 2, // 2025 — no drilldown
    })
    expect(chart.drilldown.depth).toBe(0)
  })

  it('does not clobber a user dataPointSelection handler', async () => {
    const userHandler = vi.fn()
    const chart = makeChart({ chart: { events: { dataPointSelection: userHandler } } })
    // The registry handler and the config callback are independent; firing the
    // registry event drives the drill without touching the user's config callback.
    await chart.ctx.drilldown._onPointSelect(null, chart, {
      seriesIndex: 0,
      dataPointIndex: 0,
    })
    expect(chart.drilldown.depth).toBe(1)
    expect(chart.drilldown.path).toEqual(['root', '2023-q'])
  })
})

describe('Drilldown — per-level overrides', () => {
  it('applies a fill override on drill and restores it on drillUp', async () => {
    const chart = makeChart({
      drilldown: {
        enabled: true,
        series: [
          {
            id: '2024-q',
            name: '2024 by Quarter',
            fill: { type: 'pattern', pattern: { style: 'slantedLines' } },
            data: [
              { x: 'Q1', y: 35 },
              { x: 'Q2', y: 40 },
              { x: 'Q3', y: 38 },
              { x: 'Q4', y: 37 },
            ],
          },
        ],
      },
    })

    const rootFillType = chart.w.config.fill.type
    expect(rootFillType).not.toBe('pattern')

    await chart.drillDown('2024-q')
    expect(chart.w.config.fill.type).toBe('pattern')

    await chart.drillUp()
    expect(chart.w.config.fill.type).toBe(rootFillType)
  })
})

describe('Drilldown — cross-type drill (bar → donut)', () => {
  it('drills from a bar root into a donut child and restores the bar on drillUp', async () => {
    const chart = makeChart({
      drilldown: {
        enabled: true,
        series: [
          {
            id: '2024-q',
            name: '2024 by Quarter',
            chart: { type: 'donut' },
            data: [
              { x: 'Q1', y: 35 },
              { x: 'Q2', y: 40 },
              { x: 'Q3', y: 38 },
              { x: 'Q4', y: 37 },
            ],
          },
        ],
      },
    })

    expect(chart.w.config.chart.type).toBe('bar')
    expect(chart.w.globals.axisCharts).toBe(true)

    await chart.drillDown('2024-q')
    expect(chart.drilldown.depth).toBe(1)
    expect(chart.w.config.chart.type).toBe('donut')
    expect(chart.w.globals.axisCharts).toBe(false)
    // Donut derives slice values from the object-form data.
    expect(chart.getState().series).toEqual([35, 40, 38, 37])

    await chart.drillUp()
    expect(chart.drilldown.depth).toBe(0)
    expect(chart.w.config.chart.type).toBe('bar')
    expect(chart.w.globals.axisCharts).toBe(true)
    expect(chart.getState().series[0]).toEqual([100, 150, 200])
  })
})

describe('Drilldown — multi-series child level', () => {
  it('drills from a single-series root into a 3-series child and restores it', async () => {
    const chart = makeChart({
      drilldown: {
        enabled: true,
        series: [
          {
            id: '2024-q',
            name: '2024 breakdown',
            legend: { show: true },
            series: [
              { name: 'Online', data: [{ x: 'Q1', y: 10 }, { x: 'Q2', y: 12 }] },
              { name: 'Retail', data: [{ x: 'Q1', y: 8 }, { x: 'Q2', y: 9 }] },
              { name: 'Wholesale', data: [{ x: 'Q1', y: 5 }, { x: 'Q2', y: 6 }] },
            ],
          },
        ],
      },
    })

    expect(chart.getState().series.length).toBe(1)

    await chart.drillDown('2024-q')
    expect(chart.drilldown.depth).toBe(1)
    const drilled = chart.getState().series
    expect(drilled.length).toBe(3)
    expect(drilled[0]).toEqual([10, 12])
    expect(drilled[1]).toEqual([8, 9])
    expect(drilled[2]).toEqual([5, 6])
    expect(chart.w.globals.seriesNames).toEqual(['Online', 'Retail', 'Wholesale'])

    await chart.drillUp()
    expect(chart.drilldown.depth).toBe(0)
    expect(chart.getState().series.length).toBe(1)
    expect(chart.getState().series[0]).toEqual([100, 150, 200])
  })
})

describe('Drilldown — events', () => {
  it('fires drillDownStart/End on drill, drillUp on back', async () => {
    const order = []
    const chart = makeChart({
      chart: {
        events: {
          drillDownStart: (info) => order.push(['start', info.to]),
          drillDownEnd: (info) => order.push(['end', info.to]),
          drillUp: (info) => order.push(['up', info.to]),
        },
      },
    })

    await chart.drillDown('2024-q')
    await chart.drillUp()

    expect(order).toEqual([
      ['start', '2024-q'],
      ['end', '2024-q'],
      ['up', 'root'],
    ])
  })
})

describe('Drilldown — breadcrumb', () => {
  it('renders a breadcrumb nav after drilling in, and removes it at root', async () => {
    const chart = makeChart()
    expect(document.querySelector('.apexcharts-breadcrumb')).toBeNull()

    await chart.drillDown('2024-q')
    const nav = document.querySelector('.apexcharts-breadcrumb')
    expect(nav).not.toBeNull()
    expect(nav.getAttribute('aria-label')).toBe('Drilldown breadcrumb')
    // root (button) + current (span)
    expect(nav.querySelectorAll('button.apexcharts-breadcrumb-item').length).toBe(1)
    expect(nav.querySelector('.apexcharts-breadcrumb-current').textContent).toBe(
      '2024 by Quarter',
    )

    await chart.drillToRoot()
    expect(document.querySelector('.apexcharts-breadcrumb')).toBeNull()
  })

  it('breadcrumb button navigates back to that level', async () => {
    const chart = makeChart()
    await chart.drillDown('2024-q')
    await chart.drillDown('2024-q2-m')

    const rootBtn = document.querySelector('button.apexcharts-breadcrumb-item')
    // The leftmost crumb carries a back-arrow affordance before its label.
    expect(rootBtn.querySelector('.apexcharts-breadcrumb-arrow').textContent).toBe('←')
    expect(rootBtn.querySelector('.apexcharts-breadcrumb-label').textContent).toBe('All')
    rootBtn.click()
    // click handler kicks off an async update; flush microtasks
    await new Promise((r) => setTimeout(r, 0))

    expect(chart.drilldown.depth).toBe(0)
  })
})

describe('Drilldown — async resolver', () => {
  it('resolves children via onDrillDown for points with no inline match', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', animations: { enabled: false } },
      series: [
        { name: 'Sales', data: [{ x: 'A', y: 10, drilldown: 'dyn-A' }] },
      ],
      drilldown: {
        enabled: true,
        series: [], // no inline match — falls through to onDrillDown
        onDrillDown: async ({ point }) => ({
          id: `dyn-${point.x}`,
          name: `Detail ${point.x}`,
          data: [
            { x: 'a1', y: 1 },
            { x: 'a2', y: 2 },
          ],
        }),
      },
    })

    // Async drill is driven by clicks (the clicked point is the resolver input).
    await chart.ctx.drilldown._onPointSelect(null, chart, {
      seriesIndex: 0,
      dataPointIndex: 0,
    })

    expect(chart.drilldown.depth).toBe(1)
    expect(chart.getState().series[0]).toEqual([1, 2])
  })
})

// ---------------------------------------------------------------------------
// Phase 3 — async drill against a real backend: loading, failure, caching.
// The theme of every test here is that a failed fetch is ORDINARY, so it must
// never strand the view.
// ---------------------------------------------------------------------------

const LOADING = '.apexcharts-drilldown-loading'

function asyncChart(onDrillDown, extra = {}) {
  return createChartWithOptions({
    chart: { type: 'bar', animations: { enabled: false } },
    series: [{ name: 'Sales', data: [{ x: 'A', y: 10, drilldown: 'dyn-A' }] }],
    drilldown: { enabled: true, series: [], onDrillDown, ...extra },
  })
}

const clickPoint = (chart) =>
  chart.ctx.drilldown._onPointSelect(null, chart, {
    seriesIndex: 0,
    dataPointIndex: 0,
  })

describe('Drilldown — async: the resolver contract', () => {
  it('passes the requested id to the resolver', async () => {
    let seen = null
    const chart = asyncChart((ctx) => {
      seen = ctx
      return { data: [{ x: 'a1', y: 1 }] }
    })
    await clickPoint(chart)
    // Without `id` a resolver cannot tell which level was asked for, which is
    // the first thing `fetch('/levels/' + id)` needs.
    expect(seen.id).toBe('dyn-A')
    expect(seen.seriesIndex).toBe(0)
    expect(seen.dataPointIndex).toBe(0)
    chart.destroy()
  })

  it('defaults the level id to the requested id when the resolver omits it', async () => {
    const chart = asyncChart(() => ({ data: [{ x: 'a1', y: 1 }] }))
    await clickPoint(chart)
    // The breadcrumb and the restore stack key off the id, so a resolver that
    // returns just the level must still land somewhere navigable.
    expect(chart.drilldown.depth).toBe(1)
    expect(chart.drilldown.path).toEqual(['root', 'dyn-A'])
    chart.destroy()
  })
})

describe('Drilldown — async: failure never changes state', () => {
  const rootSeries = (chart) => chart.getState().series[0]

  it('fires drillDownError and stays put when the resolver rejects', async () => {
    const onError = vi.fn()
    const chart = asyncChart(() => Promise.reject(new Error('network down')), {})
    chart.ctx.addEventListener('drillDownError', onError)
    const before = rootSeries(chart)

    await clickPoint(chart)

    expect(chart.drilldown.depth).toBe(0)
    expect(rootSeries(chart)).toEqual(before)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].error.message).toBe('network down')
    chart.destroy()
  })

  it('fires drillDownError and stays put when the resolver throws synchronously', async () => {
    const onError = vi.fn()
    const chart = asyncChart(() => {
      throw new Error('bad config')
    })
    chart.ctx.addEventListener('drillDownError', onError)

    await clickPoint(chart)

    expect(chart.drilldown.depth).toBe(0)
    expect(onError).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('fires drillDownError when the resolver returns something undrillable', async () => {
    const onError = vi.fn()
    // Previously a silent no-op, which is indistinguishable from "the click did
    // nothing" and is the hardest kind of integration bug to chase.
    const chart = asyncChart(() => ({ name: 'oops' }))
    chart.ctx.addEventListener('drillDownError', onError)

    await clickPoint(chart)

    expect(chart.drilldown.depth).toBe(0)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(String(onError.mock.calls[0][0].error.message)).toMatch(/data/)
    chart.destroy()
  })

  it('leaves the breadcrumb untouched after a failure', async () => {
    const chart = asyncChart(() => Promise.reject(new Error('nope')))
    await clickPoint(chart)
    expect(chart.w.dom.elWrap.querySelector('.apexcharts-breadcrumb')).toBe(null)
    chart.destroy()
  })
})

describe('Drilldown — async: the loading overlay', () => {
  it('shows while the level resolves and removes itself after', async () => {
    let release
    const chart = asyncChart(
      () => new Promise((r) => { release = () => r({ data: [{ x: 'a1', y: 1 }] }) }),
    )

    const drilling = clickPoint(chart)
    expect(chart.w.dom.elWrap.querySelector(LOADING)).not.toBe(null)

    release()
    await drilling
    expect(chart.w.dom.elWrap.querySelector(LOADING)).toBe(null)
    chart.destroy()
  })

  it('removes the overlay when the resolver fails', async () => {
    let reject
    const chart = asyncChart(() => new Promise((_, r) => { reject = r }))
    const drilling = clickPoint(chart)
    expect(chart.w.dom.elWrap.querySelector(LOADING)).not.toBe(null)

    reject(new Error('boom'))
    await drilling
    // A stuck spinner after a failed fetch is worse than no spinner.
    expect(chart.w.dom.elWrap.querySelector(LOADING)).toBe(null)
    chart.destroy()
  })

  it('carries an accessible name and announces politely', async () => {
    let release
    const chart = asyncChart(
      () => new Promise((r) => { release = () => r({ data: [{ x: 'a1', y: 1 }] }) }),
    )
    const drilling = clickPoint(chart)
    const el = chart.w.dom.elWrap.querySelector(LOADING)
    expect(el.getAttribute('role')).toBe('status')
    expect(el.getAttribute('aria-live')).toBe('polite')
    expect(el.getAttribute('aria-label')).toBe('Loading')
    // Spinner only by default, so nothing user-visible ships in one language.
    expect(el.querySelector('.apexcharts-drilldown-loading-text')).toBe(null)
    release()
    await drilling
    chart.destroy()
  })

  it('renders the configured text and uses it as the accessible name', async () => {
    let release
    const chart = asyncChart(
      () => new Promise((r) => { release = () => r({ data: [{ x: 'a1', y: 1 }] }) }),
      { loading: { show: true, text: 'Chargement' } },
    )
    const drilling = clickPoint(chart)
    const el = chart.w.dom.elWrap.querySelector(LOADING)
    expect(el.getAttribute('aria-label')).toBe('Chargement')
    expect(el.querySelector('.apexcharts-drilldown-loading-text').textContent).toBe('Chargement')
    release()
    await drilling
    chart.destroy()
  })

  it('can be turned off with loading:false or loading.show:false', async () => {
    for (const loading of [false, { show: false }]) {
      let release
      const chart = asyncChart(
        () => new Promise((r) => { release = () => r({ data: [{ x: 'a1', y: 1 }] }) }),
        { loading },
      )
      const drilling = clickPoint(chart)
      expect(chart.w.dom.elWrap.querySelector(LOADING)).toBe(null)
      release()
      await drilling
      chart.destroy()
    }
  })
})

describe('Drilldown — async: concurrency and caching', () => {
  it('ignores a second click while a level is still resolving', async () => {
    let calls = 0
    let release
    const chart = asyncChart(() => {
      calls++
      return new Promise((r) => { release = () => r({ data: [{ x: 'a1', y: 1 }] }) })
    })

    const first = clickPoint(chart)
    const second = clickPoint(chart)
    release()
    await Promise.all([first, second])

    // One fetch, one level: a double click must not double-drill or fire twice.
    expect(calls).toBe(1)
    expect(chart.drilldown.depth).toBe(1)
    chart.destroy()
  })

  it('caches a resolved level, so drilling the same branch again does not refetch', async () => {
    let calls = 0
    const chart = asyncChart(() => {
      calls++
      return { data: [{ x: 'a1', y: 1 }] }
    })

    await clickPoint(chart)
    expect(calls).toBe(1)
    await chart.drilldown.drillToRoot()
    await clickPoint(chart)

    expect(calls).toBe(1)
    expect(chart.drilldown.depth).toBe(1)
    chart.destroy()
  })

  it('refetches when cache is disabled', async () => {
    let calls = 0
    const chart = asyncChart(
      () => {
        calls++
        return { data: [{ x: 'a1', y: 1 }] }
      },
      { cache: false },
    )
    await clickPoint(chart)
    await chart.drilldown.drillToRoot()
    await clickPoint(chart)
    expect(calls).toBe(2)
    chart.destroy()
  })

  it('clearDrilldownCache forces the next drill to re-resolve', async () => {
    let calls = 0
    const chart = asyncChart(() => {
      calls++
      return { data: [{ x: 'a1', y: 1 }] }
    })

    await clickPoint(chart)
    await chart.drilldown.drillToRoot()
    chart.clearDrilldownCache()
    await clickPoint(chart)

    // The escape hatch for "the data behind me changed while I was drilled in".
    expect(calls).toBe(2)
    chart.destroy()
  })

  it('does not cache a level that failed to resolve', async () => {
    let calls = 0
    const chart = asyncChart(() => {
      calls++
      return calls === 1
        ? Promise.reject(new Error('flaky'))
        : { data: [{ x: 'a1', y: 1 }] }
    })

    await clickPoint(chart)
    expect(chart.drilldown.depth).toBe(0)
    // A transient failure must not poison the branch forever.
    await clickPoint(chart)
    expect(calls).toBe(2)
    expect(chart.drilldown.depth).toBe(1)
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// Co-existence: the host app keeps living while a user is drilled in. These are
// edge cases 2, 3 and 9 from plans/02-drilldown-api.md, plus the one async
// introduces: the chart going away mid-fetch.
// ---------------------------------------------------------------------------

describe('Drilldown — co-existence with host-app updates', () => {
  it('updateSeries mid-drill replaces the level, and drillUp still restores the parent', async () => {
    const chart = makeChart()
    const rootBefore = chart.getState().series[0]

    await chart.drillDown('2023-q')
    expect(chart.drilldown.depth).toBe(1)

    // A polling dashboard refreshing the level the user is looking at.
    await chart.updateSeries([{ name: 'Live', data: [9, 8, 7, 6] }])
    expect(chart.getState().series[0]).toEqual([9, 8, 7, 6])
    // The stack must survive: the restore frame is the PARENT's snapshot, taken
    // before the drill, so a live refresh of the child cannot corrupt it.
    expect(chart.drilldown.depth).toBe(1)

    await chart.drillUp()
    expect(chart.drilldown.depth).toBe(0)
    expect(chart.getState().series[0]).toEqual(rootBefore)
    chart.destroy()
  })

  it('updateOptions({series}) mid-drill leaves the restore stack intact', async () => {
    const chart = makeChart()
    const rootBefore = chart.getState().series[0]

    await chart.drillDown('2023-q')
    await chart.updateOptions({ series: [{ name: 'Live', data: [5, 5, 5, 5] }] })
    expect(chart.drilldown.depth).toBe(1)

    await chart.drillUp()
    // overwriteInitialConfig defaults true, so this is the case where a
    // user-initiated updateOptions could have overwritten the captured root.
    expect(chart.getState().series[0]).toEqual(rootBefore)
    chart.destroy()
  })

  it('a non-series updateOptions mid-drill does not disturb the drill state', async () => {
    const chart = makeChart()
    await chart.drillDown('2023-q')
    const atLevel = chart.getState().series[0]

    await chart.updateOptions({ theme: { mode: 'dark' } })

    expect(chart.drilldown.depth).toBe(1)
    expect(chart.drilldown.path).toEqual(['root', '2023-q'])
    expect(chart.getState().series[0]).toEqual(atLevel)
    chart.destroy()
  })

  it('survives destroy() while an async level is still resolving', async () => {
    let release
    const chart = asyncChart(
      () => new Promise((r) => { release = () => r({ data: [{ x: 'a1', y: 1 }] }) }),
    )
    const onError = vi.fn()
    chart.ctx.addEventListener('drillDownError', onError)

    const drilling = clickPoint(chart)
    chart.destroy()
    release()

    // The resolver settling after teardown must not drill a dead chart, and
    // must not throw an unhandled rejection into the host app.
    await expect(drilling).resolves.toBeDefined()
    expect(onError).not.toHaveBeenCalled()
  })

  it('survives destroy() while an async level is failing', async () => {
    let reject
    const chart = asyncChart(() => new Promise((_, r) => { reject = r }))
    const drilling = clickPoint(chart)
    chart.destroy()
    reject(new Error('too late'))
    await expect(drilling).resolves.toBeDefined()
  })
})
