// @ts-check
import Graphics from './Graphics'
import Utils from '../utils/Utils'
import { captureStreamFrame } from './animations/StreamScroll'
import { captureAxisChrome } from './animations/AxisTransition'
import { captureDataLabels } from './animations/DataLabelTransition'

/**
 * ApexCharts Series Class for interaction with the Series of the chart.
 *
 * @module Series
 **/

export default class Series {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {{ toggleDataSeries?: Function, revertDefaultAxisMinMax?: Function, updateSeries?: Function }} [callbacks]
   */
  constructor(
    w,
    {
      toggleDataSeries = undefined,
      revertDefaultAxisMinMax = undefined,
      updateSeries = undefined,
    } = {},
  ) {
    this.w = w
    // Injected callbacks for cross-module coordination (toggleSeries/showSeries/hideSeries/resetSeries)
    /** @type {Function | null} */ this._toggleDataSeries =
      toggleDataSeries || null
    /** @type {Function | null} */ this._revertDefaultAxisMinMax =
      revertDefaultAxisMinMax || null
    /** @type {Function | null} */ this._updateSeries = updateSeries || null

    this.legendInactiveClass = 'legend-mouseover-inactive'
  }

  clearSeriesCache() {
    const w = this.w
    if (w.globals.cachedSelectors) {
      delete w.globals.cachedSelectors.allSeriesEls
      delete w.globals.cachedSelectors.highlightSeriesEls
    }
  }

  getAllSeriesEls() {
    // cache the result to avoid repeated querySelectorAll
    const w = this.w
    const cacheKey = 'allSeriesEls'

    if (!w.globals.cachedSelectors[cacheKey]) {
      w.globals.cachedSelectors[cacheKey] = /** @type {any} */ (
        w.dom.baseEl.getElementsByClassName(`apexcharts-series`)
      )
    }

    return w.globals.cachedSelectors[cacheKey]
  }

  /**
   * @param {string} seriesName
   */
  getSeriesByName(seriesName) {
    return this.w.dom.baseEl.querySelector(
      `.apexcharts-inner .apexcharts-series[seriesName='${Utils.escapeString(
        seriesName,
      )}']`,
    )
  }

  /**
   * @param {string} seriesName
   */
  isSeriesHidden(seriesName) {
    const targetElement = this.getSeriesByName(seriesName)
    const el = /** @type {Element} */ (targetElement)
    const realIndex = parseInt(el.getAttribute('data:realIndex') ?? '0', 10)
    const isHidden = el.classList.contains('apexcharts-series-collapsed')

    return { isHidden, realIndex }
  }

  /**
   * @param {any} elSeries
   * @param {number} index
   */
  addCollapsedClassToSeries(elSeries, index) {
    Series.addCollapsedClassToSeries(this.w, elSeries, index)
  }

  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {any} elSeries
   * @param {number} index
   */
  static addCollapsedClassToSeries(w, elSeries, index) {
    /**
     * @param {any[]} series
     */
    function iterateOnAllCollapsedSeries(series) {
      for (let cs = 0; cs < series.length; cs++) {
        if (series[cs].index === index) {
          elSeries.node.classList.add('apexcharts-series-collapsed')
        }
      }
    }

    iterateOnAllCollapsedSeries(w.globals.collapsedSeries)
    iterateOnAllCollapsedSeries(w.globals.ancillaryCollapsedSeries)
  }

  /**
   * @param {string} seriesName
   */
  toggleSeries(seriesName) {
    const isSeriesHidden = this.isSeriesHidden(seriesName)

    this._toggleDataSeries?.(isSeriesHidden.realIndex, isSeriesHidden.isHidden)

    return isSeriesHidden.isHidden
  }

  /**
   * @param {string} seriesName
   */
  showSeries(seriesName) {
    const isSeriesHidden = this.isSeriesHidden(seriesName)

    if (isSeriesHidden.isHidden) {
      this._toggleDataSeries?.(isSeriesHidden.realIndex, true)
    }
  }

