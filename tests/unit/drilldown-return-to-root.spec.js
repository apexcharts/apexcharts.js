import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/drilldown.js'

// Returning to a level restores that level as it is NOW, not as it was the
// first time anyone drilled out of it, and undoes every override the level we
// leave carried, wherever that level came from (inline or onDrillDown).

const rootSeries = (a, b) => [
  {
    name: 'Sales',
    data: [
      { x: '2023', y: a, drilldown: 'a' },
      { x: '2024', y: b },
    ],
  },
]

const inline = (level, extra = {}) =>
  createChartWithOptions({
    chart: { type: 'bar', animations: { enabled: false } },
    series: rootSeries(100, 150),
    drilldown: {
      enabled: true,
      series: [{ id: 'a', name: 'A', data: [{ x: 'Q1', y: 1 }, { x: 'Q2', y: 2 }], ...level }],
    },
    ...extra,
  })

describe('drilldown: returning to the root', () => {
  it('drillUp after a root updateSeries restores the updated root, not the first-drill data', async () => {
    const chart = inline()
    await chart.drillDown('a')
    await chart.drillUp()
    await chart.updateSeries(rootSeries(7, 8))
    expect(chart.getState().series).toEqual([[7, 8]])
    await chart.drillDown('a')
    await chart.drillUp()
    expect(chart.getState().series).toEqual([[7, 8]])
    chart.destroy()
  })

  it('drillToRoot and drillToLevel(0) also restore the current root', async () => {
    const chart = inline()
    await chart.drillDown('a')
    await chart.drillToRoot()
    await chart.updateSeries(rootSeries(3, 4))
    await chart.drillDown('a')
    await chart.drilldown.drillToLevel(0)
    expect(chart.getState().series).toEqual([[3, 4]])
    chart.destroy()
  })

  it('undoes the colors and plotOptions an onDrillDown level carried', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', animations: { enabled: false } },
      colors: ['#008FFB'],
      series: rootSeries(100, 150),
      drilldown: {
        enabled: true,
        series: [],
        onDrillDown: async () => ({
          name: 'Q',
          data: [{ x: 'Q1', y: 1 }],
          colors: ['#ff0000'],
          plotOptions: { bar: { horizontal: true } },
          xaxis: { title: { text: 'Quarter' } },
        }),
      },
    })
    await chart.ctx.drilldown._onPointSelect(null, chart, { seriesIndex: 0, dataPointIndex: 0 })
    expect(chart.drilldown.depth).toBe(1)
    expect(chart.w.config.colors).toEqual(['#ff0000'])
    await chart.drillUp()
    expect(chart.drilldown.depth).toBe(0)
    expect(chart.w.config.colors).toEqual(['#008FFB'])
    expect(chart.w.config.plotOptions.bar.horizontal).toBe(false)
    expect(chart.w.config.xaxis.title.text).toBeUndefined()
    chart.destroy()
  })

  it('takes a level\'s colors back off a root that never set any', async () => {
    const chart = inline({ colors: ['#ff0000'] })
    await chart.drillDown('a')
    expect(chart.w.config.colors).toEqual(['#ff0000'])
    await chart.drillUp()
    expect(chart.w.config.colors).toBeUndefined()
    expect(chart.w.globals.colors[0]).not.toBe('#ff0000')
    chart.destroy()
  })

  it('does not turn an active breakpoint\'s options into the chart\'s own', async () => {
    const chart = inline(
      { legend: { position: 'top' } },
      { responsive: [{ breakpoint: 100000, options: { legend: { position: 'left' } } }] },
    )
    expect(chart.w.config.legend.position).toBe('left')
    await chart.drillDown('a')
    await chart.drillUp()
    expect(chart.w.config.legend.position).toBe('left')
    // Leaving the breakpoint must still fall back to the author's value.
    const base = chart.ctx.responsive.withoutBreakpoints(chart.w.config)
    expect(base.legend.position).toBe('bottom')
    chart.destroy()
  })

  it('leaves the author\'s level objects untouched', async () => {
    const level = {
      id: 'a',
      name: 'A',
      data: [{ x: 'Q1', y: 1 }, { x: 'Q2', y: 2 }],
      colors: ['#ff0000'],
      xaxis: { title: { text: 'Quarter' } },
    }
    const before = JSON.stringify(level)
    const chart = createChartWithOptions({
      chart: { type: 'bar', animations: { enabled: false } },
      series: rootSeries(100, 150),
      drilldown: { enabled: true, series: [level] },
    })
    await chart.drillDown('a')
    expect(chart.w.config.colors).not.toBe(level.colors)
    await chart.updateOptions({ colors: ['#00ff00'] })
    await chart.drillUp()
    expect(JSON.stringify(level)).toBe(before)
    chart.destroy()
  })

  it('keeps a host update made below the root when the levels left did not carry that field', async () => {
    const chart = inline({}, { legend: { showForSingleSeries: true } })
    await chart.drillDown('a')
    await chart.updateOptions({
      legend: { position: 'top' },
      yaxis: { labels: { formatter: (v) => '$' + v } },
    })
    await chart.drillUp()
    expect(chart.w.config.legend.position).toBe('top')
    const labels = [...chart.el.querySelectorAll('.apexcharts-yaxis-label tspan')]
    expect(labels.length).toBeGreaterThan(0)
    expect(labels.every((t) => t.textContent.startsWith('$'))).toBe(true)
    chart.destroy()
  })

  it('a deep drillToRoot undoes the fields every level it leaves carried', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', animations: { enabled: false } },
      series: rootSeries(100, 150),
      drilldown: {
        enabled: true,
        series: [
          { id: 'a', data: [{ x: 'Q1', y: 1, drilldown: 'b' }], colors: ['#ff0000'] },
          { id: 'b', data: [{ x: 'Jan', y: 1 }], xaxis: { title: { text: 'Month' } } },
        ],
      },
    })
    await chart.drillDown('a')
    await chart.drillDown('b')
    expect(chart.drilldown.depth).toBe(2)
    await chart.drillToRoot()
    expect(chart.w.config.colors).toBeUndefined()
    expect(chart.w.config.xaxis.title.text).toBeUndefined()
    chart.destroy()
  })

  it('a zoomed root left and re-entered still un-zooms on the next updateSeries', async () => {
    for (const xaxis of [undefined, { title: { text: 'Child' } }]) {
      const chart = createChartWithOptions({
        chart: { type: 'line', animations: { enabled: false } },
        series: [{ name: 'S', data: [1, 2, 3, 4, 5].map((x) => ({ x, y: x, drilldown: 'a' })) }],
        xaxis: { type: 'numeric' },
        drilldown: { enabled: true, series: [{ id: 'a', data: [{ x: 1, y: 1 }], xaxis }] },
      })
      chart.zoomX(2, 4)
      await chart.drillDown('a')
      await chart.drillUp()
      await chart.updateSeries([{ name: 'S', data: [{ x: 1, y: 1 }, { x: 8, y: 2 }] }])
      expect(chart.w.config.xaxis.min ?? null).toBeNull()
      expect([chart.w.globals.minX, chart.w.globals.maxX]).toEqual([1, 8])
      chart.destroy()
    }
  })
})
