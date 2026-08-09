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
  const thresholdColors = {
    threshold: 0,
    colorAboveThreshold: '#00ff00',
    colorBelowThreshold: '#ff0000',
  }

  function stopsFor(axisRange, colors = thresholdColors) {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    return getFill(chart).computeColorStops(axisRange, colors)
  }

  it('returns exactly 2 stops sharing one offset, above-threshold color first', () => {
    const stops = stopsFor({ minY: -10, maxY: 10 })
    expect(stops).toHaveLength(2)
    expect(stops[0].color).toBe('#00ff00')
    expect(stops[1].color).toBe('#ff0000')
    // both stops sit on the boundary, giving a hard transition there without
    // depending on the SVG rule that clamps an out-of-order offset upwards
    expect(stops[1].offset).toBe(stops[0].offset)
  })

  it('computes offset=50 for an axis symmetric around threshold=0', () => {
    // (maxY - threshold) / (maxY - minY) = 10 / 20 = 50%
    expect(stopsFor({ minY: -10, maxY: 10 })[0].offset).toBe(50)
  })

  it('positions the boundary over the axis range, not the data range', () => {
    // Regression guard for #5209: the gradient spans the plot area, so an axis
    // that extends well past the data must push the boundary accordingly. A
    // data-range mapping would return 50 here regardless of the axis.
    expect(stopsFor({ minY: -500, maxY: 500 })[0].offset).toBe(50)
    expect(stopsFor({ minY: -100, maxY: 300 })[0].offset).toBe(75)
  })

  it('clamps to 100 when the threshold sits at or below the axis minimum', () => {
    expect(stopsFor({ minY: 0, maxY: 3 })[0].offset).toBe(100)
    expect(stopsFor({ minY: 5, maxY: 30 })[0].offset).toBe(100)
  })

  it('clamps to 0 when the threshold sits at or above the axis maximum', () => {
    expect(stopsFor({ minY: -3, maxY: 0 })[0].offset).toBe(0)
    expect(stopsFor({ minY: -30, maxY: -5 })[0].offset).toBe(0)
  })

  it('handles a flat axis (minY === maxY) without dividing by zero', () => {
    // whole plot on the above-threshold side
    expect(stopsFor({ minY: 5, maxY: 5 })[0].offset).toBe(100)
    // ...and on the below-threshold side
    expect(stopsFor({ minY: -5, maxY: -5 })[0].offset).toBe(0)
  })

  it('computes the offset for an asymmetric axis', () => {
    // 10 / 110 ≈ 9.09%
    expect(stopsFor({ minY: -100, maxY: 10 })[0].offset).toBeCloseTo(9.09, 1)
  })

  it('uses a non-zero threshold correctly', () => {
    // (7 - 5) / (7 - 3) = 50%
    const stops = stopsFor({ minY: 3, maxY: 7 }, { ...thresholdColors, threshold: 5 })
    expect(stops[0].offset).toBe(50)
  })

  it('mirrors the boundary and the color order on a reversed axis', () => {
    // reversed puts low values at the top, so the below-threshold band leads
    const stops = stopsFor({ minY: -100, maxY: 300, reversed: true })
    expect(stops[0].color).toBe('#ff0000')
    expect(stops[1].color).toBe('#00ff00')
    expect(stops[0].offset).toBe(25)
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
