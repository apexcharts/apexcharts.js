import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/drilldown.js'

// onDrillDown levels: what happens when the fetch settles after the chart has
// moved on, what the breadcrumb calls them, and which shapes they may take.

const chartWith = (onDrillDown, data) =>
  createChartWithOptions({
    chart: { type: 'bar', animations: { enabled: false } },
    series: [
      {
        name: 'Sales',
        data: data || [
          { x: '2023', y: 10, drilldown: 'a' },
          { x: '2024', y: 20, drilldown: 'zz' },
          { x: '2025', y: 30 },
        ],
      },
    ],
    drilldown: {
      enabled: true,
      series: [{ id: 'a', name: 'A', data: [{ x: 'Q1', y: 1 }] }],
      onDrillDown,
    },
  })

const clickAt = (chart, j) =>
  chart.ctx.drilldown._onPointSelect(null, chart, { seriesIndex: 0, dataPointIndex: j })

const deferred = () => {
  let release
  const fn = vi.fn(
    () =>
      new Promise((r) => {
        release = () => r({ name: 'Late', data: [{ x: 'z1', y: 9 }] })
      }),
  )
  return { fn, release: () => release() }
}

const crumbs = (chart) =>
  [...chart.w.dom.elWrap.querySelectorAll('.apexcharts-breadcrumb-item')].map(
    (el) => el.textContent,
  )

describe('drilldown: an async level that settles late', () => {
  it('is dropped when the chart was destroyed and rendered again meanwhile', async () => {
    const { fn, release } = deferred()
    const chart = chartWith(fn)
    const drilling = clickAt(chart, 1)
    chart.destroy()
    await chart.render()
    release()
    await drilling
    expect(chart.drilldown.depth).toBe(0)
    expect(chart.getState().series).toEqual([[10, 20, 30]])
    chart.destroy()
  })

  it('does not drill on top of a level the user navigated to meanwhile', async () => {
    const { fn, release } = deferred()
    const chart = chartWith(fn)
    const drilling = clickAt(chart, 1)
    await chart.drillDown('a')
    release()
    await drilling
    expect(chart.drilldown.path).toEqual(['root', 'a'])
    expect(chart.getState().series).toEqual([[1]])
    // The level was still fetched, so drilling that branch later needs no
    // second round trip.
    await chart.drillUp()
    await clickAt(chart, 1)
    expect(chart.drilldown.path).toEqual(['root', 'zz'])
    expect(fn).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('still drills when nothing moved while it was in flight', async () => {
    const { fn, release } = deferred()
    const chart = chartWith(fn)
    const drilling = clickAt(chart, 1)
    release()
    await drilling
    expect(chart.drilldown.path).toEqual(['root', 'zz'])
    chart.destroy()
  })
})

describe('drilldown: async levels in the breadcrumb', () => {
  it('shows the name the resolver gave the level', async () => {
    const chart = chartWith(async () => ({ name: 'Async lvl', data: [{ x: 'z1', y: 1 }] }))
    await clickAt(chart, 1)
    expect(crumbs(chart)).toEqual(['←All', 'Async lvl'])
    chart.destroy()
  })

  it('names a level drilled from a point with no id after that point', async () => {
    const chart = chartWith(async () => ({ data: [{ x: 'z1', y: 1 }] }))
    await clickAt(chart, 2)
    expect(chart.drilldown.depth).toBe(1)
    expect(crumbs(chart)).toEqual(['←All', '2025'])
    chart.destroy()
  })
})

describe('drilldown: async level shapes', () => {
  it('accepts the multi-series `series` form', async () => {
    const onError = vi.fn()
    const chart = chartWith(async () => ({
      series: [
        { name: 's1', data: [1, 2] },
        { name: 's2', data: [3, 4] },
      ],
    }))
    chart.ctx.addEventListener('drillDownError', onError)
    await clickAt(chart, 1)
    expect(onError).not.toHaveBeenCalled()
    expect(chart.drilldown.depth).toBe(1)
    expect(chart.getState().series).toEqual([
      [1, 2],
      [3, 4],
    ])
    chart.destroy()
  })

  it('still rejects a level with neither `data` nor `series`', async () => {
    const onError = vi.fn()
    const chart = chartWith(async () => ({ name: 'empty' }))
    chart.ctx.addEventListener('drillDownError', onError)
    await clickAt(chart, 1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(chart.drilldown.depth).toBe(0)
    chart.destroy()
  })
})
