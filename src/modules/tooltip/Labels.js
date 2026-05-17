// @ts-check
import Formatters from '../Formatters'
import DateTime from '../../utils/DateTime'
import Utils from './Utils'
import Data from '../Data'

/**
 * ApexCharts Tooltip.Labels Class to draw texts on the tooltip.
 * This file deals with printing actual text on the tooltip.
 *
 * @module Tooltip.Labels
 **/

export default class Labels {
  /**
   * @param {import('./Tooltip').default} tooltipContext
   */
  constructor(tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
    this.tooltipUtil = new Utils(tooltipContext)
  }

  /** @param {{ shared?: boolean, ttItems?: any, i?: number, j?: any, y1?: any, y2?: any, e?: any }} opts */
  drawSeriesTexts({ shared = true, ttItems, i = 0, j = null, y1, y2, e }) {
    const w = this.w

    if (w.config.tooltip.custom !== undefined) {
      this.handleCustomTooltip({ i, j, y1, y2, w })
    } else {
      this.toggleActiveInactiveSeries(shared, i)
    }

    const values = this.getValuesToPrint({
      i,
      j,
    })

    this.printLabels({
      i,
      j,
      values,
      ttItems,
      shared,
      e,
    })

    // Re-calculate tooltip dimensions now that we have drawn the text
    const tooltipEl = this.ttCtx.getElTooltip()

    if (tooltipEl) {
      this.ttCtx.tooltipRect.ttWidth = tooltipEl.getBoundingClientRect().width
      this.ttCtx.tooltipRect.ttHeight = tooltipEl.getBoundingClientRect().height
    }
  }

  /** @param {{i: any, j: any, values: any, ttItems: any, shared: any, e: any}} opts */
  printLabels({ i, j, values, ttItems, shared, e }) {
    const w = this.w
    const { xVal, zVal, xAxisTTVal } = values
    const seriesLen = w.seriesData.series.length

    const basePColor =
      j !== null && w.config.plotOptions.bar.distributed
        ? w.globals.colors[j]
        : w.globals.colors[i]

    for (let t = 0; t < seriesLen; t++) {
      const tIndex = w.config.tooltip.inverseOrder ? seriesLen - 1 - t : t

      const row = this.computeSeriesRow({
        i,
        j,
        t,
        tIndex,
        shared,
        e,
        basePColor,
      })

      this.DOMHandling({
        i,
        t: tIndex,
        j,
        ttItems,
        values: {
          val: row.val,
          goalVals: row.goalVals,
          xVal,
          xAxisTTVal,
          zVal,
        },
        seriesName: row.seriesName,
        shared,
        pColor: row.pColor,
      })
    }
  }

  /**
   * Compute the per-series row values (seriesName, val, goalVals, pColor)
   * for one iteration of the tooltip's series loop. Extracted from
   * printLabels() to keep the outer loop scannable.
   * @param {{i: number, j: any, t: number, tIndex: number, shared: boolean, e: any, basePColor: string}} opts
   */
  computeSeriesRow({ i, j, tIndex, shared, e, basePColor }) {
    const w = this.w
    let f = this.getFormatters(i)
    let pColor = basePColor
    let val
    let goalVals = /** @type {any[]} */ ([])

    let seriesName =
      w.config.chart.type === 'treemap'
        ? f.yLbTitleFormatter(
            String(/** @type {any} */ (w.config.series[i]).data[j].x),
            {
              series: w.seriesData.series,
              seriesIndex: i,
              dataPointIndex: j,
              w,
            },
          )
        : this.getSeriesName({
            fn: f.yLbTitleFormatter,
            index: i,
            seriesIndex: i,
            j,
          })

    if (w.globals.axisCharts) {
      if (shared) {
        f = this.getFormatters(tIndex)
        seriesName = this.getSeriesName({
          fn: f.yLbTitleFormatter,
          index: tIndex,
          seriesIndex: i,
          j,
        })
        pColor = w.globals.colors[tIndex]
        val = this.formatYValue(f, tIndex, j)
        goalVals = this.formatGoalVals(f, tIndex, j)
      } else {
        pColor = this.resolvePatternColor(e, pColor)
        val = this.formatYValue(f, i, j)
        goalVals = this.formatGoalVals(f, i, j)
      }
    }

    // pie / donut (non-axis charts)
    if (j === null) {
      val = f.yLbFormatter(w.seriesData.series[i], {
        ...w,
        seriesIndex: i,
        dataPointIndex: i,
      })
    }

    return { seriesName, val, goalVals, pColor }
  }

