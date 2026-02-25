import { describe, it, expect } from 'vitest'
import DimGrid from '../../src/modules/dimensions/Grid.js'
import DimYAxis from '../../src/modules/dimensions/YAxis.js'
import Helpers from '../../src/modules/dimensions/Helpers.js'
import Dimensions from '../../src/modules/dimensions/Dimensions.js'
import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal but realistic `dCtx` (Dimensions context) so that
 * individual dimension sub-classes can be tested without rendering a chart.
 *
 * Only the properties that the methods under test actually access are present.
 */
function makeDimCtx(overrides = {}) {
  // yaxis config entries — extend per test as needed
  const yaxis = overrides.yaxis || [
    {
      show: true,
      floating: false,
      opposite: false,
      labels: {
        show: true,
        minWidth: 0,
        maxWidth: 160,
        style: { fontSize: '12px', fontFamily: 'Helvetica' },
        rotate: 0,
        offsetX: 0,
        offsetY: 0,
      },
      title: {
        text: undefined,
        rotate: -90,
        style: { fontSize: '12px', fontFamily: 'Helvetica' },
      },
    },
  ]

  const globals = {
    // series / data
    series: [[10, 20, 30]],
    seriesNames: ['Series 1'],
    labels: ['Jan', 'Feb', 'Mar'],
    categoryLabels: [],
    timescaleLabels: [],
    groups: [],

    // axis meta
    isXNumeric: false,
    isBarHorizontal: false,
    isMultiLineX: false,
    hasXaxisGroups: false,
    rotateXLabels: false,
    overlappingXLabels: false,
    isSlopeChart: false,
    axisCharts: true,

    // scale
    yAxisScale: [{ result: [0, 10, 20, 30], niceMin: 0, niceMax: 30 }],
    yLabelFormatters: [(v) => String(v)],
    xLabelFormatter: (v) => String(v),

    // layout
    svgWidth: 600,
    svgHeight: 400,
    gridWidth: 500,
    gridHeight: 340,
    translateX: 50,
    translateY: 10,
    xAxisLabelsHeight: 0,
    xAxisGroupLabelsHeight: 0,
    xAxisLabelsWidth: 0,
    xAxisHeight: 0,

    // series collapse / combo
    noData: false,
    collapsedSeries: [],
    collapsedSeriesIndices: [],
    ancillaryCollapsedSeries: [],
    ancillaryCollapsedSeriesIndices: [],
    comboBarCount: 0,

    // numeric axis
    initialMinX: 0,
    initialMaxX: 100,
    minXDiff: 10,
    dataPoints: 3,
    barPadForNumericAxis: 0,

    // y axis positioning
    yLabelsCoords: [{ width: 40, index: 0 }],
    yTitleCoords: [{ width: 0, index: 0 }],
    ignoreYAxisIndexes: [],

    // seriesYAxisMap: required by AxesUtils.isYAxisHidden → [[0], [1], ...]
    seriesYAxisMap: [[0]],

    // legend/dom
    dom: {
      baseEl: document.createElement('div'),
      elLegendWrap: (() => {
        const el = document.createElement('div')
        // Utils.getBoundingClientRect reads clientWidth/clientHeight, not getBoundingClientRect
        Object.defineProperty(el, 'clientWidth', {
          get: () => 120,
          configurable: true,
        })
        Object.defineProperty(el, 'clientHeight', {
          get: () => 20,
          configurable: true,
        })
        return el
      })(),
      elWrap: (() => {
        const el = document.createElement('div')
        el.getBoundingClientRect = () => ({ width: 600 })
        return el
      })(),
    },

    LINE_HEIGHT_RATIO: 1.618,
    ...(overrides.globals || {}),
  }

  const config = {
    chart: {
      type: 'line',
      height: 400,
      sparkline: { enabled: false },
      stacked: false,
    },
    series: [{ data: [10, 20, 30] }],
    xaxis: {
      type: 'category',
      convertedCatToNumeric: false,
      floating: false,
      position: 'bottom',
      labels: {
        show: true,
        rotate: -45,
        rotateAlways: false,
        style: { fontSize: '12px', fontFamily: 'Helvetica' },
        minHeight: undefined,
        maxHeight: 120,
        offsetX: 0,
        offsetY: 0,
        trim: false,
      },
      title: {
        text: undefined,
        style: { fontSize: '12px', fontFamily: 'Helvetica' },
      },
      axisTicks: { height: 6 },
      group: {},
    },
    yaxis,
    legend: {
      show: true,
      floating: false,
      position: 'bottom',
      height: undefined,
    },
    grid: {
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    stroke: { width: 2 },
    markers: { size: 0, discrete: [], hover: { sizeOffset: 3 } },
    plotOptions: {
      bar: { columnWidth: '70%', distributed: false },
      pie: { offsetX: 0, offsetY: 0 },
      radialBar: { offsetX: 0, offsetY: 0 },
      polarArea: { offsetX: 0, offsetY: 0 },
    },
    title: { text: undefined, floating: false, margin: 5 },
    subtitle: { text: undefined, floating: false, margin: 5 },
    dataLabels: {
      formatter: (v) => String(v),
      style: { fontSize: '12px', fontFamily: 'Helvetica' },
    },
    ...(overrides.config || {}),
  }

  const w = { config, globals }

  // A minimal ctx that sub-classes may forward to Graphics etc.
  const ctx = { w }

  const dCtx = {
    w,
    ctx,
    isSparkline: config.chart.sparkline.enabled,
    lgRect: { x: 0, y: 0, width: 120, height: 20 },
    lgWidthForSideLegends: 0,
    yAxisWidth: 50,
    yAxisWidthLeft: 50,
    yAxisWidthRight: 0,
    xAxisWidth: 0,
    xPadRight: 0,
    xPadLeft: 0,
    gridPad: config.grid.padding,
    timescaleLabels: [],
    dimHelpers: null, // set below
    ...(overrides.dCtx || {}),
  }

  // Wire up helpers so sub-classes can call them
  dCtx.dimHelpers = new Helpers(dCtx)

  return { dCtx, w, ctx }
}

// ---------------------------------------------------------------------------
// DimGrid
// ---------------------------------------------------------------------------

describe('DimGrid', () => {
  describe('gridPadForColumnsInNumericAxis', () => {
    it('returns 0 when noData is true', () => {
      const { dCtx, w } = makeDimCtx({ globals: { noData: true } })
      w.globals.noData = true
      const grid = new DimGrid(dCtx)
      expect(grid.gridPadForColumnsInNumericAxis(500)).toBe(0)
    })

    it('returns 0 when all series are collapsed', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.series = [{ data: [1, 2] }, { data: [3, 4] }]
      w.globals.collapsedSeries = [{ type: 'bar' }]
      w.globals.ancillaryCollapsedSeries = [{ type: 'bar' }]
      const grid = new DimGrid(dCtx)
      // 2 series, 2 collapsed → 0 active
      expect(grid.gridPadForColumnsInNumericAxis(500)).toBe(0)
    })

    it('returns 0 for non-bar chart type on numeric axis', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.chart.type = 'line'
      w.globals.isXNumeric = true
      w.globals.isBarHorizontal = false
      w.globals.initialMinX = 0
      w.globals.initialMaxX = 100
      w.globals.minXDiff = 10
      const grid = new DimGrid(dCtx)
      // line charts have no bar — barWidth should stay 0
      expect(grid.gridPadForColumnsInNumericAxis(500)).toBe(0)
    })

    it('returns positive barWidth for a bar chart on numeric X axis', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.chart.type = 'bar'
      w.config.plotOptions.bar.columnWidth = '70%'
      w.globals.isXNumeric = true
      w.globals.isBarHorizontal = false
      w.globals.initialMinX = 0
      w.globals.initialMaxX = 100
      w.globals.minXDiff = 25
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.config.series = [{ data: [1, 2, 3, 4, 5] }]
      const grid = new DimGrid(dCtx)
      const pad = grid.gridPadForColumnsInNumericAxis(500)
      expect(pad).toBeGreaterThan(0)
      // Also confirm global was updated
      expect(w.globals.barPadForNumericAxis).toBe(pad)
    })

    it('halves xDivision when it exceeds half the gridWidth', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.chart.type = 'bar'
      w.config.plotOptions.bar.columnWidth = '100%'
      w.globals.isXNumeric = true
      w.globals.isBarHorizontal = false
      // Very wide division: xRange=2, so xRatio = 2/100 = 0.02
      // minXDiff=50 → xDivision = 50/0.02 = 2500 >> gridWidth/2=50 → halved
      w.globals.initialMinX = 0
      w.globals.initialMaxX = 2
      w.globals.minXDiff = 50
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.config.series = [{ data: [1, 2] }]
      const grid = new DimGrid(dCtx)
      // Should not throw and should return a reasonable barWidth ≥ 1
      const pad = grid.gridPadForColumnsInNumericAxis(100)
      expect(pad).toBeGreaterThanOrEqual(1)
    })

    it('clamps barWidth to minimum of 1 when computed value rounds to 0', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.chart.type = 'bar'
      w.config.plotOptions.bar.columnWidth = '1%' // tiny percentage
      w.globals.isXNumeric = true
      w.globals.isBarHorizontal = false
      w.globals.initialMinX = 0
      w.globals.initialMaxX = 1000
      w.globals.minXDiff = 1
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.config.series = [{ data: [1, 2, 3] }]
      const grid = new DimGrid(dCtx)
      const pad = grid.gridPadForColumnsInNumericAxis(500)
      expect(pad).toBeGreaterThanOrEqual(1)
    })

    it('uses seriesLen=1 when chart is stacked', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.chart.type = 'bar'
      w.config.chart.stacked = true
      w.config.plotOptions.bar.columnWidth = '70%'
      w.globals.isXNumeric = true
      w.globals.isBarHorizontal = false
      w.globals.initialMinX = 0
      w.globals.initialMaxX = 100
      w.globals.minXDiff = 25
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.config.series = [{ data: [1, 2] }, { data: [3, 4] }]
      const grid = new DimGrid(dCtx)
      const pad = grid.gridPadForColumnsInNumericAxis(500)
      // Still a valid pad since stacked reduces seriesLen to 1 but bars still exist
      expect(pad).toBeGreaterThan(0)
    })

    it('uses comboBarCount when comboBarCount > 0', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.chart.type = 'line' // main type is line…
      w.globals.comboBarCount = 2 // …but 2 bar series in combo
      w.config.plotOptions.bar.columnWidth = '70%'
      w.globals.isXNumeric = true
      w.globals.isBarHorizontal = false
      w.globals.initialMinX = 0
      w.globals.initialMaxX = 100
      w.globals.minXDiff = 25
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.config.series = [{ data: [1, 2] }, { data: [3, 4] }]
      const grid = new DimGrid(dCtx)
      const pad = grid.gridPadForColumnsInNumericAxis(500)
      expect(pad).toBeGreaterThan(0)
    })

    it('returns 0 for horizontal bar chart', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.chart.type = 'bar'
      w.globals.isXNumeric = true
      w.globals.isBarHorizontal = true // horizontal bars skip the padding
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.config.series = [{ data: [1, 2, 3] }]
      const grid = new DimGrid(dCtx)
      expect(grid.gridPadForColumnsInNumericAxis(500)).toBe(0)
    })
  })

  describe('setGridXPosForDualYAxis', () => {
    // AxesUtils.isYAxisHidden calls gl.seriesYAxisMap[index].some(...)
    // so we must include seriesYAxisMap in globals for each yaxis entry.

    it('reduces translateX for an opposite (right-side) Y axis', () => {
      const { dCtx, w } = makeDimCtx({
        yaxis: [
          {
            show: true,
            floating: false,
            opposite: true,
            labels: {
              show: true,
              minWidth: 0,
              maxWidth: 160,
              style: { fontSize: '12px', fontFamily: 'Helvetica' },
              rotate: 0,
            },
            title: { text: undefined },
          },
        ],
        globals: {
          // seriesYAxisMap must have an entry for each yaxis (axis 0 → series [0])
          seriesYAxisMap: [[0]],
          collapsedSeriesIndices: [],
        },
      })
      w.globals.translateX = 100
      w.globals.ignoreYAxisIndexes = []

      const yTitleCoords = [{ width: 10, index: 0 }]
      const yaxisLabelCoords = [{ width: 40, index: 0 }]

      const grid = new DimGrid(dCtx)
      grid.setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords)

      // translateX should decrease because of opposite axis padding
      expect(w.globals.translateX).toBeLessThan(100)
    })

    it('clamps translateX to minimum of 2', () => {
      const { dCtx, w } = makeDimCtx({
        yaxis: [
          {
            show: true,
            floating: false,
            opposite: true,
            labels: {
              show: true,
              style: { fontSize: '48px', fontFamily: 'Helvetica' }, // huge font → big reduction
            },
            title: { text: undefined },
          },
        ],
        globals: {
          seriesYAxisMap: [[0]],
          collapsedSeriesIndices: [],
        },
      })
      w.globals.translateX = 10 // very small starting value
      w.globals.ignoreYAxisIndexes = []

      const yTitleCoords = [{ width: 500, index: 0 }] // unrealistically wide
      const yaxisLabelCoords = [{ width: 500, index: 0 }]

      const grid = new DimGrid(dCtx)
      grid.setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords)

      // Must never go below 2
      expect(w.globals.translateX).toBe(2)
    })

    it('does not modify translateX for a non-opposite left Y axis', () => {
      const { dCtx, w } = makeDimCtx({
        yaxis: [
          {
            show: true,
            floating: false,
            opposite: false, // left axis — no adjustment
            labels: {
              show: true,
              style: { fontSize: '12px', fontFamily: 'Helvetica' },
            },
            title: { text: undefined },
          },
        ],
        globals: {
          seriesYAxisMap: [[0]],
          collapsedSeriesIndices: [],
        },
      })
      w.globals.translateX = 60
      w.globals.ignoreYAxisIndexes = []

      const yTitleCoords = [{ width: 0, index: 0 }]
      const yaxisLabelCoords = [{ width: 40, index: 0 }]

      const grid = new DimGrid(dCtx)
      grid.setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords)

      expect(w.globals.translateX).toBe(60)
    })

    it('skips ignored Y axis indexes', () => {
      const { dCtx, w } = makeDimCtx({
        yaxis: [
          {
            show: true,
            floating: false,
            opposite: true,
            labels: {
              show: true,
              style: { fontSize: '12px', fontFamily: 'Helvetica' },
            },
            title: { text: undefined },
          },
        ],
        globals: {
          seriesYAxisMap: [[0]],
          collapsedSeriesIndices: [],
        },
      })
      w.globals.translateX = 80
      w.globals.ignoreYAxisIndexes = [0] // axis 0 is in the ignore list

      const yTitleCoords = [{ width: 30, index: 0 }]
      const yaxisLabelCoords = [{ width: 40, index: 0 }]

      const grid = new DimGrid(dCtx)
      grid.setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords)

      // ignored axis → no change to translateX
      expect(w.globals.translateX).toBe(80)
    })
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('Helpers', () => {
  describe('getLargestStringFromMultiArr', () => {
    it('returns val unchanged when isMultiLineX is false', () => {
      const { dCtx, w } = makeDimCtx()
      w.globals.isMultiLineX = false
      const helpers = new Helpers(dCtx)

      const result = helpers.getLargestStringFromMultiArr('longest', [
        'a',
        'b',
        'longest',
      ])
      expect(result).toBe('longest')
    })

    it('returns the element from the sub-array with the most items when isMultiLineX is true', () => {
      const { dCtx, w } = makeDimCtx()
      w.globals.isMultiLineX = true
      const helpers = new Helpers(dCtx)

      // arr[2] has 3 items — the longest sub-array
      const arr = [['Jan'], ['Feb', 'Q1'], ['Mar', 'Apr', 'May']]
      const result = helpers.getLargestStringFromMultiArr('ignored-val', arr)
      expect(result).toEqual(['Mar', 'Apr', 'May'])
    })

    it('handles flat strings alongside arrays when isMultiLineX is true', () => {
      const { dCtx, w } = makeDimCtx()
      w.globals.isMultiLineX = true
      const helpers = new Helpers(dCtx)

      // strings count as length 1; the array at index 1 has 2 items
      const arr = ['single', ['line1', 'line2'], 'another']
      const result = helpers.getLargestStringFromMultiArr('fallback', arr)
      expect(result).toEqual(['line1', 'line2'])
    })

    it('returns val unchanged when arr has only single-item sub-arrays', () => {
      const { dCtx, w } = makeDimCtx()
      w.globals.isMultiLineX = true
      const helpers = new Helpers(dCtx)

      // All sub-arrays have length 1 — first one wins and it equals the val
      const arr = [['Jan'], ['Feb'], ['Mar']]
      const result = helpers.getLargestStringFromMultiArr('Jan', arr)
      expect(result).toEqual(['Jan'])
    })
  })

  describe('getLegendsRect', () => {
    it('returns zero-dimension rect when legend is floating', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.legend.show = true
      w.config.legend.floating = true
      const helpers = new Helpers(dCtx)
      const rect = helpers.getLegendsRect()
      expect(rect).toEqual({ x: 0, y: 0, height: 0, width: 0 })
    })

    it('returns zero-dimension rect when legend is hidden', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.legend.show = false
      w.config.legend.floating = false
      const helpers = new Helpers(dCtx)
      const rect = helpers.getLegendsRect()
      expect(rect).toEqual({ x: 0, y: 0, height: 0, width: 0 })
    })

    it('returns measured rect when legend is visible and non-floating', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.legend.show = true
      w.config.legend.floating = false
      w.config.legend.position = 'bottom'

      // elLegendWrap already returns {width:120, height:20} in makeDimCtx
      const helpers = new Helpers(dCtx)
      const rect = helpers.getLegendsRect()
      expect(rect.height).toBe(20)
      // width should equal the measured width when height > 0
      expect(rect.width).toBe(120)
    })

    it('caps legend width to svgWidth/1.5 when side legend is too wide', () => {
      const { dCtx, w } = makeDimCtx()
      w.config.legend.show = true
      w.config.legend.floating = false
      w.config.legend.position = 'left'
      w.globals.svgWidth = 300
      // Utils.getBoundingClientRect uses element.clientWidth / clientHeight
      // Make the legend wider than svgWidth/1.5 (= 200), height must be > 0
      Object.defineProperty(w.globals.dom.elLegendWrap, 'clientWidth', {
        get: () => 9999,
        configurable: true,
      })
      Object.defineProperty(w.globals.dom.elLegendWrap, 'clientHeight', {
        get: () => 30,
        configurable: true,
      })
      const helpers = new Helpers(dCtx)
      const rect = helpers.getLegendsRect()
      expect(rect.width).toBe(300 / 1.5)
    })
  })
})

