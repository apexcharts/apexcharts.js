import { createChartWithOptions } from './utils/utils.js'
import { fiveNumberSummary, kernelDensity } from '../../src/charts/common/Stats'
import {
  registerSeriesTransform,
  unregisterSeriesTransform,
} from '../../src/modules/SeriesTransformRegistry'
import { boxPlotTransform, violinTransform } from '../../src/features/stats'

// `apexcharts/features/stats` lets boxPlot and violin take the SAMPLE instead
// of a precomputed summary or density. Both previously required the caller to
// do the statistics that give the chart its meaning.

/** A deterministic sample with a long right tail (so Tukey finds outliers). */
function skewed(n = 60) {
  const out = []
  let seed = 11
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647
    out.push(10 + (seed % 200) / 10)
  }
  out.push(120, 140) // two clear outliers
  return out
}

describe('Stats: five-number summary', () => {
  test('quartiles interpolate between ranks (R type 7)', () => {
    const s = fiveNumberSummary([1, 2, 3, 4, 5, 6, 7, 8])
    expect(s.summary[0]).toBe(1) // min
    expect(s.summary[1]).toBeCloseTo(2.75, 10) // q1
    expect(s.summary[2]).toBeCloseTo(4.5, 10) // median
    expect(s.summary[3]).toBeCloseTo(6.25, 10) // q3
    expect(s.summary[4]).toBe(8) // max
  })

  test('the summary is monotonic for any sample', () => {
    const s = fiveNumberSummary(skewed())
    for (let i = 1; i < 5; i++) {
      expect(s.summary[i]).toBeGreaterThanOrEqual(s.summary[i - 1])
    }
  })

  test('minmax whiskers hide nothing', () => {
    const values = skewed()
    const s = fiveNumberSummary(values, { whiskers: 'minmax' })
    expect(s.summary[4]).toBe(Math.max(...values))
    expect(s.outliers).toEqual([])
  })

  test('tukey whiskers stop at the fence and report what is beyond', () => {
    const values = skewed()
    const s = fiveNumberSummary(values, { whiskers: 'tukey' })
    expect(s.summary[4]).toBeLessThan(Math.max(...values))
    expect(s.outliers).toContain(140)
    // the fence itself is 1.5 IQR past q3
    expect(s.summary[4]).toBeLessThanOrEqual(s.summary[3] + 1.5 * s.iqr)
  })

  test('tukey degrades to minmax when the IQR is 0', () => {
    const values = new Array(20).fill(4).concat([9])
    const s = fiveNumberSummary(values, { whiskers: 'tukey' })
    expect(s.summary[4]).toBe(9)
    expect(s.outliers).toEqual([])
  })

  test('a single observation summarises to itself', () => {
    const s = fiveNumberSummary([7])
    expect(s.summary).toEqual([7, 7, 7, 7, 7])
  })

  test('empty input returns null rather than throwing', () => {
    expect(fiveNumberSummary([])).toBeNull()
    expect(fiveNumberSummary(null)).toBeNull()
  })
})

describe('Stats: kernel density', () => {
  test('the density is a value/weight pair list spanning the sample', () => {
    const values = [10, 12, 14, 16, 18, 20]
    const { density } = kernelDensity(values, { resolution: 32 })
    expect(density.length).toBe(32)
    expect(density[0][0]).toBeLessThan(10) // padded below the minimum
    expect(density[31][0]).toBeGreaterThan(20) // and above the maximum
    density.forEach(([, wt]) => expect(wt).toBeGreaterThanOrEqual(0))
  })

  test('it integrates to about 1 (it is a density, not a count)', () => {
    const values = skewed(200)
    const { density } = kernelDensity(values, { resolution: 256 })
    const step = density[1][0] - density[0][0]
    const area = density.reduce((a, [, wt]) => a + wt * step, 0)
    expect(area).toBeGreaterThan(0.95)
    expect(area).toBeLessThan(1.05)
  })

  test('the peak sits near the densest part of the sample', () => {
    // 100 observations at 50, a handful at 10
    const values = new Array(100).fill(50).concat([10, 11, 12])
    const { density } = kernelDensity(values)
    const peak = density.reduce((best, d) => (d[1] > best[1] ? d : best))
    expect(peak[0]).toBeGreaterThan(40)
    expect(peak[0]).toBeLessThan(60)
  })

  test('a wider bandwidth flattens the curve', () => {
    const values = skewed(100)
    const narrow = kernelDensity(values, { bandwidth: 1 })
    const wide = kernelDensity(values, { bandwidth: 20 })
    const peakOf = (d) => Math.max(...d.density.map(([, w]) => w))
    expect(peakOf(wide)).toBeLessThan(peakOf(narrow))
  })

  test('an all-identical sample yields a spike, not a divide by zero', () => {
    const { density } = kernelDensity([5, 5, 5, 5])
    expect(density.length).toBe(3)
    expect(density[1][0]).toBe(5)
    expect(density[1][1]).toBeGreaterThan(0)
    density.forEach(([v, wt]) => {
      expect(Number.isFinite(v)).toBe(true)
      expect(Number.isFinite(wt)).toBe(true)
    })
  })

  test('empty input returns null rather than throwing', () => {
    expect(kernelDensity([])).toBeNull()
    expect(kernelDensity(null)).toBeNull()
  })
})

