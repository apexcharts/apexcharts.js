// @ts-check
import Defaults from '../settings/Defaults'
import Config from '../settings/Config'
import CoreUtils from '../CoreUtils'
import Graphics from '../Graphics'
import Utils from '../../utils/Utils'
import PerformanceCache from '../../utils/PerformanceCache'

export default class UpdateHelpers {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: getSyncedCharts, series, data, pie, update
  }

  /**
   * private method to update Options.
   *
   * @param {Record<string, any>} options - A new config object can be passed which will be merged with the existing config object
   * @param {boolean} redraw - should redraw from beginning or should use existing paths and redraw from there
   * @param {boolean} animate - should animate or not on updating Options
   * @param {boolean} overwriteInitialConfig - should update the initial config or not
   */
  _updateOptions(
    options,
    redraw = false,
    animate = true,
    updateSyncedCharts = true,
    overwriteInitialConfig = false,
  ) {
    return new Promise((resolve) => {
      let charts = [this.ctx]
      if (updateSyncedCharts) {
        charts = this.ctx.getSyncedCharts()
      }

      if (this.w.globals.isExecCalled) {
        // If the user called exec method, we don't want to get grouped charts as user specifically provided a chartID to update
        charts = [this.ctx]
        this.w.globals.isExecCalled = false
      }

      charts.forEach((ch, chartIndex) => {
        const w = ch.w

        w.globals.shouldAnimate = animate

        if (!redraw) {
          w.globals.resized = true
          w.globals.dataChanged = true

          if (animate) {
            ch.series.getPreviousPaths()
          }
        }

        if (options && typeof options === 'object') {
          ch.config = new Config(options)
          options = CoreUtils.extendArrayProps(ch.config, options, w)

          // fixes #914, #623
          if (ch.w.globals.chartID !== this.w.globals.chartID) {
            // don't overwrite series of synchronized charts
            delete options.series
          }

          w.config = Utils.extend(w.config, options)

          if (overwriteInitialConfig) {
            // we need to forget the lastXAxis and lastYAxis as user forcefully overwriteInitialConfig. If we do not do this, and next time when user zooms the chart after setting yaxis.min/max or xaxis.min/max - the stored lastXAxis will never allow the chart to use the updated min/max by user.
            w.globals.lastXAxis = options.xaxis
              ? Utils.clone(options.xaxis)
              : []
            w.globals.lastYAxis = options.yaxis
              ? Utils.clone(options.yaxis)
              : []

            // After forgetting lastAxes, we need to restore the new config in initialConfig/initialSeries
            w.globals.initialConfig = Utils.extend({}, w.config)
            w.globals.initialSeries = Utils.clone(w.config.series)

            if (options.series) {
              // Replace the collapsed series data
              for (
                let i = 0;
                i < w.globals.collapsedSeriesIndices.length;
                i++
              ) {
                const series =
                  w.config.series[w.globals.collapsedSeriesIndices[i]]
                w.globals.collapsedSeries[i].data = w.globals.axisCharts
                  ? /** @type {any} */ (series).data.slice()
                  : series
              }
              for (
                let i = 0;
                i < w.globals.ancillaryCollapsedSeriesIndices.length;
                i++
              ) {
                const series =
                  w.config.series[w.globals.ancillaryCollapsedSeriesIndices[i]]
                w.globals.ancillaryCollapsedSeries[i].data = w.globals
                  .axisCharts
                  ? /** @type {any} */ (series).data.slice()
                  : series
              }

              // Ensure that auto-generated axes are scaled to the visible data
              ch.series.emptyCollapsedSeries(w.config.series)
            }
          }
        }

        return ch.update(options).then(() => {
          if (chartIndex === charts.length - 1) {
            resolve(ch)
          }
        })
      })
    })
  }

  /**
   * Private method to update Series.
   *
   * @param {any[]} newSeries - New series which will override the existing
   * @param {boolean} animate
   */
  _updateSeries(newSeries, animate, overwriteInitialSeries = false) {
    return new Promise((resolve) => {
      const w = this.w

      w.globals.shouldAnimate = animate

      w.globals.dataChanged = true

      PerformanceCache.invalidateSelectors(w)

      if (animate) {
        this.ctx.series.getPreviousPaths()
      }

      // Capture previous series count BEFORE parsing (parseData overwrites w.seriesData.series)
      const prevSeriesCount = w.config.series.length

      this.ctx.data.resetParsingFlags()
      // Phase 1: return value captured; writer stubs are no-ops.
      const parsedState = this.ctx.data.parseData(newSeries)
      this.ctx._writeParsedSeriesData(parsedState.seriesData)
      this.ctx._writeParsedRangeData(parsedState.rangeData)
      this.ctx._writeParsedCandleData(parsedState.candleData)
      this.ctx._writeParsedLabelData(parsedState.labelData)
      this.ctx._writeParsedAxisFlags(parsedState.axisFlags)

      if (overwriteInitialSeries) {
        if (w.globals.initialConfig) {
          w.globals.initialConfig.series = Utils.clone(w.config.series)
        }
        w.globals.initialSeries = Utils.clone(w.config.series)
      }

      // Use the fast path when the series structure is compatible:
      // same series count, same chart type, axis chart, no series collapse in progress.
      if (this._canUseFastPath(newSeries, prevSeriesCount, w)) {
        return this.ctx.fastUpdate(animate).then(() => {
          resolve(this.ctx)
        })
      }

      return this.ctx.update().then(() => {
        resolve(this.ctx)
      })
    })
  }

  /**
   * Returns true if the data-only fast path can be used for this update.
   * Fast path skips rebuilding grid, axes, legend, annotations, and tooltip DOM.
   *
   * Requirements:
   * - Chart has been fully rendered (DOM exists)
   * - Axis chart (non-axis charts like pie always need full rebuild due to radial layout)
   * - Series count unchanged (grid column/row counts depend on it)
   * - No series currently collapsing (collapsed series changes visible data range)
   * - Not a combo chart (combo charts mix types and need coordinated axis recalc)
   * @param {any[]} newSeries
   * @param {number} prevSeriesCount
   * @param {import('../../types/internal').ChartStateW} w
   */
  _canUseFastPath(newSeries, prevSeriesCount, w) {
    if (!w.dom.elGraphical) return false
    if (!w.globals.axisCharts) return false
    if (newSeries.length !== prevSeriesCount) return false
    if (w.globals.collapsedSeries.length > 0) return false
    if (w.globals.risingSeries.length > 0) return false
    if (w.globals.comboCharts) return false
    return true
  }

  /**
   * @param {any} s
   * @param {number} i
   */
  _extendSeries(s, i) {
    const w = this.w
    const ser = w.config.series[i]

    return {
      .../** @type {Record<string,any>} */ (w.config.series[i]),
      name: s.name ? s.name : /** @type {any} */ (ser)?.name,
      color: s.color ? s.color : /** @type {any} */ (ser)?.color,
      type: s.type ? s.type : /** @type {any} */ (ser)?.type,
      group: s.group ? s.group : /** @type {any} */ (ser)?.group,
      hidden:
        typeof s.hidden !== 'undefined'
          ? s.hidden
          : /** @type {any} */ (ser)?.hidden,
      data: s.data ? s.data : /** @type {any} */ (ser)?.data,
      zIndex: typeof s.zIndex !== 'undefined' ? s.zIndex : i,
    }
  }

  /**
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   */
  toggleDataPointSelection(seriesIndex, dataPointIndex) {
    const w = this.w
    let elPath = null
    const parent = `.apexcharts-series[data\\:realIndex='${seriesIndex}']`

    if (w.globals.axisCharts) {
      elPath = w.dom.Paper.findOne(
        `${parent} path[j='${dataPointIndex}'], ${parent} circle[j='${dataPointIndex}'], ${parent} rect[j='${dataPointIndex}']`,
      )
    } else {
      // dataPointIndex will be undefined here, hence using seriesIndex
      if (typeof dataPointIndex === 'undefined') {
        elPath = w.dom.Paper.findOne(`${parent} path[j='${seriesIndex}']`)

        if (
          w.config.chart.type === 'pie' ||
          w.config.chart.type === 'polarArea' ||
          w.config.chart.type === 'donut'
        ) {
          this.ctx.pie.pieClicked(seriesIndex)
        }
      }
    }

    if (elPath) {
      const graphics = new Graphics(this.w)
      graphics.pathMouseDown(elPath, /** @type {any} */ (null))
    } else {
      console.warn('toggleDataPointSelection: Element not found')
      return null
    }

    return elPath.node ? elPath.node : null
  }

  /**
   * @param {Record<string, any>} options
   */
  forceXAxisUpdate(options) {
    const w = this.w
    const minmax = ['min', 'max']

    minmax.forEach((a) => {
      if (typeof options.xaxis[a] !== 'undefined') {
        w.config.xaxis[a] = options.xaxis[a]
        ;/** @type {Record<string,any>} */ (w.globals.lastXAxis)[a] =
          options.xaxis[a]
      }
    })

    if (options.xaxis.categories && options.xaxis.categories.length) {
      w.config.xaxis.categories = options.xaxis.categories
    }

    if (w.config.xaxis.convertedCatToNumeric) {
      const defaults = new Defaults(options)
      options = defaults.convertCatToNumericXaxis(options, this.ctx)
    }
    return options
  }

  /**
   * @param {Record<string, any>} options
   */
  forceYAxisUpdate(options) {
    if (
      options.chart &&
      options.chart.stacked &&
      options.chart.stackType === '100%'
    ) {
      if (Array.isArray(options.yaxis)) {
        /**
         * @param {ApexYAxis} yaxe
         * @param {number} index
         */
        options.yaxis.forEach(
          (/** @type {any} */ yaxe, /** @type {any} */ index) => {
            options.yaxis[index].min = 0
            options.yaxis[index].max = 100
          },
        )
      } else {
        options.yaxis.min = 0
        options.yaxis.max = 100
      }
    }
    return options
  }

  /**
   * This function reverts the yaxis and xaxis min/max values to what it was when the chart was defined.
   * This function fixes an important bug where a user might load a new series after zooming in/out of previous series which resulted in wrong min/max
   * Also, this should never be called internally on zoom/pan - the reset should only happen when user calls the updateSeries() function externally
   * The function also accepts an object {xaxis, yaxis} which when present is set as the new xaxis/yaxis
   * @param {Record<string, any>} opts
   */
  revertDefaultAxisMinMax(opts) {
    const w = this.w

    let xaxis = w.globals.lastXAxis
    let yaxis = w.globals.lastYAxis

    if (opts && opts.xaxis) {
      xaxis = opts.xaxis
    }
    if (opts && opts.yaxis) {
      yaxis = opts.yaxis
    }
    const _xaxis = /** @type {any} */ (xaxis)
    w.config.xaxis.min = _xaxis.min
    w.config.xaxis.max = _xaxis.max

    /**
     * @param {number} index
     */
    const getLastYAxis = (index) => {
      if (typeof yaxis[index] !== 'undefined') {
        const _y = /** @type {any} */ (yaxis[index])
        w.config.yaxis[index].min = _y.min
        w.config.yaxis[index].max = _y.max
      }
    }

    /**
     * @param {ApexYAxis} yaxe
     * @param {number} index
     */
    w.config.yaxis.map((yaxe, index) => {
      if (w.interact.zoomed) {
        // user has zoomed, check the last yaxis
        getLastYAxis(index)
      } else {
        // user hasn't zoomed, check the last yaxis first
        if (typeof yaxis[index] !== 'undefined') {
          getLastYAxis(index)
        } else {
          // if last y-axis don't exist, check the original yaxis
          if (typeof this.ctx.opts.yaxis[index] !== 'undefined') {
            yaxe.min = this.ctx.opts.yaxis[index].min
            yaxe.max = this.ctx.opts.yaxis[index].max
          }
        }
      }
    })
  }
}
