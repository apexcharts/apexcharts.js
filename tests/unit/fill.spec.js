import { describe, it, expect } from 'vitest'
import { createChart, createChartWithOptions } from './utils/utils.js'
import Fill from '../../src/modules/Fill.js'

function getFill(chart) {
  return new Fill(chart.w)
}

describe('Fill — getSeriesIndex()', () => {
  it('returns seriesNumber modulo series length for a standard bar chart', () => {
    const chart = createChart('bar', [
      { data: [1, 2, 3] },
      { data: [4, 5, 6] },
    ])
    const fill = getFill(chart)
    // 2 series → modulo 2
    expect(fill.getSeriesIndex({ seriesNumber: 0 })).toBe(0)
    expect(fill.getSeriesIndex({ seriesNumber: 1 })).toBe(1)
    // wraps: 3 % 2 = 1
    expect(fill.getSeriesIndex({ seriesNumber: 3 })).toBe(1)
  })

  it('returns seriesNumber directly for distributed bar (no modulo)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      plotOptions: { bar: { distributed: true } },
      series: [{ data: [1, 2, 3] }],
    })
    const fill = getFill(chart)
    expect(fill.getSeriesIndex({ seriesNumber: 0 })).toBe(0)
    expect(fill.getSeriesIndex({ seriesNumber: 2 })).toBe(2)
    expect(fill.getSeriesIndex({ seriesNumber: 5 })).toBe(5)
  })

  it('returns seriesNumber directly for heatmap (no modulo)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap' },
      series: [
        { name: 'A', data: [{ x: 'Jan', y: 10 }] },
        { name: 'B', data: [{ x: 'Jan', y: 20 }] },
      ],
    })
    const fill = getFill(chart)
    expect(fill.getSeriesIndex({ seriesNumber: 1 })).toBe(1)
    expect(fill.getSeriesIndex({ seriesNumber: 0 })).toBe(0)
  })

  it('returns seriesNumber directly for treemap (no modulo)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'treemap' },
      series: [
        { name: 'A', data: [{ x: 'X', y: 10 }] },
        { name: 'B', data: [{ x: 'Y', y: 20 }] },
      ],
    })
    const fill = getFill(chart)
    expect(fill.getSeriesIndex({ seriesNumber: 0 })).toBe(0)
    expect(fill.getSeriesIndex({ seriesNumber: 1 })).toBe(1)
  })
})

describe('Fill — getFillType()', () => {
  it('returns a scalar fill type string when config is not an array', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      fill: { type: 'solid' },
      series: [{ data: [1, 2, 3] }],
    })
    const fill = getFill(chart)
    expect(fill.getFillType(0)).toBe('solid')
    expect(fill.getFillType(1)).toBe('solid') // same value for any index
  })

  it('returns per-series fill type when config is an array', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      fill: { type: ['solid', 'gradient', 'pattern'] },
      series: [{ data: [1, 2] }, { data: [3, 4] }, { data: [5, 6] }],
    })
    const fill = getFill(chart)
    expect(fill.getFillType(0)).toBe('solid')
    expect(fill.getFillType(1)).toBe('gradient')
    expect(fill.getFillType(2)).toBe('pattern')
  })
})

describe('Fill — computeColorStops()', () => {
  it('returns exactly 2 stops with correct structure', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    const stops = fill.computeColorStops([-10, 10], {
      threshold: 0,
      colorAboveThreshold: '#00ff00',
      colorBelowThreshold: '#ff0000',
    })
    expect(stops).toHaveLength(2)
    // first stop = above-threshold color
    expect(stops[0].color).toBe('#00ff00')
    // second stop = below-threshold color
    expect(stops[1].color).toBe('#ff0000')
    // second stop is always anchored at 0
    expect(stops[1].offset).toBe(0)
  })

  it('computes offset=50 for symmetric data around threshold=0', () => {
    // data: [-10, 10] → maxPositive=10, minNegative=-10
    // totalRange = 10 + 10 = 20
    // negativePercentage = 10/20 * 100 = 50
    // offset = 100 - 50 = 50
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    const stops = fill.computeColorStops([-10, 10], {
      threshold: 0,
      colorAboveThreshold: '#00ff00',
      colorBelowThreshold: '#ff0000',
    })
    expect(stops[0].offset).toBe(50)
  })

  it('clamps offset to 100 when all data is above threshold', () => {
    // no negatives → minNegative = threshold = 0
    // negativePercentage = 0 → offset = 100
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    const stops = fill.computeColorStops([1, 2, 3], {
      threshold: 0,
      colorAboveThreshold: '#00ff00',
      colorBelowThreshold: '#ff0000',
    })
    expect(stops[0].offset).toBe(100)
  })

  it('clamps offset to 0 when all data is below threshold', () => {
    // no positives → maxPositive = threshold = 0
    // negativePercentage = 100 → offset = 0
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    const stops = fill.computeColorStops([-3, -2, -1], {
      threshold: 0,
      colorAboveThreshold: '#00ff00',
      colorBelowThreshold: '#ff0000',
    })
    expect(stops[0].offset).toBe(0)
  })

  it('handles totalRange=0 (all values equal threshold) without dividing by zero', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    // threshold=5, only value=5 → both maxPositive=5, minNegative=5
    // totalRange = (5-5) + (5-5) = 0 → guarded to 1
    expect(() =>
      fill.computeColorStops([5], {
        threshold: 5,
        colorAboveThreshold: '#00ff00',
        colorBelowThreshold: '#ff0000',
      })
    ).not.toThrow()
  })

  it('computes correct offset for asymmetric data (more negative range)', () => {
    // data: [-100, 10] with threshold=0
    // maxPositive=10, minNegative=-100
    // totalRange = 10 + 100 = 110
    // negativePercentage = 100/110 * 100 ≈ 90.91
    // offset = 100 - 90.91 ≈ 9.09
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    const stops = fill.computeColorStops([-100, 10], {
      threshold: 0,
      colorAboveThreshold: '#00ff00',
      colorBelowThreshold: '#ff0000',
    })
    expect(stops[0].offset).toBeCloseTo(9.09, 1)
  })

  it('uses non-zero threshold correctly', () => {
    // data: [3, 7] threshold=5 → maxPositive=7, minNegative=3
    // totalRange = (7-5) + (5-3) = 2 + 2 = 4
    // negativePercentage = (5-3)/4 * 100 = 50
    // offset = 50
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    const stops = fill.computeColorStops([3, 7], {
      threshold: 5,
      colorAboveThreshold: '#blue',
      colorBelowThreshold: '#red',
    })
    expect(stops[0].offset).toBe(50)
  })
})

