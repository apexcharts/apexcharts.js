import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/drilldown.js'

const opts = (enabled) => ({
  chart: { type: 'bar', animations: { enabled: false } },
  series: [
    {
      name: 'Sales',
      data: [
        { x: '2023', y: 100, drilldown: 'a' },
        { x: '2024', y: 150 },
      ],
    },
  ],
  drilldown: { enabled, series: [{ id: 'a', name: 'A', data: [{ x: 'Q1', y: 2 }] }] },
})
// Fire the same registry event Graphics.pathMouseDown fires on a bar click.
const click = (chart) =>
  chart.ctx.events.fireEvent('dataPointSelection', [
    null,
    chart,
    { seriesIndex: 0, dataPointIndex: 0 },
  ])
const settle = () => new Promise((r) => setTimeout(r, 20))

describe('drilldown: enabled toggled through updateOptions', () => {
  it('disabling stops click-drilling', async () => {
    const chart = createChartWithOptions(opts(true))
    await chart.updateOptions({ drilldown: { enabled: false } })
    expect(chart.w.config.drilldown.enabled).toBe(false)
    click(chart)
    await settle()
    expect(chart.drilldown.depth).toBe(0)
    expect(chart.getState().series).toEqual([[100, 150]])
    chart.destroy()
  })

  it('enabling later makes points drillable on click', async () => {
    const chart = createChartWithOptions(opts(false))
    await chart.updateOptions({ drilldown: { enabled: true } })
    click(chart)
    await settle()
    expect(chart.drilldown.depth).toBe(1)
    expect(chart.getState().series).toEqual([[2]])
    chart.destroy()
  })

  it('a chart that never drills does no drill work on update', async () => {
    const chart = createChartWithOptions(opts(false))
    const discrete = chart.w.config.markers.discrete
    await chart.updateSeries([{ name: 'Sales', data: [{ x: '2023', y: 1 }] }])
    expect(chart.w.config.markers.discrete).toBe(discrete)
    chart.destroy()
  })

  it('disabling at the root takes the drill dots away', async () => {
    const o = opts(true)
    o.chart.type = 'line'
    const chart = createChartWithOptions(o)
    const dots = () => chart.w.config.markers.discrete.length
    expect(dots()).toBe(1)
    await chart.updateOptions({ drilldown: { enabled: false } })
    expect(dots()).toBe(0)
    chart.destroy()
  })

  it('disabling below the root keeps the way back on screen', async () => {
    const chart = createChartWithOptions(opts(true))
    await chart.drillDown('a')
    await chart.updateOptions({ drilldown: { enabled: false } })
    expect(chart.w.dom.elWrap.querySelector('.apexcharts-breadcrumb')).not.toBeNull()
    await chart.drillUp()
    expect(chart.getState().series).toEqual([[100, 150]])
    expect(chart.w.dom.elWrap.querySelector('.apexcharts-breadcrumb')).toBeNull()
    chart.destroy()
  })
})
