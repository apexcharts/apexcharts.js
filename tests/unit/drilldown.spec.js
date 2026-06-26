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