describe('boxPlot from raw observations', () => {
  // A box is drawn as two rects (q1 to median, median to q3), so the element
  // count is twice the number of boxes.
  const boxCount = () =>
    document.querySelectorAll('.apexcharts-boxPlot-area').length / 2

  function boxChart(data, plotOptions) {
    return createChartWithOptions({
      chart: { type: 'boxPlot', width: 600, height: 400 },
      series: [{ name: 'A', data }],
      ...(plotOptions ? { plotOptions } : {}),
    })
  }

  test('a datum with only points renders a box', () => {
    const chart = boxChart([{ x: 'G1', points: skewed() }])
    expect(boxCount()).toBe(1)
    const expected = fiveNumberSummary(skewed()).summary
    expect(chart.w.candleData.seriesCandleO[0][0]).toBeCloseTo(expected[0], 8)
    expect(chart.w.candleData.seriesCandleC[0][0]).toBeCloseTo(expected[4], 8)
  })

  test('a precomputed five-number y is left exactly as given', () => {
    const chart = boxChart([{ x: 'G1', y: [10, 20, 40, 50, 70] }])
    expect(chart.w.config.series[0].data[0].y).toEqual([10, 20, 40, 50, 70])
  })

  test('a precomputed summary wins even when points are also supplied', () => {
    // points are the jitter dots there, not a summary to recompute
    const chart = boxChart([
      { x: 'G1', y: [10, 20, 40, 50, 70], points: [1, 2, 3, 999] },
    ])
    expect(chart.w.config.series[0].data[0].y).toEqual([10, 20, 40, 50, 70])
  })

  test('whiskers: tukey shortens the whisker on a tailed sample', () => {
    const minmax = boxChart([{ x: 'G1', points: skewed() }])
    const tukey = boxChart([{ x: 'G1', points: skewed() }], {
      boxPlot: { whiskers: 'tukey' },
    })
    expect(tukey.w.candleData.seriesCandleC[0][0]).toBeLessThan(
      minmax.w.candleData.seriesCandleC[0][0],
    )
  })

  test('the derived summary survives a re-render (no drift)', async () => {
    const chart = boxChart([{ x: 'G1', points: skewed() }])
    const first = chart.w.candleData.seriesCandleO[0][0]
    await chart.updateOptions({ title: { text: 'again' } })
    expect(chart.w.candleData.seriesCandleO[0][0]).toBe(first)
  })

  test('changing the whisker rule re-derives the summary', async () => {
    // The transform writes its result back into config.series, so a second pass
    // sees a five-number y. It must still recognise its own work as derived,
    // otherwise the statistic freezes at whatever the first render produced and
    // this option is inert after mount.
    const chart = boxChart([{ x: 'G1', points: skewed() }])
    const minmaxTop = chart.w.candleData.seriesCandleC[0][0]

    await chart.updateOptions({ plotOptions: { boxPlot: { whiskers: 'tukey' } } })
    const tukeyTop = chart.w.candleData.seriesCandleC[0][0]
    expect(tukeyTop).toBeLessThan(minmaxTop)

    await chart.updateOptions({
      plotOptions: { boxPlot: { whiskers: 'minmax' } },
    })
    expect(chart.w.candleData.seriesCandleC[0][0]).toBe(minmaxTop)
  })

  test('a user-supplied summary is still never recomputed on update', async () => {
    const chart = boxChart([
      { x: 'G1', y: [10, 20, 40, 50, 70], points: [1, 2, 3, 999] },
    ])
    await chart.updateOptions({ plotOptions: { boxPlot: { whiskers: 'tukey' } } })
    expect(chart.w.config.series[0].data[0].y).toEqual([10, 20, 40, 50, 70])
  })

  test('mixed data: one datum summarised, one precomputed', () => {
    const chart = boxChart([
      { x: 'G1', points: [1, 2, 3, 4, 5] },
      { x: 'G2', y: [10, 20, 30, 40, 50] },
    ])
    expect(boxCount()).toBe(2)
    expect(chart.w.candleData.seriesCandleO[0][1]).toBe(10)
  })

  test('without the feature, precomputed boxPlots still work', () => {
    unregisterSeriesTransform('boxPlot')
    try {
      const chart = boxChart([{ x: 'G1', y: [10, 20, 40, 50, 70] }])
      expect(boxCount()).toBe(1)
      expect(chart.w.candleData.seriesCandleO[0][0]).toBe(10)
    } finally {
      registerSeriesTransform('boxPlot', boxPlotTransform)
    }
  })
})

