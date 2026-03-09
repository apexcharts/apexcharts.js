import { describe, it, expect, vi } from 'vitest'
import { createChart, createChartWithOptions } from './utils/utils.js'
import Series from '../../src/modules/Series.js'

function getSeries(chart) {
  return chart.series
}

describe('Series — static addCollapsedClassToSeries()', () => {
  it('adds collapsed class when series index is in collapsedSeries', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w

    const mockNode = { classList: { add: vi.fn() } }
    const mockElSeries = { node: mockNode }

    w.globals.collapsedSeries = [{ index: 0 }]
    w.globals.ancillaryCollapsedSeries = []

    Series.addCollapsedClassToSeries(w, mockElSeries, 0)

    expect(mockNode.classList.add).toHaveBeenCalledWith('apexcharts-series-collapsed')
  })

  it('does NOT add class when the index is not in any collapsed list', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w

    const mockNode = { classList: { add: vi.fn() } }
    const mockElSeries = { node: mockNode }

    w.globals.collapsedSeries = [{ index: 1 }]
    w.globals.ancillaryCollapsedSeries = []

    Series.addCollapsedClassToSeries(w, mockElSeries, 0) // index 0 ≠ 1

    expect(mockNode.classList.add).not.toHaveBeenCalled()
  })

  it('checks ancillaryCollapsedSeries as well as collapsedSeries', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w

    const mockNode = { classList: { add: vi.fn() } }
    const mockElSeries = { node: mockNode }

    w.globals.collapsedSeries = []
    w.globals.ancillaryCollapsedSeries = [{ index: 2 }]

    Series.addCollapsedClassToSeries(w, mockElSeries, 2)

    expect(mockNode.classList.add).toHaveBeenCalledWith('apexcharts-series-collapsed')
  })

  it('does NOT add class when index matches neither list', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w

    const mockNode = { classList: { add: vi.fn() } }
    const mockElSeries = { node: mockNode }

    w.globals.collapsedSeries = [{ index: 3 }]
    w.globals.ancillaryCollapsedSeries = [{ index: 4 }]

    Series.addCollapsedClassToSeries(w, mockElSeries, 0)

    expect(mockNode.classList.add).not.toHaveBeenCalled()
  })
})

describe('Series — emptyCollapsedSeries()', () => {
  it('clears data for the collapsed series index only', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [4, 5, 6] },
      ],
    })
    const w = chart.w
    const series = getSeries(chart)

    w.globals.collapsedSeriesIndices = [1]

    const input = [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [4, 5, 6] },
    ]
    const result = series.emptyCollapsedSeries(input)

    expect(result[0].data).toEqual([1, 2, 3]) // unchanged
    expect(result[1].data).toEqual([])         // collapsed → emptied
  })

  it('returns series unchanged when no indices are collapsed', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const series = getSeries(chart)

    w.globals.collapsedSeriesIndices = []

    const input = [{ name: 'A', data: [1, 2, 3] }]
    const result = series.emptyCollapsedSeries(input)

    expect(result[0].data).toEqual([1, 2, 3])
  })

  it('empties multiple collapsed indices', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [3, 4] },
        { name: 'C', data: [5, 6] },
      ],
    })
    const w = chart.w
    const series = getSeries(chart)

    w.globals.collapsedSeriesIndices = [0, 2]

    const input = [
      { name: 'A', data: [1, 2] },
      { name: 'B', data: [3, 4] },
      { name: 'C', data: [5, 6] },
    ]
    const result = series.emptyCollapsedSeries(input)

    expect(result[0].data).toEqual([])   // collapsed
    expect(result[1].data).toEqual([3, 4]) // not collapsed
    expect(result[2].data).toEqual([])   // collapsed
  })
})

describe('Series — resetSeries()', () => {
  it('restores w.config.series to initialSeries data on reset', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w

    // Manually diverge config from initial
    w.globals.initialSeries = [{ name: undefined, data: [1, 2, 3] }]
    w.config.series = [{ name: undefined, data: [99, 88, 77] }]

    chart.series.resetSeries(false, false, true)

    expect(w.config.series[0].data).toEqual([1, 2, 3])
  })

  it('clears previousPaths on any reset', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    w.globals.previousPaths = [{ type: 'line', paths: [] }]

    chart.resetSeries(false) // shouldUpdateChart = false

    expect(w.globals.previousPaths).toEqual([])
  })

  it('clears collapsedSeries arrays when shouldResetCollapsed=true', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w

    w.globals.collapsedSeries = [{ index: 0 }]
    w.globals.collapsedSeriesIndices = [0]

    chart.resetSeries(false, false, true)

    expect(w.globals.collapsedSeries).toEqual([])
    expect(w.globals.collapsedSeriesIndices).toEqual([])
  })

  it('preserves collapsedSeriesIndices when shouldResetCollapsed=false', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [4, 5, 6] },
      ],
    })
    const w = chart.w

    w.globals.collapsedSeries = [{ index: 1, name: 'B', data: [] }]
    w.globals.collapsedSeriesIndices = [1]
    w.globals.ancillaryCollapsedSeries = []
    w.globals.ancillaryCollapsedSeriesIndices = []

    // Call with shouldUpdateChart=false so globals aren't reset by re-render
    chart.series.resetSeries(false, false, false)

    // shouldResetCollapsed=false → collapsedSeriesIndices must survive
    expect(w.globals.collapsedSeriesIndices).toEqual([1])
  })
})