  /**
   * @param {string} seriesName
   */
  hideSeries(seriesName) {
    const isSeriesHidden = this.isSeriesHidden(seriesName)

    if (!isSeriesHidden.isHidden) {
      this._toggleDataSeries?.(isSeriesHidden.realIndex, false)
    }
  }

  /**
   * Cheap pre-update reset for the data-replacement paths (updateSeries /
   * appendSeries). Clears the same bookkeeping resetSeries() clears (series
   * cache, previous paths, collapsed-series state) WITHOUT restoring
   * config.series from the initialSeries snapshot: the caller is about to
   * replace the series anyway (parseData assigns config.series = newSeries),
   * so materializing and cloning the snapshot per update is pure waste (two
   * O(n) deep clones per streaming tick at 50k points).
   */
  prepareDataUpdate() {
    const w = this.w
    this.clearSeriesCache()
    w.globals.previousPaths = []
    w.globals.collapsedSeries = []
    w.globals.ancillaryCollapsedSeries = []
    w.globals.collapsedSeriesIndices = []
    w.globals.ancillaryCollapsedSeriesIndices = []
  }

  resetSeries(
    shouldUpdateChart = true,
    shouldResetZoom = true,
    shouldResetCollapsed = true,
  ) {
    const w = this.w

    this.clearSeriesCache()

    let series = Utils.clone(w.globals.initialSeries)

    w.globals.previousPaths = []

    if (shouldResetCollapsed) {
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.globals.collapsedSeriesIndices = []
      w.globals.ancillaryCollapsedSeriesIndices = []
    } else {
      series = this.emptyCollapsedSeries(series)
    }

    w.config.series = series

    if (shouldUpdateChart) {
      if (shouldResetZoom) {
        w.interact.zoomed = false
        this._revertDefaultAxisMinMax?.()
      }
      this._updateSeries?.(
        series,
        w.config.chart.animations.dynamicAnimation.enabled,
      )
    }
  }

  /**
   * @param {any[]} series
   */
  emptyCollapsedSeries(series) {
    const w = this.w
    for (let i = 0; i < series.length; i++) {
      if (w.globals.collapsedSeriesIndices.indexOf(i) > -1) {
        series[i].data = []
      }
    }
    return series
  }

  /**
   * @param {string} seriesName
   */
  /**
   * Bridge SVG series-dim state to the canvas renderer: SVG opacity classes
   * (legend-mouseover-inactive) don't touch the painted canvas series layer, so
   * repaint it with a matching per-series opacity. No-op unless the canvas
   * renderer is active. The renderer is mirrored on globals by RendererController
   * (Series has no ctx handle).
   * @param {{active:number, opacity:number}|null} dim
   */
  canvasRestyle(dim) {
    const r = this.w.globals.activeRenderer
    if (r && r.kind === 'canvas' && typeof r.restyle === 'function') {
      r.restyle(dim)
    }
  }

  /**
   * @param {string} seriesName
   */
  highlightSeries(seriesName) {
    const w = this.w

    const targetElement = this.getSeriesByName(seriesName)
    const realIndex = parseInt(
      targetElement?.getAttribute('data:realIndex') ?? '',
      10,
    )

    const cacheKey = 'highlightSeriesEls'
    let allSeriesEls = w.globals.cachedSelectors[cacheKey]

    if (!allSeriesEls) {
      allSeriesEls = w.dom.baseEl.querySelectorAll(
        `.apexcharts-series, .apexcharts-datalabels, .apexcharts-yaxis`,
      )
      w.globals.cachedSelectors[cacheKey] = allSeriesEls
    }

    let seriesEl = null
    let dataLabelEl = null
    let yaxisEl = null
    if (w.globals.axisCharts || w.config.chart.type === 'radialBar') {
      if (w.globals.axisCharts) {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[data\\:realIndex='${realIndex}']`,
        )
        dataLabelEl = w.dom.baseEl.querySelector(
          `.apexcharts-datalabels[data\\:realIndex='${realIndex}']`,
        )
        const yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex]
        yaxisEl = w.dom.baseEl.querySelector(
          `.apexcharts-yaxis[rel='${yaxisIndex}']`,
        )
      } else {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${realIndex + 1}']`,
        )
      }
    } else {
      seriesEl = w.dom.baseEl.querySelector(
        `.apexcharts-series[rel='${realIndex + 1}'] path`,
      )
    }