  /**
   * Run the y-value formatter for a given (seriesIndex, dataPointIndex),
   * handling the range-data case (start - end concatenation).
   * @param {{yLbFormatter: Function}} f
   * @param {number} index
   * @param {any} j
   */
  formatYValue(f, index, j) {
    const w = this.w
    if (w.axisFlags.isRangeData) {
      return (
        f.yLbFormatter(w.rangeData.seriesRangeStart?.[index]?.[j], {
          series: w.rangeData.seriesRangeStart,
          seriesIndex: index,
          dataPointIndex: j,
          w,
        }) +
        ' - ' +
        f.yLbFormatter(w.rangeData.seriesRangeEnd?.[index]?.[j], {
          series: w.rangeData.seriesRangeEnd,
          seriesIndex: index,
          dataPointIndex: j,
          w,
        })
      )
    }
    return f.yLbFormatter(w.seriesData.series[index][j], {
      series: w.seriesData.series,
      seriesIndex: index,
      dataPointIndex: j,
      w,
    })
  }

  /**
   * Format the goal-line values attached to a given (seriesIndex, dataPointIndex).
   * Returns an empty array when no goals exist.
   * @param {{yLbFormatter: Function}} f
   * @param {number} index
   * @param {any} j
   */
  formatGoalVals(f, index, j) {
    const w = this.w
    const goals = w.seriesData.seriesGoals[index]?.[j]
    if (!Array.isArray(goals)) return []
    return goals.map((/** @type {any} */ goal) => ({
      attrs: goal,
      val: f.yLbFormatter(goal.value, {
        seriesIndex: index,
        dataPointIndex: j,
        w,
      }),
    }))
  }

  /**
   * When the hovered element has a pattern fill (url(#…Pattern…)), reach
   * into the pattern's first child to pull a stroke color. Otherwise
   * return the raw fill attribute or the fallback.
   * @param {any} e
   * @param {string} fallback
   */
  resolvePatternColor(e, fallback) {
    const w = this.w
    const targetFill = e?.target?.getAttribute('fill')
    if (!targetFill) return fallback
    if (targetFill.indexOf('url') === -1) return targetFill
    if (targetFill.indexOf('Pattern') === -1) return fallback
    const patternEl = w.dom.baseEl.querySelector(
      targetFill.substr(4).slice(0, -1),
    )
    return patternEl?.childNodes[0]?.getAttribute('stroke') ?? fallback
  }

  /**
   * @param {number} i
   */
  getFormatters(i) {
    const w = this.w

    let yLbFormatter = w.formatters.yLabelFormatters[i]
    let yLbTitleFormatter

    if (w.formatters.ttVal !== undefined) {
      if (Array.isArray(w.formatters.ttVal)) {
        yLbFormatter =
          /** @type {any} */ (w.formatters.ttVal)[i] &&
          /** @type {any} */ (w.formatters.ttVal)[i].formatter
        yLbTitleFormatter =
          /** @type {any} */ (w.formatters.ttVal)[i] &&
          /** @type {any} */ (w.formatters.ttVal)[i].title &&
          /** @type {any} */ (w.formatters.ttVal)[i].title.formatter
      } else {
        yLbFormatter = /** @type {any} */ (w.formatters.ttVal).formatter
        if (
          typeof (/** @type {any} */ (w.formatters.ttVal).title.formatter) ===
          'function'
        ) {
          yLbTitleFormatter = /** @type {any} */ (w.formatters.ttVal).title
            .formatter
        }
      }
    } else {
      yLbTitleFormatter = w.config.tooltip.y.title.formatter
    }

    if (typeof yLbFormatter !== 'function') {
      if (w.formatters.yLabelFormatters[0]) {
        yLbFormatter = w.formatters.yLabelFormatters[0]
      } else {
        /**
         * @param {string} label
         */
        yLbFormatter = function (label) {
          return label
        }
      }
    }

    if (typeof yLbTitleFormatter !== 'function') {
      /**
       * @param {string} label
       */
      yLbTitleFormatter = function (label) {
        // refrence used from line: 966 in Options.js
        return label ? label + ': ' : ''
      }
    }

    return {
      yLbFormatter,
      yLbTitleFormatter,
    }
  }

