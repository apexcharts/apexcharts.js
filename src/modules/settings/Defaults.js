// @ts-check
import Utils from '../../utils/Utils'
import DateTime from '../../utils/DateTime'
import Formatters from '../Formatters'
import Options from './Options'

/**
 * ApexCharts Default Class for setting default options for all chart types.
 *
 * @module Defaults
 **/

/**
 * Marks a function a chart type installed as one of its own defaults, so it can
 * be told from a function the user supplied. Two closures are never `===`, and
 * a merged config records no provenance, so without the mark there is no way
 * back from "this config has a formatter" to "whose formatter is it".
 *
 * Only functions carry the mark. Every other type default is recognised by
 * value, by comparing against what the outgoing type would have chosen.
 */
const TYPE_OWNED = '_apexOwnedByType'

/**
 * @template {Function} T
 * @param {string[]} types chart types whose data this function can read
 * @param {T} fn
 * @returns {T}
 */
const ownedBy = (types, fn) => {
  const marked = /** @type {any} */ (fn)
  marked[TYPE_OWNED] = types
  return fn
}

/**
 * The config leaves that belong to the chart TYPE rather than to the chart, and
 * so are re-chosen when `updateOptions({ chart: { type } })` changes it.
 *
 * Type defaults are applied once, by Config.init on the initial render. The
 * update path constructs Config directly and skips init, so before this every
 * leaf a type had chosen for itself outlived that type. Two ways that showed:
 * a box plot that became a violin kept asking for a five-number summary nobody
 * computes for a violin and threw on every hover, and a bar that became a box
 * plot never acquired the five-number formatter at all.
 *
 * The line drawn here is between what a chart DOES and how it is PAINTED. A
 * leaf that decides what is read, what is said, or what is hit-tested belongs
 * to the type and hands over. A leaf that decides colour, opacity, stroke,
 * spacing or legend placement stays put, so that changing type re-reads the
 * data without also restyling the chart out from under a morph in flight, and
 * so that a palette chosen for a bar survives its becoming a line.
 *
 * A leaf only hands over when it still holds exactly what the outgoing type
 * chose for it. Anything the user set, then or in this same update, is theirs
 * and is left alone.
 */
const TYPE_OWNED_PATHS = [
  // What the tooltip reads and how it resolves a hover. `custom` is the sharp
  // one: each built-in reads globals only its own type fills.
  'tooltip.custom',
  'tooltip.shared',
  'tooltip.intersect',
  'tooltip.followCursor',
  // Whether values are written on the marks, and how they are phrased. A pie's
  // percentage formatter handed a treemap a category name.
  'dataLabels.enabled',
  'dataLabels.formatter',
  'plotOptions.bar.dataLabels.position',
  // A box plot's outlier markers are hit targets; a violin draws none.
  'markers.size',
  // Hover and select feedback, off by design on the types that draw their own.
  'states.hover.filter.type',
  'states.active.filter.type',
  // Axis chrome that exists to be pointed at.
  'xaxis.crosshairs.width',
  'xaxis.tickPlacement',
  'xaxis.tooltip.enabled',
  // Interaction the type either supports or does not: a violin's categories
  // cannot be range-zoomed, and an index-keyed summary animates as churn.
  'chart.zoom.enabled',
  'chart.animations.dynamicAnimation.enabled',
]

/**
 * Read a dotted path out of a config-shaped object.
 * @param {Record<string, any> | undefined} obj
 * @param {string} path
 */
const readPath = (obj, path) => {
  let cur = /** @type {any} */ (obj)
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[key]
  }
  return cur
}

/**
 * Write a dotted path into a config-shaped object, creating the objects on the
 * way. A leaf whose new value is `undefined` is deleted rather than set, so the
 * field reads as absent exactly like it would on a fresh chart of that type.
 * @param {Record<string, any>} obj
 * @param {string} path
 * @param {any} value
 */
const writePath = (obj, path, value) => {
  const keys = path.split('.')
  const last = keys.pop()
  let cur = /** @type {any} */ (obj)
  for (const key of keys) {
    if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {}
    cur = cur[key]
  }
  if (value === undefined) delete cur[/** @type {string} */ (last)]
  else cur[/** @type {string} */ (last)] = value
}


/** The user-facing chart types that render through another type's pathway. */
const TYPE_ALIASES = {
  funnel: 'bar',
  pyramid: 'bar',
  gauge: 'radialBar',
  waffle: 'unit',
  histogram: 'bar',
  waterfall: 'rangeBar',
}

/**
 * A throwaway config naming one chart type and nothing else, for asking
 * Defaults.forType what that type wants. Throwaway because two of the type
 * blocks (funnel and radar) hide the y-axis by writing into the opts they are
 * handed, and the live config must not take that write.
 *
 * @param {string} type a chart type, or a user-facing alias of one
 * @param {Record<string, any>} config the live config, read for the few
 *   chart-level flags a type default consults
 */
const typeOpts = (type, config) => {
  const base = /** @type {Record<string, string>} */ (TYPE_ALIASES)[type]
  return {
    chart: {
      type: base || type,
      requestedType: base ? type : undefined,
      // Stacking belongs to the chart, not to its type, so both sides see it.
      stacked: config.chart?.stacked,
    },
    plotOptions: {
      bar: { isFunnel: type === 'funnel' || type === 'pyramid' },
      histogram: config.plotOptions?.histogram,
    },
    // The histogram's defaults read the series to decide whether overlaid bins
    // share a tooltip. Both sides are asked with the series the chart has now.
    series: config.series,
    yaxis: [{ title: {}, labels: {}, axisBorder: {}, axisTicks: {} }],
  }
}

