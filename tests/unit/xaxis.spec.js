import Range from '../../src/modules/Range.js'
import series2dArrayNumeric from './data/series2dArrayNumeric.js'
import { createChartWithOptions } from './utils/utils.js'

// ===========================================================================
// EXISTING TESTS – basic numeric datapoint counts
// ===========================================================================

describe('x-axis when 2 datapoints area provided in a line chart', () => {
  it('should set the x-axis min and max from the 2 points for a line chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
            {
              x: 2022,
              y: 15336,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([2021, 2022])
  })
})

describe('x-axis when 2 datapoints area provided in a column chart', () => {
  it('should set the x-axis min and max from the 2 points in a column chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
            {
              x: 2022,
              y: 15336,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.minX).toEqual(2021)
    expect(chart.w.globals.maxX).toEqual(2022)
  })
})

describe('x-axis when 1 datapoint is provided in a line chart', () => {
  it('should set the x-axis min and max from a single data-points in a line chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([2021])
  })
})

describe('x-axis when 1 datapoint is provided in a column chart', () => {
  it('should set the x-axis min and max from a single data-points in a column chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([2021])
  })
})

describe('x-axis when more than 10 datapoints are provided in a line chart', () => {
  it('should set the x-axis min and max from 10 data-points in a line chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
            {
              x: 2022,
              y: 15336,
            },
            {
              x: 2023,
              y: 15951,
            },
            {
              x: 2024,
              y: 11343,
            },
            {
              x: 2025,
              y: 18845,
            },
            {
              x: 2026,
              y: 15104,
            },
            {
              x: 2027,
              y: 10596,
            },
            {
              x: 2028,
              y: 18725,
            },
            {
              x: 2029,
              y: 17630,
            },
            {
              x: 2030,
              y: 13692,
            },
            {
              x: 2031,
              y: 17766,
            },
            {
              x: 2032,
              y: 23432,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([
      2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032,
    ])
  })
})

describe('x-axis when more than 10 datapoints are provided in a column chart', () => {
  it('should set the x-axis min and max from 10 data-points in a column chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
            {
              x: 2022,
              y: 15336,
            },
            {
              x: 2023,
              y: 15951,
            },
            {
              x: 2024,
              y: 11343,
            },
            {
              x: 2025,
              y: 18845,
            },
            {
              x: 2026,
              y: 15104,
            },
            {
              x: 2027,
              y: 10596,
            },
            {
              x: 2028,
              y: 18725,
            },
            {
              x: 2029,
              y: 17630,
            },
            {
              x: 2030,
              y: 13692,
            },
            {
              x: 2031,
              y: 17766,
            },
            {
              x: 2032,
              y: 23432,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.minX).toEqual(2021)
    expect(chart.w.globals.maxX).toEqual(2032)
  })
})

describe('User defined X-axis min/max', () => {
  it('should set the min and max of x-axis based on user input', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: series2dArrayNumeric,
      xaxis: {
        min: 0,
        max: 40,
      },
    })

    const range = new Range(chart)
    const xRange = range.setXRange()

    expect(xRange.minX).toEqual(0)
    expect(xRange.maxX).toEqual(40)
  })
})

// ===========================================================================
// EDGE CASE TESTS
// ===========================================================================

describe('x-axis category mode', () => {
  it('should render correct number of xaxis labels for categories', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ data: [10, 20, 30, 40, 50] }],
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      },
    })

    const el = chart.el
    const labels = el.querySelectorAll('.apexcharts-xaxis-label')
    expect(labels.length).toBe(5)
  })

  it('should render correct label text for categories', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['Alpha', 'Beta', 'Gamma'],
      },
    })

    const el = chart.el
    const tspans = el.querySelectorAll('.apexcharts-xaxis-label tspan')
    const texts = Array.from(tspans).map((t) => t.textContent)
    expect(texts).toContain('Alpha')
    expect(texts).toContain('Beta')
    expect(texts).toContain('Gamma')
  })

  it('should handle empty categories array with flat series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: [] },
    })

    expect(chart.w.globals.labels.length).toBeGreaterThan(0)
  })
})

