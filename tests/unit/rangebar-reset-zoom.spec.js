import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Scales from '../../src/modules/Scales.js'
import AxisMapping from '../../src/modules/AxisMapping.js'

// #4986: a rangeBar selection zoomed down past the resolution of its datetime
// values. The tick step stopped advancing the timestamp, the scale loop ran
// until it threw, and the chart (already cleared for that update) stayed
// blank. Selection zoom now stops at the same minimum window wheel and pinch
// use, so the drag cannot get there. Reset Zoom still restores the bars.

const DAY = 86400000
const T0 = Date.UTC(2024, 2, 2)

const series = [
  {
    name: 'Frontend',
    data: [
      { x: 'Design', y: [T0, T0 + 3 * DAY] },
      { x: 'Code', y: [T0 + 3 * DAY, T0 + 6 * DAY] },
      { x: 'Test', y: [T0 + 6 * DAY, T0 + 11 * DAY] },
    ],
  },
  {
    name: 'Backend',
    data: [
      { x: 'Design', y: [T0 - 3 * DAY, T0] },
      { x: 'Code', y: [T0 + DAY, T0 + 4 * DAY] },
      { x: 'Test', y: [T0 + 5 * DAY, T0 + 14 * DAY] },
    ],
  },
]

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

function render() {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = createChartWithOptions({
    chart: {
      type: 'rangeBar',
      width: 650,
      height: 350,
      zoom: { enabled: true },
    },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: true },
    xaxis: { type: 'datetime' },
    series,
  })
  return chart
}

const barCount = (c) => c.el.querySelectorAll('.apexcharts-rangebar-area').length

// Drag a selection of `widthPx` plot pixels. Returns the xaxis the zoom applied.
async function selectionZoom(c, widthPx) {
  const z = c.zoomPanSelection
  const plot = AxisMapping.plotRect(c.w)
  const left = plot.left + c.w.layout.gridWidth * 0.45 * plot.zoom
  const right = left + widthPx * plot.zoom
  z.zoomRect = {
    node: {
      getBoundingClientRect: () => ({
        left,
        right,
        top: plot.top,
        bottom: plot.top + 24,
        width: right - left,
        height: 24,
      }),
    },
  }
  z.dragged = true
  z.dragX = 12
  z.dragY = 0

  let pending
  let applied
  const helpers = c.ctx.updateHelpers
  const orig = helpers._updateOptions
  helpers._updateOptions = function (opts, ...args) {
    applied = opts
    pending = orig.apply(this, [opts, ...args])
    return pending
  }
  z.selectionDrawn({ context: z, zoomtype: 'x' })
  helpers._updateOptions = orig
  if (pending && typeof pending.then === 'function') await pending
  return applied
}

function rangeBarBounds(c) {
  const vals = (c.w.rangeData.seriesRangeStart || [])
    .concat(c.w.rangeData.seriesRangeEnd || [])
    .flat()
    .filter((y) => typeof y === 'number' && Number.isFinite(y))
  return { min: Math.min(...vals), max: Math.max(...vals) }
}

// niceScale strips non-integers to 7 significant digits. The selection floor
// keeps two of those quanta, which a millionth of a short bar span does not.
function scaleResolution(value) {
  const mag = Math.abs(value)
  if (!(mag > 0)) return 0
  return 10 ** (Math.floor(Math.log10(mag)) - 6)
}

function selectionFloor(bounds) {
  const span = bounds.max - bounds.min
  const resolution =
    Math.max(scaleResolution(bounds.min), scaleResolution(bounds.max)) * 2
  return Math.min(span, Math.max(span * 1e-6, resolution))
}

