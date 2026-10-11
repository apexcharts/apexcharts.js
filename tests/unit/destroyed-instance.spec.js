import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/drilldown.js'
import Drilldown from '../../src/modules/drilldown/Drilldown.js'

// destroy() promises a fresh render() on the same instance, but render() used
// to call setLocale on the modules destroy() had released, and the update
// entry points threw synchronously on them instead of returning a promise.

const opts = () => ({
  chart: { type: 'line', width: 600, height: 300 },
  series: [{ name: 'A', data: [1, 2, 3] }],
  xaxis: { categories: ['a', 'b', 'c'] },
})

describe('a destroyed instance', () => {
  it('renders again', async () => {
    const chart = createChartWithOptions(opts())
    await chart.render()
    chart.destroy()
    await chart.render()
    expect(
      chart.el.querySelectorAll('.apexcharts-series path').length,
    ).toBeGreaterThan(0)
    chart.destroy()
  })

  it('resolves the update entry points instead of throwing', async () => {
    const chart = createChartWithOptions(opts())
    await chart.render()
    chart.destroy()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const call of [
      () => chart.updateSeries([{ data: [3, 2, 1] }]),
      () => chart.updateOptions({ yaxis: { min: 0 } }),
      () => chart.appendSeries({ name: 'B', data: [1, 1, 1] }),
      () => chart.appendData([{ data: [4] }]),
    ]) {
      let ret
      expect(() => (ret = call())).not.toThrow()
      await expect(ret).resolves.toBe(chart)
    }
    expect(() => chart.resetSeries()).not.toThrow()
    warn.mockRestore()
  })

  it('drills once per click after a destroy and a fresh render', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [
        {
          name: 'Sales',
          data: [
            { x: '2023', y: 100, drilldown: 'q' },
            { x: '2024', y: 150 },
          ],
        },
      ],
      drilldown: {
        enabled: true,
        // the child is drillable at the same index, so a second (stale)
        // listener would drill on through it
        series: [
          {
            id: 'q',
            name: 'Quarters',
            data: [{ x: 'Q1', y: 20, drilldown: 'm' }],
          },
          { id: 'm', name: 'Months', data: [{ x: 'Jan', y: 7 }] },
        ],
      },
    })
    await chart.render()
    chart.destroy()
    await chart.render()
    const drill = vi.spyOn(Drilldown.prototype, 'drillDown')
    chart.events.fireEvent('dataPointSelection', [
      new Event('click'),
      chart,
      { seriesIndex: 0, dataPointIndex: 0 },
    ])
    expect(drill).toHaveBeenCalledTimes(1)
    drill.mockRestore()
    chart.destroy()
  })
})