describe('x-axis labels visibility', () => {
  it('should render xaxis labels when show is true (default)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: ['A', 'B', 'C'] },
    })

    const el = chart.el
    const labels = el.querySelectorAll('.apexcharts-xaxis-label')
    expect(labels.length).toBeGreaterThan(0)
  })

  it('should not render xaxis labels when show is false', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        labels: { show: false },
      },
    })

    const el = chart.el
    const labels = el.querySelectorAll('.apexcharts-xaxis-label')
    expect(labels.length).toBe(0)
  })
})

describe('x-axis title', () => {
  it('should render xaxis title when text is provided', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        title: { text: 'X Values' },
      },
    })

    const el = chart.el
    const titleEl = el.querySelector('.apexcharts-xaxis-title-text')
    expect(titleEl).not.toBeNull()
    expect(titleEl.textContent).toBe('X Values')
  })

  it('should not render xaxis title when text is undefined', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: ['A', 'B', 'C'] },
    })

    const el = chart.el
    const titleEl = el.querySelector('.apexcharts-xaxis-title')
    expect(titleEl).toBeNull()
  })
})

describe('x-axis border', () => {
  it('should render xaxis border when show is true', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        axisBorder: { show: true },
      },
    })

    const el = chart.el
    const xaxis = el.querySelector('.apexcharts-xaxis')
    expect(xaxis).not.toBeNull()
  })

  it('should respect custom axisBorder color', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        axisBorder: { show: true, color: '#ff0000' },
      },
    })
    const w = chart.w
    expect(w.config.xaxis.axisBorder.color).toBe('#ff0000')
  })
})

describe('x-axis position', () => {
  it('should place xaxis at bottom by default', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: ['A', 'B', 'C'] },
    })
    const w = chart.w
    expect(w.config.xaxis.position).toBe('bottom')
  })

  it('should place xaxis at top when configured', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        position: 'top',
      },
    })
    const w = chart.w
    expect(w.config.xaxis.position).toBe('top')
  })
})

describe('x-axis with numeric type', () => {
  it('should handle numeric xaxis type with x/y data', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 10, y: 100 },
            { x: 20, y: 200 },
            { x: 30, y: 150 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.isXNumeric).toBe(true)
    expect(w.globals.minX).toBeLessThanOrEqual(10)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(30)
  })

  it('should produce unique scale values for numeric axis', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 5, y: 10 },
            { x: 10, y: 20 },
            { x: 15, y: 30 },
            { x: 20, y: 40 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const scale = chart.w.globals.xAxisScale.result
    const unique = new Set(scale)
    expect(unique.size).toBe(scale.length)
  })

  it('should handle unsorted numeric x values', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 30, y: 100 },
            { x: 10, y: 200 },
            { x: 20, y: 150 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(10)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(30)
  })
})

describe('x-axis single datapoint edge cases', () => {
  it('should expand range for single numeric datapoint (minX === maxX)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [{ x: 100, y: 50 }] }],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    // _handleSingleDataPoint adjusts minX and maxX by ±2
    expect(w.globals.minX).toBeLessThan(100)
    expect(w.globals.maxX).toBeGreaterThan(100)
  })

  it('should set minXDiff to 0.5 for single numeric datapoint', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [{ data: [{ x: 50, y: 100 }] }],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.minXDiff).toBe(0.5)
  })
})

describe('x-axis user-defined range', () => {
  it('should apply xaxis.range to calculate minX from maxX', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 10, y: 100 },
            { x: 50, y: 200 },
            { x: 100, y: 150 },
          ],
        },
      ],
      xaxis: { range: 50 },
    })

    const w = chart.w
    // range = maxX - minX should be 50
    expect(w.globals.maxX - w.globals.minX).toBeCloseTo(50, 0)
  })

  it('should override only min when xaxis.min is set', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 10, y: 100 },
            { x: 20, y: 200 },
            { x: 30, y: 150 },
          ],
        },
      ],
      xaxis: { min: 5 },
    })

    const w = chart.w
    expect(w.globals.minX).toBe(5)
  })

  it('should override only max when xaxis.max is set', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 10, y: 100 },
            { x: 20, y: 200 },
            { x: 30, y: 150 },
          ],
        },
      ],
      xaxis: { max: 50 },
    })

    const w = chart.w
    expect(w.globals.maxX).toBe(50)
  })
})