describe('rangeBar reset zoom after an extreme zoom (#4986)', () => {
  it('keeps a sub-ulp datetime window on a finite scale', () => {
    const c = render()
    const s = new Scales(c.w)
    const yMin = 1709000000000
    const yMax = yMin + yMin * Number.EPSILON
    const scale = s.niceScale(yMin, yMax)
    expect(scale.result.length).toBeGreaterThanOrEqual(2)
    expect(Number.isFinite(scale.niceMin)).toBe(true)
    expect(Number.isFinite(scale.niceMax)).toBe(true)
    expect(scale.niceMax).not.toBe(scale.niceMin)
  })

  it('reset zoom restores the bars after a sub-ulp window', async () => {
    const c = render()
    const full = c.w.globals.maxY - c.w.globals.minY
    const barsBefore = barCount(c)
    expect(barsBefore).toBe(6)

    const min = c.w.globals.minY
    const zoomed = c.ctx.updateHelpers._updateOptions(
      { xaxis: { min, max: min + min * Number.EPSILON } },
      false,
      false,
    )
    c.w.interact.zoomed = true
    await zoomed

    expect(Number.isFinite(c.w.globals.minY)).toBe(true)
    expect(Number.isFinite(c.w.globals.maxY)).toBe(true)
    expect(c.w.globals.maxY).not.toBe(c.w.globals.minY)

    let resetPromise
    const orig = c.ctx.updateHelpers._updateSeries
    c.ctx.updateHelpers._updateSeries = function (...args) {
      resetPromise = orig.apply(this, args)
      return resetPromise
    }
    c.toolbar.handleZoomReset()
    await resetPromise

    expect(c.w.interact.zoomed).toBe(false)
    expect(c.w.globals.maxY - c.w.globals.minY).toBeGreaterThan(full / 2)
    expect(barCount(c)).toBe(barsBefore)
  })

  it('floors a tiny selection above the scale resolution', async () => {
    const c = render()
    expect(c.w.interact.zoomEnabled).toBe(true)
    const full = c.w.globals.maxY - c.w.globals.minY
    const minRange = selectionFloor(rangeBarBounds(c))

    // A real drag still narrows the chart. The floor only catches a window
    // that would otherwise fall through the datetime resolution.
    const wide = await selectionZoom(c, c.w.layout.gridWidth * 0.4)
    const wideSpan = wide.xaxis.max - wide.xaxis.min
    expect(wideSpan).toBeGreaterThan(minRange * 10)
    expect(wideSpan).toBeLessThan(full)

    const tiny = await selectionZoom(c, 0.0001)
    expect(tiny?.xaxis).toBeTruthy()
    const span = tiny.xaxis.max - tiny.xaxis.min
    expect(span).toBeCloseTo(minRange, 0)
    expect(span).toBeLessThan(full / 2)
    expect(c.w.globals.maxY).toBeGreaterThan(c.w.globals.minY)
    expect(barCount(c)).toBe(6)
  })

  it('keeps the window above the floor across repeated 10px drags', async () => {
    const c = render()
    const barsBefore = barCount(c)
    const full = c.w.globals.maxY - c.w.globals.minY
    const minRange = selectionFloor(rangeBarBounds(c))

    for (let i = 0; i < 8; i++) {
      const applied = await selectionZoom(c, 10)
      expect(applied.xaxis.max - applied.xaxis.min).toBeGreaterThanOrEqual(
        minRange * 0.999,
      )
      expect(c.w.globals.maxY).toBeGreaterThan(c.w.globals.minY)
    }

    expect(c.w.globals.maxY - c.w.globals.minY).toBeLessThan(full)
    expect(barCount(c)).toBe(barsBefore)

    let resetPromise
    const orig = c.ctx.updateHelpers._updateSeries
    c.ctx.updateHelpers._updateSeries = function (...args) {
      resetPromise = orig.apply(this, args)
      return resetPromise
    }
    c.toolbar.handleZoomReset()
    await resetPromise

    expect(c.w.interact.zoomed).toBe(false)
    expect(c.w.globals.maxY - c.w.globals.minY).toBeGreaterThan(full / 2)
    expect(barCount(c)).toBe(barsBefore)
  })
})

describe('selection zoom minimum range', () => {
  it('floors a datetime line at two point-spacings, like wheel zoom', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const t0 = Date.UTC(2024, 0, 1)
    chart = createChartWithOptions({
      chart: {
        type: 'line',
        width: 650,
        height: 350,
        zoom: { enabled: true },
      },
      xaxis: { type: 'datetime' },
      series: [
        {
          data: Array.from({ length: 8 }, (_, i) => ({
            x: t0 + i * DAY,
            y: i + 1,
          })),
        },
      ],
    })
    const c = chart
    const domain = c.w.globals.initialMaxX - c.w.globals.initialMinX
    expect(c.w.globals.minXDiff).toBe(DAY)
    const minRange = Math.min(domain, Math.max(DAY * 2, domain * 1e-6))
    const full = c.w.globals.maxX - c.w.globals.minX

    const wide = await selectionZoom(c, c.w.layout.gridWidth * 0.4)
    const wideSpan = wide.xaxis.max - wide.xaxis.min
    expect(wideSpan).toBeGreaterThan(minRange)
    expect(wideSpan).toBeLessThan(full)

    const tiny = await selectionZoom(c, 0.0001)
    expect(tiny.xaxis.max - tiny.xaxis.min).toBeCloseTo(minRange, 0)
  })
})
