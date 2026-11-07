import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Scales from '../../src/modules/Scales.js'

// #4986: a rangeBar selection zoomed down past the resolution of its datetime
// values. The tick step stopped advancing the timestamp, the scale loop ran
// until it threw, and the chart (already cleared for that update) stayed
// blank. Reset Zoom has to come back to the original bars.

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

  it('draws when a series range row is missing', () => {
    const c = render()
    c.w.rangeData.seriesRangeStart[1] = undefined
    c.w.rangeData.seriesRangeEnd[1] = undefined
    expect(() => c.ctx.rangeBar.draw(c.w.seriesData.series)).not.toThrow()
  })
})
