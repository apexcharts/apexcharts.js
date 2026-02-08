import Range from '../../src/modules/Range.js'
import Bar from '../../src/charts/Bar.js'
import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helper: create a rendered chart and return the chart instance
// ---------------------------------------------------------------------------
function barChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'bar', ...opts.chart },
    series: opts.series || [{ data: [10, 20, 30] }],
    xaxis: opts.xaxis || {},
    yaxis: opts.yaxis || [{}],
    plotOptions: {
      bar: { horizontal: false, ...opts.bar },
      ...opts.plotOptions,
    },
    dataLabels: opts.dataLabels || { enabled: false },
    stroke: opts.stroke || {},
    ...opts.extra,
  })
}

// ---------------------------------------------------------------------------
// Helper: minimal mock for isolated Bar method tests
// ---------------------------------------------------------------------------
function createBarInstance(overrides = {}) {
  const globals = {
    series: [[10, 20, 30]],
    seriesNames: ['Series 1'],
    seriesX: [[1, 2, 3]],
    seriesRange: [],
    seriesXvalues: [],
    seriesYvalues: [],
    seriesYAxisReverseMap: [0],
    colors: ['#008FFB'],
    stroke: { colors: ['#fff'] },
    isXNumeric: false,
    isBarHorizontal: false,
    comboCharts: false,
    dataPoints: 3,
    gridWidth: 500,
    gridHeight: 400,
    minX: 0,
    maxX: 4,
    previousPaths: [],
    delayedElements: [],
    collapsedSeries: [],
    collapsedSeriesIndices: [],
    barGroups: [],
    seriesGroups: [['Series 1']],
    columnSeries: { i: [0] },
    maxValsInArrayIndex: 0,
    barPadForNumericAxis: 0,
    cuid: 'test123',
    dom: {},
    ...(overrides.globals || {}),
  }

  const config = {
    plotOptions: {
      bar: {
        horizontal: false,
        isFunnel: false,
        rangeBarGroupRows: false,
        dataLabels: { maxItems: 100 },
        distributed: false,
      },
    },
    stroke: { width: 2, colors: ['#000'], lineCap: 'butt' },
    chart: {
      type: 'bar',
      stacked: false,
      animations: {
        enabled: false,
        speed: 300,
        animateGradually: { delay: 150 },
        dynamicAnimation: { speed: 300 },
      },
      dropShadow: { enabled: false },
    },
    dataLabels: { enabled: false },
    series: [{ name: 'Series 1', data: [10, 20, 30] }],
    yaxis: [{ reversed: false }],
    forecastDataPoints: { count: 0 },
    ...(overrides.config || {}),
  }

  const w = { config, globals }

  // Build a minimal ctx that Bar's constructor needs
  const ctx = {
    w,
    series: { addCollapsedClassToSeries: jest.fn() },
  }
  ctx.ctx = ctx

  return { ctx, w }
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('Bar chart', () => {
  it('columns should not overlap because of wrong minXDiff value', () => {
    const chart = createChartWithOptions({
      series: [
        {
          data: [
            [1, 1],
            [4, 4],
            [3, 3],
          ],
        },
      ],
      chart: { type: 'bar' },
    })

    const range = new Range(chart)
    range.setXRange()

    expect(range.w.globals.minXDiff).toEqual(1)
  })

  // =========================================================================
  // getPreviousPath – isolated unit tests
  // =========================================================================
  describe('getPreviousPath', () => {
    it('should return default "M 0 0" when no previous paths exist', () => {
      const { ctx } = createBarInstance()
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      expect(bar.getPreviousPath(0, 0)).toBe('M 0 0')
    })

    it('should return the matching path d when realIndex and j match', () => {
      const { ctx } = createBarInstance({
        globals: {
          previousPaths: [
            {
              realIndex: 0,
              paths: [{ d: 'M 10 20 L 30 40' }, { d: 'M 50 60 L 70 80' }],
            },
          ],
        },
      })
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      expect(bar.getPreviousPath(0, 0)).toBe('M 10 20 L 30 40')
      expect(bar.getPreviousPath(0, 1)).toBe('M 50 60 L 70 80')
    })

    it('should return "M 0 0" when realIndex does not match', () => {
      const { ctx } = createBarInstance({
        globals: {
          previousPaths: [
            {
              realIndex: 5,
              paths: [{ d: 'M 10 20 L 30 40' }],
            },
          ],
        },
      })
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      expect(bar.getPreviousPath(0, 0)).toBe('M 0 0')
    })

    it('should return "M 0 0" when j is out of bounds', () => {
      const { ctx } = createBarInstance({
        globals: {
          previousPaths: [
            {
              realIndex: 0,
              paths: [{ d: 'M 10 20 L 30 40' }],
            },
          ],
        },
      })
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      expect(bar.getPreviousPath(0, 5)).toBe('M 0 0')
    })

    it('should handle string realIndex via parseInt comparison', () => {
      const { ctx } = createBarInstance({
        globals: {
          previousPaths: [
            {
              realIndex: '2',
              paths: [{ d: 'M 1 2 L 3 4' }],
            },
          ],
        },
      })
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      expect(bar.getPreviousPath(2, 0)).toBe('M 1 2 L 3 4')
    })

    it('should skip entries with empty paths array', () => {
      const { ctx } = createBarInstance({
        globals: {
          previousPaths: [
            { realIndex: 0, paths: [] },
            { realIndex: 0, paths: [{ d: 'M 99 99' }] },
          ],
        },
      })
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      expect(bar.getPreviousPath(0, 0)).toBe('M 99 99')
    })
  })

  // =========================================================================
  // getBarXForNumericXAxis – isolated unit tests
  // =========================================================================
  describe('getBarXForNumericXAxis', () => {
    function makeBar(globals) {
      const bar = Object.create(Bar.prototype)
      bar.w = {
        globals: {
          seriesX: [[10, 20, 30]],
          minX: 0,
          maxValsInArrayIndex: 0,
          ...globals,
        },
      }
      bar.xRatio = 1
      bar.seriesLen = 1
      bar.visibleI = 0
      return bar
    }

    it('should compute x position from seriesX values', () => {
      const bar = makeBar()
      bar.xRatio = 2
      bar.seriesLen = 1

      const result = bar.getBarXForNumericXAxis({
        x: 0,
        j: 0,
        realIndex: 0,
        barWidth: 10,
      })

      // x = (10 - 0) / 2 - (10 * 1) / 2 = 5 - 5 = 0
      expect(result.x).toBe(0)
      expect(result.barXPosition).toBe(0) // x + barWidth * visibleI(0) = 0
    })

    it('should fallback to maxValsInArrayIndex when seriesX[realIndex] is empty', () => {
      const bar = makeBar({
        seriesX: [[], [10, 20, 30]],
        maxValsInArrayIndex: 1,
      })
      bar.xRatio = 1
      bar.seriesLen = 1

      const result = bar.getBarXForNumericXAxis({
        x: 0,
        j: 1,
        realIndex: 0,
        barWidth: 4,
      })

      // Uses seriesX[1] (maxValsInArrayIndex=1), j=1 => value=20
      // x = (20 - 0) / 1 - (4 * 1) / 2 = 20 - 2 = 18
      expect(result.x).toBe(18)
    })

    it('should account for visibleI in barXPosition', () => {
      const bar = makeBar()
      bar.xRatio = 1
      bar.seriesLen = 2
      bar.visibleI = 1

      const result = bar.getBarXForNumericXAxis({
        x: 0,
        j: 0,
        realIndex: 0,
        barWidth: 10,
      })

      // x = (10 - 0) / 1 - (10 * 2) / 2 = 10 - 10 = 0
      // barXPosition = 0 + 10 * 1 = 10
      expect(result.x).toBe(0)
      expect(result.barXPosition).toBe(10)
    })
  })

  // =========================================================================
  // draw() – integration tests
  // =========================================================================
  describe('draw (via chart rendering)', () => {
    it('should populate seriesXvalues and seriesYvalues for column chart', () => {
      const chart = barChart({
        series: [{ data: [10, 20, 30] }],
      })
      const w = chart.w

      expect(w.globals.seriesXvalues.length).toBeGreaterThan(0)
      expect(w.globals.seriesYvalues.length).toBeGreaterThan(0)
      expect(w.globals.seriesXvalues[0].length).toBe(3)
      expect(w.globals.seriesYvalues[0].length).toBe(3)
    })

    it('should populate seriesXvalues and seriesYvalues for horizontal bar', () => {
      const chart = barChart({
        bar: { horizontal: true },
        series: [{ data: [10, 20, 30] }],
      })
      const w = chart.w

      expect(w.globals.seriesXvalues.length).toBeGreaterThan(0)
      expect(w.globals.seriesYvalues.length).toBeGreaterThan(0)
    })

    it('should handle multi-series bar charts', () => {
      const chart = barChart({
        series: [{ data: [10, 20, 30] }, { data: [15, 25, 35] }],
      })
      const w = chart.w

      expect(w.globals.seriesXvalues.length).toBe(2)
      expect(w.globals.seriesYvalues.length).toBe(2)
    })

    it('should handle series with empty data', () => {
      const chart = barChart({
        series: [{ data: [] }],
      })
      const w = chart.w

      // Should not throw — chart renders even with no data
      expect(w.globals.series).toBeDefined()
    })

    it('should warn when dataLabels exceed maxItems', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      barChart({
        dataLabels: { enabled: true },
        bar: { dataLabels: { maxItems: 2 } },
        series: [{ data: [10, 20, 30] }],
      })

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining(
          'WARNING: DataLabels are enabled but there are too many'
        )
      )

      spy.mockRestore()
    })

    it('should not warn when dataLabels are within maxItems', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      barChart({
        dataLabels: { enabled: true },
        bar: { dataLabels: { maxItems: 100 } },
        series: [{ data: [10, 20, 30] }],
      })

      expect(spy).not.toHaveBeenCalledWith(
        expect.stringContaining(
          'WARNING: DataLabels are enabled but there are too many'
        )
      )

      spy.mockRestore()
    })
  })

  // =========================================================================
  // Rendered SVG – integration tests
  // =========================================================================
  describe('rendered SVG output', () => {
    it('should render bar series group elements', () => {
      const chart = barChart({
        series: [{ data: [10, 20, 30] }],
      })

      const el = chart.el
      const barSeries = el.querySelectorAll('.apexcharts-bar-series')
      expect(barSeries.length).toBeGreaterThan(0)
    })

    it('should render correct number of series groups', () => {
      const chart = barChart({
        series: [
          { name: 'A', data: [10, 20] },
          { name: 'B', data: [30, 40] },
        ],
      })

      const el = chart.el
      const seriesGroups = el.querySelectorAll('.apexcharts-series')
      // At least 2 series groups for bar data
      const barSeriesGroups = Array.from(seriesGroups).filter((g) =>
        g.closest('.apexcharts-bar-series')
      )
      expect(barSeriesGroups.length).toBe(2)
    })

    it('should render datalabels wrapper for each series', () => {
      const chart = barChart({
        dataLabels: { enabled: true },
        series: [{ data: [10, 20, 30] }],
      })

      const el = chart.el
      const dlWraps = el.querySelectorAll('.apexcharts-datalabels')
      expect(dlWraps.length).toBeGreaterThan(0)
    })

    it('should render bar-area path elements for each data point', () => {
      const chart = barChart({
        series: [{ data: [10, 20, 30] }],
      })

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      expect(barPaths.length).toBe(3)
    })

    it('should set clip-path attribute on bar path elements', () => {
      const chart = barChart({
        series: [{ data: [10, 20] }],
      })

      const el = chart.el
      const barPath = el.querySelector('.apexcharts-bar-area')
      expect(barPath).not.toBeNull()
      const clipPath = barPath.getAttribute('clip-path')
      expect(clipPath).toMatch(/url\(#gridRectBarMask/)
    })

    it('should set val attribute on bar path elements', () => {
      const chart = barChart({
        series: [{ data: [42, 88] }],
      })

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      const vals = Array.from(barPaths).map((p) =>
        parseFloat(p.getAttribute('val'))
      )
      expect(vals).toEqual([42, 88])
    })
  })

  // =========================================================================
  // Horizontal bar rendering
  // =========================================================================
  describe('horizontal bar rendering', () => {
    it('should render horizontal bars', () => {
      const chart = barChart({
        bar: { horizontal: true },
        series: [{ data: [10, 20, 30] }],
      })

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      expect(barPaths.length).toBe(3)
    })

    it('should set seriesXvalues and seriesYvalues for horizontal bars', () => {
      const chart = barChart({
        bar: { horizontal: true },
        series: [{ data: [10, 20, 30] }],
      })
      const w = chart.w

      expect(w.globals.seriesYvalues[0].length).toBe(3)
    })
  })

  // =========================================================================
  // Stacked bar charts
  // =========================================================================
  describe('stacked bar charts', () => {
    it('should render stacked column chart', () => {
      const chart = barChart({
        chart: { stacked: true },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [5, 10, 15] },
        ],
      })

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      // 3 data points * 2 series = 6 bars
      expect(barPaths.length).toBe(6)
    })

    it('should render stacked horizontal bar chart', () => {
      const chart = barChart({
        chart: { stacked: true },
        bar: { horizontal: true },
        series: [
          { name: 'A', data: [10, 20] },
          { name: 'B', data: [5, 10] },
        ],
      })

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      expect(barPaths.length).toBe(4)
    })
  })

  // =========================================================================
  // Forecast data points
  // =========================================================================
  describe('forecast data points', () => {
    it('should apply forecast attributes to trailing data points', () => {
      const chart = barChart({
        series: [{ data: [10, 20, 30, 40, 50] }],
        extra: {
          forecastDataPoints: {
            count: 2,
            fillOpacity: 0.5,
            strokeWidth: 1,
            dashArray: 4,
          },
        },
      })

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      // Last 2 bars should have forecast fill-opacity
      const forecastBars = Array.from(barPaths).filter(
        (p) => p.getAttribute('fill-opacity') === '0.5'
      )
      expect(forecastBars.length).toBe(2)
    })
  })

  // =========================================================================
  // Negative values
  // =========================================================================
  describe('negative values', () => {
    it('should render bars with negative values', () => {
      const chart = barChart({
        series: [{ data: [-10, 20, -30] }],
      })

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      expect(barPaths.length).toBe(3)
    })

    it('should render horizontal bars with negative values', () => {
      const chart = barChart({
        bar: { horizontal: true },
        series: [{ data: [-10, 20, -30] }],
      })

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      expect(barPaths.length).toBe(3)
    })
  })

  // =========================================================================
  // Goals markers
  // =========================================================================
  describe('goals markers', () => {
    it('should render goal markers container', () => {
      const chart = barChart({
        series: [{ data: [10, 20, 30] }],
      })

      const el = chart.el
      const goalGroups = el.querySelectorAll('.apexcharts-bar-goals-markers')
      expect(goalGroups.length).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // Data labels integration
  // =========================================================================
  describe('data labels', () => {
    it('should render data labels when enabled', () => {
      const chart = barChart({
        dataLabels: { enabled: true },
        series: [{ data: [10, 20, 30] }],
      })

      const el = chart.el
      const datalabels = el.querySelectorAll('.apexcharts-datalabels')
      expect(datalabels.length).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // Numeric X-axis bar chart
  // =========================================================================
  describe('numeric x-axis', () => {
    it('should render bar chart with numeric x-axis data', () => {
      const chart = createChartWithOptions({
        chart: { type: 'bar' },
        series: [
          {
            data: [
              [1, 10],
              [2, 20],
              [3, 30],
            ],
          },
        ],
      })

      const w = chart.w
      expect(w.globals.isXNumeric).toBe(true)

      const el = chart.el
      const barPaths = el.querySelectorAll('.apexcharts-bar-area')
      expect(barPaths.length).toBe(3)
    })
  })
})
