import { createChartWithOptions } from './utils/utils.js'
import {
  binCounts,
  binIndexOf,
  computeBinning,
  normalizeCounts,
  quantileSorted,
  rowsForBin,
  widthForRule,
} from '../../src/charts/common/Binning'

// `chart.type: 'histogram'` takes raw observations and bins them into one
// column per bin, rendering through the bar pathway.

/** A deterministic, mildly skewed sample. */
function sample(n = 200) {
  const out = []
  let seed = 7
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647
    out.push((seed % 1000) / 10)
  }
  return out
}

function histChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'histogram', width: 600, height: 400, ...opts.chart },
    series: opts.series || [{ name: 'Sample', data: sample() }],
    ...(opts.plotOptions ? { plotOptions: opts.plotOptions } : {}),
    ...opts.extra,
  })
}

describe('Binning — bin edges', () => {
  test('edges tile the data extent exactly, with no partial last bin', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const b = computeBinning(values, { bins: 4 })
    expect(b.edges.length).toBe(5)
    expect(b.edges[0]).toBe(1)
    expect(b.edges[4]).toBe(10)
    // uniform
    const w = b.edges[1] - b.edges[0]
    for (let k = 1; k < b.edges.length; k++) {
      expect(b.edges[k] - b.edges[k - 1]).toBeCloseTo(w, 10)
    }
  })

  test('every observation lands in exactly one bin (counts sum to n)', () => {
    const values = sample(500)
    const b = computeBinning(values)
    const counts = binCounts(values, b.edges)
    expect(counts.reduce((a, c) => a + c, 0)).toBe(500)
  })

  test('the maximum observation falls in the last bin, not outside it', () => {
    const values = [0, 1, 2, 3, 9.999999999]
    const b = computeBinning(values, { bins: 3 })
    expect(binIndexOf(9.999999999, b.edges)).toBe(2)
    expect(binCounts(values, b.edges).reduce((a, c) => a + c, 0)).toBe(5)
  })

  test('bins are half-open [lo, hi) so a boundary value is not double counted', () => {
    const b = computeBinning([0, 10], { bins: 2 })
    expect(b.edges).toEqual([0, 5, 10])
    expect(binIndexOf(5, b.edges)).toBe(1)
    expect(binIndexOf(4.999, b.edges)).toBe(0)
  })

  test('binWidth wins over bins', () => {
    const b = computeBinning([0, 100], { bins: 3, binWidth: 25 })
    expect(b.rule).toBe('binWidth')
    expect(b.edges.length).toBe(5)
  })

  test('range frames the axis independently of the data', () => {
    const b = computeBinning([40, 50, 60], { range: [0, 100], bins: 10 })
    expect(b.edges[0]).toBe(0)
    expect(b.edges[b.edges.length - 1]).toBe(100)
    // values outside a narrower range are dropped rather than clamped
    const narrow = computeBinning([1, 2, 3, 99], { range: [0, 10], bins: 2 })
    expect(binCounts([1, 2, 3, 99], narrow.edges).reduce((a, c) => a + c, 0)).toBe(3)
  })

  test('an all-identical sample produces one drawable bin, not a divide by zero', () => {
    const b = computeBinning([5, 5, 5, 5])
    expect(b.edges.length).toBe(2)
    expect(b.binWidth).toBeGreaterThan(0)
    expect(binCounts([5, 5, 5, 5], b.edges)).toEqual([4])
  })

  test('a single observation still bins', () => {
    const b = computeBinning([42])
    expect(b.edges.length).toBe(2)
    expect(binCounts([42], b.edges)).toEqual([1])
  })

  test('empty input returns null rather than throwing', () => {
    expect(computeBinning([])).toBeNull()
    expect(computeBinning(null)).toBeNull()
  })

  test('an absurd bin count is capped instead of hanging the render', () => {
    const b = computeBinning([0, 1], { bins: 100000 })
    expect(b.capped).toBe(true)
    expect(b.edges.length - 1).toBeLessThanOrEqual(1000)
  })
})

