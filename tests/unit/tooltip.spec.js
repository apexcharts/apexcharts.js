import { describe, it, expect, vi } from 'vitest'
import TooltipUtils from '../../src/modules/tooltip/Utils.js'
import TooltipLabels from '../../src/modules/tooltip/Labels.js'
import TooltipPosition from '../../src/modules/tooltip/Position.js'
import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helper factories for isolated unit tests
// ---------------------------------------------------------------------------

function makeTooltipContext(overrides = {}) {
  const globals = {
    series: [[10, 20, 30]],
    seriesNames: ['Series 1'],
    seriesX: [[1, 2, 3]],
    seriesXvalues: [[10, 20, 30]],
    seriesYvalues: [[100, 200, 300]],
    colors: ['#008FFB'],
    isXNumeric: false,
    isBarHorizontal: false,
    comboCharts: false,
    dataPoints: 3,
    gridWidth: 500,
    gridHeight: 300,
    translateX: 0,
    translateY: 0,
    collapsedSeriesIndices: [],
    ancillaryCollapsedSeriesIndices: [],
    allSeriesHasEqualX: true,
    zoomEnabled: false,
    panEnabled: false,
    hasNullValues: false,
    barPadForNumericAxis: 0,
    capturedSeriesIndex: -1,
    capturedDataPointIndex: 0,
    markers: { size: [4] },
    initialSeries: [{ data: [10, 20, 30] }],
    ...(overrides.globals || {}),
  }

  const config = {
    chart: { type: 'line' },
    tooltip: {
      shared: true,
      followCursor: false,
      items: { display: 'flex' },
      marker: { show: true, fillColors: undefined },
      fillSeriesColor: false,
      y: { title: { formatter: undefined } },
      x: { formatter: undefined },
      inverseOrder: false,
    },
    xaxis: {
      convertedCatToNumeric: false,
      crosshairs: { width: 'tickWidth' },
      tooltip: { offsetY: 0 },
      offsetY: 0,
    },
    yaxis: [{ opposite: false, tooltip: { offsetX: 0 } }],
    markers: {
      hover: { size: undefined, sizeOffset: 3 },
    },
    plotOptions: {
      bar: { distributed: false },
    },
    ...(overrides.config || {}),
  }

  const w = {
    config,
    globals,
    layout: {
      gridWidth: globals.gridWidth,
      gridHeight: globals.gridHeight,
      translateX: globals.translateX,
      translateY: globals.translateY,
      translateXAxisX: globals.translateXAxisX ?? 0,
      translateXAxisY: globals.translateXAxisY ?? 0,
      rotateXLabels: globals.rotateXLabels ?? false,
      xAxisHeight: globals.xAxisHeight ?? 0,
      xAxisLabelsHeight: globals.xAxisLabelsHeight ?? 0,
      xAxisGroupLabelsHeight: globals.xAxisGroupLabelsHeight ?? 0,
      xAxisLabelsWidth: globals.xAxisLabelsWidth ?? 0,
      yLabelsCoords: globals.yLabelsCoords ?? [],
      yTitleCoords: globals.yTitleCoords ?? [],
      ...(overrides.layout || {}),
    },
    seriesData: {
      series: globals.series,
      seriesNames: globals.seriesNames,
      seriesX: globals.seriesX,
      seriesZ: globals.seriesZ ?? [],
      seriesColors: globals.seriesColors ?? [],
      seriesGoals: globals.seriesGoals ?? [],
      stackedSeriesTotals: globals.stackedSeriesTotals ?? [],
      stackedSeriesTotalsByGroups: globals.stackedSeriesTotalsByGroups ?? [],
      ...(overrides.seriesData || {}),
    },
    axisFlags: {
      isXNumeric: globals.isXNumeric,
      dataFormatXNumeric: globals.dataFormatXNumeric ?? false,
      isDataXYZ: globals.isDataXYZ ?? false,
      isRangeData: globals.isRangeData ?? false,
      isRangeBar: globals.isRangeBar ?? false,
      isMultiLineX: globals.isMultiLineX ?? false,
      noLabelsProvided: globals.noLabelsProvided ?? false,
      dataWasParsed: globals.dataWasParsed ?? false,
      ...(overrides.axisFlags || {}),
    },
    labelData: {
      labels: globals.labels ?? [],
      categoryLabels: globals.categoryLabels ?? [],
      timescaleLabels: globals.timescaleLabels ?? [],
      hasXaxisGroups: globals.hasXaxisGroups ?? false,
      groups: globals.groups ?? [],
      seriesGroups: globals.seriesGroups ?? [],
      ...(overrides.labelData || {}),
    },
    rangeData: {
      seriesRangeStart: globals.seriesRangeStart ?? [],
      seriesRangeEnd: globals.seriesRangeEnd ?? [],
      seriesRange: globals.seriesRange ?? [],
      ...(overrides.rangeData || {}),
    },
    candleData: {
      seriesCandleO: globals.seriesCandleO ?? [],
      seriesCandleH: globals.seriesCandleH ?? [],
      seriesCandleM: globals.seriesCandleM ?? [],
      seriesCandleL: globals.seriesCandleL ?? [],
      seriesCandleC: globals.seriesCandleC ?? [],
      ...(overrides.candleData || {}),
    },
    dom: {
      baseEl: document.createElement('div'),
      ...(overrides.dom || {}),
    },
    formatters: {
      xLabelFormatter: undefined,
      yLabelFormatters: [],
      xaxisTooltipFormatter: undefined,
      ttKeyFormatter: undefined,
      ttVal: undefined,
      ttZFormatter: undefined,
      legendFormatter: undefined,
      ...(overrides.formatters || {}),
    },
  }

  // Install bidirectional shims on globals — mirrors what Base.init() does
  const sliceShims = [
    ['layout', ['gridHeight','gridWidth','translateX','translateY','translateXAxisX',
      'translateXAxisY','rotateXLabels','xAxisHeight','xAxisLabelsHeight',
      'xAxisGroupLabelsHeight','xAxisLabelsWidth','yLabelsCoords','yTitleCoords']],
    ['seriesData', ['series','seriesNames','seriesX','seriesZ','seriesColors','seriesGoals',
      'stackedSeriesTotals','stackedSeriesTotalsByGroups']],
    ['axisFlags', ['isXNumeric','dataFormatXNumeric','isDataXYZ','isRangeData','isRangeBar',
      'isMultiLineX','noLabelsProvided','dataWasParsed']],
    ['labelData', ['labels','categoryLabels','timescaleLabels','hasXaxisGroups','groups','seriesGroups']],
    ['rangeData', ['seriesRangeStart','seriesRangeEnd','seriesRange']],
    ['candleData', ['seriesCandleO','seriesCandleH','seriesCandleM','seriesCandleL','seriesCandleC']],
  ]
  for (const [sliceName, keys] of sliceShims) {
    for (const key of keys) {
      Object.defineProperty(globals, key, {
        get() { return w[sliceName][key] },
        set(v) { w[sliceName][key] = v },
        enumerable: false,
        configurable: true,
      })
    }
  }

  const ttCtx = {
    w,
    ctx: { w },
    tooltipRect: { ttWidth: 100, ttHeight: 50 },
    getElTooltip: vi.fn(() => {
      const el = document.createElement('div')
      el.getBoundingClientRect = () => ({ width: 100, height: 50 })
      return el
    }),
    getElXCrosshairs: vi.fn(() => null),
    getElGrid: vi.fn(() => {
      const el = document.createElement('div')
      el.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        width: 500,
        height: 300,
      })
      return el
    }),
    xcrosshairsWidth: 10,
    xaxisOffY: 0,
    isXAxisTooltipEnabled: false,
    xaxisTooltip: null,
    xaxisTooltipText: null,
    ycrosshairs: null,
    ycrosshairsHidden: null,
    yaxisTTEls: null,
    tooltipTitle: null,
    showTooltipTitle: true,
    allTooltipSeriesGroups: [],
    translateYAxisX: [0],
    marker: { resetPointsSize: vi.fn() },
    tooltipUtil: null,
    ...(overrides.ttCtx || {}),
  }
  ttCtx.ctx.w = w

  return { ttCtx, w }
}

