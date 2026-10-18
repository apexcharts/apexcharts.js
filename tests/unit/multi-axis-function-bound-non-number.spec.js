import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// On a single axis, Range ignores a yaxis min/max function that returns
// nothing usable (#5328). Multi-axis charts resolve their bounds in
// Scales.scaleMultipleYAxes, which assigned the return value as is, so the
// axis fell into the no-data 0..tickAmount scale.

const series = [
  { name: 'a', data: [120, 140, 135, 160, 150] },
  { name: 'b', type: 'column', data: [3, 5, 4, 7, 6] },
]

/** @param {any} yaxis0 */
const scale0 = (yaxis0) => {
  const chart = createChartWithOptions({
    chart: { type: 'line', width: 600, height: 300 },
    yaxis: [yaxis0, { opposite: true }],
    series,
  })
  const { niceMin, niceMax, result } = chart.w.globals.yAxisScale[0]
  return { niceMin, niceMax, result: result.slice() }
}

describe('multi-axis yaxis min/max functions', () => {
  it('ignore a function that returns undefined, like a single axis does', () => {
    const plain = scale0({})
    expect(plain.niceMax).toBeGreaterThan(100)
    expect(scale0({ min: () => undefined, max: () => undefined })).toEqual(
      plain,
    )
  })

  it('ignore a function that returns NaN or a non-number', () => {
    const plain = scale0({})
    expect(scale0({ min: () => NaN, max: () => '200' })).toEqual(plain)
  })

  it('still honour a function or a number that resolves', () => {
    const fn = scale0({ min: () => 0, max: (max) => max + 100 })
    expect(fn.niceMin).toBe(0)
    expect(fn.niceMax).toBeGreaterThanOrEqual(260)
    const num = scale0({ min: 50, max: 250 })
    expect(num.niceMin).toBe(50)
    expect(num.niceMax).toBe(250)
  })
})