// ---------------------------------------------------------------------------
// DimYAxis.getTotalYAxisWidth
// ---------------------------------------------------------------------------

describe('DimYAxis.getTotalYAxisWidth', () => {
  /**
   * getTotalYAxisWidth sums up widths from yLabelsCoords + yTitleCoords,
   * applying padding and skipping ignored/floating axes.
   */

  it('adds label width plus inter-axis padding for multiple axes', () => {
    const { dCtx, w } = makeDimCtx({
      yaxis: [
        {
          show: true,
          floating: false,
          opposite: false,
          labels: { show: true, style: { fontSize: '12px' } },
          title: { text: undefined },
        },
        {
          show: true,
          floating: false,
          opposite: false,
          labels: { show: true, style: { fontSize: '12px' } },
          title: { text: undefined },
        },
      ],
      globals: {
        seriesYAxisMap: [[0], [0]], // both axes map to series 0
        collapsedSeriesIndices: [],
      },
    })

    w.globals.yAxisScale = [
      { result: [0, 50, 100], niceMin: 0, niceMax: 100 },
      { result: [0, 50, 100], niceMin: 0, niceMax: 100 },
    ]
    w.globals.yLabelsCoords = [
      { width: 40, index: 0 },
      { width: 35, index: 1 },
    ]
    w.globals.yTitleCoords = [
      { width: 0, index: 0 },
      { width: 0, index: 1 },
    ]
    w.globals.ignoreYAxisIndexes = []
    w.globals.isBarHorizontal = false

    const dimYAxis = new DimYAxis(dCtx)
    const total = dimYAxis.getTotalYAxisWidth()

    // padding=10 (because >1 axis); each coord with width>0 adds width+padding,
    // each coord with width===0 (the title coords) adds a 5px gutter.
    // yLabelsCoords: axis0 → 40+10=50, axis1 → 35+10=45
    // yTitleCoords:  axis0 → 5,         axis1 → 5
    // total = 50 + 45 + 5 + 5 = 105
    expect(total).toBe(105)
  })

  it('skips ignored axis indexes', () => {
    const { dCtx, w } = makeDimCtx({
      yaxis: [
        {
          show: true,
          floating: false,
          opposite: false,
          labels: { show: true, style: { fontSize: '12px' } },
          title: { text: undefined },
        },
        {
          show: true,
          floating: false,
          opposite: false,
          labels: { show: true, style: { fontSize: '12px' } },
          title: { text: undefined },
        },
      ],
      globals: {
        seriesYAxisMap: [[0], [0]],
        collapsedSeriesIndices: [],
      },
    })
    w.globals.yLabelsCoords = [
      { width: 40, index: 0 },
      { width: 35, index: 1 },
    ]
    w.globals.yTitleCoords = [
      { width: 0, index: 0 },
      { width: 0, index: 1 },
    ]
    w.globals.ignoreYAxisIndexes = [1] // second axis is hidden
    w.globals.isBarHorizontal = false

    const dimYAxis = new DimYAxis(dCtx)
    const total = dimYAxis.getTotalYAxisWidth()

    // axis1 is ignored → its coord.width is subtracted back out
    // axis0 (not ignored): width=40, padding=10 → contributes 50
    // axis1 (ignored): contributes 35+10 - 35 - 10 = 0
    expect(total).toBe(50)
  })

  it('separates left and right axis widths correctly', () => {
    const { dCtx, w } = makeDimCtx({
      yaxis: [
        {
          show: true,
          floating: false,
          opposite: false, // left
          labels: { show: true, style: { fontSize: '12px' } },
          title: { text: undefined },
        },
        {
          show: true,
          floating: false,
          opposite: true, // right
          labels: { show: true, style: { fontSize: '12px' } },
          title: { text: undefined },
        },
      ],
      globals: {
        seriesYAxisMap: [[0], [0]],
        collapsedSeriesIndices: [],
      },
    })
    w.globals.yLabelsCoords = [
      { width: 40, index: 0 },
      { width: 30, index: 1 },
    ]
    w.globals.yTitleCoords = [
      { width: 0, index: 0 },
      { width: 0, index: 1 },
    ]
    w.globals.ignoreYAxisIndexes = []
    w.globals.isBarHorizontal = false

    const dimYAxis = new DimYAxis(dCtx)
    dimYAxis.getTotalYAxisWidth()

    // Left axis 0 contributes to yAxisWidthLeft; right axis 1 to yAxisWidthRight
    expect(dCtx.yAxisWidthLeft).toBeGreaterThan(0)
    expect(dCtx.yAxisWidthRight).toBeGreaterThan(0)
  })

  it('uses special horizontal bar formula when isBarHorizontal is true', () => {
    const { dCtx, w } = makeDimCtx()
    w.globals.isBarHorizontal = true
    w.config.yaxis[0].floating = false
    w.globals.yLabelsCoords = [{ width: 60, index: 0 }]
    w.globals.yTitleCoords = [{ width: 20, index: 0 }]
    w.globals.ignoreYAxisIndexes = []

    const dimYAxis = new DimYAxis(dCtx)
    const total = dimYAxis.getTotalYAxisWidth()

    // Horizontal bar: yLabels[0].width + yTitles[0].width + 15
    expect(total).toBe(60 + 20 + 15)
  })

  it('returns a small fallback width for a floating axis', () => {
    const { dCtx, w } = makeDimCtx({
      yaxis: [
        {
          show: true,
          floating: true,
          opposite: false,
          labels: { show: true, style: { fontSize: '12px' } },
          title: { text: undefined },
        },
      ],
    })
    w.globals.yLabelsCoords = [{ width: 0, index: 0 }] // floating → width 0
    w.globals.yTitleCoords = [{ width: 0, index: 0 }]
    w.globals.ignoreYAxisIndexes = []
    w.globals.isBarHorizontal = false

    const dimYAxis = new DimYAxis(dCtx)
    const total = dimYAxis.getTotalYAxisWidth()

    // coord.width===0 && floating → contributes 0
    expect(total).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Dimensions.conditionalChecksForAxisCoords
// ---------------------------------------------------------------------------

describe('Dimensions.conditionalChecksForAxisCoords', () => {
  /**
   * This method computes this.xAxisHeight from the three coord objects and
   * then enforces min/max height constraints from config.
   */

  function makeInstance(overrides = {}) {
    const { dCtx, w } = makeDimCtx(overrides)
    const dim = Object.create(Dimensions.prototype)
    dim.w = w
    dim.isSparkline = false
    dim.xAxisHeight = 0
    dim.xAxisWidth = 0
    dim.yAxisWidth = 50
    return { dim, w, dCtx }
  }

  it('calculates xAxisHeight from label + title + group coords', () => {
    const { dim, w } = makeInstance()
    w.globals.hasXaxisGroups = false
    w.globals.isMultiLineX = false
    w.globals.rotateXLabels = false
    w.globals.LINE_HEIGHT_RATIO = 1.618
    w.config.xaxis.labels.minHeight = undefined
    w.config.xaxis.labels.maxHeight = 120
    w.config.xaxis.floating = false
    w.config.yaxis = [{ labels: { minWidth: 0, maxWidth: 160 } }]

    const xaxisLabelCoords = { width: 50, height: 20 }
    const xtitleCoords = { width: 100, height: 15 }
    const xaxisGroupLabelCoords = { width: 0, height: 0 }

    dim.conditionalChecksForAxisCoords(
      xaxisLabelCoords,
      xtitleCoords,
      xaxisGroupLabelCoords,
    )

    // baseHeight = 0 + 20 + 15 = 35; multiplicate = LINE_HEIGHT_RATIO = 1.618
    // rotatedXAxisOffset = 10 (not rotated); xAxisNum = 1
    const expected = 35 * 1.618 + 1 * 10 + 0
    expect(dim.xAxisHeight).toBeCloseTo(expected, 0)
  })

  it('clamps xAxisHeight to config maxHeight', () => {
    const { dim, w } = makeInstance()
    w.globals.hasXaxisGroups = false
    w.globals.isMultiLineX = false
    w.globals.rotateXLabels = false
    w.globals.LINE_HEIGHT_RATIO = 1.618
    w.config.xaxis.labels.maxHeight = 30 // very small max
    w.config.xaxis.labels.minHeight = undefined
    w.config.xaxis.floating = false
    w.config.yaxis = [{ labels: { minWidth: 0, maxWidth: 160 } }]

    const xaxisLabelCoords = { width: 50, height: 50 }
    const xtitleCoords = { width: 100, height: 50 }
    const xaxisGroupLabelCoords = { width: 0, height: 0 }

    dim.conditionalChecksForAxisCoords(
      xaxisLabelCoords,
      xtitleCoords,
      xaxisGroupLabelCoords,
    )

    expect(dim.xAxisHeight).toBe(30)
  })

  it('clamps xAxisHeight to config minHeight', () => {
    const { dim, w } = makeInstance()
    w.globals.hasXaxisGroups = false
    w.globals.isMultiLineX = false
    w.globals.rotateXLabels = false
    w.globals.LINE_HEIGHT_RATIO = 1.618
    w.config.xaxis.labels.maxHeight = 120
    w.config.xaxis.labels.minHeight = 60 // force upward clamp
    w.config.xaxis.floating = false
    w.config.yaxis = [{ labels: { minWidth: 0, maxWidth: 160 } }]

    const xaxisLabelCoords = { width: 20, height: 5 }
    const xtitleCoords = { width: 20, height: 5 }
    const xaxisGroupLabelCoords = { width: 0, height: 0 }

    dim.conditionalChecksForAxisCoords(
      xaxisLabelCoords,
      xtitleCoords,
      xaxisGroupLabelCoords,
    )

    expect(dim.xAxisHeight).toBe(60)
  })

  it('forces xAxisHeight to 0 when axis is floating', () => {
    const { dim, w } = makeInstance()
    w.globals.hasXaxisGroups = false
    w.globals.isMultiLineX = false
    w.globals.rotateXLabels = false
    w.globals.LINE_HEIGHT_RATIO = 1.618
    w.config.xaxis.labels.maxHeight = 120
    w.config.xaxis.labels.minHeight = undefined
    w.config.xaxis.floating = true // floating axis
    w.config.yaxis = [{ labels: { minWidth: 0, maxWidth: 160 } }]

    const xaxisLabelCoords = { width: 50, height: 30 }
    const xtitleCoords = { width: 50, height: 10 }
    const xaxisGroupLabelCoords = { width: 0, height: 0 }

    dim.conditionalChecksForAxisCoords(
      xaxisLabelCoords,
      xtitleCoords,
      xaxisGroupLabelCoords,
    )

    expect(dim.xAxisHeight).toBe(0)
  })

  it('applies multiline X multiplier (1.2) when isMultiLineX=true', () => {
    const { dim, w } = makeInstance()
    w.globals.hasXaxisGroups = false
    w.globals.isMultiLineX = true
    w.globals.rotateXLabels = false
    w.globals.LINE_HEIGHT_RATIO = 1.618
    w.config.xaxis.labels.maxHeight = 9999
    w.config.xaxis.labels.minHeight = undefined
    w.config.xaxis.floating = false
    w.config.yaxis = [{ labels: { minWidth: 0, maxWidth: 160 } }]

    const xaxisLabelCoords = { width: 50, height: 20 }
    const xtitleCoords = { width: 0, height: 0 }
    const xaxisGroupLabelCoords = { width: 0, height: 0 }

    dim.conditionalChecksForAxisCoords(
      xaxisLabelCoords,
      xtitleCoords,
      xaxisGroupLabelCoords,
    )

    // multiline multiplier = 1.2 (not LINE_HEIGHT_RATIO)
    const expected = 20 * 1.2 + 10 // rotatedXAxisOffset=10 (not rotated)
    expect(dim.xAxisHeight).toBeCloseTo(expected, 0)
  })

  it('enforces yAxisWidth min/max constraints from yaxis label config', () => {
    const { dim, w } = makeInstance({
      yaxis: [{ labels: { minWidth: 80, maxWidth: 100 } }],
    })
    w.globals.hasXaxisGroups = false
    w.globals.isMultiLineX = false
    w.globals.rotateXLabels = false
    w.globals.LINE_HEIGHT_RATIO = 1.618
    w.config.xaxis.labels.maxHeight = 120
    w.config.xaxis.labels.minHeight = undefined
    w.config.xaxis.floating = false

    // Start with yAxisWidth below minWidth
    dim.yAxisWidth = 20

    dim.conditionalChecksForAxisCoords(
      { width: 30, height: 15 },
      { width: 0, height: 0 },
      { width: 0, height: 0 },
    )

    expect(dim.yAxisWidth).toBeGreaterThanOrEqual(80)
    expect(dim.yAxisWidth).toBeLessThanOrEqual(100)
  })
})

// ---------------------------------------------------------------------------
// Dimensions.setDimensionsForNonAxisCharts
// ---------------------------------------------------------------------------

describe('Dimensions.setDimensionsForNonAxisCharts', () => {
  function makeNonAxisInstance(legendPosition = 'bottom', legendShow = true) {
    const { w } = makeDimCtx()
    w.globals.axisCharts = false
    w.config.legend.show = legendShow
    w.config.legend.floating = false
    w.config.legend.position = legendPosition
    w.config.chart.type = 'pie'
    w.config.chart.height = 400
    w.globals.svgWidth = 600
    w.globals.svgHeight = 400

    const dim = Object.create(Dimensions.prototype)
    dim.w = w
    dim.isSparkline = false
    dim.lgRect = { x: 0, y: 0, width: 120, height: 20 }
    return { dim, w }
  }

  it('sets gridHeight = svgHeight - lgRect.height for bottom legend', () => {
    const { dim, w } = makeNonAxisInstance('bottom')
    dim.setDimensionsForNonAxisCharts()
    expect(w.globals.gridHeight).toBe(w.globals.svgHeight - dim.lgRect.height)
  })

  it('sets gridHeight = svgHeight - lgRect.height for top legend', () => {
    const { dim, w } = makeNonAxisInstance('top')
    dim.setDimensionsForNonAxisCharts()
    expect(w.globals.gridHeight).toBe(w.globals.svgHeight - dim.lgRect.height)
  })

  it('offsets translateY by lgRect.height for top legend', () => {
    const { dim, w } = makeNonAxisInstance('top')
    const offY = w.config.plotOptions.pie.offsetY
    dim.setDimensionsForNonAxisCharts()
    expect(w.globals.translateY).toBe(dim.lgRect.height + offY + 10)
  })

  it('reduces gridWidth by lgRect.width for left legend', () => {
    const { dim, w } = makeNonAxisInstance('left')
    dim.setDimensionsForNonAxisCharts()
    const xPad = 20 // legend.show && !floating → xPad=20
    expect(w.globals.gridWidth).toBe(
      w.globals.svgWidth - dim.lgRect.width - xPad,
    )
  })

  it('offsets translateX by lgRect.width + xPad for left legend', () => {
    const { dim, w } = makeNonAxisInstance('left')
    const offX = w.config.plotOptions.pie.offsetX
    dim.setDimensionsForNonAxisCharts()
    expect(w.globals.translateX).toBe(offX + dim.lgRect.width + 20)
  })

  it('reduces gridWidth by lgRect.width + 5 for right legend', () => {
    const { dim, w } = makeNonAxisInstance('right')
    dim.setDimensionsForNonAxisCharts()
    const xPad = 20
    expect(w.globals.gridWidth).toBe(
      w.globals.svgWidth - dim.lgRect.width - xPad - 5,
    )
  })

  it('throws for unsupported legend position', () => {
    const { dim } = makeNonAxisInstance('center')
    expect(() => dim.setDimensionsForNonAxisCharts()).toThrow(
      'Legend position not supported',
    )
  })
})

// ---------------------------------------------------------------------------
// Integration tests – rendered charts
// ---------------------------------------------------------------------------

describe('Dimensions integration (rendered charts)', () => {
  it('sets positive gridWidth and gridHeight after rendering a line chart', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      series: [{ name: 'Series A', data: [10, 20, 30, 40] }],
      xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr'] },
    })

    const gl = chart.w.globals
    expect(gl.gridWidth).toBeGreaterThan(0)
    expect(gl.gridHeight).toBeGreaterThan(0)
    // Grid must fit inside the SVG
    expect(gl.gridWidth).toBeLessThan(gl.svgWidth)
    expect(gl.gridHeight).toBeLessThan(gl.svgHeight)
  })

  it('sets positive translateX / translateY after rendering a bar chart', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 400 },
      series: [{ name: 'Sales', data: [30, 50, 70] }],
      xaxis: { categories: ['A', 'B', 'C'] },
    })

    const gl = chart.w.globals
    expect(gl.translateX).toBeGreaterThanOrEqual(0)
    expect(gl.translateY).toBeGreaterThanOrEqual(0)
  })

  it('produces smaller gridHeight when a title is present', () => {
    const chartNoTitle = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      series: [{ data: [1, 2, 3] }],
    })

    document.body.innerHTML = '<div id="chart" />'
    const chartWithTitle = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      title: { text: 'My Chart Title' },
      series: [{ data: [1, 2, 3] }],
    })

    // Title consumes vertical space → grid is shorter
    expect(chartWithTitle.w.globals.gridHeight).toBeLessThan(
      chartNoTitle.w.globals.gridHeight,
    )
  })

  it('sets positive gridWidth and gridHeight for a pie chart', () => {
    const chart = createChartWithOptions({
      chart: { type: 'pie', width: 500, height: 400 },
      series: [44, 55, 13],
      labels: ['Apple', 'Mango', 'Orange'],
    })

    const gl = chart.w.globals
    expect(gl.gridWidth).toBeGreaterThan(0)
    expect(gl.gridHeight).toBeGreaterThan(0)
  })

  it('sets positive gridWidth and gridHeight for a donut chart', () => {
    const chart = createChartWithOptions({
      chart: { type: 'donut', width: 500, height: 400 },
      series: [30, 40, 30],
      labels: ['X', 'Y', 'Z'],
    })

    const gl = chart.w.globals
    expect(gl.gridWidth).toBeGreaterThan(0)
    expect(gl.gridHeight).toBeGreaterThan(0)
  })

  it('top legend reduces translateY correctly vs bottom legend on axis chart', () => {
    const chartBottom = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      legend: { position: 'bottom' },
      series: [{ name: 'S', data: [1, 2, 3] }],
    })

    document.body.innerHTML = '<div id="chart" />'
    const chartTop = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      legend: { position: 'top' },
      series: [{ name: 'S', data: [1, 2, 3] }],
    })

    // Top legend pushes the grid down → translateY should be larger
    expect(chartTop.w.globals.translateY).toBeGreaterThanOrEqual(
      chartBottom.w.globals.translateY,
    )
  })

  it('sparkline chart has smaller or equal gridPad than regular chart', () => {
    const regular = createChartWithOptions({
      chart: { type: 'line', width: 200, height: 80 },
      series: [{ data: [1, 2, 3] }],
    })

    document.body.innerHTML = '<div id="chart" />'
    const sparkline = createChartWithOptions({
      chart: {
        type: 'line',
        width: 200,
        height: 80,
        sparkline: { enabled: true },
      },
      series: [{ data: [1, 2, 3] }],
    })

    // Sparkline grids use the full dimensions (no axes), so gridWidth/gridHeight
    // should be >= regular chart which reserves space for axes
    expect(sparkline.w.globals.gridWidth).toBeGreaterThanOrEqual(
      regular.w.globals.gridWidth,
    )
  })

  it('grid dimensions remain positive when Y axis has a title', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      series: [{ name: 'Revenue', data: [100, 200, 300] }],
      yaxis: { title: { text: 'Revenue ($)' } },
    })

    const gl = chart.w.globals
    expect(gl.gridWidth).toBeGreaterThan(0)
    expect(gl.gridHeight).toBeGreaterThan(0)
  })

  it('numeric X axis bar chart sets barPadForNumericAxis in globals', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 400 },
      series: [
        {
          name: 'S',
          data: [
            { x: 10, y: 5 },
            { x: 30, y: 8 },
            { x: 60, y: 3 },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })

    // barPadForNumericAxis should be a non-negative number
    expect(chart.w.globals.barPadForNumericAxis).toBeGreaterThanOrEqual(0)
  })
})