// ---------------------------------------------------------------------------
// TOOLTIP UTILS
// ---------------------------------------------------------------------------

describe('Tooltip.Utils', () => {
  describe('closestInArray', () => {
    // closestInArray starts currIndex=null and only updates when newdiff < diff
    // So the first element is never selected (it sets the baseline diff but not currIndex)
    // Only strictly closer subsequent elements get assigned to currIndex.
    it('returns index of element strictly closer than the first', () => {
      const { ttCtx } = makeTooltipContext()
      const utils = new TooltipUtils(ttCtx)

      // val=18: diff to 10 = 8, diff to 20 = 2 (strictly less) → j=1
      expect(utils.closestInArray(18, [10, 20, 30])).toEqual({ j: 1 })
      // val=28: diff to 10 = 18, diff to 20 = 8 (strictly less) → j=1,
      //         then diff to 30 = 2 (strictly less) → j=2
      expect(utils.closestInArray(28, [10, 20, 30])).toEqual({ j: 2 })
    })

    it('returns null when no element is strictly closer than the first (equal distance)', () => {
      const { ttCtx } = makeTooltipContext()
      const utils = new TooltipUtils(ttCtx)

      // val=10: first element IS the closest, but currIndex starts null
      // and is only updated when newdiff is STRICTLY less — so j stays null
      const result = utils.closestInArray(10, [10, 20, 30])
      expect(result.j).toBeNull()
    })

    it('handles single-element array — returns null (no comparison happens)', () => {
      const { ttCtx } = makeTooltipContext()
      const utils = new TooltipUtils(ttCtx)

      expect(utils.closestInArray(999, [42])).toEqual({ j: null })
    })
  })

  describe('closestInMultiArray', () => {
    it('finds closest point across multiple series (allSeriesHasEqualX=true)', () => {
      const { ttCtx, w } = makeTooltipContext({
        globals: { allSeriesHasEqualX: true },
      })
      w.globals.allSeriesHasEqualX = true
      const utils = new TooltipUtils(ttCtx)

      const Xarrays = [
        [10, 20, 30],
        [10, 20, 30],
      ]
      const Yarrays = [
        [100, 200, 300],
        [150, 250, 350],
      ]

      // hoverX=11 is closest to X=10 (index 0)
      const result = utils.closestInMultiArray(11, 100, Xarrays, Yarrays)
      expect(result.j).toBe(0)
      expect(result.index).toBe(0)
    })

    it('finds closest point using euclidean distance when series have different X (allSeriesHasEqualX=false)', () => {
      const { ttCtx, w } = makeTooltipContext()
      w.globals.allSeriesHasEqualX = false
      const utils = new TooltipUtils(ttCtx)

      const Xarrays = [
        [10, 50],
        [30, 70],
      ]
      const Yarrays = [
        [100, 200],
        [150, 250],
      ]

      // hoverX=32, hoverY=155 → closest to series 1, point 0 (30, 150)
      const result = utils.closestInMultiArray(32, 155, Xarrays, Yarrays)
      expect(result.index).toBe(1)
      expect(result.j).toBe(0)
    })

    it('skips collapsed series', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          collapsedSeriesIndices: [0],
          ancillaryCollapsedSeriesIndices: [],
          allSeriesHasEqualX: true,
        },
      })
      const utils = new TooltipUtils(ttCtx)

      const Xarrays = [
        [10, 20],
        [100, 200],
      ]
      const Yarrays = [
        [10, 20],
        [100, 200],
      ]

      // Series 0 is collapsed, so closest point must come from series 1
      const result = utils.closestInMultiArray(15, 15, Xarrays, Yarrays)
      expect(result.index).toBe(1)
    })

    it('returns null index/j when all series are collapsed', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          collapsedSeriesIndices: [0, 1],
          ancillaryCollapsedSeriesIndices: [],
          allSeriesHasEqualX: true,
        },
      })
      const utils = new TooltipUtils(ttCtx)

      const result = utils.closestInMultiArray(
        10,
        10,
        [[10], [20]],
        [[10], [20]],
      )
      expect(result.index).toBeNull()
      expect(result.j).toBeNull()
    })

    it('returns null when arrays are empty', () => {
      const { ttCtx } = makeTooltipContext()
      const utils = new TooltipUtils(ttCtx)

      const result = utils.closestInMultiArray(10, 10, [[], []], [[], []])
      expect(result.index).toBeNull()
      expect(result.j).toBeNull()
    })
  })

  describe('isXoverlap', () => {
    it('returns true when all series have the same X at index j', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          seriesX: [
            [10, 20, 30],
            [10, 20, 30],
          ],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isXoverlap(0)).toBe(true)
      expect(utils.isXoverlap(1)).toBe(true)
    })

    it('returns false when series have different X at index j', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          seriesX: [
            [10, 20, 30],
            [15, 25, 35],
          ],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isXoverlap(0)).toBe(false)
    })

    it('returns true when only one series exists', () => {
      const { ttCtx } = makeTooltipContext({
        globals: { seriesX: [[10, 20, 30]] },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isXoverlap(0)).toBe(true)
    })

    it('returns true when seriesX is empty', () => {
      const { ttCtx } = makeTooltipContext({
        globals: { seriesX: [] },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isXoverlap(0)).toBe(true)
    })

    it('filters out series with undefined first element', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          seriesX: [
            [undefined, 20],
            [10, 20],
          ],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      // Only [10, 20] remains after filtering, so no comparison → true
      expect(utils.isXoverlap(1)).toBe(true)
    })
  })

  describe('isInitialSeriesSameLen', () => {
    it('returns true when all series have equal length', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          initialSeries: [{ data: [1, 2, 3] }, { data: [4, 5, 6] }],
          collapsedSeriesIndices: [],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isInitialSeriesSameLen()).toBe(true)
    })

    it('returns false when series have different lengths', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          initialSeries: [{ data: [1, 2, 3] }, { data: [4, 5] }],
          collapsedSeriesIndices: [],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isInitialSeriesSameLen()).toBe(false)
    })

    it('returns true when only one series exists', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          initialSeries: [{ data: [1, 2, 3] }],
          collapsedSeriesIndices: [],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isInitialSeriesSameLen()).toBe(true)
    })

    it('ignores collapsed series when comparing lengths', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          initialSeries: [
            { data: [1, 2, 3] },
            { data: [4, 5] }, // collapsed — should be ignored
            { data: [7, 8, 9] },
          ],
          collapsedSeriesIndices: [1],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isInitialSeriesSameLen()).toBe(true)
    })

    it('returns true for empty initialSeries', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          initialSeries: [],
          collapsedSeriesIndices: [],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      expect(utils.isInitialSeriesSameLen()).toBe(true)
    })
  })

  describe('getFirstActiveXArray', () => {
    it('returns index of first non-empty, non-collapsed series', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          collapsedSeriesIndices: [0],
          ancillaryCollapsedSeriesIndices: [],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      const Xarrays = [[], [10, 20], [30, 40]]
      // Series 0 has no data, series 1 is collapsed, series 2 wins
      // But collapsedSeriesIndices = [0], series 0 is both empty and collapsed
      // series 1 is not collapsed → returns 1
      expect(utils.getFirstActiveXArray(Xarrays)).toBe(1)
    })

    it('returns 0 when all series are active', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          collapsedSeriesIndices: [],
          ancillaryCollapsedSeriesIndices: [],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      const Xarrays = [
        [10, 20],
        [30, 40],
      ]
      expect(utils.getFirstActiveXArray(Xarrays)).toBe(0)
    })

    it('skips empty series arrays', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          collapsedSeriesIndices: [],
          ancillaryCollapsedSeriesIndices: [],
        },
      })
      const utils = new TooltipUtils(ttCtx)

      const Xarrays = [[], [], [10, 20]]
      expect(utils.getFirstActiveXArray(Xarrays)).toBe(2)
    })
  })

  describe('getHoverMarkerSize', () => {
    it('returns explicit hover.size when defined', () => {
      const { ttCtx, w } = makeTooltipContext({
        config: { markers: { hover: { size: 8, sizeOffset: 3 } } },
        globals: { markers: { size: [4] } },
      })
      w.config.markers.hover.size = 8
      const utils = new TooltipUtils(ttCtx)

      expect(utils.getHoverMarkerSize(0)).toBe(8)
    })

    it('returns base size + sizeOffset when hover.size is undefined', () => {
      const { ttCtx, w } = makeTooltipContext({
        globals: { markers: { size: [4] } },
      })
      w.config.markers.hover.size = undefined
      w.config.markers.hover.sizeOffset = 3
      const utils = new TooltipUtils(ttCtx)

      expect(utils.getHoverMarkerSize(0)).toBe(7) // 4 + 3
    })

    it('uses the correct series index for base size', () => {
      const { ttCtx, w } = makeTooltipContext({
        globals: { markers: { size: [2, 6, 10] } },
      })
      w.config.markers.hover.size = undefined
      w.config.markers.hover.sizeOffset = 2
      const utils = new TooltipUtils(ttCtx)

      expect(utils.getHoverMarkerSize(0)).toBe(4) // 2 + 2
      expect(utils.getHoverMarkerSize(1)).toBe(8) // 6 + 2
      expect(utils.getHoverMarkerSize(2)).toBe(12) // 10 + 2
    })
  })
})

