import { describe, test, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'

// #5389: highlightFilter set() and clear() re-feed the chart its own series
// with new parts. They went through the public updateSeries(), which reverts
// any zoom for page-supplied data, so every pick or clear threw the user's
// zoom window away. The internal route keeps the window, the zoomed flag and
// the reset control; a plain updateSeries() still resets all three.

function lineChart() {
  const data = []
  for (let x = 1; x <= 15; x++) data.push({ x, y: 10 + ((x * 7) % 11) })
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 600,
      height: 400,
      animations: { enabled: false },
      zoom: { enabled: true },
      // no toolbar: the reset control is the on-demand one
      toolbar: { show: false },
    },
    series: [{ name: 'S', data }],
    xaxis: { type: 'numeric' },
  })
}

const settle = () => new Promise((r) => setTimeout(r, 0))
const resets = (c) => c.el.querySelectorAll('.apexcharts-reset-icon')
const view = (c) => ({
  min: c.w.globals.minX,
  max: c.w.globals.maxX,
  zoomed: c.w.interact.zoomed,
  stateZoomed: c.getState().zoomed,
  reset: resets(c).length,
})

describe('highlightFilter keeps a zoomed window (#5389)', () => {
  test('set() then clear() leave the x window, the flag and the reset control', async () => {
    const c = lineChart()
    c.zoomX(4, 10)
    await settle()
    const zoomed = view(c)
    expect(zoomed).toMatchObject({ min: 4, max: 10, zoomed: true, reset: 1 })

    await c.highlightFilter.set(({ value }) => value / 2, { animate: false })
    await settle()
    expect(c.highlightFilter.isActive()).toBe(true)
    expect(view(c)).toEqual(zoomed)

    await c.highlightFilter.clear({ animate: false })
    await settle()
    expect(c.highlightFilter.isActive()).toBe(false)
    expect(view(c)).toEqual(zoomed)
  })

  test('a plain updateSeries() still resets the zoom', async () => {
    const c = lineChart()
    c.zoomX(4, 10)
    await settle()
    await c.updateSeries(c.w.config.series, false)
    await settle()
    expect(view(c)).toMatchObject({
      min: 1,
      max: 15,
      zoomed: false,
      stateZoomed: false,
      reset: 0,
    })
  })
})
