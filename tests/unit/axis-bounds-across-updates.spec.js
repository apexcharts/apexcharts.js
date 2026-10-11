import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

// updateOptions() snapshots the payload's axes (lastXAxis / lastYAxis), and
// every data update writes that snapshot back into the bounds. An axis the
// payload does not name keeps its snapshot: emptying it made an unrelated
// updateOptions({ title }) drop a fixed x or y window on the next updateSeries.

const data = Array.from({ length: 50 }, (_, i) => [i, (i % 7) + 1])
const shifted = (dy) => [{ name: 'S', data: data.map(([x, y]) => [x, y + dy]) }]

const mount = async (extra = {}) => {
  document.body.innerHTML = '<div id="c"></div>'
  const chart = new ApexCharts(document.querySelector('#c'), {
    chart: {
      type: 'line',
      width: 600,
      height: 300,
      animations: { enabled: false },
      zoom: { enabled: true },
    },
    series: [{ name: 'S', data }],
    xaxis: { type: 'numeric', min: 10, max: 30 },
    ...extra,
  })
  await chart.render()
  return chart
}

describe('axis bounds across updates', () => {
  it('keep the constructor x window after updateOptions({ title }) + updateSeries', async () => {
    const chart = await mount()
    await chart.updateOptions({ title: { text: 'Hello' } })
    await chart.updateSeries(shifted(2))
    expect(chart.w.config.xaxis.min).toBe(10)
    expect(chart.w.config.xaxis.max).toBe(30)
    expect(chart.w.globals.minX).toBe(10)
    expect(chart.w.globals.maxX).toBe(30)
    chart.destroy()
  })

  it('keep an x window set by updateOptions({ xaxis })', async () => {
    const chart = await mount()
    await chart.updateOptions({ xaxis: { min: 5, max: 20 } })
    await chart.updateOptions({ title: { text: 'Hello' } })
    await chart.updateSeries(shifted(2))
    expect(chart.w.globals.minX).toBe(5)
    expect(chart.w.globals.maxX).toBe(20)
    chart.destroy()
  })

  it('keep a y window set by updateOptions({ yaxis })', async () => {
    const chart = await mount({ yaxis: { min: 0, max: 50 } })
    await chart.updateOptions({ yaxis: { min: 0, max: 100 } })
    await chart.updateOptions({ title: { text: 'Hello' } })
    await chart.updateSeries(shifted(2))
    expect(chart.w.config.yaxis[0].max).toBe(100)
    expect(chart.w.globals.maxY).toBe(100)
    chart.destroy()
  })

  it('a zoom does not move the snapshot: the next updateSeries leaves it', async () => {
    const chart = await mount()
    chart.zoomX(15, 20)
    await chart.updateOptions({ title: { text: 'Hello' } })
    await chart.updateSeries(shifted(2))
    expect(chart.w.globals.minX).toBe(10)
    expect(chart.w.globals.maxX).toBe(30)
    chart.destroy()
  })

  it('the toolbar reset returns to the window set by updateOptions({ xaxis })', async () => {
    const chart = await mount()
    await chart.updateOptions({ xaxis: { min: 5, max: 25 } })
    await chart.updateOptions({ title: { text: 'Hello' } })
    chart.zoomX(8, 12)
    expect(chart.w.interact.zoomed).toBe(true)
    chart.ctx.toolbar.handleZoomReset()
    await new Promise((r) => setTimeout(r, 0))
    expect(chart.w.config.xaxis.min).toBe(5)
    expect(chart.w.config.xaxis.max).toBe(25)
    chart.destroy()
  })
})