// ---------------------------------------------------------------------------
// TOOLTIP LABELS (pure methods only)
// ---------------------------------------------------------------------------

describe('Tooltip.Labels', () => {
  describe('getFormatters', () => {
    it('returns identity functions when no formatter is configured', () => {
      const { ttCtx } = makeTooltipContext()
      const labels = new TooltipLabels(ttCtx)

      const { yLbFormatter, yLbTitleFormatter } = labels.getFormatters(0)
      expect(yLbFormatter('hello')).toBe('hello')
      expect(yLbTitleFormatter('Name')).toBe('Name: ')
    })

    it('returns empty string from yLbTitleFormatter when label is falsy', () => {
      const { ttCtx } = makeTooltipContext()
      const labels = new TooltipLabels(ttCtx)

      const { yLbTitleFormatter } = labels.getFormatters(0)
      expect(yLbTitleFormatter('')).toBe('')
      expect(yLbTitleFormatter(null)).toBe('')
      expect(yLbTitleFormatter(undefined)).toBe('')
    })

    it('uses yLabelFormatters[i] from w.formatters', () => {
      const { ttCtx, w } = makeTooltipContext()
      const customFmt = (val) => `$${val}`
      w.formatters.yLabelFormatters = [customFmt]
      const labels = new TooltipLabels(ttCtx)

      const { yLbFormatter } = labels.getFormatters(0)
      expect(yLbFormatter(42)).toBe('$42')
    })

    it('falls back to yLabelFormatters[0] when index formatter is missing', () => {
      const { ttCtx, w } = makeTooltipContext()
      const fallbackFmt = (val) => `€${val}`
      w.formatters.yLabelFormatters = [fallbackFmt]
      const labels = new TooltipLabels(ttCtx)

      // Index 2 has no formatter — should fall back to index 0
      const { yLbFormatter } = labels.getFormatters(2)
      expect(yLbFormatter(10)).toBe('€10')
    })

    it('uses custom ttVal formatter (object form)', () => {
      const { ttCtx, w } = makeTooltipContext()
      const customFmt = (val) => `[${val}]`
      const customTitleFmt = (label) => `>> ${label}`
      w.formatters.ttVal = {
        formatter: customFmt,
        title: { formatter: customTitleFmt },
      }
      const labels = new TooltipLabels(ttCtx)

      const { yLbFormatter, yLbTitleFormatter } = labels.getFormatters(0)
      expect(yLbFormatter(5)).toBe('[5]')
      expect(yLbTitleFormatter('Series')).toBe('>> Series')
    })

    it('uses custom ttVal formatter (array form)', () => {
      const { ttCtx, w } = makeTooltipContext()
      const fmt0 = (val) => `A:${val}`
      const fmt1 = (val) => `B:${val}`
      w.formatters.ttVal = [
        { formatter: fmt0, title: { formatter: (l) => `Title0:${l}` } },
        { formatter: fmt1, title: { formatter: (l) => `Title1:${l}` } },
      ]
      const labels = new TooltipLabels(ttCtx)

      const f0 = labels.getFormatters(0)
      const f1 = labels.getFormatters(1)

      expect(f0.yLbFormatter(10)).toBe('A:10')
      expect(f1.yLbFormatter(20)).toBe('B:20')
    })

    it('uses config.tooltip.y.title.formatter when ttVal is undefined', () => {
      const { ttCtx, w } = makeTooltipContext()
      const titleFmt = (label) => `-- ${label} --`
      w.config.tooltip.y.title.formatter = titleFmt
      const labels = new TooltipLabels(ttCtx)

      const { yLbTitleFormatter } = labels.getFormatters(0)
      expect(yLbTitleFormatter('MySeries')).toBe('-- MySeries --')
    })
  })

  describe('getSeriesName', () => {
    it('calls the formatter with series context', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          seriesNames: ['Revenue', 'Expenses'],
          series: [
            [10, 20],
            [30, 40],
          ],
        },
      })
      const labels = new TooltipLabels(ttCtx)

      const fn = vi.fn((name) => name.toUpperCase())
      const result = labels.getSeriesName({
        fn,
        index: 0,
        seriesIndex: 0,
        j: 1,
      })

      expect(fn).toHaveBeenCalledWith(
        'Revenue',
        expect.objectContaining({
          seriesIndex: 0,
          dataPointIndex: 1,
        }),
      )
      expect(result).toBe('REVENUE')
    })

    it('passes j as dataPointIndex', () => {
      const { ttCtx } = makeTooltipContext({
        globals: {
          seriesNames: ['Alpha'],
          series: [[5, 10, 15]],
        },
      })
      const labels = new TooltipLabels(ttCtx)

      let capturedArgs = null
      const fn = (name, args) => {
        capturedArgs = args
        return name
      }
      labels.getSeriesName({ fn, index: 0, seriesIndex: 0, j: 2 })

      expect(capturedArgs.dataPointIndex).toBe(2)
    })
  })
})

