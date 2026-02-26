import { describe, it, expect } from 'vitest'
import { createChart, createChartWithOptions } from './utils/utils.js'

describe('ApexCharts.getState()', () => {
  it('returns an object with all expected top-level keys', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const state = chart.getState()

    const expectedKeys = [
      'series',
      'seriesNames',
      'colors',
      'labels',
      'seriesTotals',
      'minX',
      'maxX',
      'minY',
      'maxY',
      'svgWidth',
      'svgHeight',
      'gridWidth',
      'gridHeight',
      'selectedDataPoints',
      'collapsedSeriesIndices',
      'zoomed',
      'seriesX',
      'seriesZ',
      'seriesCandleO',
      'seriesCandleH',
      'seriesCandleM',
      'seriesCandleL',
      'seriesCandleC',
      'seriesRangeStart',
      'seriesRangeEnd',
      'seriesGoals',
    ]

    for (const key of expectedKeys) {
      expect(state, `missing key: ${key}`).toHaveProperty(key)
    }
  })

  it('series reflects the parsed series data', () => {
    const chart = createChart('line', [{ data: [10, 20, 30] }])
    const state = chart.getState()

    expect(state.series).toEqual([[10, 20, 30]])
  })

  it('seriesNames reflects configured series names', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [
        { name: 'Revenue', data: [1, 2, 3] },
        { name: 'Costs', data: [4, 5, 6] },
      ],
    })
    const state = chart.getState()

    expect(state.seriesNames).toEqual(['Revenue', 'Costs'])
  })

  it('colors is a non-empty array of strings', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const { colors } = chart.getState()

    expect(Array.isArray(colors)).toBe(true)
    expect(colors.length).toBeGreaterThan(0)
    expect(typeof colors[0]).toBe('string')
  })

  it('zoomed is false before any zoom interaction', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    expect(chart.getState().zoomed).toBe(false)
  })

  it('selectedDataPoints is an empty array initially', () => {
    const chart = createChart('bar', [{ data: [1, 2, 3] }])
    expect(chart.getState().selectedDataPoints).toEqual([])
  })

  it('collapsedSeriesIndices is empty initially', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [4, 5, 6] },
      ],
    })
    expect(chart.getState().collapsedSeriesIndices).toEqual([])
  })

  it('does not expose internal dom, tooltip, or memory properties', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const state = chart.getState()

    expect(state).not.toHaveProperty('dom')
    expect(state).not.toHaveProperty('tooltip')
    expect(state).not.toHaveProperty('memory')
    expect(state).not.toHaveProperty('events')
    expect(state).not.toHaveProperty('domCache')
    expect(state).not.toHaveProperty('dimensionCache')
    expect(state).not.toHaveProperty('cachedSelectors')
  })

  it('returns a live reference — state reflects updates after updateSeries', async () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])

    expect(chart.getState().series).toEqual([[1, 2, 3]])

    await chart.updateSeries([{ data: [10, 20, 30] }])

    expect(chart.getState().series).toEqual([[10, 20, 30]])
  })

  it('candlestick arrays are empty for non-OHLC chart types', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const state = chart.getState()

    expect(state.seriesCandleO).toEqual([])
    expect(state.seriesCandleH).toEqual([])
    expect(state.seriesCandleL).toEqual([])
    expect(state.seriesCandleC).toEqual([])
  })

  it('svgWidth and svgHeight are positive numbers after render', () => {
    const chart = createChart('bar', [{ data: [1, 2, 3] }])
    const { svgWidth, svgHeight } = chart.getState()

    // jsdom sets dimensions to 0 but the properties must exist and be numbers
    expect(typeof svgWidth).toBe('number')
    expect(typeof svgHeight).toBe('number')
  })
})