    for (let se = 0; se < allSeriesEls.length; se++) {
      const serEl = /** @type {Element} */ (allSeriesEls[se])
      serEl.classList.add(this.legendInactiveClass)
    }

    if (seriesEl) {
      if (!w.globals.axisCharts) {
        const parentEl = /** @type {Element} */ (seriesEl.parentNode)
        parentEl?.classList.remove(this.legendInactiveClass)
      }
      seriesEl.classList.remove(this.legendInactiveClass)

      if (dataLabelEl !== null) {
        dataLabelEl.classList.remove(this.legendInactiveClass)
      }

      if (yaxisEl !== null) {
        yaxisEl.classList.remove(this.legendInactiveClass)
      }
    } else {
      for (let se = 0; se < allSeriesEls.length; se++) {
        const serEl = /** @type {Element} */ (allSeriesEls[se])
        serEl.classList.remove(this.legendInactiveClass)
      }
    }

    this.canvasRestyle(
      seriesEl && !Number.isNaN(realIndex)
        ? { active: realIndex, opacity: 0.2 }
        : null,
    )
  }

  /**
   * @param {Event} e
   * @param {any} targetElement
   */
  toggleSeriesOnHover(e, targetElement) {
    const w = this.w

    if (!targetElement) targetElement = e.target

    const allSeriesEls = w.dom.baseEl.querySelectorAll(
      `.apexcharts-series, .apexcharts-datalabels, .apexcharts-yaxis`,
    )

    if (e.type === 'mousemove') {
      const realIndex = parseInt(targetElement.getAttribute('rel'), 10) - 1

      this.highlightSeries(w.seriesData.seriesNames[realIndex])
    } else if (e.type === 'mouseout') {
      for (let se = 0; se < allSeriesEls.length; se++) {
        allSeriesEls[se].classList.remove(this.legendInactiveClass)
      }
      this.canvasRestyle(null)
    }
  }

  /**
   * Dim every heatmap cell except those whose value falls inside the color
   * range at `rangeIndex`. Shared by the categorical legend (hover a legend
   * item) and the gradient legend (hover a band) — both supply an index into
   * `colorScale.ranges` plus an action, decoupling the highlight from any
   * particular DOM element / event shape.
   *
   * @param {number} rangeIndex index into `colorScale.ranges`
   * @param {'highlight'|'reset'} action
   */
  highlightRangeInSeries(rangeIndex, action) {
    const w = this.w
    const allHeatMapElements = w.dom.baseEl.getElementsByClassName(
      'apexcharts-heatmap-rect',
    )

    /**
     * @param {'add'|'remove'} op
     */
    const toggleAllInactive = (op) => {
      for (let i = 0; i < allHeatMapElements.length; i++) {
        const classList = /** @type {any} */ (allHeatMapElements[i]).classList
        if (typeof classList[op] === 'function') {
          classList[op](this.legendInactiveClass)
        }
      }
    }

    if (action === 'reset') {
      toggleAllInactive('remove')
      return
    }

    const ranges = w.config.plotOptions.heatmap.colorScale.ranges
    const range = ranges && ranges[rangeIndex]
    if (!range) return

    toggleAllInactive('add')
    for (let i = 0; i < allHeatMapElements.length; i++) {
      const val = Number(allHeatMapElements[i].getAttribute('val'))
      // Match the inclusive bounds used by determineColor (treemap/Helpers.js)
      // so the same cells that were colored by this range get highlighted.
      if (val >= range.from && val <= range.to) {
        allHeatMapElements[i].classList.remove(this.legendInactiveClass)
      }
    }
  }

  /**
   * @param {string[]} chartTypes
   */
  getActiveConfigSeriesIndex(order = 'asc', chartTypes = []) {
    const w = this.w
    let activeIndex = 0

    if (w.config.series.length > 1) {
      // active series flag is required to know if user has not deactivated via legend click
      /**
       * @param {Record<string, any>} s
       * @param {number} index
       */
      const activeSeriesIndex = w.config.series.map((s, index) => {
        const checkChartType = () => {
          if (w.globals.comboCharts) {
            return (
              chartTypes.length === 0 ||
              (chartTypes.length &&
                chartTypes.indexOf(
                  /** @type {Record<string,any>} */ (w.config.series[index])
                    .type,
                ) > -1)
            )
          }
          return true
        }

        const hasData =
          /** @type {any} */ (s).data &&
          /** @type {any} */ (s).data.length > 0 &&
          w.globals.collapsedSeriesIndices.indexOf(index) === -1

        return hasData && checkChartType() ? index : -1
      })
      for (
        let a = order === 'asc' ? 0 : activeSeriesIndex.length - 1;
        order === 'asc' ? a < activeSeriesIndex.length : a >= 0;
        order === 'asc' ? a++ : a--
      ) {
        if (activeSeriesIndex[a] !== -1) {
          activeIndex = activeSeriesIndex[a]
          break
        }
      }
    }

    return activeIndex
  }

  getBarSeriesIndices() {
    const w = this.w
    if (w.globals.comboCharts) {
      return this.w.config.series
        .map((/** @type {any} */ s, /** @type {number} */ i) => {
          return s.type === 'bar' || s.type === 'column' ? i : -1
        })
        .filter((/** @type {number} */ i) => {
          return i !== -1
        })
    }
    /**
     * @param {Record<string, any>} s
     * @param {number} i
     */
    return this.w.config.series.map((s, i) => {
      return i
    })
  }

  getPreviousPaths() {
    const w = this.w

    // Streaming scroll: snapshot the outgoing frame's parsed rows + pixel
    // positions so a windowed-continuation update (rolling window / append
    // under xaxis.range) can be animated as a slide. See StreamScroll.
    captureStreamFrame(w)

    // Axis-chrome snapshot: tick labels + gridlines of the outgoing render,
    // so a variable-length update can slide/fade the ruler along with the
    // reflowing marks. See AxisTransition.
    captureAxisChrome(w)

    // Data-label snapshot (opt-in): position + value of bar/column labels, so
    // a data-change update can ride labels to their new slot and count their
    // value up. See DataLabelTransition. No-op unless the feature is on.
    captureDataLabels(w)

    // Non-axis charts (pie/donut/radialBar) overwrite previousPaths with the
    // raw series values at the end anyway — skip the DOM captures entirely.
    if (!w.globals.axisCharts) {
      w.globals.previousPaths = w.seriesData.series
      return
    }

    // A synced sibling chart (see getSyncedCharts()) can land here mid
    // teardown/rebuild: a wrapping component (e.g. a templating card that
    // re-renders its child on every data-driven config change) may have
    // already detached this chart's host element - or never finished
    // mounting it - while this chart's own _updateOptions() call is still
    // in flight. Either way there's no live DOM to capture paths from.
    if (!Utils.elementExists(w.dom.baseEl)) {
      w.globals.previousPaths = []
      return
    }

    w.globals.previousPaths = []

    /**
     * @param {any} seriesEls
     * @param {number} i
     * @param {string} type
     */
    function pushPaths(seriesEls, i, type) {
      const paths = seriesEls[i].childNodes
      const dArr = {
        type,
        paths: /** @type {any[]} */ ([]),
        realIndex: seriesEls[i].getAttribute('data:realIndex'),
      }

      for (let j = 0; j < paths.length; j++) {
        if (paths[j].hasAttribute('pathTo')) {
          const d = paths[j].getAttribute('pathTo')
          // Datum key + fill stamped by the bar renderer: the key lets the
          // next render match survivors by identity (not position) and detect
          // exited datums; the fill paints their exit ghosts.
          dArr.paths.push({
            d,
            key: paths[j].getAttribute('data:pathKey'),
            fill: paths[j].getAttribute('fill'),
          })
        }
      }

      w.globals.previousPaths.push(dArr)
    }

    /**
     * @param {string} chartType
     */
    const getPaths = (chartType) => {
      return w.dom.baseEl.querySelectorAll(
        `.apexcharts-${chartType}-series .apexcharts-series`,
      )
    }

    const chartTypes = [
      'line',
      'area',
      'bar',
      'rangebar',
      'rangeArea',
      'candlestick',
      'radar',
    ]
    chartTypes.forEach((type) => {
      const paths = getPaths(type)
      for (let p = 0; p < paths.length; p++) {
        pushPaths(paths, p, type)
      }
    })

    const heatTreeSeries = w.dom.baseEl.querySelectorAll(
      `.apexcharts-${w.config.chart.type} .apexcharts-series`,
    )

    if (heatTreeSeries.length > 0) {
      for (let h = 0; h < heatTreeSeries.length; h++) {
        const seriesEls = w.dom.baseEl.querySelectorAll(
          `.apexcharts-${w.config.chart.type} .apexcharts-series[data\\:realIndex='${h}'] rect`,
        )

        const dArr = []

        for (let i = 0; i < seriesEls.length; i++) {
          /**
           * @param {number} x
           */
          const getAttr = (/** @type {string} */ x) => {
            return /** @type {Element} */ (seriesEls[i]).getAttribute(x)
          }
          const rect = {
            x: parseFloat(getAttr('x') ?? '0'),
            y: parseFloat(getAttr('y') ?? '0'),
            width: parseFloat(getAttr('width') ?? '0'),
            height: parseFloat(getAttr('height') ?? '0'),
          }
          dArr.push({
            rect,
            color: seriesEls[i].getAttribute('color'),
          })
        }
        w.globals.previousPaths.push(dArr)
      }
    }
  }

  clearPreviousPaths() {
    const w = this.w
    w.globals.previousPaths = []
    w.globals.allSeriesCollapsed = false
  }

  handleNoData() {
    const w = this.w
    const me = this

    const noDataOpts = w.config.noData
    const graphics = new Graphics(me.w)

    let x = w.globals.svgWidth / 2
    let y = w.globals.svgHeight / 2
    let textAnchor = 'middle'

    w.globals.noData = true
    w.globals.animationEnded = true

    if (noDataOpts.align === 'left') {
      x = 10
      textAnchor = 'start'
    } else if (noDataOpts.align === 'right') {
      x = w.globals.svgWidth - 10
      textAnchor = 'end'
    }

    if (noDataOpts.verticalAlign === 'top') {
      y = 50
    } else if (noDataOpts.verticalAlign === 'bottom') {
      y = w.globals.svgHeight - 50
    }

    x = x + noDataOpts.offsetX
    y = y + parseInt(noDataOpts.style.fontSize, 10) + 2 + noDataOpts.offsetY

    if (noDataOpts.text !== undefined && noDataOpts.text !== '') {
      const titleText = graphics.drawText({
        x,
        y,
        text: noDataOpts.text,
        textAnchor,
        fontSize: noDataOpts.style.fontSize,
        fontFamily: noDataOpts.style.fontFamily,
        foreColor: noDataOpts.style.color,
        opacity: 1,
        cssClass: 'apexcharts-text-nodata',
      })

      w.dom.Paper.add(titleText)
    }
  }

  // When user clicks on legends, the collapsed series is filled with [0,0,0,...,0]
  // This is because we don't want to alter the series' length as it is used at many places
  /**
   * @param {any[]} series
   */
  setNullSeriesToZeroValues(series) {
    const w = this.w
    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length === 0) {
        for (let j = 0; j < series[w.globals.maxValsInArrayIndex].length; j++) {
          series[sl].push(0)
        }
      }
    }
    return series
  }

  hasAllSeriesEqualX() {
    let equalLen = true
    const w = this.w

    const filteredSerX = this.filteredSeriesX()

    for (let i = 0; i < filteredSerX.length - 1; i++) {
      if (filteredSerX[i][0] !== filteredSerX[i + 1][0]) {
        equalLen = false
        break
      }
    }

    w.globals.allSeriesHasEqualX = equalLen

    return equalLen
  }

  filteredSeriesX() {
    const w = this.w

    /**
     * @param {any[]} ser
     */
    const filteredSeriesX = w.seriesData.seriesX.map((ser) =>
      ser.length > 0 ? ser : [],
    )

    return filteredSeriesX
  }
}