describe('Binning — rules', () => {
  test('quantileSorted interpolates between ranks', () => {
    expect(quantileSorted([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(quantileSorted([1, 2, 3, 4], 0.25)).toBe(1.75)
    expect(quantileSorted([7], 0.9)).toBe(7)
  })

  test('fd falls back to sturges when the IQR is 0', () => {
    // 90% identical values: IQR collapses, FD width would be 0
    const values = new Array(100).fill(5).concat([1, 9])
    const sorted = values.slice().sort((a, b) => a - b)
    const r = widthForRule(sorted, 8, 'fd')
    expect(r.rule).toBe('sturges')
    expect(r.width).toBeGreaterThan(0)
  })

  test('auto picks the narrower of fd and sturges', () => {
    const values = sample(1000)
    const sorted = values.slice().sort((a, b) => a - b)
    const span = sorted[sorted.length - 1] - sorted[0]
    const auto = widthForRule(sorted, span, 'auto')
    const fd = widthForRule(sorted, span, 'fd')
    const sturges = widthForRule(sorted, span, 'sturges')
    expect(auto.width).toBeCloseTo(Math.min(fd.width, sturges.width), 10)
  })

  test('scott falls back to sturges on zero variance', () => {
    const sorted = new Array(50).fill(3)
    expect(widthForRule(sorted, 1, 'scott').rule).toBe('sturges')
  })

  test('more data means more bins under every rule', () => {
    for (const rule of ['auto', 'fd', 'sturges', 'scott', 'rice', 'sqrt']) {
      const small = computeBinning(sample(50), { bins: rule })
      const large = computeBinning(sample(5000), { bins: rule })
      expect(large.edges.length).toBeGreaterThan(small.edges.length)
    }
  })
})

describe('Binning — normalize and cumulative', () => {
  test('relative sums to 100', () => {
    const out = normalizeCounts([1, 2, 3, 4], { normalize: 'relative' })
    expect(out.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 10)
  })

  test('density integrates to 1 over the bins', () => {
    const counts = [2, 5, 3]
    const binWidth = 4
    const out = normalizeCounts(counts, { normalize: 'density', binWidth })
    const area = out.reduce((a, b) => a + b * binWidth, 0)
    expect(area).toBeCloseTo(1, 10)
  })

  test('cumulative is monotonic and ends at the total', () => {
    const out = normalizeCounts([3, 1, 4, 2], { cumulative: true })
    expect(out).toEqual([3, 4, 8, 10])
  })

  test('an all-zero histogram does not divide by zero', () => {
    expect(normalizeCounts([0, 0], { normalize: 'relative' })).toEqual([0, 0])
    expect(normalizeCounts([0, 0], { normalize: 'density', binWidth: 1 })).toEqual([0, 0])
  })
})

describe('Binning — rowsForBin (the aggregate-to-rows hook)', () => {
  test('recovers exactly the observations behind a bar', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const b = computeBinning(values, { bins: 2 })
    const first = rowsForBin(values, b.edges, 0)
    const second = rowsForBin(values, b.edges, 1)
    expect(first.concat(second).sort((x, y) => x - y)).toEqual(values)
    // and the partition matches what the bar heights claimed
    const counts = binCounts(values, b.edges)
    expect(first.length).toBe(counts[0])
    expect(second.length).toBe(counts[1])
  })

  test('an out-of-range bin index yields no rows rather than throwing', () => {
    const b = computeBinning([1, 2, 3], { bins: 2 })
    expect(rowsForBin([1, 2, 3], b.edges, -1)).toEqual([])
    expect(rowsForBin([1, 2, 3], b.edges, 99)).toEqual([])
  })
})

describe('histogram chart type', () => {
  test('renders one bar per bin', () => {
    const chart = histChart({ plotOptions: { histogram: { bins: 8 } } })
    const bars = document.querySelectorAll('.apexcharts-bar-area')
    expect(bars.length).toBe(8)
    expect(chart.w.histogramData.edges.length).toBe(9)
  })

  test('normalizes to the bar renderer but remembers it was asked for a histogram', () => {
    const chart = histChart()
    expect(chart.w.config.chart.type).toBe('bar')
    expect(chart.w.config.chart.requestedType).toBe('histogram')
  })

  test('bar heights are the bin counts, and they sum to the sample size', () => {
    const values = sample(300)
    const chart = histChart({
      series: [{ name: 'S', data: values }],
      plotOptions: { histogram: { bins: 10 } },
    })
    const counts = chart.w.histogramData.counts[0]
    expect(counts.reduce((a, c) => a + c, 0)).toBe(300)
    expect(chart.w.seriesData.series[0]).toEqual(counts)
  })

  test('the raw observations survive on the stash, so rows are recoverable', () => {
    const values = sample(120)
    const chart = histChart({
      series: [{ name: 'S', data: values }],
      plotOptions: { histogram: { bins: 6 } },
    })
    // config.series carries the binned rows (that is what got rendered), and
    // the sample itself lives on the stash: the row source a bar needs to name
    // the observations behind it.
    expect(chart.w.globals.histogramRawSeries[0].data).toEqual(values)
    const { edges, counts } = chart.w.histogramData
    for (let k = 0; k < counts[0].length; k++) {
      expect(rowsForBin(values, edges, k).length).toBe(counts[0][k])
    }
  })

  test('re-parsing bins the sample, never the counts', async () => {
    const values = sample(200)
    const chart = histChart({
      series: [{ name: 'S', data: values }],
      plotOptions: { histogram: { bins: 8 } },
    })
    const first = chart.w.histogramData.counts[0].slice()
    // A second parse (any re-render: resize, updateOptions, legend toggle)
    // must reproduce the same distribution, not bin the previous bar heights.
    await chart.updateOptions({ title: { text: 'again' } })
    expect(chart.w.histogramData.counts[0]).toEqual(first)
    expect(chart.w.histogramData.counts[0].reduce((a, c) => a + c, 0)).toBe(200)
  })

  test('appendData adds observations to the sample, not bars to the chart', async () => {
    const chart = histChart({
      series: [{ name: 'S', data: [1, 2, 3, 4] }],
      plotOptions: { histogram: { bins: 2, range: [0, 8] } },
    })
    const barsBefore = document.querySelectorAll('.apexcharts-bar-area').length
    await chart.appendData([{ data: [5, 6, 7, 8] }])
    expect(chart.w.histogramData.counts[0].reduce((a, c) => a + c, 0)).toBe(8)
    expect(document.querySelectorAll('.apexcharts-bar-area').length).toBe(barsBefore)
  })

  test('x values are bin midpoints', () => {
    const chart = histChart({
      series: [{ name: 'S', data: [0, 10] }],
      plotOptions: { histogram: { bins: 2 } },
    })
    const { edges } = chart.w.histogramData
    const xs = chart.w.seriesData.seriesX[0]
    expect(xs[0]).toBeCloseTo((edges[0] + edges[1]) / 2, 10)
    expect(xs[1]).toBeCloseTo((edges[1] + edges[2]) / 2, 10)
  })

  test('multiple series share one set of edges', () => {
    const chart = histChart({
      series: [
        { name: 'A', data: [1, 2, 3, 4, 5] },
        { name: 'B', data: [50, 60, 70] },
      ],
      plotOptions: { histogram: { bins: 5 } },
    })
    const { edges, counts } = chart.w.histogramData
    expect(counts.length).toBe(2)
    expect(edges[0]).toBe(1)
    expect(edges[edges.length - 1]).toBe(70)
    // both series are measured against the combined extent
    expect(chart.w.seriesData.seriesX[0].length).toBe(
      chart.w.seriesData.seriesX[1].length,
    )
  })

  test('object data ({ y }) is accepted as raw observations', () => {
    const chart = histChart({
      series: [{ name: 'S', data: [{ y: 1 }, { y: 2 }, { y: 3 }, { y: 4 }] }],
      plotOptions: { histogram: { bins: 2 } },
    })
    expect(chart.w.histogramData.counts[0].reduce((a, c) => a + c, 0)).toBe(4)
  })

  test('cumulative ends at the sample size', () => {
    const values = sample(150)
    const chart = histChart({
      series: [{ name: 'S', data: values }],
      plotOptions: { histogram: { bins: 10, cumulative: true } },
    })
    const ys = chart.w.seriesData.series[0]
    expect(ys[ys.length - 1]).toBe(150)
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1])
  })

  test('relative normalization sums to 100', () => {
    const chart = histChart({
      plotOptions: { histogram: { bins: 12, normalize: 'relative' } },
    })
    const ys = chart.w.seriesData.series[0]
    expect(ys.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6)
  })

  test('an explicit binWidth is honored end to end', () => {
    const chart = histChart({
      series: [{ name: 'S', data: [0, 25, 50, 75, 100] }],
      plotOptions: { histogram: { binWidth: 25 } },
    })
    expect(chart.w.histogramData.binWidth).toBeCloseTo(25, 10)
    expect(document.querySelectorAll('.apexcharts-bar-area').length).toBe(4)
  })

  test('the x-axis is numeric, not categorical', () => {
    const chart = histChart()
    expect(chart.w.config.xaxis.type).toBe('numeric')
  })

  test('an empty series renders without throwing', () => {
    const chart = histChart({ series: [{ name: 'S', data: [] }] })
    expect(chart.w.histogramData.edges).toEqual([])
  })

  test('non-numeric junk in the data is skipped, not counted', () => {
    const chart = histChart({
      series: [{ name: 'S', data: [1, null, 2, undefined, 3, NaN, 'x'] }],
      plotOptions: { histogram: { bins: 3 } },
    })
    expect(chart.w.histogramData.counts[0].reduce((a, c) => a + c, 0)).toBe(3)
  })

  test('updateSeries re-bins from the new raw values', async () => {
    const chart = histChart({
      series: [{ name: 'S', data: [1, 2, 3, 4] }],
      plotOptions: { histogram: { bins: 2 } },
    })
    expect(chart.w.histogramData.counts[0].reduce((a, c) => a + c, 0)).toBe(4)
    await chart.updateSeries([{ name: 'S', data: [1, 2, 3, 4, 5, 6, 7, 8] }])
    expect(chart.w.histogramData.counts[0].reduce((a, c) => a + c, 0)).toBe(8)
    expect(chart.w.globals.histogramRawSeries[0].data.length).toBe(8)
    // the chart still shows the bins it was asked for, not one bar per value
    expect(chart.w.config.series[0].data.length).toBe(2)
  })

  test('re-rendering the same config bins identically (no drift)', () => {
    const values = sample(200)
    const a = histChart({ series: [{ name: 'S', data: values }] })
    const first = a.w.histogramData.edges.slice()
    const b = histChart({ series: [{ name: 'S', data: values }] })
    expect(b.w.histogramData.edges).toEqual(first)
  })

  test('non-histogram charts leave the slice empty', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 400 },
      series: [{ name: 'S', data: [1, 2, 3] }],
    })
    expect(chart.w.histogramData.edges).toEqual([])
    expect(chart.w.config.chart.requestedType).toBeUndefined()
  })
})
