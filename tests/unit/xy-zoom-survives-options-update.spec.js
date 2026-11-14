import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import Utils from '../../src/utils/Utils.js'

// A wrapper re-sends the page's options on every render. After an xy zoom,
// a payload naming yaxis replaced the y axes and the y range the zoom had
// written there, while the x range and the zoomed flag stayed: the y half of
// the zoom snapped back on the next render.

const breached = [
  [-73.928, 41.36],
  [-73.915, 41.4],
  [-73.855, 41.66],
  [-73.817, 42.27],
  [-73.808, 42.09],
  [-73.796, 42.4],
  [-73.781, 42.55],
]

const options = () => ({
  chart: { type: 'scatter', height: 300, zoom: { enabled: true, type: 'xy' } },
  xaxis: { type: 'numeric', labels: { formatter: (v) => Number(v).toFixed(2) } },
  yaxis: { labels: { formatter: (v) => Number(v).toFixed(1) } },
})

const mount = async () => {
  document.body.innerHTML = '<div id="c"></div>'
  const chart = new ApexCharts(document.querySelector('#c'), {
    ...options(),
    chart: { ...options().chart, width: 600, animations: { enabled: false } },
    series: [{ name: 'Breached', data: breached }],
  })
  await chart.render()
  return chart
}

// What a drag selection applies on an xy zoom (ZoomPanSelection).
const dragZoomXY = async (chart, x, y) => {
  const w = chart.w
  const yaxis = Utils.clone(w.globals.initialConfig.yaxis)
  yaxis.forEach((a) => {
    a.min = y[0]
    a.max = y[1]
  })
  w.interact.zoomed = true
  await chart.updateHelpers._updateOptions(
    { xaxis: { min: x[0], max: x[1] }, yaxis },
    false,
    false,
  )
}

const ranges = (chart) => {
  const g = chart.w.globals
  return { minX: g.minX, maxX: g.maxX, minY: g.minY, maxY: g.maxY }
}

describe('an xy zoom across a page options update', () => {
  it('keeps both zoomed ranges when the options name yaxis without bounds', async () => {
    const chart = await mount()
    await dragZoomXY(chart, [-73.85, -73.79], [41.5, 42.45])
    const zoomed = ranges(chart)
    expect(zoomed.minY).toBe(41.5)

    await chart.updateOptions(options())

    expect(chart.w.interact.zoomed).toBe(true)
    expect(ranges(chart)).toEqual(zoomed)
    chart.destroy()
  })

  it('a reset afterwards still returns to the full range', async () => {
    const chart = await mount()
    const full = ranges(chart)
    await dragZoomXY(chart, [-73.85, -73.79], [41.5, 42.45])
    await chart.updateOptions(options())

    chart.ctx.toolbar.handleZoomReset()
    await new Promise((r) => setTimeout(r, 0))

    expect(chart.w.interact.zoomed).toBe(false)
    expect(ranges(chart)).toEqual(full)
    chart.destroy()
  })

  it('a reset after an update that names no axis returns to the full range', async () => {
    // The snapshot a reset returns to was retaken from the zoomed config.
    const chart = await mount()
    const full = ranges(chart)
    chart.zoomX(-73.85, -73.79)
    await chart.updateOptions({ title: { text: 'Faults' } })

    chart.ctx.toolbar.handleZoomReset()
    await new Promise((r) => setTimeout(r, 0))

    expect(ranges(chart)).toEqual(full)
    chart.destroy()
  })

  it('bounds the options set themselves win over the zoomed ones', async () => {
    const chart = await mount()
    await dragZoomXY(chart, [-73.85, -73.79], [41.5, 42.45])

    await chart.updateOptions({ yaxis: { min: 40, max: 44 } })

    expect(chart.w.globals.minY).toBe(40)
    expect(chart.w.globals.maxY).toBe(44)
    chart.destroy()
  })

  it('new series still drop the whole zoom', async () => {
    const chart = await mount()
    const full = ranges(chart)
    await dragZoomXY(chart, [-73.85, -73.79], [41.5, 42.45])

    await chart.updateOptions({
      ...options(),
      series: [{ name: 'Breached', data: breached }],
    })

    expect(chart.w.interact.zoomed).toBe(false)
    expect(ranges(chart)).toEqual(full)
    chart.destroy()
  })
})
