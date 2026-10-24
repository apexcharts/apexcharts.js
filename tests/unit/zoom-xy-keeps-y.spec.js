import { describe, test, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// #5369: on a zoom.type 'xy' (or 'y') chart a zoom box narrows y as well as x,
// but every path that then moves only x (the toolbar zoom buttons, zoomX(),
// a pan drag, the wheel, a pinch, a pixel pan) rebuilt y from the initial
// config and threw the y window away; the `zoomed` payload reported the
// initial y too. They now keep the y window the box chose.

function scatter(zoom = {}, events = {}) {
  const data = []
  for (let x = 0; x < 40; x++) data.push([x, (x * 37) % 101])
  return createChartWithOptions({
    chart: {
      type: 'scatter',
      width: 600,
      height: 400,
      animations: { enabled: false },
      zoom: { enabled: true, type: 'xy', ...zoom },
      events,
    },
    series: [{ name: 'S', data }],
    xaxis: { type: 'numeric' },
  })
}

/** What a zoom box over x 8..27, y 30..80 leaves behind (ZoomPanSelection). */
function boxZoom(chart) {
  const w = chart.w
  const yaxis = JSON.parse(JSON.stringify(w.globals.initialConfig.yaxis))
  yaxis.forEach((y) => {
    y.min = 30
    y.max = 80
  })
  w.interact.zoomed = true
  chart.updateHelpers._updateOptions(
    { xaxis: { min: 8, max: 27 }, yaxis },
    false,
    false,
  )
}

const yWindow = (c) => ({
  config: [c.w.config.yaxis[0].min, c.w.config.yaxis[0].max],
  drawn: [c.w.globals.minY, c.w.globals.maxY],
})
const xWindow = (c) => [c.w.globals.minX, c.w.globals.maxX]

function setup(zoom, events) {
  const chart = scatter(zoom, events)
  const full = yWindow(chart)
  boxZoom(chart)
  const boxed = yWindow(chart)
  expect(boxed.config).toEqual([30, 80])
  expect(boxed.drawn).not.toEqual(full.drawn)
  return { chart, full, boxed }
}

describe("zoom.type 'xy' keeps the y window when only x moves (#5369)", () => {
  test('toolbar zoom in and zoom out keep y, x still moves', () => {
    const { chart, boxed } = setup()
    chart.toolbar.handleZoomIn()
    expect(xWindow(chart)[0]).toBeGreaterThan(8)
    expect(xWindow(chart)[1]).toBeLessThan(27)
    expect(yWindow(chart)).toEqual(boxed)

    chart.toolbar.handleZoomOut()
    expect(yWindow(chart)).toEqual(boxed)
  })

  test('zoomX() keeps y', () => {
    const { chart, boxed } = setup()
    chart.zoomX(10, 20)
    expect(xWindow(chart)).toEqual([10, 20])
    expect(yWindow(chart)).toEqual(boxed)
  })

  test('a pan drag keeps y', () => {
    const { chart, boxed } = setup()
    const zps = chart.zoomPanSelection
    zps.moveDirection = 'left'
    zps.panScrolled()
    expect(xWindow(chart)[0]).toBeGreaterThan(8)
    expect(yWindow(chart)).toEqual(boxed)
  })

  test('the wheel, pinch and pixel-pan window keeps y', () => {
    const { chart, boxed } = setup()
    const zps = chart.zoomPanSelection
    expect(zps._applyXRange(10, 20, true)).toBeTruthy()
    expect(xWindow(chart)).toEqual([10, 20])
    expect(yWindow(chart)).toEqual(boxed)
    expect(zps._applyXRange(12, 22, false)).toBeTruthy()
    expect(yWindow(chart)).toEqual(boxed)
  })

  test("zoom.type 'y' keeps y the same way", () => {
    const { chart, boxed } = setup({ type: 'y' })
    chart.toolbar.handleZoomIn()
    expect(yWindow(chart)).toEqual(boxed)
  })

  test("zoom.type 'x' and autoScaleYaxis still start y from the config", () => {
    const x = setup({ type: 'x' })
    x.chart.toolbar.handleZoomIn()
    expect(yWindow(x.chart)).toEqual(x.full)

    const auto = scatter({ autoScaleYaxis: true })
    boxZoom(auto)
    expect(auto.toolbar.yaxisForXWindow()[0].min).toBeUndefined()
  })

  test('the zoomed payload reports the y window on screen', () => {
    const zoomed = vi.fn()
    const { chart } = setup({}, { zoomed })
    const y = () => {
      const { yaxis } = zoomed.mock.calls.at(-1)[1]
      return [yaxis[0].min, yaxis[0].max]
    }

    chart.toolbar.handleZoomIn()
    expect(y()).toEqual([30, 80])

    const zps = chart.zoomPanSelection
    zps._applyXRange(10, 20, true)
    zps._endWheelZoom()
    expect(zoomed.mock.calls.at(-1)[1].xaxis).toEqual({ min: 10, max: 20 })
    expect(y()).toEqual([30, 80])

    zps._endPinch()
    expect(y()).toEqual([30, 80])
  })

  test('after a reset, x moves start from the full y range again', () => {
    const { chart, full } = setup()
    chart.toolbar.handleZoomReset()
    chart.toolbar.handleZoomIn()
    expect(yWindow(chart)).toEqual(full)
  })
})