  /** @param {{fn: any, index: any, seriesIndex: any, j: any}} opts */
  getSeriesName({ fn, index, seriesIndex, j }) {
    const w = this.w
    return fn(String(w.seriesData.seriesNames[index]), {
      series: w.seriesData.series,
      seriesIndex,
      dataPointIndex: j,
      w,
    })
  }

  /** @param {{ t?: any, j?: any, i?: any, ttItems?: any, values?: any, seriesName?: any, shared?: any, pColor?: any }} opts */
  DOMHandling({ t, j, ttItems, values, seriesName, shared, pColor }) {
    const w = this.w
    const ttCtx = this.ttCtx

    const { val, goalVals, xVal, xAxisTTVal, zVal } = values

    let ttItemsChildren = null
    ttItemsChildren = ttItems[t].children

    if (w.config.tooltip.fillSeriesColor) {
      ttItems[t].style.backgroundColor = pColor
      ttItemsChildren[0].style.display = 'none'
    }

    if (ttCtx.showTooltipTitle) {
      if (ttCtx.tooltipTitle === null) {
        // get it once if null, and store it in class property
        ttCtx.tooltipTitle = w.dom.baseEl.querySelector(
          '.apexcharts-tooltip-title',
        )
      }
      if (ttCtx.tooltipTitle) {
        ttCtx.tooltipTitle.innerHTML = xVal
      }
    }

    // if xaxis tooltip is constructed, we need to replace the innerHTML
    if (ttCtx.isXAxisTooltipEnabled) {
      if (ttCtx.xaxisTooltipText) {
        ttCtx.xaxisTooltipText.innerHTML = xAxisTTVal !== '' ? xAxisTTVal : xVal
      }
    }

    const ttYLabel = ttItems[t].querySelector(
      '.apexcharts-tooltip-text-y-label',
    )
    if (ttYLabel) {
      ttYLabel.innerHTML = seriesName ? seriesName : ''
    }
    const ttYVal = ttItems[t].querySelector('.apexcharts-tooltip-text-y-value')
    if (ttYVal) {
      ttYVal.innerHTML = typeof val !== 'undefined' ? val : ''
    }

    if (
      ttItemsChildren[0] &&
      ttItemsChildren[0].classList.contains('apexcharts-tooltip-marker')
    ) {
      if (
        w.config.tooltip.marker.fillColors &&
        Array.isArray(w.config.tooltip.marker.fillColors)
      ) {
        pColor = w.config.tooltip.marker.fillColors[t]
      }

      if (w.config.tooltip.fillSeriesColor) {
        ttItemsChildren[0].style.backgroundColor = pColor
      } else {
        ttItemsChildren[0].style.color = pColor
      }
    }

    if (!w.config.tooltip.marker.show) {
      ttItemsChildren[0].style.display = 'none'
    }

    const ttGLabel = ttItems[t].querySelector(
      '.apexcharts-tooltip-text-goals-label',
    )
    const ttGVal = ttItems[t].querySelector(
      '.apexcharts-tooltip-text-goals-value',
    )

    if (goalVals.length && w.seriesData.seriesGoals[t]) {
      const createGoalsHtml = () => {
        let gLabels = '<div>'
        let gVals = '<div>'
        /**
         * @param {any} goal
         */
        goalVals.forEach((/** @type {any} */ goal) => {
          gLabels += ` <div style="display: flex"><span class="apexcharts-tooltip-marker" style="background-color: ${goal.attrs.strokeColor}; height: 3px; border-radius: 0; top: 5px;"></span> ${goal.attrs.name}</div>`
          gVals += `<div>${goal.val}</div>`
        })
        ttGLabel.innerHTML = gLabels + `</div>`
        ttGVal.innerHTML = gVals + `</div>`
      }
      if (shared) {
        if (
          w.seriesData.seriesGoals[t][j] &&
          Array.isArray(w.seriesData.seriesGoals[t][j])
        ) {
          createGoalsHtml()
        } else {
          ttGLabel.innerHTML = ''
          ttGVal.innerHTML = ''
        }
      } else {
        createGoalsHtml()
      }
    } else {
      ttGLabel.innerHTML = ''
      ttGVal.innerHTML = ''
    }

    if (zVal !== null) {
      const ttZLabel = ttItems[t].querySelector(
        '.apexcharts-tooltip-text-z-label',
      )
      ttZLabel.innerHTML = w.config.tooltip.z.title
      const ttZVal = ttItems[t].querySelector(
        '.apexcharts-tooltip-text-z-value',
      )
      ttZVal.innerHTML = typeof zVal !== 'undefined' ? zVal : ''
    }

    if (shared && ttItemsChildren[0]) {
      // hide when no Val or series collapsed
      if (w.config.tooltip.hideEmptySeries) {
        const ttItemMarker = ttItems[t].querySelector(
          '.apexcharts-tooltip-marker',
        )
        const ttItemText = ttItems[t].querySelector('.apexcharts-tooltip-text')
        if (parseFloat(val) == 0) {
          ttItemMarker.style.display = 'none'
          ttItemText.style.display = 'none'
        } else {
          ttItemMarker.style.display = 'block'
          ttItemText.style.display = 'block'
        }
      }
      if (
        typeof val === 'undefined' ||
        val === null ||
        w.globals.ancillaryCollapsedSeriesIndices.indexOf(t) > -1 ||
        w.globals.collapsedSeriesIndices.indexOf(t) > -1 ||
        (Array.isArray(ttCtx.tConfig.enabledOnSeries) &&
          ttCtx.tConfig.enabledOnSeries.indexOf(t) === -1)
      ) {
        ttItemsChildren[0].parentNode.style.display = 'none'
      } else {
        ttItemsChildren[0].parentNode.style.display =
          w.config.tooltip.items.display
      }
    } else {
      if (
        Array.isArray(ttCtx.tConfig.enabledOnSeries) &&
        ttCtx.tConfig.enabledOnSeries.indexOf(t) === -1
      ) {
        ttItemsChildren[0].parentNode.style.display = 'none'
      }
    }
  }