describe('Series — setNullSeriesToZeroValues()', () => {
  it('fills an empty series with zeros to match the max-length series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [] },
      ],
    })
    const w = chart.w
    const series = getSeries(chart)

    w.globals.maxValsInArrayIndex = 0  // series 0 has 3 points

    const input = [[1, 2, 3], []]
    const result = series.setNullSeriesToZeroValues(input)

    expect(result[1]).toEqual([0, 0, 0])
  })

  it('leaves non-empty series unchanged', () => {
    const chart = createChart('line', [{ data: [5, 6, 7] }])
    const w = chart.w
    const series = getSeries(chart)

    w.globals.maxValsInArrayIndex = 0

    const input = [[5, 6, 7]]
    const result = series.setNullSeriesToZeroValues(input)

    expect(result[0]).toEqual([5, 6, 7])
  })
})

describe('Series — getActiveConfigSeriesIndex()', () => {
  it('returns 0 when there is only one series', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const series = getSeries(chart)

    expect(series.getActiveConfigSeriesIndex()).toBe(0)
  })

  it('skips collapsed series and returns the first non-collapsed index', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [] },       // collapsed / empty
        { name: 'B', data: [1, 2, 3] },
      ],
    })
    const w = chart.w
    const series = getSeries(chart)

    w.globals.collapsedSeriesIndices = [0]

    expect(series.getActiveConfigSeriesIndex()).toBe(1)
  })

  it('returns the last non-collapsed index when order="desc"', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [4, 5, 6] },
      ],
    })
    const w = chart.w
    const series = getSeries(chart)

    w.globals.collapsedSeriesIndices = []

    expect(series.getActiveConfigSeriesIndex('desc')).toBe(1)
  })
})

describe('Series — clearPreviousPaths()', () => {
  it('resets previousPaths to [] and sets allSeriesCollapsed=false', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const series = getSeries(chart)

    w.globals.previousPaths = ['something']
    w.globals.allSeriesCollapsed = true

    series.clearPreviousPaths()

    expect(w.globals.previousPaths).toEqual([])
    expect(w.globals.allSeriesCollapsed).toBe(false)
  })
})

describe('Series — clearSeriesCache()', () => {
  it('removes allSeriesEls and highlightSeriesEls keys but leaves other keys intact', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const series = getSeries(chart)

    w.globals.cachedSelectors = {
      allSeriesEls: [document.createElement('div')],
      highlightSeriesEls: [document.createElement('div')],
      other: 'keep-me',
    }

    series.clearSeriesCache()

    expect(w.globals.cachedSelectors.allSeriesEls).toBeUndefined()
    expect(w.globals.cachedSelectors.highlightSeriesEls).toBeUndefined()
    expect(w.globals.cachedSelectors.other).toBe('keep-me')
  })

  it('does not throw when cachedSelectors keys are already absent', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const series = getSeries(chart)

    w.globals.cachedSelectors = {}  // already empty

    expect(() => series.clearSeriesCache()).not.toThrow()
  })
})

describe('Series — getBarSeriesIndices()', () => {
  it('returns all indices for a non-combo bar chart', () => {
    const chart = createChart('bar', [
      { data: [1, 2, 3] },
      { data: [4, 5, 6] },
    ])
    const series = getSeries(chart)

    const indices = series.getBarSeriesIndices()

    expect(indices).toEqual([0, 1])
  })

  it('returns only bar/column type indices for a combo chart (excludes line)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { type: 'bar',    data: [1, 2, 3] },
        { type: 'line',   data: [4, 5, 6] },
        { type: 'column', data: [7, 8, 9] },
      ],
    })
    const w = chart.w
    const series = getSeries(chart)

    w.globals.comboCharts = true

    const indices = series.getBarSeriesIndices()

    expect(indices).toContain(0)     // bar  → included
    expect(indices).not.toContain(1) // line → excluded
    expect(indices).toContain(2)     // column → included
  })
})
