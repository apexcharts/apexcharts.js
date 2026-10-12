/**
 * The sparkline preset (hidden axes, legend and toolbar, zero grid padding)
 * was applied only at construction, so turning chart.sparkline.enabled on or
 * off through updateOptions left the chart dressed for the other mode.
 */
import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

afterEach(() => {
  document.body.innerHTML = ''
})

function host() {
  const d = document.createElement('div')
  document.body.appendChild(d)
  return d
}

const CHART = { type: 'line', width: 400, height: 200, animations: { enabled: false } }
const SERIES = [{ name: 's', data: [5, 3, 4, 7] }]

/** The leaves the sparkline preset owns. */
const look = (c) => ({
  yShow: c.yaxis[0].show,
  yFloating: c.yaxis[0].floating,
  grid: c.grid.show,
  padding: { ...c.grid.padding },
  legend: c.legend.show,
  xLabels: c.xaxis.labels.show,
  xBorder: c.xaxis.axisBorder.show,
  toolbar: c.chart.toolbar.show,
  zoom: c.chart.zoom.enabled,
})

async function fresh(sparkline) {
  const chart = new ApexCharts(host(), {
    chart: { ...CHART, sparkline: { enabled: sparkline } },
    series: SERIES,
  })
  await chart.render()
  const out = look(chart.w.config)
  chart.destroy()
  return out
}

describe('chart.sparkline.enabled through updateOptions', () => {
  it('turning it on and off again matches a chart built that way', async () => {
    const asLine = await fresh(false)
    const asSpark = await fresh(true)

    const chart = new ApexCharts(host(), { chart: CHART, series: SERIES })
    await chart.render()
    await chart.updateOptions({ chart: { sparkline: { enabled: true } } })
    expect(look(chart.w.config)).toEqual(asSpark)
    expect(chart.el.querySelector('.apexcharts-yaxis-texts-g')).toBeNull()

    await chart.updateOptions({ chart: { sparkline: { enabled: false } } })
    expect(look(chart.w.config)).toEqual(asLine)
    chart.destroy()
  })

  it('an explicit ask in the same update wins', async () => {
    const chart = new ApexCharts(host(), { chart: CHART, series: SERIES })
    await chart.render()
    await chart.updateOptions({
      chart: { sparkline: { enabled: true } },
      legend: { show: true },
    })
    expect(chart.w.config.legend.show).toBe(true)
    expect(chart.w.config.grid.show).toBe(false)
    chart.destroy()
  })
})
