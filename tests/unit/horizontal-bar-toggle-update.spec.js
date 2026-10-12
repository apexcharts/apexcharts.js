/**
 * A horizontal bar has its zoom and axis tooltips switched off by
 * Defaults.reconcile, which writes false into the config. Nothing took that
 * back, so a bar made vertical (or into another type) by updateOptions stayed
 * without zoom or axis tooltips for good.
 */
import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

afterEach(() => {
  document.body.innerHTML = ''
})

const look = (c) => ({
  zoom: c.chart.zoom.enabled,
  xTip: c.xaxis.tooltip.enabled,
  yTip: c.yaxis[0].tooltip.enabled,
})

async function make(extra = {}) {
  const d = document.createElement('div')
  document.body.appendChild(d)
  const chart = new ApexCharts(d, {
    chart: {
      type: 'bar',
      width: 400,
      height: 200,
      animations: { enabled: false },
    },
    series: [{ name: 's', data: [5, 3, 4] }],
    xaxis: { categories: ['a', 'b', 'c'] },
    plotOptions: { bar: { horizontal: true } },
    ...extra,
  })
  await chart.render()
  return chart
}
const horizontal = () => make()

/** What a chart built that way from the start has. */
async function freshLook(extra) {
  const chart = await make(extra)
  const l = look(chart.w.config)
  chart.destroy()
  return l
}
const VERTICAL = { plotOptions: { bar: { horizontal: false } } }

describe('leaving a horizontal bar by update', () => {
  it('switches zoom and the axis tooltips off while horizontal', async () => {
    const chart = await horizontal()
    expect(look(chart.w.config)).toEqual({
      zoom: false,
      xTip: false,
      yTip: false,
    })
    chart.destroy()
  })

  it('hands them back when the bar turns vertical', async () => {
    const chart = await horizontal()
    await chart.updateOptions(VERTICAL)
    expect(look(chart.w.config)).toEqual(await freshLook(VERTICAL))
    expect(chart.w.config.chart.zoom.enabled).toBe(true)
    chart.destroy()
  })

  it('hands them back when the bar becomes a line', async () => {
    const chart = await horizontal()
    await chart.updateOptions({ chart: { type: 'line' } })
    expect(look(chart.w.config)).toEqual(
      await freshLook({ chart: { type: 'line', width: 400, height: 200 } }),
    )
    expect(chart.w.config.chart.zoom.enabled).toBe(true)
    chart.destroy()
  })

  it('keeps what the same update asks for', async () => {
    const chart = await horizontal()
    await chart.updateOptions({
      chart: { zoom: { enabled: false } },
      plotOptions: { bar: { horizontal: false } },
    })
    expect(chart.w.config.chart.zoom.enabled).toBe(false)
    chart.destroy()
  })

  it('leaves a horizontal bar alone on an unrelated update', async () => {
    const chart = await horizontal()
    await chart.updateOptions({ title: { text: 't' } })
    expect(look(chart.w.config)).toEqual({
      zoom: false,
      xTip: false,
      yTip: false,
    })
    chart.destroy()
  })
})