describe('Fill — getFillColors()', () => {
  it('returns the fill colors array for a bar chart', () => {
    const chart = createChart('bar', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    fill.opts = {}
    fill.seriesIndex = 0

    const colors = fill.getFillColors()
    expect(Array.isArray(colors)).toBe(true)
    expect(colors.length).toBeGreaterThan(0)
    // fill colors should be valid color strings
    expect(typeof colors[0]).toBe('string')
    expect(colors[0].length).toBeGreaterThan(0)
  })

  it('returns stroke colors for a line chart (lines use stroke not fill)', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    fill.opts = {}
    fill.seriesIndex = 0

    const colors = fill.getFillColors()
    expect(Array.isArray(colors)).toBe(true)
    expect(colors.length).toBeGreaterThan(0)
  })

  it('opts.fillColors array overrides config fill colors', () => {
    const chart = createChart('bar', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    fill.opts = { fillColors: ['#CUSTOM1', '#CUSTOM2'] }
    fill.seriesIndex = 0

    const colors = fill.getFillColors()
    // Override must be the exact values passed in
    expect(colors).toEqual(['#CUSTOM1', '#CUSTOM2'])
  })

  it('scalar opts.fillColors string is wrapped into an array', () => {
    const chart = createChart('bar', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)
    fill.opts = { fillColors: '#single' }
    fill.seriesIndex = 0

    const colors = fill.getFillColors()
    expect(Array.isArray(colors)).toBe(true)
    expect(colors).toEqual(['#single'])
  })
})

describe('Fill — fillPath() solid fill', () => {
  it('solid fill returns an rgba() color string for a bar chart', () => {
    const chart = createChart('bar', [{ data: [1, 2, 3] }])
    const fill = getFill(chart)

    const result = fill.fillPath({
      seriesNumber: 0,
      fillColors: ['#ff0000'],
      fillType: 'solid',
    })

    // Must be a string, not a url(#gradient...)
    expect(typeof result).toBe('string')
    expect(result).not.toMatch(/^url\(/)
    // Should contain the supplied color in some form (rgba, hex, or original)
    expect(result.toLowerCase()).toMatch(/rgba|#|red/)
  })

  it('opts.solid=true forces solid fill even when fillType is gradient', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      fill: { type: 'gradient' },
      series: [{ data: [1, 2, 3] }],
    })
    const fill = getFill(chart)

    const result = fill.fillPath({
      seriesNumber: 0,
      fillColors: ['#336699'],
      solid: true,
    })

    // solid override must give a color value, not a url(#gradient...)
    expect(result).not.toMatch(/^url\(/)
    expect(typeof result).toBe('string')
  })

  it('gradient fill returns a url(#...) string reference', () => {
    const chart = createChartWithOptions({
      chart: { type: 'area' },
      fill: { type: 'gradient' },
      series: [{ data: [1, 2, 3] }],
    })
    const fill = getFill(chart)

    const result = fill.fillPath({
      seriesNumber: 0,
      fillColors: ['#336699'],
      fillType: 'gradient',
    })

    // fillPath returns the gradientFill which is a url(#...) string from drawGradient
    const resultStr = typeof result === 'string' ? result : String(result)
    expect(resultStr).toMatch(/url\(#/)
  })
})
