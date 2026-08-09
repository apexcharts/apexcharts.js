import { describe, it, expect } from 'vitest'
import {
  createChartWithOptions,
  createChartsWithOptions,
} from './utils/utils.js'

/**
 * #5251: a brush selection reconstructs its x range from the selection rect's
 * DOM bounds, so `xaxis.max` can come back a sub-pixel fraction BELOW the
 * timestamp of the boundary data point. `Range.getMinYMaxY()` trimmed the
 * autoScaleYaxis window with a strict compare, so that point was dropped from
 * the y extrema while its marker and line segment were still painted inside the
 * plot, and the line escaped/clipped at the top of the grid.
 *
 * The same x window reached by panning (exact data values) scaled correctly,
 * which is the oracle these tests use.
 */

const DAY = 24 * 60 * 60 * 1000
const START = Date.UTC(2026, 5, 15)

const VALUES = [483, 438, 438, 438, 438, 390, 388, 437, 448, 448, 450, 447, 540]
const DATA = VALUES.map((y, i) => [START + i * DAY, y])

const LAST_X = DATA[DATA.length - 1][0]
const LAST_Y = VALUES[VALUES.length - 1]
const WINDOW_MIN = LAST_X - 7 * DAY

function render(overrides = {}) {
  return createChartWithOptions({
    chart: {
      type: 'area',
      width: 800,
      height: 240,
      zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
    },
    series: [{ name: 'Price', data: DATA }],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 4 },
    xaxis: { type: 'datetime' },
    ...overrides,
  })
}

/** Data units covered by one rendered x pixel of the given window. */
function onePixelInDomain(chart, min, max) {
  return (max - min) / chart.w.layout.gridWidth
}

describe('Issue 5251: sub-pixel x boundary excluded from autoScaleYaxis', () => {
  it('includes a boundary point that a pixel round-trip nudged out of range', () => {
    const chart = render()

    const px = onePixelInDomain(chart, WINDOW_MIN, LAST_X)
    // what a DOM pixel -> timestamp round-trip on the selection rect produces:
    // short of the last point by less than one rendered pixel
    const brushMax = LAST_X - px / 4
    expect(LAST_X - brushMax).toBeLessThan(px)

    chart.zoomX(WINDOW_MIN, brushMax)

    // the segment leading to the last point is rendered, so it has to fit
    expect(chart.w.globals.yAxisScale[0].niceMax).toBeGreaterThanOrEqual(LAST_Y)
  })

  it('matches the y range reached by panning to the same window', () => {
    const panned = render()
    panned.zoomX(WINDOW_MIN, LAST_X)
    const pannedMax = panned.w.globals.yAxisScale[0].niceMax

    const brushed = render()
    const px = onePixelInDomain(brushed, WINDOW_MIN, LAST_X)
    brushed.zoomX(WINDOW_MIN, LAST_X - px / 4)

    expect(brushed.w.globals.yAxisScale[0].niceMax).toBe(pannedMax)
  })

  it('applies the same tolerance at the left edge', () => {
    // index 6 (y = 388) is the unique minimum of this window AND its leftmost
    // point, so a sub-pixel overshoot on xaxis.min lifts the bottom of the scale
    const windowMin = DATA[6][0]
    const windowMax = DATA[9][0]

    const panned = render()
    panned.zoomX(windowMin, windowMax)
    const pannedMin = panned.w.globals.minY

    // control: a window that genuinely starts one point later must land
    // somewhere else, otherwise the assertion below proves nothing
    const narrower = render()
    narrower.zoomX(DATA[7][0], windowMax)
    expect(narrower.w.globals.minY).not.toBe(pannedMin)

    const brushed = render()
    const px = onePixelInDomain(brushed, windowMin, windowMax)
    brushed.zoomX(windowMin + px / 4, windowMax)

    expect(brushed.w.globals.minY).toBe(pannedMin)
    expect(brushed.w.globals.yAxisScale[0].niceMin).toBe(
      panned.w.globals.yAxisScale[0].niceMin,
    )
  })

  it('applies to a target scaled by chart.brush.autoScaleYaxis', async () => {
    // the target opts out of zoom.autoScaleYaxis, so the only thing turning
    // auto-scaling on is the brush source - a different branch in getMinYMaxY
    const [main, brush] = createChartsWithOptions(
      {
        chart: {
          id: 'issue-5251-main',
          type: 'area',
          width: 800,
          height: 240,
          animations: { enabled: false },
          zoom: { enabled: true, type: 'x', autoScaleYaxis: false },
        },
        series: [{ name: 'Price', data: DATA }],
        xaxis: { type: 'datetime', min: WINDOW_MIN, max: LAST_X },
      },
      {
        chart: {
          type: 'bar',
          width: 800,
          height: 100,
          animations: { enabled: false },
          brush: {
            enabled: true,
            target: 'issue-5251-main',
            autoScaleYaxis: true,
          },
          selection: {
            enabled: true,
            xaxis: { min: WINDOW_MIN, max: LAST_X },
          },
        },
        series: [{ name: 'Price', data: DATA }],
        xaxis: { type: 'datetime' },
        yaxis: { show: false },
      },
    )

    expect(main.w.globals.brushSource).toBeTruthy()

    const px = onePixelInDomain(main, WINDOW_MIN, LAST_X)
    // this is the handler ZoomPanSelection invokes with the rect-derived range
    brush.w.config.chart.events.selection(brush, {
      xaxis: { min: WINDOW_MIN, max: LAST_X - px / 4 },
      yaxis: { min: 0, max: 1 },
    })
    await new Promise((r) => setTimeout(r, 0))

    // globals.maxY carries the line/area range padding, so only the bound matters
    expect(main.w.globals.maxY).toBeGreaterThanOrEqual(LAST_Y)
    expect(main.w.globals.yAxisScale[0].niceMax).toBeGreaterThanOrEqual(LAST_Y)
  })

  it('still excludes points more than a pixel outside the window', () => {
    // the tolerance must not silently widen the window: a point a long way
    // past the boundary stays out of the extrema
    const chart = render()
    const px = onePixelInDomain(chart, WINDOW_MIN, LAST_X)
    chart.zoomX(WINDOW_MIN, LAST_X - 10 * px)

    expect(chart.w.globals.yAxisScale[0].niceMax).toBeLessThan(LAST_Y)
  })
})
