import { createChartWithOptions } from './utils/utils.js'

import { logData } from './data/log-data.js'

describe('Multiple Y-axis Scales', () => {
  it('should return correct scales for log and linear yaxis scales when no logarithmic base specified', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Logarithmic',
          data: logData,
        },
        {
          name: 'Linear',
          data: logData,
        },
      ],
      yaxis: [
        {
          min: 1000000,
          max: 500000000,
          tickAmount: 4,
          logarithmic: true,
          seriesName: 'Logarithmic',
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
          tickAmount: 4,
          seriesName: 'Linear',
        },
      ],
    })

    const { minYArr, maxYArr, yAxisScale } = chart.getState()

    expect(minYArr).toEqual([1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000])

    // Both axes ask for tickAmount: 4, so both get 4 intervals / 5 labels. The
    // log axis used to return 4 labels here because tickAmount never reached
    // the log generators and the count fell out of Math.round(logRange)
    // instead, disagreeing with the linear axis in the same chart (#4873).
    // Consecutive log ticks are in a constant ratio of 500^(1/4) = 4.7287.
    expect(yAxisScale).toEqual([
      {
        niceMax: 500000000,
        niceMin: 1000000,
        result: [
          999999.9999999979, 4728708.04501587, 22360679.77499785,
          105737126.3440564, 499999999.99999994,
        ],
      },
      {
        niceMax: 500000000,
        niceMin: 1000000,
        result: [1000000, 125750000, 250500000, 375250000, 500000000],
      },
    ])
  })

  it('should return correct scales for log and linear yaxis scales when logarithmic base is 20', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Logarithmic',
          data: logData,
        },
        {
          name: 'Linear',
          data: logData,
        },
      ],
      yaxis: [
        {
          min: 1000000,
          max: 500000000,
          tickAmount: 4,
          logarithmic: true,
          logBase: 20,
          seriesName: 'Logarithmic',
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
          tickAmount: 4,
          seriesName: 'Linear',
        },
      ],
    })

    const { minYArr, maxYArr, yAxisScale } = chart.getState()

    expect(minYArr).toEqual([1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000])

    expect(yAxisScale[0].niceMax).toBe(500000000)
    expect(yAxisScale[0].niceMin).toBe(1000000)
    // tickAmount: 4 is now honoured, so 5 labels rather than the 3 that
    // Math.round(logRange) happened to yield for base 20 (#4873).
    //
    // Without forceNiceScale the ticks are a geometric interpolation across the
    // domain, and geometric spacing does not depend on the base, so a fixed
    // tickAmount gives the same values here as base 10 does. logBase now only
    // influences the count, and only when tickAmount is left unset.
    expect(yAxisScale[0].result).toHaveLength(5)
    expect(yAxisScale[0].result[0]).toBeCloseTo(999999.9999999998, 0)
    expect(yAxisScale[0].result[1]).toBeCloseTo(4728708.045015873, 0)
    expect(yAxisScale[0].result[2]).toBeCloseTo(22360679.774997853, 0)
    expect(yAxisScale[0].result[3]).toBeCloseTo(105737126.3440561, 0)
    expect(yAxisScale[0].result[4]).toBeCloseTo(500000000.0000007, 0)
    // consecutive ratios are constant: 500^(1/4)
    const r = yAxisScale[0].result
    for (let i = 1; i < r.length; i++) {
      expect(r[i] / r[i - 1]).toBeCloseTo(Math.pow(500, 1 / 4), 4)
    }
    expect(yAxisScale[1]).toEqual({
      niceMax: 500000000,
      niceMin: 1000000,
      result: [1000000, 125750000, 250500000, 375250000, 500000000],
    })
  })

  it('should associate multiple series to multiple yaxes according to seriesName array spec', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          seriesName: ['Series C', 'Series D'],
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const { minYArr, maxYArr, seriesYAxisMap, seriesYAxisReverseMap } = chart.getState()

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(seriesYAxisMap).toEqual([
      [0, 1],
      [2, 3],
    ])
    expect(seriesYAxisReverseMap).toEqual([0, 0, 1, 1])
  })

  it('should associate series to yaxes according to seriesName then assign remainder to last free axis', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const { minYArr, maxYArr, seriesYAxisMap, seriesYAxisReverseMap } = chart.getState()

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(seriesYAxisMap).toEqual([
      [0, 1],
      [2, 3],
    ])
    expect(seriesYAxisReverseMap).toEqual([0, 0, 1, 1])
  })

  it('should associate series to yaxes according to seriesName then assign remainder to last axis', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          seriesName: 'Series C',
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const { minYArr, maxYArr, seriesYAxisMap, seriesYAxisReverseMap } = chart.getState()

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(seriesYAxisMap).toEqual([
      [0, 1],
      [2, 3],
    ])
    expect(seriesYAxisReverseMap).toEqual([0, 0, 1, 1])
  })

  it('should associate series to yaxes according to seriesName then assign remainder one-for-one', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const { minYArr, maxYArr, seriesYAxisMap, seriesYAxisReverseMap } = chart.getState()

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(seriesYAxisMap).toEqual([[0, 1], [2], [3]])
    expect(seriesYAxisReverseMap).toEqual([0, 0, 1, 2])
  })

  it('should associate series to yaxes according to seriesName before assigning remainder one-for-one', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const { minYArr, maxYArr, seriesYAxisMap, seriesYAxisReverseMap } = chart.getState()

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(seriesYAxisMap).toEqual([[2], [0, 1], [3]])
    expect(seriesYAxisReverseMap).toEqual([1, 1, 0, 2])
  })

  describe('alignZero option', () => {
    it('should not change scales when alignZero is false (default)', () => {
      const chart = createChartWithOptions({
        chart: { type: 'bar' },
        series: [
          { name: 'A', data: [-10, 5, 15, -3] },
          { name: 'B', data: [1, 2, 3, 2] },
        ],
        yaxis: [{ seriesName: 'A' }, { seriesName: 'B', opposite: true }],
      })

      const { minYArr, maxYArr } = chart.getState()
      const rA = -minYArr[0] / (maxYArr[0] - minYArr[0])
      const rB = -minYArr[1] / (maxYArr[1] - minYArr[1])
      expect(rA).not.toBeCloseTo(rB, 1)
    })

    it('should align zero pixel position when alignZero is true on both axes', () => {
      const chart = createChartWithOptions({
        chart: { type: 'bar' },
        series: [
          { name: 'A', data: [-10, 5, 15, -3] },
          { name: 'B', data: [1, 2, 3, 2] },
        ],
        yaxis: [
          { seriesName: 'A', alignZero: true },
          { seriesName: 'B', alignZero: true, opposite: true },
        ],
      })

      const { minYArr, maxYArr } = chart.getState()
      const rA = -minYArr[0] / (maxYArr[0] - minYArr[0])
      const rB = -minYArr[1] / (maxYArr[1] - minYArr[1])
      expect(rA).toBeCloseTo(rB, 1)
    })

    it('should leave non-opted-in axis independent', () => {
      const chart = createChartWithOptions({
        chart: { type: 'bar' },
        series: [
          { name: 'A', data: [-10, 5, 15, -3] },
          { name: 'B', data: [1, 2, 3, 2] },
          { name: 'C', data: [25, 27, 26, 29] },
        ],
        yaxis: [
          { seriesName: 'A', alignZero: true },
          { seriesName: 'B', alignZero: true, opposite: true },
          { seriesName: 'C', opposite: true },
        ],
      })

      const { minYArr, maxYArr } = chart.getState()
      // A and B aligned
      const rA = -minYArr[0] / (maxYArr[0] - minYArr[0])
      const rB = -minYArr[1] / (maxYArr[1] - minYArr[1])
      expect(rA).toBeCloseTo(rB, 1)
      // C untouched — still tightly fit to its positive range
      expect(minYArr[2]).toBeGreaterThanOrEqual(20)
    })

    it('should be a no-op when only one axis opts in', () => {
      const chart = createChartWithOptions({
        chart: { type: 'bar' },
        series: [
          { name: 'A', data: [-10, 5, 15, -3] },
          { name: 'B', data: [1, 2, 3, 2] },
        ],
        yaxis: [
          { seriesName: 'A', alignZero: true },
          { seriesName: 'B', opposite: true },
        ],
      })

      const { minYArr } = chart.getState()
      // B should not have been forced to a negative min by alignment
      expect(minYArr[1]).toBeGreaterThanOrEqual(0)
    })

    it('should skip an opted-in axis that has user-set min', () => {
      const chart = createChartWithOptions({
        chart: { type: 'bar' },
        series: [
          { name: 'A', data: [-10, 5, 15, -3] },
          { name: 'B', data: [1, 2, 3, 2] },
        ],
        yaxis: [
          { seriesName: 'A', alignZero: true },
          { seriesName: 'B', alignZero: true, min: 0, opposite: true },
        ],
      })

      const { minYArr } = chart.getState()
      // B kept its user-set min
      expect(minYArr[1]).toBe(0)
    })

    it('should skip a logarithmic axis from alignment', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [
          { name: 'A', data: [-10, 5, 15, -3] },
          { name: 'B', data: [1, 10, 100, 1000] },
        ],
        yaxis: [
          { seriesName: 'A', alignZero: true },
          { seriesName: 'B', alignZero: true, logarithmic: true, opposite: true },
        ],
      })

      const { minYArr, maxYArr } = chart.getState()
      // B is logarithmic, so its min should remain positive (not extended negative)
      expect(minYArr[1]).toBeGreaterThan(0)
      // A should not have been forced to align because B opted out
      expect(maxYArr[0]).toBeGreaterThanOrEqual(15)
    })
  })
})