// ---------------------------------------------------------------------------
// TOOLTIP POSITION (pure math methods)
// ---------------------------------------------------------------------------

describe('Tooltip.Position', () => {
  describe('moveTooltip', () => {
    function makePosition(overrides = {}) {
      const { ttCtx, w } = makeTooltipContext(overrides)

      // Give the tooltip element real style tracking
      const tooltipEl = document.createElement('div')
      tooltipEl.getBoundingClientRect = () => ({ width: 100, height: 50 })
      ttCtx.getElTooltip = vi.fn(() => tooltipEl)
      ttCtx.tooltipRect = { ttWidth: 100, ttHeight: 50 }

      const pos = new TooltipPosition(ttCtx)
      return { pos, ttCtx, w, tooltipEl }
    }

    it('positions tooltip to the right of the point by default', () => {
      const { pos, tooltipEl, w } = makePosition()
      w.globals.gridWidth = 500
      w.globals.translateX = 0
      w.config.tooltip.followCursor = false

      pos.moveTooltip(50, 50, 5)

      // x = 50 + 5 + 5 = 60; 60 < 250 (gridWidth/2), no flip
      expect(parseFloat(tooltipEl.style.left)).toBe(60)
    })

    it('flips tooltip to left when cx > gridWidth/2', () => {
      const { pos, tooltipEl, w } = makePosition()
      w.globals.gridWidth = 500
      w.globals.translateX = 0
      w.config.tooltip.followCursor = false
      w.globals.isBarHorizontal = false

      pos.moveTooltip(300, 50, 5)

      // x = 300 + 5 + 5 = 310 > 250 → x = 310 - 100 - 5 - 10 = 195
      expect(parseFloat(tooltipEl.style.left)).toBe(195)
    })

    it('clamps x to -20 minimum', () => {
      const { pos, tooltipEl, w } = makePosition()
      w.globals.gridWidth = 500
      w.globals.translateX = 0
      w.config.tooltip.followCursor = false
      // Make markerSize 0 → x = cx + 0 + 5 = 5; 5 < 250 so no flip
      // But if cx is very negative we should clamp
      // cx = -100, markerSize = 5: x = -100 + 5 + 5 = -90 < -20 → x = -20
      pos.moveTooltip(-100, 50, 5)

      expect(parseFloat(tooltipEl.style.left)).toBe(-20)
    })

    it('clamps x to gridWidth - ttWidth when near right edge', () => {
      const { pos, tooltipEl, w } = makePosition()
      w.globals.gridWidth = 500
      w.globals.translateX = 0
      w.globals.isBarHorizontal = false
      w.config.tooltip.followCursor = false
      w.ttCtx = undefined

      // cx=420, markerSize=5 → x=430 > 250 → flip: x=430-100-5-10=315
      // 315 < 500-100-10=390 so no further clamping
      pos.moveTooltip(420, 50, 5)
      const left = parseFloat(tooltipEl.style.left)
      expect(left).toBeLessThanOrEqual(500 - 100) // at most gridWidth - ttWidth
    })

    it('applies translateX offset', () => {
      const { pos, tooltipEl, w } = makePosition()
      w.globals.gridWidth = 500
      w.globals.translateX = 30
      w.config.tooltip.followCursor = false

      pos.moveTooltip(50, 50, 5)

      // x = 50 + 5 + 5 = 60 → +translateX(30) = 90
      expect(parseFloat(tooltipEl.style.left)).toBe(90)
    })

    it('defaults markerSize to 1 when null', () => {
      const { pos, tooltipEl, w } = makePosition()
      w.globals.gridWidth = 500
      w.globals.translateX = 0
      w.config.tooltip.followCursor = false

      pos.moveTooltip(50, 100, null)

      // pointSize = 1, x = 50 + 1 + 5 = 56
      expect(parseFloat(tooltipEl.style.left)).toBe(56)
    })
  })

  describe('moveXCrosshairs', () => {
    it('sets crosshair x based on cx when j is null', () => {
      const { ttCtx, w } = makeTooltipContext()

      const xcrosshairs = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      ttCtx.getElXCrosshairs = vi.fn(() => xcrosshairs)
      ttCtx.xcrosshairsWidth = 10
      w.globals.isBarHorizontal = false
      w.globals.gridWidth = 500
      w.globals.gridHeight = 300
      w.globals.labels = ['A', 'B', 'C']
      ttCtx.isXAxisTooltipEnabled = false

      const pos = new TooltipPosition(ttCtx)
      pos.moveXCrosshairs(100, null)

      // x = 100 - 10/2 = 95
      expect(xcrosshairs.getAttribute('x')).toBe('95')
    })

    it('sets crosshair x based on j index when j is provided', () => {
      const { ttCtx, w } = makeTooltipContext()

      const xcrosshairs = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      ttCtx.getElXCrosshairs = vi.fn(() => xcrosshairs)
      ttCtx.xcrosshairsWidth = 10
      w.globals.isBarHorizontal = false
      w.globals.gridWidth = 300
      w.globals.gridHeight = 300
      w.globals.labels = ['A', 'B', 'C'] // tickAmount = 3
      ttCtx.isXAxisTooltipEnabled = false

      const pos = new TooltipPosition(ttCtx)
      pos.moveXCrosshairs(0, 1) // j=1 → x = (300/3)*1 = 100

      expect(xcrosshairs.getAttribute('x')).toBe('100')
    })

    it('adds apexcharts-active class to crosshair', () => {
      const { ttCtx, w } = makeTooltipContext()

      const xcrosshairs = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      ttCtx.getElXCrosshairs = vi.fn(() => xcrosshairs)
      ttCtx.xcrosshairsWidth = 0
      w.globals.isBarHorizontal = false
      w.globals.gridWidth = 500
      w.globals.gridHeight = 300
      w.globals.labels = ['A', 'B']
      ttCtx.isXAxisTooltipEnabled = false

      const pos = new TooltipPosition(ttCtx)
      pos.moveXCrosshairs(50, null)

      expect(xcrosshairs.classList.contains('apexcharts-active')).toBe(true)
    })

    it('does not set crosshair when isBarHorizontal is true', () => {
      const { ttCtx, w } = makeTooltipContext()

      const xcrosshairs = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      const setSpy = vi.spyOn(xcrosshairs, 'setAttribute')
      ttCtx.getElXCrosshairs = vi.fn(() => xcrosshairs)
      w.globals.isBarHorizontal = true
      w.globals.gridWidth = 500
      w.globals.gridHeight = 300
      w.globals.labels = ['A', 'B']
      ttCtx.isXAxisTooltipEnabled = false

      const pos = new TooltipPosition(ttCtx)
      pos.moveXCrosshairs(100, null)

      expect(setSpy).not.toHaveBeenCalled()
    })

    it('skips when xcrosshairs element is null', () => {
      const { ttCtx, w } = makeTooltipContext()
      ttCtx.getElXCrosshairs = vi.fn(() => null)
      w.globals.gridWidth = 500
      w.globals.labels = ['A']
      ttCtx.isXAxisTooltipEnabled = false

      const pos = new TooltipPosition(ttCtx)
      // Should not throw
      expect(() => pos.moveXCrosshairs(100, null)).not.toThrow()
    })
  })

  describe('moveYCrosshairs', () => {
    it('updates y1/y2 on both crosshair elements', () => {
      const { ttCtx } = makeTooltipContext()

      const ycrosshairs = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      const ycrosshairsHidden = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line',
      )
      ttCtx.ycrosshairs = ycrosshairs
      ttCtx.ycrosshairsHidden = ycrosshairsHidden

      const pos = new TooltipPosition(ttCtx)
      pos.moveYCrosshairs(150)

      expect(ycrosshairs.getAttribute('y1')).toBe('150')
      expect(ycrosshairs.getAttribute('y2')).toBe('150')
      expect(ycrosshairsHidden.getAttribute('y1')).toBe('150')
      expect(ycrosshairsHidden.getAttribute('y2')).toBe('150')
    })

    it('skips when ycrosshairs is null', () => {
      const { ttCtx } = makeTooltipContext()
      ttCtx.ycrosshairs = null
      ttCtx.ycrosshairsHidden = null

      const pos = new TooltipPosition(ttCtx)
      expect(() => pos.moveYCrosshairs(100)).not.toThrow()
    })
  })
})

