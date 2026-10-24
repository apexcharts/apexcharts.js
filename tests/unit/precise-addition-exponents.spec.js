import { describe, it, expect, vi } from 'vitest'
import Utils from '../../src/utils/Utils.js'
import Scales from '../../src/modules/Scales.js'
import { createChartWithOptions } from './utils/utils.js'

// String(1e-7) is "1e-7": counting decimals after a '.' found none, so
// preciseAddition rounded both terms to 0.

describe('Utils.preciseAddition with exponent notation', () => {
  it('adds values written in exponent notation', () => {
    expect(Utils.preciseAddition(1e-7, 2e-7)).toBe(3e-7)
    expect(Utils.preciseAddition(0, 1e-7)).toBe(1e-7)
    expect(Utils.preciseAddition(1.5e-8, 1e-8)).toBe(2.5e-8)
  })

  it('keeps ordinary decimals exact', () => {
    expect(Utils.preciseAddition(0.1, 0.2)).toBe(0.3)
    expect(Utils.preciseAddition(1, 2)).toBe(3)
  })

  it('a tiny numeric stepSize gives advancing ticks instead of hanging', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300, animations: { enabled: false } },
      series: [{ data: [[0, 1], [1e-7, 2], [2e-7, 3], [3e-7, 4]] }],
      xaxis: { type: 'numeric', stepSize: 1e-7 },
    })
    expect(chart.w.globals.xAxisScale.result).toEqual([0, 1e-7, 2e-7, 3e-7])
  })

  it('a step that never reaches the data falls back instead of spinning', () => {
    // simulate a scale that cannot advance: every stepped scale stops short
    const orig = Scales.prototype.linearScale
    const spy = vi
      .spyOn(Scales.prototype, 'linearScale')
      .mockImplementation(function (min, max, ticks, index, step) {
        const s = orig.call(this, min, max, ticks, index, step)
        return step ? { ...s, niceMax: min } : s
      })
    try {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 300, animations: { enabled: false } },
        series: [{ data: [[0, 1], [10, 2], [20, 3], [30, 4]] }],
        xaxis: { type: 'numeric', stepSize: 10 },
      })
      const r = chart.w.globals.xAxisScale.result
      expect(r[0]).toBe(0)
      expect(r[r.length - 1]).toBeGreaterThanOrEqual(30)
    } finally {
      spy.mockRestore()
    }
  })
})