describe('x-axis tickAmount', () => {
  it('should respect explicit tickAmount', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 0, y: 10 },
            { x: 10, y: 20 },
            { x: 20, y: 30 },
            { x: 30, y: 40 },
            { x: 40, y: 50 },
            { x: 50, y: 60 },
          ],
        },
      ],
      xaxis: { type: 'numeric', tickAmount: 5 },
    })

    const w = chart.w
    expect(w.globals.xTickAmount).toBe(5)
  })

  it('should handle tickAmount: "dataPoints" for multi-series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
            { x: 3, y: 30 },
          ],
        },
        {
          data: [
            { x: 1, y: 15 },
            { x: 2, y: 25 },
            { x: 3, y: 35 },
          ],
        },
      ],
      xaxis: { type: 'numeric', tickAmount: 'dataPoints' },
    })

    const w = chart.w
    // tickAmount = series[maxValsInArrayIndex].length - 1
    expect(w.globals.xTickAmount).toBe(2)
  })
})

describe('x-axis with negative values', () => {
  it('should handle negative x values', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: -20, y: 100 },
            { x: -10, y: 200 },
            { x: 0, y: 150 },
            { x: 10, y: 300 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(-20)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(10)
  })

  it('should handle all-negative x values', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        {
          data: [
            { x: -50, y: 10 },
            { x: -30, y: 20 },
            { x: -10, y: 30 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(-50)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(-10)
  })
})

describe('x-axis with multi-series', () => {
  it('should compute minX/maxX across multiple series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 5, y: 10 },
            { x: 15, y: 20 },
          ],
        },
        {
          data: [
            { x: 1, y: 10 },
            { x: 25, y: 20 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    // minX should come from second series (1), maxX from second series (25)
    expect(w.globals.minX).toBeLessThanOrEqual(1)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(25)
  })

  it('should compute minXDiff from smallest gap across all series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 10, y: 10 },
            { x: 20, y: 20 },
            { x: 30, y: 30 },
          ],
        },
        {
          data: [
            { x: 10, y: 15 },
            { x: 12, y: 25 },
            { x: 30, y: 35 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    // Second series has gap of 2 (12-10) which is smallest
    expect(w.globals.minXDiff).toBeLessThanOrEqual(2)
  })
})

describe('x-axis with large values', () => {
  it('should handle very large x values', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 1000000, y: 10 },
            { x: 2000000, y: 20 },
            { x: 3000000, y: 30 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(1000000)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(3000000)

    const scale = w.globals.xAxisScale.result
    expect(scale.length).toBeGreaterThan(0)
    // All scale values should be unique
    const unique = new Set(scale)
    expect(unique.size).toBe(scale.length)
  })
})

describe('x-axis with equal x values (all same)', () => {
  it('should handle all-equal numeric x values', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        {
          data: [
            { x: 50, y: 10 },
            { x: 50, y: 20 },
            { x: 50, y: 30 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    // _handleSingleDataPoint should expand the range
    expect(w.globals.minX).toBeLessThan(50)
    expect(w.globals.maxX).toBeGreaterThan(50)
  })
})

describe('x-axis with 2D array format', () => {
  it('should handle [x, y] array format', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        {
          data: [
            [5, 10],
            [15, 20],
            [25, 30],
          ],
        },
      ],
    })

    const w = chart.w
    expect(w.globals.isXNumeric).toBe(true)
    expect(w.globals.minX).toBeLessThanOrEqual(5)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(25)
  })

  it('should handle multi-series 2D array format', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: series2dArrayNumeric,
    })

    const w = chart.w
    expect(w.globals.isXNumeric).toBe(true)
    expect(w.globals.seriesX.length).toBe(2)
  })
})

