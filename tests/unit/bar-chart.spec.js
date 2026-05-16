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

  const w = {
    config,
    globals,
    dom: {},
  }

  // Build a minimal ctx that Bar's constructor needs
  const ctx = {
    w,
    series: { addCollapsedClassToSeries: vi.fn() },
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

    const range = new Range(chart.w)
    range.setXRange()

    expect(range.w.globals.minXDiff).toEqual(1)
  })

  // =========================================================================
  // getPreviousPath – isolated unit tests
  //
  // Signature: getPreviousPath(realIndex, j, pathTo)
  //   - If a captured `d` exists for (realIndex, j) AND its SVG command count
  //     matches `pathTo` → returns captured d (survivor → smooth morph).
  //   - Otherwise → returns `pathTo` (pathFrom === pathTo = snap, no
  //     animation). Mirrors Highcharts: only survivors animate.
  // =========================================================================
  describe('getPreviousPath', () => {
    const PATH_TO = 'M 0 0 L 1 1' // 2 commands

    it('returns pathTo (snap) when no previous paths exist', () => {
      const { ctx } = createBarInstance()
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      expect(bar.getPreviousPath(0, 0, PATH_TO)).toBe(PATH_TO)
    })

    it('returns the captured d when realIndex/j match and command count matches', () => {
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

      expect(bar.getPreviousPath(0, 0, PATH_TO)).toBe('M 10 20 L 30 40')
      expect(bar.getPreviousPath(0, 1, PATH_TO)).toBe('M 50 60 L 70 80')
    })

    it('returns pathTo (snap) when realIndex does not match', () => {
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

      expect(bar.getPreviousPath(0, 0, PATH_TO)).toBe(PATH_TO)
    })

    it('returns pathTo (snap) when j is out of bounds', () => {
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

      expect(bar.getPreviousPath(0, 5, PATH_TO)).toBe(PATH_TO)
    })

    it('handles string realIndex via parseInt comparison', () => {
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

      expect(bar.getPreviousPath(2, 0, PATH_TO)).toBe('M 1 2 L 3 4')
    })

    it('skips previousPaths entries with empty paths array', () => {
      const { ctx } = createBarInstance({
        globals: {
          previousPaths: [
            { realIndex: 0, paths: [] },
            { realIndex: 0, paths: [{ d: 'M 99 99 L 1 1' }] },
          ],
        },
      })
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      expect(bar.getPreviousPath(0, 0, PATH_TO)).toBe('M 99 99 L 1 1')
    })

    it('returns pathTo (snap) when captured d has different command count', () => {
      // Reproduces the "corner state flipped" case — e.g. a stacked bar that
      // wasn't previously the top of its stack now becomes the top and picks
      // up rounded-corner arcs. Command counts diverge → snap, no morph.
      const { ctx } = createBarInstance({
        globals: {
          previousPaths: [
            {
              realIndex: 0,
              paths: [{ d: 'M 10 20 L 30 40 L 50 60 L 70 80 Z' }], // 5 commands
            },
          ],
        },
      })
      const bar = Object.create(Bar.prototype)
      bar.w = ctx.w

      // PATH_TO is 2 commands → mismatch → snap.
      expect(bar.getPreviousPath(0, 0, PATH_TO)).toBe(PATH_TO)
    })

    it('pathCommandCount counts SVG command letters', () => {
      expect(Bar.pathCommandCount('M 0 0')).toBe(1)
      expect(Bar.pathCommandCount('M 0 0 L 1 1')).toBe(2)
      expect(Bar.pathCommandCount('M 0 0 L 1 1 L 2 2 L 3 3 Z')).toBe(5)
      expect(Bar.pathCommandCount('M 0 0 q 5 5 10 0 l 5 5 z')).toBe(4)
      expect(Bar.pathCommandCount('')).toBe(0)
      expect(Bar.pathCommandCount(null)).toBe(0)
    })
  })

  // =========================================================================
  // getBarXForNumericXAxis – isolated unit tests
  // =========================================================================
  describe('getBarXForNumericXAxis', () => {
    function makeBar(globals) {
      const bar = Object.create(Bar.prototype)
      const gl = {
        seriesX: [[10, 20, 30]],
        minX: 0,
        maxValsInArrayIndex: 0,
        ...globals,
      }
      bar.w = {
        globals: gl,
        seriesData: {
          seriesX: gl.seriesX,
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
      const { seriesXvalues, seriesYvalues } = chart.getState()

      expect(seriesXvalues.length).toBeGreaterThan(0)
      expect(seriesYvalues.length).toBeGreaterThan(0)
      expect(seriesXvalues[0].length).toBe(3)
      expect(seriesYvalues[0].length).toBe(3)
    })

    it('should populate seriesXvalues and seriesYvalues for horizontal bar', () => {
      const chart = barChart({
        bar: { horizontal: true },
        series: [{ data: [10, 20, 30] }],
      })
      const { seriesXvalues, seriesYvalues } = chart.getState()

      expect(seriesXvalues.length).toBeGreaterThan(0)
      expect(seriesYvalues.length).toBeGreaterThan(0)
    })

    it('should handle multi-series bar charts', () => {
      const chart = barChart({
        series: [{ data: [10, 20, 30] }, { data: [15, 25, 35] }],
      })
      const { seriesXvalues, seriesYvalues } = chart.getState()

      expect(seriesXvalues.length).toBe(2)
      expect(seriesYvalues.length).toBe(2)
    })

    it('should handle series with empty data', () => {
      const chart = barChart({
        series: [{ data: [] }],
      })
      // Should not throw — chart renders even with no data
      expect(chart.getState().series).toBeDefined()
    })

    it('should warn when dataLabels exceed maxItems', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

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
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

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

      expect(chart.getState().seriesYvalues[0].length).toBe(3)
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

    it('should not blank first/last bar data labels in mixed charts (bar + line)', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', height: 380 },
        series: [
          { name: 'Incidents', type: 'bar', data: [1, 9, 2, 1, 0, 1] },
          { name: 'Invites', type: 'bar', data: [2, 16, 2, 1, 3, 1] },
          { name: 'Accepted', type: 'bar', data: [2, 8, 2, 1, 1, 1] },
          { name: '% Accepted', type: 'line', data: [100, 50, 100, 100, 0, 100] },
        ],
        dataLabels: { enabled: true },
        stroke: { width: [0, 0, 0, 3] },
        xaxis: {
          categories: ['Mar-2021', 'Aug-2021', 'Sep-2021', 'Nov-2021', 'Jan-2022', 'Jan-2023'],
        },
        yaxis: [
          { seriesName: 'Incidents', min: 0, max: 20 },
          { seriesName: 'Invites', show: false, min: 0, max: 20 },
          { seriesName: 'Accepted', show: false, min: 0, max: 20 },
          { seriesName: '% Accepted', opposite: true, min: 0, max: 120 },
        ],
        plotOptions: { bar: { columnWidth: '70%' } },
      })

      const el = chart.el
      const datalabelTexts = el.querySelectorAll(
        '.apexcharts-datalabels .apexcharts-datalabel'
      )
      const labels = Array.from(datalabelTexts).map((t) =>
        t.textContent.trim()
      )

      const barLabels = labels.filter((l) => l !== '')
      const firstCategoryLabels = labels.slice(0, 4).filter((l) => l !== '')
      const lastCategoryLabels = labels.slice(-4).filter((l) => l !== '')

      expect(barLabels.length).toBeGreaterThan(0)
      expect(firstCategoryLabels.length).toBeGreaterThan(0)
      expect(lastCategoryLabels.length).toBeGreaterThan(0)
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