/**
 * Is `current` still what the outgoing type chose, rather than something the
 * user put there?
 *
 * Functions can only be compared by provenance: a marked function came from
 * this module and may be replaced, an unmarked one is the user's and may not.
 * Everything else compares by value.
 *
 * @param {any} current
 * @param {any} fromDefault
 */
const isUntouched = (current, fromDefault) => {
  if (typeof current === 'function') {
    if (Array.isArray(/** @type {any} */ (current)[TYPE_OWNED])) return true
    // Unmarked, so it is either the user's or one of the plain formatters
    // Options rebuilds on every read. Those are never `===` across two reads,
    // so the only thing left to compare is the source itself.
    return (
      typeof fromDefault === 'function' &&
      String(current) === String(fromDefault)
    )
  }
  if (typeof fromDefault === 'function') return current === undefined
  if (current === fromDefault) return true
  try {
    return JSON.stringify(current) === JSON.stringify(fromDefault)
  } catch {
    return false
  }
}

/** @param {{isTimeline: any, seriesIndex: any, dataPointIndex: any, y1: any, y2: any, w: any}} opts */
const getRangeValues = ({
  isTimeline,
  seriesIndex,
  dataPointIndex,
  y1,
  y2,
  w,
}) => {
  let start = w.rangeData.seriesRangeStart[seriesIndex][dataPointIndex]
  let end = w.rangeData.seriesRangeEnd[seriesIndex][dataPointIndex]
  let ylabel = w.labelData.labels[dataPointIndex]
  let seriesName = w.config.series[seriesIndex].name
    ? w.config.series[seriesIndex].name
    : ''
  const yLbFormatter = w.formatters.ttKeyFormatter
  const yLbTitleFormatter = w.config.tooltip.y.title.formatter

  const opts = {
    w,
    seriesIndex,
    dataPointIndex,
    start,
    end,
  }

  if (typeof yLbTitleFormatter === 'function') {
    seriesName = yLbTitleFormatter(seriesName, opts)
  }
  if (w.config.series[seriesIndex].data[dataPointIndex]?.x) {
    ylabel = w.config.series[seriesIndex].data[dataPointIndex].x
  }

  if (!isTimeline) {
    if (w.config.xaxis.type === 'datetime') {
      const xFormat = new Formatters(w)
      ylabel = xFormat.xLabelFormat(
        w.formatters.ttKeyFormatter,
        ylabel,
        ylabel,
        {
          i: undefined,
          dateFormatter: new DateTime(w).formatDate,
          w,
        },
      )
    }
  }

  if (typeof yLbFormatter === 'function') {
    ylabel = yLbFormatter(ylabel, opts)
  }
  if (Number.isFinite(y1) && Number.isFinite(y2)) {
    start = y1
    end = y2
  }

  let startVal = ''
  let endVal = ''

  const color = w.globals.colors[seriesIndex]
  if (w.config.tooltip.x.formatter === undefined) {
    if (w.config.xaxis.type === 'datetime') {
      const datetimeObj = new DateTime(w)
      startVal = datetimeObj.formatDate(
        datetimeObj.getDate(start),
        w.config.tooltip.x.format,
      )
      endVal = datetimeObj.formatDate(
        datetimeObj.getDate(end),
        w.config.tooltip.x.format,
      )
    } else {
      startVal = start
      endVal = end
    }
  } else {
    startVal = w.config.tooltip.x.formatter(start)
    endVal = w.config.tooltip.x.formatter(end)
  }

  return { start, end, startVal, endVal, ylabel, color, seriesName }
}
/**
 * @param {Record<string, any>} opts
 */
const buildRangeTooltipHTML = (opts) => {
  let { color, seriesName, ylabel, start, end, seriesIndex, dataPointIndex } =
    opts

  const formatter =
    opts.w.globals.tooltip.tooltipLabels.getFormatters(seriesIndex)

  start = formatter.yLbFormatter(start)
  end = formatter.yLbFormatter(end)
  const val = formatter.yLbFormatter(
    opts.w.seriesData.series[seriesIndex][dataPointIndex],
  )

  let valueHTML = ''
  const rangeValues = `<span class="value start-value">
  ${start}
  </span> <span class="separator">-</span> <span class="value end-value">
  ${end}
  </span>`

  if (opts.w.globals.comboCharts) {
    if (
      opts.w.config.series[seriesIndex].type === 'rangeArea' ||
      opts.w.config.series[seriesIndex].type === 'rangeBar'
    ) {
      valueHTML = rangeValues
    } else {
      valueHTML = `<span>${val}</span>`
    }
  } else {
    valueHTML = rangeValues
  }
  return (
    '<div class="apexcharts-tooltip-rangebar">' +
    '<div> <span class="series-name" style="color: ' +
    color +
    '">' +
    (seriesName ? seriesName : '') +
    '</span></div>' +
    '<div> <span class="category">' +
    ylabel +
    ': </span> ' +
    valueHTML +
    ' </div>' +
    '</div>'
  )
}

export default class Defaults {
  /**
   * @param {Record<string, any>} opts
   */
  constructor(opts) {
    this.opts = opts
  }

