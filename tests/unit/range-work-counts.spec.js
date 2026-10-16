import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Range from '../../src/modules/Range.js'
import Utils from '../../src/utils/Utils.js'

// Counts the work Range.getMinYMaxY and _setStackedMinMax used to repeat per
// series or per point. The values they produce are pinned in
// parse-output-pins.spec.js.

afterEach(() => vi.restoreAllMocks())

const render = (opts) =>
  createChartWithOptions({
    ...opts,
    chart: { width: 480, height: 300, ...opts.chart },
  })

describe('getMinYMaxY hoists its per-call invariants', () => {
  it('reads the category labels and series totals once per call', () => {
    const S = 8
    const chart = render({
      chart: { type: 'bar' },
      xaxis: { categories: ['a', 'b', 'c'] },
      series: Array.from({ length: S }, () => ({ data: [1, 2, 3] })),
    })
    const w = chart.w
    // as a category axis converted to numeric x holds them
    const cats = ['a', undefined, 'c']
    let catReads = 0
    Object.defineProperty(w.labelData, 'categoryLabels', {
      configurable: true,
      get: () => (catReads++, cats),
    })
    const rows = w.seriesData.series
    let totals = 0
    w.seriesData.series = new Proxy(rows, {
      get(t, k) {
        if (k === 'reduce' || k === 'some') totals++
        return t[k]
      },
    })
    new Range(w).getMinYMaxY(0, undefined, undefined, S)
    w.seriesData.series = rows
    // were 2 and 1 per series (16 and 8)
    expect(catReads).toBe(2)
    expect(totals).toBe(1)
    expect(w.globals.dataPoints).toBe(3)
    chart.destroy()
  })
})

describe('_setStackedMinMax', () => {
  it('sums stacked points without isNumber', () => {
    const chart = render({
      chart: { type: 'bar', stacked: true },
      series: [0, 1, 2].map(() => ({ data: [1, -2, 3.5, 4] })),
    })
    const isNumber = vi.spyOn(Utils, 'isNumber')
    const gl = chart.w.globals
    gl.maxY = -Number.MAX_VALUE
    gl.minY = Number.MIN_VALUE
    new Range(chart.w)._setStackedMinMax()
    // was 1 per stacked point (12)
    expect(isNumber).toHaveBeenCalledTimes(0)
    expect(gl.minY).toBe(-6)
    expect(gl.maxY).toBeCloseTo(12.000012, 9)
    chart.destroy()
  })
})