// ---------------------------------------------------------------------------
// INTEGRATION TESTS — full chart rendering
// ---------------------------------------------------------------------------

describe('Tooltip integration (chart rendering)', () => {
  function lineChart(opts = {}) {
    return createChartWithOptions({
      chart: { type: 'line', ...opts.chart },
      series: opts.series || [{ name: 'Series 1', data: [10, 20, 30] }],
      xaxis: opts.xaxis || { categories: ['Jan', 'Feb', 'Mar'] },
      tooltip: opts.tooltip || {},
      ...opts.extra,
    })
  }

  it('renders the tooltip container element', () => {
    const chart = lineChart()
    const tooltip = chart.el.querySelector('.apexcharts-tooltip')
    expect(tooltip).not.toBeNull()
  })

  it('tooltip has ARIA role=tooltip', () => {
    const chart = lineChart()
    const tooltip = chart.el.querySelector('.apexcharts-tooltip')
    expect(tooltip.getAttribute('role')).toBe('tooltip')
  })

  it('tooltip has aria-hidden initially', () => {
    const chart = lineChart()
    const tooltip = chart.el.querySelector('.apexcharts-tooltip')
    expect(tooltip.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders tooltip series groups matching series count (shared)', () => {
    const chart = lineChart({
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [4, 5, 6] },
      ],
      tooltip: { shared: true },
    })
    const groups = chart.el.querySelectorAll('.apexcharts-tooltip-series-group')
    expect(groups.length).toBe(2)
  })

  it('renders tooltip title element', () => {
    const chart = lineChart()
    const title = chart.el.querySelector('.apexcharts-tooltip-title')
    expect(title).not.toBeNull()
  })

  it('renders tooltip y-label and y-value elements per series', () => {
    const chart = lineChart()
    const yLabels = chart.el.querySelectorAll(
      '.apexcharts-tooltip-text-y-label',
    )
    const yValues = chart.el.querySelectorAll(
      '.apexcharts-tooltip-text-y-value',
    )
    expect(yLabels.length).toBeGreaterThan(0)
    expect(yValues.length).toBeGreaterThan(0)
  })

  it('renders marker element inside tooltip series group', () => {
    const chart = lineChart()
    const marker = chart.el.querySelector('.apexcharts-tooltip-marker')
    expect(marker).not.toBeNull()
  })

  it('renders x-axis tooltip element when xaxis tooltip enabled', () => {
    const chart = lineChart({
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar'],
        tooltip: { enabled: true },
      },
    })
    const xaxisTooltip = chart.el.querySelector('.apexcharts-xaxistooltip')
    expect(xaxisTooltip).not.toBeNull()
  })

  it('does not render x-axis tooltip when disabled', () => {
    const chart = lineChart({
      xaxis: {
        categories: ['Jan', 'Feb'],
        tooltip: { enabled: false },
      },
    })
    const xaxisTooltip = chart.el.querySelector('.apexcharts-xaxistooltip')
    expect(xaxisTooltip).toBeNull()
  })

  it('applies custom tooltip when config.tooltip.custom is a function', () => {
    const customFn = vi.fn(
      ({ series, seriesIndex, dataPointIndex }) =>
        `<div class="custom-tt">val: ${series[seriesIndex][dataPointIndex]}</div>`,
    )

    const chart = lineChart({
      tooltip: { custom: customFn },
    })

    // The tooltip element should be rendered
    const tooltip = chart.el.querySelector('.apexcharts-tooltip')
    expect(tooltip).not.toBeNull()
  })

  it('renders correct number of groups for multi-series chart', () => {
    const chart = lineChart({
      series: [
        { name: 'X', data: [1, 2] },
        { name: 'Y', data: [3, 4] },
        { name: 'Z', data: [5, 6] },
      ],
    })
    const groups = chart.el.querySelectorAll('.apexcharts-tooltip-series-group')
    expect(groups.length).toBe(3)
  })

  it('bar chart renders tooltip container', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ name: 'Sales', data: [30, 40, 50] }],
    })
    const tooltip = chart.el.querySelector('.apexcharts-tooltip')
    expect(tooltip).not.toBeNull()
  })

  it('pie chart renders tooltip container', () => {
    const chart = createChartWithOptions({
      chart: { type: 'pie' },
      series: [44, 55, 13],
      labels: ['A', 'B', 'C'],
    })
    const tooltip = chart.el.querySelector('.apexcharts-tooltip')
    expect(tooltip).not.toBeNull()
  })

  it('tooltip with inverseOrder renders correct group count', () => {
    const chart = lineChart({
      series: [
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [3, 4] },
      ],
      tooltip: { inverseOrder: true },
    })
    const groups = chart.el.querySelectorAll('.apexcharts-tooltip-series-group')
    expect(groups.length).toBe(2)
  })
})