  /**
   * The defaults a chart type chooses for itself, which is the same pick
   * Config.init makes on the initial render. Shared with the update path so
   * that "what does type X want" has one answer and cannot drift between the
   * two. Modes layered on top of a type (brush, slope, sparkline) are not
   * included: they belong to the chart, not to its type, and a type change does
   * not disturb them.
   *
   * @param {Record<string, any>} opts a config, read for the type and for the
   *   flags that pick a variant of it
   * @returns {Record<string, any>}
   */
  static forType(opts) {
    const defaults = new Defaults(opts)
    const chartTypes = [
      'line',
      'area',
      'bar',
      'candlestick',
      'boxPlot',
      'violin',
      'rangeBar',
      'rangeArea',
      'bubble',
      'scatter',
      'heatmap',
      'treemap',
      'unit',
      'sunburst',
      'pie',
      'polarArea',
      'donut',
      'radar',
      'radialBar',
    ]
    const requestedType = opts.chart.requestedType
    let chartDefaults

    if (requestedType === 'funnel' || requestedType === 'pyramid') {
      chartDefaults = /** @type {any} */ (defaults)[requestedType]()
    } else if (requestedType === 'gauge') {
      chartDefaults = defaults.gauge()
    } else if (requestedType === 'histogram') {
      chartDefaults = defaults.histogram()
    } else if (requestedType === 'waterfall') {
      chartDefaults = defaults.waterfall()
    } else if (chartTypes.indexOf(opts.chart.type) !== -1) {
      chartDefaults = /** @type {any} */ (defaults)[opts.chart.type]()
    } else {
      // Unknown, or a type someone registered: it has no defaults of its own,
      // so it gets the same baseline Config.init would give it.
      chartDefaults = defaults.line()
    }

    if (opts.plotOptions?.bar?.isFunnel) {
      chartDefaults = defaults.funnel()
    }

    if (opts.chart.stacked && opts.chart.type === 'bar') {
      chartDefaults = defaults.stackedBars()
    }

    return chartDefaults
  }

  /**
   * Re-choose the type-owned leaves (see TYPE_OWNED_PATHS) after
   * `updateOptions({ chart: { type } })` moved the chart from one type to
   * another, so the chart behaves as the type it now is.
   *
   * A leaf is only handed over when it still holds exactly what `fromType`
   * chose for it. That single test covers every way a value can be the user's
   * instead of ours: set at construction, set by an earlier update, or set by
   * this very update. `options` is consulted too, so an explicit ask in the
   * same call wins even when it happens to equal the outgoing default.
   *
   * @param {Record<string, any>} config the merged w.config, mutated in place
   * @param {string} fromType the type (or requested alias) before this update
   * @param {Record<string, any>} [options] this update's payload
   */
  static handOverTypeDefaults(config, fromType, options) {
    const toType = config.chart.requestedType || config.chart.type
    if (!fromType || fromType === toType) return

    // Ask each side separately, through a config that names only that type, so
    // neither answer is contaminated by the other's alias flags. Each answer is
    // then laid over the base options, because a type that says nothing about a
    // leaf is not saying "absent", it is leaving the library default standing:
    // a violin sets no markers.size, and what it wants there is the base 0, not
    // the box plot's 7 and not nothing at all.
    const base = new Options().init()
    const from = Utils.extend(
      base,
      Defaults.forType(typeOpts(fromType, config)),
    )
    const to = Utils.extend(base, Defaults.forType(typeOpts(toType, config)))

    for (const path of TYPE_OWNED_PATHS) {
      if (options && readPath(options, path) !== undefined) continue
      const fromDefault = readPath(from, path)
      const toDefault = readPath(to, path)
      if (fromDefault === undefined && toDefault === undefined) continue
      if (!isUntouched(readPath(config, path), fromDefault)) continue
      writePath(config, path, toDefault)
    }
  }

  hideYAxis() {
    this.opts.yaxis[0].show = false
    this.opts.yaxis[0].title.text = ''
    this.opts.yaxis[0].axisBorder.show = false
    this.opts.yaxis[0].axisTicks.show = false
    this.opts.yaxis[0].floating = true
  }

