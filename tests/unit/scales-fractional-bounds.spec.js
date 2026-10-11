import Utils from '../../src/utils/Utils.js'
import { createChartWithOptions } from './utils/utils.js'

// A fractional yaxis.min with integer data and forceNiceScale made niceScale
// hand getPrimeFactors a fractional tick count (15.5), which looped forever.
describe('fractional y-axis bounds', () => {
  it('passes niceScale an integer tick count and draws the axis', () => {
    const orig = Utils.getPrimeFactors
    const fractional = []
    const spy = vi.spyOn(Utils, 'getPrimeFactors').mockImplementation((n) => {
      if (!Number.isInteger(n)) fractional.push(n)
      return orig(n)
    })
    try {
      const chart = createChartWithOptions({
        chart: { type: 'line', height: 300, width: 500 },
        series: [{ data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }],
        yaxis: { min: -0.5, forceNiceScale: true },
      })
      expect(fractional).toEqual([])
      expect(chart.w.globals.yAxisScale[0].result.length).toBeGreaterThan(1)
    } finally {
      spy.mockRestore()
    }
  })

  it('getPrimeFactors returns ascending factors and never hangs', () => {
    expect(Utils.getPrimeFactors(30)).toEqual([2, 3, 5])
    expect(Utils.getPrimeFactors(64)).toEqual([2, 2, 2, 2, 2, 2])
    expect(Utils.getPrimeFactors(97)).toEqual([97])
    expect(Utils.getPrimeFactors(1)).toEqual([])
    expect(Utils.getPrimeFactors(15.5)).toEqual([2, 2, 2, 2])
    expect(Utils.getPrimeFactors(NaN)).toEqual([])
    expect(Utils.getPrimeFactors(Infinity)).toEqual([])
  })
})