describe('violin from raw observations', () => {
  function violinChart(data, plotOptions) {
    return createChartWithOptions({
      chart: { type: 'violin', width: 600, height: 400 },
      series: [{ name: 'A', data }],
      ...(plotOptions ? { plotOptions } : {}),
    })
  }

  test('a datum with only points renders a violin', () => {
    violinChart([{ x: 'G1', points: skewed() }])
    expect(document.querySelectorAll('.apexcharts-violin-area').length).toBe(1)
  })

  test('a flat number array as y is read as observations', () => {
    const chart = violinChart([{ x: 'G1', y: skewed() }])
    const density = chart.w.violinData.seriesViolinDensity[0][0]
    expect(density.values.length).toBeGreaterThan(8)
    expect(density.maxWeight).toBeGreaterThan(0)
  })

  test('a precomputed density is left exactly as given', () => {
    const density = [
      [1, 0],
      [2, 1],
      [3, 0],
    ]
    const chart = violinChart([{ x: 'G1', y: { density, points: [1, 2, 3] } }])
    expect(chart.w.violinData.seriesViolinDensity[0][0].values).toEqual([1, 2, 3])
  })

  test('kde.resolution controls the sample count', () => {
    const chart = violinChart([{ x: 'G1', points: skewed() }], {
      violin: { kde: { resolution: 24 } },
    })
    expect(chart.w.violinData.seriesViolinDensity[0][0].values.length).toBe(24)
  })

  test('the observations are kept for the jitter dots', () => {
    const values = skewed()
    const chart = violinChart([{ x: 'G1', points: values }], {
      violin: { points: { show: true } },
    })
    expect(chart.w.violinData.seriesViolinPoints[0][0].length).toBe(values.length)
    expect(
      document.querySelectorAll('.apexcharts-violin-points').length,
    ).toBe(1)
  })

  test('the derived density survives a re-render (no drift)', async () => {
    const chart = violinChart([{ x: 'G1', points: skewed() }])
    const first = chart.w.violinData.seriesViolinDensity[0][0].maxWeight
    await chart.updateOptions({ title: { text: 'again' } })
    expect(chart.w.violinData.seriesViolinDensity[0][0].maxWeight).toBe(first)
  })

  test('changing the bandwidth re-estimates the density', async () => {
    const chart = violinChart([{ x: 'G1', points: skewed() }])
    const auto = chart.w.violinData.seriesViolinDensity[0][0].maxWeight

    await chart.updateOptions({
      plotOptions: { violin: { kde: { bandwidth: 20 } } },
    })
    // a much wider kernel spreads the same mass over more values
    expect(chart.w.violinData.seriesViolinDensity[0][0].maxWeight).toBeLessThan(
      auto,
    )
  })

  test('a user-supplied density is still never recomputed on update', async () => {
    const density = [
      [1, 0],
      [2, 1],
      [3, 0],
    ]
    const chart = violinChart([{ x: 'G1', y: { density, points: [1, 2, 3] } }])
    await chart.updateOptions({
      plotOptions: { violin: { kde: { bandwidth: 5 } } },
    })
    expect(chart.w.violinData.seriesViolinDensity[0][0].values).toEqual([1, 2, 3])
  })

  test('without the feature, precomputed violins still work', () => {
    unregisterSeriesTransform('violin')
    try {
      const density = [
        [1, 0],
        [2, 1],
        [3, 0],
      ]
      violinChart([{ x: 'G1', y: { density, points: [] } }])
      expect(document.querySelectorAll('.apexcharts-violin-area').length).toBe(1)
    } finally {
      registerSeriesTransform('violin', violinTransform)
    }
  })
})