  line() {
    return {
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 5,
        curve: 'straight',
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6,
        },
      },
      xaxis: {
        crosshairs: {
          width: 1,
        },
      },
    }
  }

  /**
   * @param {Record<string, any>} defaults
   */
  sparkline(defaults) {
    this.hideYAxis()
    const ret = {
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
      legend: {
        show: false,
      },
      xaxis: {
        labels: {
          show: false,
        },
        tooltip: {
          enabled: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      chart: {
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
    }

    return Utils.extend(defaults, ret)
  }

  slope() {
    this.hideYAxis()

    return {
      chart: {
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: true,
        /**
         * @param {any} val
         * @param {Record<string, any>} opts
         */
        formatter(val, opts) {
          const seriesName = opts.w.config.series[opts.seriesIndex].name
          return val !== null ? seriesName + ': ' + val : ''
        },
        background: {
          enabled: false,
        },
        offsetX: -5,
      },
      grid: {
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        position: 'top',
        labels: {
          style: {
            fontSize: 14,
            fontWeight: 900,
          },
        },
        tooltip: {
          enabled: false,
        },
        crosshairs: {
          show: false,
        },
      },
      markers: {
        size: 8,
        hover: {
          sizeOffset: 1,
        },
      },
      legend: {
        show: false,
      },
      tooltip: {
        shared: false,
        intersect: true,
        followCursor: true,
      },
      stroke: {
        width: 5,
        curve: 'straight',
      },
    }
  }

  bar() {
    return {
      chart: {
        stacked: false,
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: 'center',
          },
        },
      },
      dataLabels: {
        style: {
          colors: ['#fff'],
        },
        background: {
          enabled: false,
        },
      },
      stroke: {
        width: 0,
        lineCap: 'square',
      },
      fill: {
        opacity: 0.85,
      },
      legend: {
        markers: {
          shape: 'square',
        },
      },
      tooltip: {
        shared: false,
        intersect: true,
      },
      xaxis: {
        tooltip: {
          enabled: false,
        },
        tickPlacement: 'between',
        crosshairs: {
          width: 'barWidth',
          position: 'back',
          fill: {
            type: 'gradient',
          },
          dropShadow: {
            enabled: false,
          },
          stroke: {
            width: 0,
          },
        },
      },
    }
  }

  funnel() {
    this.hideYAxis()

    return {
      ...this.bar(),
      chart: {
        animations: {
          speed: 800,
          animateGradually: {
            enabled: false,
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadiusApplication: 'around',
          borderRadius: 0,
          dataLabels: {
            position: 'center',
          },
        },
      },
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
        },
      },
      xaxis: {
        labels: {
          show: false,
        },
        tooltip: {
          enabled: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
    }
  }

  pyramid() {
    // Pyramid is funnel rendered in reverse order (widest at bottom).
    // Internally reuses the bar funnel renderer; ordering is handled in Config.
    return this.funnel()
  }

  gauge() {
    // Gauge defaults: half-circle, single-series, large center value label.
    // Internally renders via the radialBar pathway.
    const base = this.radialBar()
    return {
      ...base,
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: {
            margin: 0,
            size: '60%',
          },
          track: {
            background: '#e7e7e7',
            strokeWidth: '100%',
            margin: 5,
          },
          dataLabels: {
            name: {
              show: false,
            },
            value: {
              show: true,
              fontSize: '32px',
              fontWeight: 600,
              offsetY: 8,
            },
          },
        },
      },
    }
  }

  waterfall() {
    // Waterfall defaults: a cumulative walk drawn as floating range columns
    // (see Config.normalizeAliasedChartType), so it starts from the range-column
    // defaults and changes only what the walk needs.
    const range = this.rangeBar()

    return {
      ...range,
      chart: {
        stacked: false,
        // A waterfall is a fixed set of named steps, not a window onto a
        // continuum: there is nothing to zoom into, and a horizontal one would
        // otherwise inherit the timeline range bar's zoom toolbar.
        zoom: {
          enabled: false,
        },
        animations: {
          // The bars ARE a left-to-right sequence, so the staggered reveal
          // traces the walk instead of implying an order that is not there.
          // (A timeline range bar turns this off; a waterfall wants it.)
          animateGradually: {
            enabled: true,
          },
        },
      },
      plotOptions: {
        ...range.plotOptions,
        bar: {
          .../** @type {any} */ (range.plotOptions).bar,
          // Narrower than a plain bar's 70%, because the gaps are load-bearing
          // here: the connectors are drawn in them. Both orientations, so a
          // horizontal waterfall's connectors have room too.
          columnWidth: '60%',
          barHeight: '60%',
        },
      },
      dataLabels: {
        .../** @type {any} */ (range).dataLabels,
        // The step is the whole point of a waterfall, so it is written on the
        // bar by default. The inherited range formatter already reports
        // `end - start`, which is the delta for a step bar and the sum for a
        // subtotal / total bar.
        enabled: true,
        // Small steps are normal in a waterfall, and a label wider or taller
        // than its bar gets placed OUTSIDE it. The range column's white label
        // is then white text on the chart background, so the two smallest steps
        // of a P&L bridge simply vanished. A pale chip with dark ink reads
        // wherever the label lands: over a green, red or blue bar, or off it.
        background: {
          enabled: true,
          backgroundColor: '#fff',
          foreColor: '#373d3f',
          borderColor: '#e3e8ee',
          opacity: 0.92,
        },
      },
      legend: {
        // A waterfall is one series, so the legend would show a single swatch
        // named after it, and clicking it empties the chart. The legend a
        // waterfall actually wants names the KINDS of bar (increase, decrease,
        // total), which is not something the series legend can express.
        show: false,
      },
      tooltip: {
        shared: false,
        intersect: true,
        followCursor: false,
        // Deliberately no `custom`: the range-column tooltip reads out
        // "start - end", which is a span the data never claims. The ordinary
        // tooltip is correct once the value it prints is the step, which
        // TooltipLabels.formatYValue takes from `w.waterfallData.values`.
      },
    }
  }

  histogram() {
    // Histogram defaults: a distribution of raw observations, binned by
    // features/stats and drawn through the bar pathway.
    //
    // Two or more distributions overlay by default (see plotOptions.histogram
    // .overlap), and an overlay only reads if the fill lets the one behind
    // through. The bin separator goes with it: a hairline exists to keep
    // touching bins apart, and over translucent overlapping bars it just
    // outlines every overlap. Both are plain defaults, so either can be set
    // back.
    const overlaid =
      Array.isArray(this.opts?.series) &&
      this.opts.series.length > 1 &&
      this.opts?.plotOptions?.histogram?.overlap !== false

    return {
      ...this.bar(),
      chart: {
        stacked: false,
        // The bins are the summary: they are chosen once from the whole sample
        // and do NOT re-derive from the visible window, so zooming only
        // magnifies bars while hiding the rest of the distribution the shape is
        // read against. Off by default, mirroring heatmap and violin; users can
        // opt back in with chart.zoom.enabled: true.
        zoom: {
          enabled: false,
        },
        animations: {
          // The bars of a histogram are one shape, not N independent
          // categories, so revealing them one by one reads as a sequence that
          // is not in the data. The distribution rises as a whole instead.
          animateGradually: {
            enabled: false,
          },
        },
      },
      plotOptions: {
        bar: {
          // Bins are adjacent by definition, so the columns touch: a gap
          // between them would read as a gap in the data. Rounded corners are
          // dropped for the same reason (they shave area off each bar, and a
          // histogram's whole claim is that area is proportional to count).
          columnWidth: '100%',
          borderRadius: 0,
          dataLabels: {
            position: 'top',
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      fill: overlaid ? { opacity: 0.65 } : {},
      // A hairline separator keeps the bin boundaries readable once the columns
      // touch, the same treatment heatmap cells get.
      stroke: overlaid
        ? { show: false }
        : {
            show: true,
            width: 1,
            colors: ['#fff'],
          },
      xaxis: {
        type: 'numeric',
        // The axis carries bin midpoints; the range is what people read, and
        // the tooltip already states it.
        tooltip: {
          enabled: false,
        },
      },
      tooltip: {
        // Overlaid bars share a bin, so hovering one has to report both
        // distributions: the comparison is the whole point of stacking them on
        // one axis.
        shared: overlaid,
        intersect: false,
        x: {
          formatter: (
            /** @type {number} */ val,
            /** @type {any} */ opts,
          ) => {
            const edges = opts?.w?.histogramData?.edges
            const k = opts?.dataPointIndex
            if (!Array.isArray(edges) || typeof k !== 'number' || k < 0) {
              return String(val)
            }
            const lo = edges[k]
            const hi = edges[k + 1]
            if (lo === undefined || hi === undefined) return String(val)
            const fmt = (/** @type {number} */ v) =>
              Number.isInteger(v) ? String(v) : v.toFixed(2)
            return `${fmt(lo)} to ${fmt(hi)}`
          },
        },
      },
    }
  }

  candlestick() {
    return {
      stroke: {
        width: 1,
      },
      fill: {
        opacity: 1,
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        shared: true,
        custom: ownedBy(
          ['candlestick'],
          (/** @type {any} */ { seriesIndex, dataPointIndex, w }) => {
            return this._getBoxTooltip(
              w,
              seriesIndex,
              dataPointIndex,
              ['Open', 'High', '', 'Low', 'Close'],
              'candlestick',
            )
          },
        ),
      },
      states: {
        active: {
          filter: {
            type: 'none',
          },
        },
      },
      xaxis: {
        crosshairs: {
          width: 1,
        },
      },
    }
  }

  boxPlot() {
    return {
      chart: {
        animations: {
          dynamicAnimation: {
            enabled: false,
          },
        },
      },
      stroke: {
        width: 1,
        colors: ['#24292e'],
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        shared: true,
        custom: ownedBy(
          ['boxPlot'],
          (/** @type {any} */ { seriesIndex, dataPointIndex, w }) => {
            return this._getBoxTooltip(
              w,
              seriesIndex,
              dataPointIndex,
              ['Minimum', 'Q1', 'Median', 'Q3', 'Maximum'],
              'boxPlot',
            )
          },
        ),
      },
      markers: {
        size: 7,
        strokeWidth: 1,
        strokeColors: '#111',
      },
      xaxis: {
        crosshairs: {
          width: 1,
        },
      },
    }
  }

  violin() {
    return {
      chart: {
        // Violins are a per-category distribution plot (discrete category
        // x-axis), so range zooming/panning is meaningless — off by default.
        zoom: {
          enabled: false,
        },
        animations: {
          dynamicAnimation: {
            enabled: false,
          },
        },
      },
      stroke: {
        width: 1,
        colors: ['#24292e'],
      },
      fill: {
        opacity: 0.7,
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        shared: true,
        custom: ownedBy(
          ['violin'],
          (/** @type {any} */ { seriesIndex, dataPointIndex, w }) => {
            return this._getViolinTooltip(w, seriesIndex, dataPointIndex)
          },
        ),
      },
      states: {
        active: {
          filter: {
            type: 'none',
          },
        },
      },
      xaxis: {
        crosshairs: {
          width: 1,
        },
      },
    }
  }

  rangeBar() {
    /**
     * @param {any} opts
     */
    const handleTimelineTooltip = (opts) => {
      const { color, seriesName, ylabel, startVal, endVal } = getRangeValues({
        ...opts,
        isTimeline: true,
      })
      return buildRangeTooltipHTML({
        ...opts,
        color,
        seriesName,
        ylabel,
        start: startVal,
        end: endVal,
      })
    }

    /**
     * @param {any} opts
     */
    const handleRangeColumnTooltip = (opts) => {
      const { color, seriesName, ylabel, start, end } = getRangeValues(opts)
      return buildRangeTooltipHTML({
        ...opts,
        color,
        seriesName,
        ylabel,
        start,
        end,
      })
    }
    return {
      chart: {
        animations: {
          animateGradually: false,
        },
      },
      stroke: {
        width: 0,
        lineCap: 'square',
      },
      plotOptions: {
        bar: {
          borderRadius: 0,
          dataLabels: {
            position: 'center',
          },
        },
      },
      dataLabels: {
        enabled: false,
        /**
         * @param {any} val
         */
        formatter(
          /** @type {any} */ val,
          /** @type {any} */ { seriesIndex, dataPointIndex, w },
        ) {
          const getVal = () => {
            const start =
              w.rangeData.seriesRangeStart[seriesIndex][dataPointIndex]
            const end = w.rangeData.seriesRangeEnd[seriesIndex][dataPointIndex]
            return end - start
          }
          if (w.globals.comboCharts) {
            if (
              w.config.series[seriesIndex].type === 'rangeBar' ||
              w.config.series[seriesIndex].type === 'rangeArea'
            ) {
              return getVal()
            } else {
              return val
            }
          } else {
            return getVal()
          }
        },
        background: {
          enabled: false,
        },
        style: {
          colors: ['#fff'],
        },
      },
      markers: {
        size: 10,
      },
      tooltip: {
        shared: false,
        followCursor: true,
        custom: ownedBy(
          ['rangeBar'],
          /** @param {Record<string, any>} opts */
          (opts) => {
            if (
              opts.w.config.plotOptions &&
              opts.w.config.plotOptions.bar &&
              opts.w.config.plotOptions.bar.horizontal
            ) {
              return handleTimelineTooltip(opts)
            } else {
              return handleRangeColumnTooltip(opts)
            }
          },
        ),
      },
      xaxis: {
        tickPlacement: 'between',
        tooltip: {
          enabled: false,
        },
        crosshairs: {
          stroke: {
            width: 0,
          },
        },
      },
    }
  }

  /**
   * @param {Record<string, any>} opts
   */
  dumbbell(opts) {
    if (!opts.plotOptions.bar?.barHeight) {
      opts.plotOptions.bar.barHeight = 2
    }
    if (!opts.plotOptions.bar?.columnWidth) {
      opts.plotOptions.bar.columnWidth = 2
    }
    return opts
  }

  area() {
    return {
      stroke: {
        width: 4,
        fill: {
          type: 'solid',
          gradient: {
            inverseColors: false,
            shade: 'light',
            type: 'vertical',
            opacityFrom: 0.65,
            opacityTo: 0.5,
            stops: [0, 100, 100],
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          inverseColors: false,
          shade: 'light',
          type: 'vertical',
          opacityFrom: 0.65,
          opacityTo: 0.5,
          stops: [0, 100, 100],
        },
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6,
        },
      },
      tooltip: {
        followCursor: false,
      },
    }
  }

  rangeArea() {
    /**
     * @param {any} opts
     */
    const handleRangeAreaTooltip = (opts) => {
      const { color, seriesName, ylabel, start, end } = getRangeValues(opts)
      return buildRangeTooltipHTML({
        ...opts,
        color,
        seriesName,
        ylabel,
        start,
        end,
      })
    }
    return {
      stroke: {
        curve: 'straight',
        width: 0,
      },
      fill: {
        type: 'solid',
        opacity: 0.6,
      },
      markers: {
        size: 0,
      },
      states: {
        hover: {
          filter: {
            type: 'none',
          },
        },
        active: {
          filter: {
            type: 'none',
          },
        },
      },
      tooltip: {
        intersect: false,
        shared: true,
        followCursor: true,
        custom: ownedBy(
          ['rangeArea'],
          /** @param {Record<string, any>} opts */
          (opts) => handleRangeAreaTooltip(opts),
        ),
      },
    }
  }

  /**
   * @param {Record<string, any>} defaults
   */
  brush(defaults) {
    const ret = {
      chart: {
        toolbar: {
          autoSelected: 'selection',
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 1,
      },
      tooltip: {
        enabled: false,
      },
      xaxis: {
        tooltip: {
          enabled: false,
        },
      },
    }

    return Utils.extend(defaults, ret)
  }

  /**
   * @param {Record<string, any>} opts
   */
  stacked100(opts) {
    opts.dataLabels = opts.dataLabels || {}
    opts.dataLabels.formatter = opts.dataLabels.formatter || undefined
    const existingDataLabelFormatter = opts.dataLabels.formatter

    /**
     * @param {ApexYAxis} yaxe
     * @param {number} index
     */
    opts.yaxis.forEach((/** @type {any} */ yaxe, /** @type {any} */ index) => {
      opts.yaxis[index].min = 0
      opts.yaxis[index].max = 100
    })

    const isBar = opts.chart.type === 'bar'

    if (isBar) {
      opts.dataLabels.formatter =
        existingDataLabelFormatter ||
        /**
         * @param {any} val
         */
        function (val) {
          if (typeof val === 'number') {
            return val ? val.toFixed(0) + '%' : val
          }
          return val
        }
    }
    return opts
  }

  stackedBars() {
    const barDefaults = this.bar()
    return {
      ...barDefaults,
      plotOptions: {
        ...barDefaults.plotOptions,
        bar: {
          ...barDefaults.plotOptions.bar,
          borderRadiusApplication: 'end',
        },
      },
    }
  }

  // This function removes the left and right spacing in chart for line/area/scatter if xaxis type = category for those charts by converting xaxis = numeric. Numeric/Datetime xaxis prevents the unnecessary spacing in the left/right of the chart area
  /**
   * @param {Record<string, any>} opts
   */
  convertCatToNumeric(opts) {
    opts.xaxis.convertedCatToNumeric = true

    return opts
  }

  /**
   * @param {Record<string, any>} opts
   * @param {any} cats
   */
  convertCatToNumericXaxis(opts, cats) {
    opts.xaxis.type = 'numeric'
    opts.xaxis.labels = opts.xaxis.labels || {}
    opts.xaxis.labels.formatter =
      opts.xaxis.labels.formatter ||
      /**
       * @param {any} val
       */
      function (val) {
        return Utils.isNumber(val) ? Math.floor(val) : val
      }

    const defaultFormatter = opts.xaxis.labels.formatter
    let labels =
      opts.xaxis.categories && opts.xaxis.categories.length
        ? opts.xaxis.categories
        : opts.labels

    if (cats && cats.length) {
      /**
       * @param {any} c
       */
      labels = cats.map((/** @type {any} */ c) => {
        return Array.isArray(c) ? c : String(c)
      })
    }

    if (labels && labels.length) {
      /**
       * @param {any} val
       */
      opts.xaxis.labels.formatter = function (val) {
        return Utils.isNumber(val)
          ? defaultFormatter(labels[Math.floor(val) - 1])
          : defaultFormatter(val)
      }
    }

    opts.xaxis.categories = []
    opts.labels = []
    opts.xaxis.tickAmount = opts.xaxis.tickAmount || 'dataPoints'
    return opts
  }

  bubble() {
    return {
      dataLabels: {
        style: {
          colors: ['#fff'],
        },
      },
      tooltip: {
        shared: false,
        intersect: true,
      },
      xaxis: {
        crosshairs: {
          width: 0,
        },
      },
      fill: {
        type: 'solid',
        gradient: {
          shade: 'light',
          inverse: true,
          shadeIntensity: 0.55,
          opacityFrom: 0.4,
          opacityTo: 0.8,
        },
      },
    }
  }

  scatter() {
    return {
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        shared: false,
        intersect: true,
      },
      markers: {
        size: 6,
        strokeWidth: 1,
        hover: {
          sizeOffset: 2,
        },
      },
    }
  }

  heatmap() {
    return {
      chart: {
        stacked: false,
        // A heatmap is a fixed grid: zooming/panning only distorts the cells
        // and (on a datetime axis) collapses the month labels to repeats, so
        // it is off by default, mirroring treemap. Users can opt back in with
        // chart.zoom.enabled: true.
        zoom: {
          enabled: false,
        },
      },
      fill: {
        opacity: 1,
      },
      dataLabels: {
        style: {
          colors: ['#fff'],
        },
      },
      stroke: {
        colors: ['#fff'],
      },
      tooltip: {
        // Anchor the tooltip above the hovered cell with a downward arrow
        // (flipping below near the top edge), the same treatment horizontal
        // bars get, rather than trailing the cursor. Opt back into the old
        // behavior with tooltip.followCursor: true.
        followCursor: false,
        marker: {
          show: false,
        },
        x: {
          show: false,
        },
      },
      legend: {
        position: 'top',
        markers: {
          shape: 'square',
        },
      },
      grid: {
        padding: {
          right: 20,
        },
      },
    }
  }

  treemap() {
    return {
      chart: {
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        style: {
          fontSize: 14,
          fontWeight: 600,
          colors: ['#fff'],
        },
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['#fff'],
      },
      legend: {
        show: false,
      },
      fill: {
        opacity: 1,
        gradient: {
          stops: [0, 100],
        },
      },
      tooltip: {
        followCursor: true,
        x: {
          show: false,
        },
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
        },
      },
      xaxis: {
        crosshairs: {
          show: false,
        },
        tooltip: {
          enabled: false,
        },
        // A treemap has no x axis to read: the tiles are the whole plot, and
        // the ticks mark data-point positions that mean nothing here. One tick
        // per row is invisible at a dozen rows and a solid comb under the plot
        // at several hundred, so they are off by default. Set
        // `xaxis.axisTicks.show: true` to bring them back.
        axisTicks: {
          show: false,
        },
      },
    }
  }

  unit() {
    return {
      chart: {
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: false,
        width: 0,
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        followCursor: true,
        x: {
          show: false,
        },
      },
      legend: {
        show: true,
        position: 'bottom',
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
    }
  }

  sunburst() {
    return {
      chart: {
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        style: {
          colors: ['#fff'],
        },
        dropShadow: {
          enabled: true,
        },
      },
      stroke: {
        colors: ['#fff'],
      },
      fill: {
        opacity: 1,
      },
      // Unlike pie, sunburst keeps the STANDARD themed tooltip (light/dark).
      // Slice-coloured tooltips (fillSeriesColor) wash out here because child
      // arcs are tinted toward white per depth; users can still opt in.
      legend: {
        position: 'right',
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
    }
  }

  pie() {
    return {
      chart: {
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: false,
            },
          },
        },
      },
      dataLabels: {
        /**
         * The share of the whole, as a percentage. Guarded because a config
         * survives a chart-type change: a pie that becomes a treemap hands
         * this same default a category NAME, and a default of ours must not
         * throw on a value it was never designed for.
         * @param {any} val
         */
        formatter(val) {
          return typeof val === 'number' ? val.toFixed(1) + '%' : val
        },
        style: {
          colors: ['#fff'],
        },
        background: {
          enabled: false,
        },
        dropShadow: {
          enabled: true,
        },
      },
      stroke: {
        colors: ['#fff'],
      },
      fill: {
        opacity: 1,
        gradient: {
          shade: 'light',
          stops: [0, 100],
        },
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: true,
      },
      legend: {
        position: 'right',
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
    }
  }

  donut() {
    return {
      chart: {
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        /**
         * The share of the whole, as a percentage. Guarded because a config
         * survives a chart-type change: a pie that becomes a treemap hands
         * this same default a category NAME, and a default of ours must not
         * throw on a value it was never designed for.
         * @param {any} val
         */
        formatter(val) {
          return typeof val === 'number' ? val.toFixed(1) + '%' : val
        },
        style: {
          colors: ['#fff'],
        },
        background: {
          enabled: false,
        },
        dropShadow: {
          enabled: true,
        },
      },
      stroke: {
        colors: ['#fff'],
      },
      fill: {
        opacity: 1,
        gradient: {
          shade: 'light',
          shadeIntensity: 0.35,
          stops: [80, 100],
          opacityFrom: 1,
          opacityTo: 1,
        },
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: true,
      },
      legend: {
        position: 'right',
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
    }
  }

  polarArea() {
    return {
      chart: {
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        /**
         * The share of the whole, as a percentage. Guarded because a config
         * survives a chart-type change: a pie that becomes a treemap hands
         * this same default a category NAME, and a default of ours must not
         * throw on a value it was never designed for.
         * @param {any} val
         */
        formatter(val) {
          return typeof val === 'number' ? val.toFixed(1) + '%' : val
        },
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
      },
      fill: {
        opacity: 0.7,
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: true,
      },
      legend: {
        position: 'right',
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
    }
  }

  radar() {
    this.opts.yaxis[0].labels.offsetY = this.opts.yaxis[0].labels.offsetY
      ? this.opts.yaxis[0].labels.offsetY
      : 6

    return {
      dataLabels: {
        enabled: false,
        style: {
          fontSize: '11px',
        },
      },
      stroke: {
        width: 2,
      },
      markers: {
        size: 5,
        strokeWidth: 1,
        strokeOpacity: 1,
      },
      fill: {
        opacity: 0.2,
      },
      tooltip: {
        shared: false,
        intersect: true,
        followCursor: true,
      },
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
      xaxis: {
        labels: {
          formatter: (/** @type {any} */ val) => val,
          style: {
            colors: ['#a8a8a8'],
            fontSize: '11px',
          },
        },
        tooltip: {
          enabled: false,
        },
        crosshairs: {
          show: false,
        },
      },
    }
  }

  radialBar() {
    return {
      chart: {
        animations: {
          dynamicAnimation: {
            enabled: true,
            speed: 800,
          },
        },
        toolbar: {
          show: false,
        },
      },
      stroke: {
        // Radial value arcs are stroked open arcs; square/round caps would
        // extend the stroke half a stroke-width past each endpoint, making
        // the "starting edge" visibly stick out past the geometric arc.
        // Butt cap is the only one that aligns with the arc's true angular
        // span. Without this, a chart that previously was a bar (whose
        // defaults set lineCap='square') would carry that cap across into
        // the radial render after a type morph.
        lineCap: 'butt',
      },
      fill: {
        gradient: {
          shade: 'dark',
          shadeIntensity: 0.4,
          inverseColors: false,
          type: 'diagonal2',
          opacityFrom: 1,
          opacityTo: 1,
          stops: [70, 98, 100],
        },
      },
      legend: {
        show: false,
        position: 'right',
      },
      tooltip: {
        enabled: false,
        fillSeriesColor: true,
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
    }
  }

  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   * @param {any[]} labels
   * @param {string} chartType
   */
  _getBoxTooltip(w, seriesIndex, dataPointIndex, labels, chartType) {
    const o = w.candleData.seriesCandleO[seriesIndex][dataPointIndex]
    const h = w.candleData.seriesCandleH[seriesIndex][dataPointIndex]
    const m = w.candleData.seriesCandleM[seriesIndex][dataPointIndex]
    const l = w.candleData.seriesCandleL[seriesIndex][dataPointIndex]
    const c = w.candleData.seriesCandleC[seriesIndex][dataPointIndex]

    const _si = /** @type {Record<string,any>} */ (w.config.series[seriesIndex])

    if (_si.type && _si.type !== chartType) {
      return `<div class="apexcharts-custom-tooltip">
          ${
            _si.name ? _si.name : 'series-' + (seriesIndex + 1)
          }: <strong>${w.seriesData.series[seriesIndex][dataPointIndex]}</strong>
        </div>`
    } else {
      return (
        `<div class="apexcharts-tooltip-box apexcharts-tooltip-${w.config.chart.type}">` +
        `<div>${labels[0]}: <span class="value">` +
        o +
        '</span></div>' +
        `<div>${labels[1]}: <span class="value">` +
        h +
        '</span></div>' +
        (m
          ? `<div>${labels[2]}: <span class="value">` + m + '</span></div>'
          : '') +
        `<div>${labels[3]}: <span class="value">` +
        l +
        '</span></div>' +
        `<div>${labels[4]}: <span class="value">` +
        c +
        '</span></div>' +
        '</div>'
      )
    }
  }

  /**
   * Shared tooltip for a violin: distribution value range and observation
   * count. Per-point hover is intentionally unsupported (jitter renders as a
   * single path), so the tooltip summarizes the violin as a whole.
   *
   * @param {import('../../types/internal').ChartStateW} w
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   */
  _getViolinTooltip(w, seriesIndex, dataPointIndex) {
    const minV = w.violinData.seriesViolinMin[seriesIndex]?.[dataPointIndex]
    const maxV = w.violinData.seriesViolinMax[seriesIndex]?.[dataPointIndex]
    const pts =
      w.violinData.seriesViolinPoints[seriesIndex]?.[dataPointIndex] || []
    const name =
      /** @type {Record<string,any>} */ (w.config.series[seriesIndex]).name ||
      'series-' + (seriesIndex + 1)

    return (
      `<div class="apexcharts-tooltip-box apexcharts-tooltip-${w.config.chart.type}">` +
      `<div class="apexcharts-tooltip-violin-name">${name}</div>` +
      `<div>Min: <span class="value">${minV}</span></div>` +
      `<div>Max: <span class="value">${maxV}</span></div>` +
      `<div>Observations: <span class="value">${pts.length}</span></div>` +
      '</div>'
    )
  }
}