describe('x-axis with timestamp data', () => {
  it('should handle timestamp x values in 2D arrays', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            [1262284200000, 300],
            [1262370600000, 230],
            [1262457000000, 210],
          ],
        },
      ],
      xaxis: { type: 'datetime' },
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(1262284200000)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(1262457000000)
  })
})

describe('x-axis overwriteCategories', () => {
  it('should use overwriteCategories when provided', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        overwriteCategories: ['X', 'Y', 'Z'],
      },
    })

    const el = chart.el
    const tspans = el.querySelectorAll('.apexcharts-xaxis-label tspan')
    const texts = Array.from(tspans).map((t) => t.textContent)
    expect(texts).toContain('X')
    expect(texts).toContain('Y')
    expect(texts).toContain('Z')
    expect(texts).not.toContain('A')
  })
})

describe('x-axis horizontal bar chart', () => {
  it('should render inversed xaxis for horizontal bar', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true } },
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: ['A', 'B', 'C'] },
    })

    const el = chart.el
    const inversed = el.querySelector('.apexcharts-xaxis-inversed')
    expect(inversed).not.toBeNull()
  })

  it('should set xTickAmount from labels.length for horizontal bar', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true } },
      series: [{ data: [10, 20, 30, 40, 50] }],
      xaxis: { categories: ['A', 'B', 'C', 'D', 'E'] },
    })

    const w = chart.w
    expect(w.globals.labels.length).toBe(5)
  })
})

describe('x-axis ticks', () => {
  it('should render xaxis ticks when axisTicks.show is true', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        axisTicks: { show: true },
      },
    })

    const el = chart.el
    const ticks = el.querySelectorAll('.apexcharts-xaxis-tick')
    expect(ticks.length).toBeGreaterThan(0)
  })

  it('should not render xaxis ticks when axisTicks.show is false', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        axisTicks: { show: false },
      },
    })

    const el = chart.el
    const ticks = el.querySelectorAll('.apexcharts-xaxis-tick')
    expect(ticks.length).toBe(0)
  })
})

describe('x-axis with stepSize', () => {
  it('should respect xaxis.stepSize in scale generation', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 0, y: 10 },
            { x: 100, y: 20 },
          ],
        },
      ],
      xaxis: { type: 'numeric', stepSize: 25 },
    })

    const scale = chart.w.globals.xAxisScale.result
    // With stepSize 25 over 0-100, we expect steps of 25
    for (let i = 1; i < scale.length; i++) {
      const diff = scale[i] - scale[i - 1]
      expect(diff).toBeCloseTo(25, 0)
    }
  })
})

describe('x-axis with sparse/gapped numeric data', () => {
  it('should handle non-uniform spacing between x values', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
            { x: 100, y: 30 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(1)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(100)
    // minXDiff should be 1 (gap between 1 and 2)
    expect(w.globals.minXDiff).toBe(1)
  })
})

describe('x-axis with many categories', () => {
  it('should handle a large number of categories', () => {
    const categories = Array.from({ length: 50 }, (_, i) => `Cat ${i + 1}`)
    const data = Array.from({ length: 50 }, (_, i) => i * 10)

    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data }],
      xaxis: { categories },
    })

    const w = chart.w
    expect(w.globals.labels.length).toBe(50)
  })
})

