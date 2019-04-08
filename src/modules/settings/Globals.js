import Utils from './../../utils/Utils'

export default class Globals {
  globalVars(config) {
    return {
      chartID: null, // chart ID - apexcharts-cuid
      cuid: null, // chart ID - random numbers excluding "apexcharts" part
      events: {
        beforeMount: [],
        mounted: [],
        updated: [],
        clicked: [],
        selection: [],
        dataPointSelection: [],
        zoomed: [],
        scrolled: []
      },
      colors: [],
      fill: {
        colors: []
      },
      stroke: {
        colors: []
      },
      dataLabels: {
        style: {
          colors: []
        }
      },
      radarPolygons: {
        fill: {
          colors: []
        }
      },
      markers: {
        colors: [],
        size: config.markers.size,
        largestSize: 0
      },
      animationEnded: false,
      isTouchDevice: 'ontouchstart' in window || navigator.msMaxTouchPoints,
      isDirty: false, // chart has been updated after the initial render. This is different than dataChanged property. isDirty means user manually called some method to update
      initialConfig: null, // we will store the first config user has set to go back when user finishes interactions like zooming and come out of it
      lastXAxis: [],
      lastYAxis: [],
      series: [], // the MAIN series array (y values)
      seriesPercent: [], // the percentage values of the given series
      seriesTotals: [],
      stackedSeriesTotals: [],
      seriesX: [], // store the numeric x values in this array (x values)
      seriesZ: [], // The 3rd "Z" dimension for bubbles chart (z values)
      labels: [], // store the text to draw on x axis
      // Don't mutate the labels, many things including tooltips depends on it!
      timelineLabels: [], // store the timeline Labels in another variable
      seriesNames: [], // same as labels, used in non axis charts
      noLabelsProvided: false, // if user didn't provide any categories/labels or x values, fallback to 1,2,3,4...
      allSeriesCollapsed: false,
      collapsedSeries: [], // when user collapses a series, it goes into this array
      collapsedSeriesIndices: [], // this stores the index of the collapsedSeries instead of whole object for quick access
      ancillaryCollapsedSeries: [], // when user collapses an "alwaysVisible" series, it goes into this array
      ancillaryCollapsedSeriesIndices: [], // this stores the index of the collapsedSeries whose y-axis is always visible
      risingSeries: [], // when user re-opens a collapsed series, it goes here
      dataFormat2DArray: false,
      dataFormatXY: false,
      selectedDataPoints: [],
      ignoreYAxisIndexes: [], // when series are being collapsed in multiple y axes, ignore certain index
      padHorizontal: 0,
      maxValsInArrayIndex: 0,
      zoomEnabled:
        config.chart.toolbar.autoSelected === 'zoom' &&
        config.chart.toolbar.tools.zoom &&
        config.chart.zoom.enabled,
      panEnabled:
        config.chart.toolbar.autoSelected === 'pan' &&
        config.chart.toolbar.tools.pan,
      selectionEnabled:
        config.chart.toolbar.autoSelected === 'selection' &&
        config.chart.toolbar.tools.selection,
      yaxis: null,
      minY: Number.MIN_VALUE, //  is 5e-324, i.e. the smallest positive number
      // NOTE: If there are multiple y axis, the first yaxis array element will be considered for all y values calculations. Rest all will be calculated based on that
      maxY: -Number.MAX_VALUE, // is -1.7976931348623157e+308
      // NOTE: The above note for minY applies here as well

      minYArr: [],
      maxYArr: [],
      maxX: -Number.MAX_VALUE, // is -1.7976931348623157e+308
      initialmaxX: -Number.MAX_VALUE,
      minX: Number.MIN_VALUE, //  is 5e-324, i.e. the smallest positive number
      initialminX: Number.MIN_VALUE,
      minZ: Number.MIN_VALUE, // Max Z value in charts with Z axis
      maxZ: -Number.MAX_VALUE, // Max Z value in charts with Z axis
      mousedown: false,
      lastClientPosition: {}, // don't reset this variable this the chart is destroyed. It is used to detect right or left mousemove in panning
      visibleXRange: undefined,
      yRange: [], // this property is the absolute sum of positive and negative values [eg (-100 + 200 = 300)] - yAxis
      zRange: 0, // zAxis Range (for bubble charts)
      xRange: 0, // xAxis range
      yValueDecimal: 0, // are there floating numbers in the series. If yes, this represent the len of the decimals
      total: 0,
      SVGNS: 'http://www.w3.org/2000/svg', // svg namespace
      svgWidth: 0, // the whole svg width
      svgHeight: 0, // the whole svg height
      noData: false, // whether there is any data to display or not
      locale: {}, // the current locale values will be preserved here for global access
      dom: {}, // for storing all dom nodes in this particular property
      // elWrap: null, // the element that wraps everything
      // elGraphical: null, // this contains lines/areas/bars/pies
      // elGridRect: null, // paths going outside this area will be clipped
      // elGridRectMask: null, // clipping will happen with this mask
      // elGridRectMarkerMask: null, // clipping will happen with this mask
      // elLegendWrap: null, // the whole legend area
      // elDefs: null, // [defs] element
      memory: {
        methodsToExec: []
      },
      shouldAnimate: true,
      delayedElements: [], // element which appear after animation has finished
      axisCharts: true, // chart type = line or area or bar
      // (refer them also as plot charts in the code)
      isXNumeric: false, // bool: data was provided in a {[x,y], [x,y]} pattern
      isDataXYZ: false, // bool: data was provided in a {[x,y,z]} pattern
      resized: false, // bool: user has resized
      resizeTimer: null, // timeout function to make a small delay before
      // drawing when user resized
      comboCharts: false, // bool: whether it's a combination of line/column
      comboChartsHasBars: false, // bool: whether it's a combination of line/column
      dataChanged: false, // bool: has data changed dynamically
      previousPaths: [], // array: when data is changed, it will animate from
      // previous paths
      seriesXvalues: [], // we will need this in tooltip (it's x position)
      // when we will have unequal x values, we will need
      // some way to get x value depending on mouse pointer
      seriesYvalues: [], // we will need this when deciding which series
      // user hovered on
      seriesCandleO: [], // candle stick open values
      seriesCandleH: [], // candle stick high values
      seriesCandleL: [], // candle stick low values
      seriesCandleC: [], // candle stick close values
      allSeriesHasEqualX: true,
      dataPoints: 0, // the longest series length
      pointsArray: [], // store the points positions here to draw later on hover
      // format is - [[x,y],[x,y]... [x,y]]
      dataLabelsRects: [], // store the positions of datalabels to prevent collision
      lastDrawnDataLabelsIndexes: [],
      hasNullValues: false, // bool: whether series contains null values
      easing: null, // function: animation effect to apply
      zoomed: false, // whether user has zoomed or not
      gridWidth: 0, // drawable width of actual graphs (series paths)
      gridHeight: 0, // drawable height of actual graphs (series paths)
      yAxisScale: [],
      xAxisScale: null,
      xAxisTicksPositions: [],
      timescaleTicks: [],
      rotateXLabels: false,
      defaultLabels: false,
      xLabelFormatter: undefined, // formatter for x axis labels
      yLabelFormatters: [],
      xaxisTooltipFormatter: undefined, // formatter for x axis tooltip
      ttKeyFormatter: undefined,
      ttVal: undefined,
      ttZFormatter: undefined,
      LINE_HEIGHT_RATIO: 1.618,
      xAxisLabelsHeight: 0,
      yAxisLabelsWidth: 0,
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
      translateYAxisX: [],
      yLabelsCoords: [],
      yTitleCoords: [],
      yAxisWidths: [],
      translateXAxisY: 0,
      translateXAxisX: 0,
      tooltip: null,
      tooltipOpts: null
    }
  }

  init(config) {
    let globals = this.globalVars(config)

    globals.initialConfig = Utils.extend({}, config)
    globals.initialSeries = JSON.parse(
      JSON.stringify(globals.initialConfig.series)
    )
    globals.lastXAxis = JSON.parse(JSON.stringify(globals.initialConfig.xaxis))
    globals.lastYAxis = JSON.parse(JSON.stringify(globals.initialConfig.yaxis))
    return globals
  }
}