  /**
   * @param {boolean} shared
   * @param {number} i
   */
  toggleActiveInactiveSeries(shared, i) {
    const w = this.w
    if (shared) {
      // make all tooltips active
      this.tooltipUtil.toggleAllTooltipSeriesGroups('enable')
    } else {
      // disable all tooltip text groups
      this.tooltipUtil.toggleAllTooltipSeriesGroups('disable')

      // enable the first tooltip text group
      const firstTooltipSeriesGroup = w.dom.baseEl.querySelector(
        `.apexcharts-tooltip-series-group-${i}`,
      )

      if (firstTooltipSeriesGroup) {
        const ftsGroup = /** @type {HTMLElement} */ (firstTooltipSeriesGroup)
        ftsGroup.classList.add('apexcharts-active')
        ftsGroup.style.display = w.config.tooltip.items.display
      }
    }
  }

  /** @param {{i: any, j: any}} opts */
  getValuesToPrint({ i, j }) {
    const w = this.w
    /**
     * @param {any[]} ser
     */
    const filteredSeriesX = w.seriesData.seriesX.map(
      (/** @type {any} */ ser) => (ser.length > 0 ? ser : []),
    )

    let xVal = ''
    let xAxisTTVal = ''
    let zVal = null
    let val = null

    const customFormatterOpts = {
      series: w.seriesData.series,
      seriesIndex: i,
      dataPointIndex: j,
      w,
    }

    const zFormatter = w.formatters.ttZFormatter

    if (j === null) {
      val = w.seriesData.series[i]
    } else {
      if (w.axisFlags.isXNumeric && w.config.chart.type !== 'treemap') {
        xVal = filteredSeriesX[i][j]
        if (filteredSeriesX[i].length === 0) {
          // a series (possibly the first one) might be collapsed, so get the next active index
          const firstActiveSeriesIndex =
            this.tooltipUtil.getFirstActiveXArray(filteredSeriesX)
          xVal = filteredSeriesX[firstActiveSeriesIndex][j]
        }
      } else {
        const dataFormat = new Data(this.w)
        if (dataFormat.isFormatXY()) {
          xVal =
            typeof (/** @type {any} */ (w.config.series[i]).data[j]) !==
            'undefined'
              ? /** @type {any} */ (w.config.series[i]).data[j].x
              : ''
        } else {
          xVal =
            typeof w.labelData.labels[j] !== 'undefined'
              ? w.labelData.labels[j]
              : ''
        }
      }
    }

    const bufferXVal = xVal

    if (w.axisFlags.isXNumeric && w.config.xaxis.type === 'datetime') {
      const xFormat = new Formatters(this.w)
      xVal = xFormat.xLabelFormat(
        /** @type {Function} */ (w.formatters.ttKeyFormatter),
        bufferXVal,
        bufferXVal,
        {
          i: undefined,
          dateFormatter: new DateTime(this.w).formatDate,
          w: this.w,
        },
      )
    } else {
      if (w.globals.isBarHorizontal) {
        xVal = w.formatters.yLabelFormatters[0](bufferXVal, customFormatterOpts)
      } else {
        xVal =
          w.formatters.xLabelFormatter?.(bufferXVal, customFormatterOpts) ??
          bufferXVal
      }
    }

    // override default x-axis formatter with tooltip formatter
    if (w.config.tooltip.x.formatter !== undefined) {
      xVal =
        w.formatters.ttKeyFormatter?.(bufferXVal, customFormatterOpts) ??
        bufferXVal
    }

    if (w.seriesData.seriesZ.length > 0 && w.seriesData.seriesZ[i].length > 0) {
      zVal = zFormatter?.(w.seriesData.seriesZ[i][j], w)
    }

    if (typeof w.config.xaxis.tooltip.formatter === 'function') {
      xAxisTTVal = w.formatters.xaxisTooltipFormatter?.(
        bufferXVal,
        customFormatterOpts,
      )
    } else {
      xAxisTTVal = xVal
    }

    return {
      val: Array.isArray(val) ? val.join(' ') : val,
      xVal: Array.isArray(xVal) ? xVal.join(' ') : xVal,
      xAxisTTVal: Array.isArray(xAxisTTVal) ? xAxisTTVal.join(' ') : xAxisTTVal,
      zVal,
    }
  }

  /** @param {{i: any, j: any, y1: any, y2: any, w: any}} opts */
  handleCustomTooltip({ i, j, y1, y2, w }) {
    const tooltipEl = this.ttCtx.getElTooltip()
    let fn = w.config.tooltip.custom

    if (Array.isArray(fn) && fn[i]) {
      fn = fn[i]
    }

    const customTooltip = fn({
      series: w.seriesData.series,
      seriesIndex: i,
      dataPointIndex: j,
      y1,
      y2,
      w,
    })

    if (tooltipEl) {
      if (
        typeof customTooltip === 'string' ||
        typeof customTooltip === 'number'
      ) {
        tooltipEl.innerHTML = String(customTooltip)
      } else if (
        customTooltip instanceof Element ||
        typeof customTooltip.nodeName === 'string'
      ) {
        tooltipEl.innerHTML = ''
        tooltipEl.appendChild(customTooltip.cloneNode(true))
      }
    }
  }
}