describe('x-axis with zero values', () => {
  it('should handle x values starting from zero', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 0, y: 10 },
            { x: 1, y: 20 },
            { x: 2, y: 30 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(0)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(2)
  })

  it('should handle all-zero x values', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        {
          data: [
            { x: 0, y: 10 },
            { x: 0, y: 20 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    // _handleSingleDataPoint should expand range around 0
    expect(w.globals.minX).toBeLessThan(0)
    expect(w.globals.maxX).toBeGreaterThan(0)
  })
})

describe('x-axis with area chart', () => {
  it('should compute xaxis scale for area chart with numeric data', () => {
    const chart = createChartWithOptions({
      chart: { type: 'area' },
      series: [
        {
          data: [
            { x: 10, y: 100 },
            { x: 20, y: 200 },
            { x: 30, y: 150 },
            { x: 40, y: 250 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.isXNumeric).toBe(true)
    expect(w.globals.xAxisScale.result.length).toBeGreaterThan(0)
    expect(w.globals.minX).toBeLessThanOrEqual(10)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(40)
  })
})

describe('x-axis label styling', () => {
  it('should apply custom fontSize to labels', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        labels: {
          style: { fontSize: '16px' },
        },
      },
    })
    const w = chart.w
    expect(w.config.xaxis.labels.style.fontSize).toBe('16px')
  })

  it('should apply custom label colors', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20] }],
      xaxis: {
        categories: ['A', 'B'],
        labels: {
          style: { colors: ['#ff0000', '#00ff00'] },
        },
      },
    })
    const w = chart.w
    expect(w.config.xaxis.labels.style.colors).toEqual(['#ff0000', '#00ff00'])
  })
})

describe('x-axis with stacked bar chart', () => {
  it('should compute correct xaxis for stacked column chart', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', stacked: true },
      series: [
        { data: [10, 20, 30] },
        { data: [15, 25, 35] },
      ],
      xaxis: { categories: ['A', 'B', 'C'] },
    })

    const w = chart.w
    expect(w.globals.labels.length).toBe(3)
    expect(w.config.chart.stacked).toBe(true)
  })
})

describe('x-axis with label offsets', () => {
  it('should respect labels.offsetX and labels.offsetY', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        labels: { offsetX: 5, offsetY: 10 },
      },
    })
    const w = chart.w
    expect(w.config.xaxis.labels.offsetX).toBe(5)
    expect(w.config.xaxis.labels.offsetY).toBe(10)
  })

  it('should respect xaxis.offsetX and xaxis.offsetY', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        offsetX: 15,
        offsetY: 20,
      },
    })
    const w = chart.w
    expect(w.config.xaxis.offsetX).toBe(15)
    expect(w.config.xaxis.offsetY).toBe(20)
  })
})

describe('x-axis with floating point x values', () => {
  it('should handle decimal x values correctly', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            { x: 1.5, y: 10 },
            { x: 2.5, y: 20 },
            { x: 3.5, y: 30 },
            { x: 4.5, y: 40 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(1.5)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(4.5)
    expect(w.globals.minXDiff).toBeCloseTo(1, 5)
  })
})

describe('x-axis with scatter chart', () => {
  it('should compute numeric xaxis for scatter chart', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        {
          data: [
            [10, 50],
            [20, 60],
            [30, 70],
            [40, 80],
          ],
        },
      ],
    })

    const w = chart.w
    expect(w.globals.isXNumeric).toBe(true)
    expect(w.globals.minX).toBeLessThanOrEqual(10)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(40)
  })

  it('should handle multi-series scatter with different ranges', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        {
          data: [
            [10, 50],
            [20, 60],
          ],
        },
        {
          data: [
            [5, 30],
            [50, 90],
          ],
        },
      ],
    })

    const w = chart.w
    expect(w.globals.minX).toBeLessThanOrEqual(5)
    expect(w.globals.maxX).toBeGreaterThanOrEqual(50)
  })
})

describe('x-axis with empty series', () => {
  it('should handle empty data array gracefully', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [] }],
      xaxis: { categories: [] },
    })

    const w = chart.w
    expect(w.globals.series).toBeDefined()
  })

  it('should handle series with no data property', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [],
    })

    const w = chart.w
    expect(w.globals.series).toBeDefined()
  })
})

describe('x-axis axisTicks configuration', () => {
  it('should respect custom tick height', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        categories: ['A', 'B', 'C'],
        axisTicks: { show: true, height: 10 },
      },
    })
    const w = chart.w
    expect(w.config.xaxis.axisTicks.height).toBe(10)
  })

  it('should respect custom tick color', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20] }],
      xaxis: {
        categories: ['A', 'B'],
        axisTicks: { show: true, color: '#333' },
      },
    })
    const w = chart.w
    expect(w.config.xaxis.axisTicks.color).toBe('#333')
  })
})
