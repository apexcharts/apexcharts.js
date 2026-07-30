// @ts-check
import apexchartsLegendCSS from '../../assets/apexcharts-legend.css'
import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment.js'

export default class Helpers {
  /**
   * @param {import('./Legend').default} lgCtx
   */
  constructor(lgCtx) {
    this.w = lgCtx.w
    this.lgCtx = lgCtx
  }

  getLegendStyles() {
    if (Environment.isSSR()) return null

    const stylesheet = document.createElement('style')
    stylesheet.setAttribute('type', 'text/css')
    const nonce = this.w.config.chart.nonce
    if (nonce) {
      stylesheet.setAttribute('nonce', nonce)
    }

    const rule = document.createTextNode(apexchartsLegendCSS)
    stylesheet.appendChild(rule)
    return stylesheet
  }

  getLegendDimensions() {
    const w = this.w
    const currLegendsWrap = w.dom.baseEl.querySelector('.apexcharts-legend')
    if (!currLegendsWrap) {
      return { clwh: 0, clww: 0 }
    }
    const { width: currLegendsWrapWidth, height: currLegendsWrapHeight } =
      currLegendsWrap.getBoundingClientRect()

    return {
      clwh: currLegendsWrapHeight,
      clww: currLegendsWrapWidth,
    }
  }

  appendToForeignObject() {
    const legendStyles = this.getLegendStyles()
    if (this.w.config.chart.injectStyleSheet !== false && legendStyles) {
      this.w.dom.elLegendForeign?.appendChild(legendStyles)
    }
  }

  /**
   * @param {number} seriesCnt
   * @param {boolean} isHidden
   */
  toggleDataSeries(seriesCnt, isHidden) {
    const w = this.w
    if (w.globals.axisCharts || w.config.chart.type === 'radialBar') {
      w.globals.resized = true // we don't want initial animations again

      let seriesEl = null

      /** @type {number | null} */
      let realIndex = null

      // yes, make it null. 1 series will rise at a time
      w.globals.risingSeries = []

      if (w.globals.axisCharts) {
        // Scan instead of an escaped-colon attribute selector
        // ([data\:realIndex='n']): some selector engines (jsdom/nwsapi)
        // silently fail to match attribute names containing a colon.
        seriesEl =
          Array.prototype.find.call(
            w.dom.baseEl.querySelectorAll('.apexcharts-series'),
            (/** @type {Element} */ el) =>
              el.getAttribute('data:realIndex') === String(seriesCnt),
          ) ?? null
        if (!seriesEl) return
        realIndex = parseInt(seriesEl.getAttribute('data:realIndex') ?? '', 10)
      } else {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`,
        )
        if (!seriesEl) return
        realIndex = parseInt(seriesEl.getAttribute('rel') ?? '', 10) - 1
      }

      if (isHidden) {
        const seriesToMakeVisible = [
          {
            cs: w.globals.collapsedSeries,
            csi: w.globals.collapsedSeriesIndices,
          },
          {
            cs: w.globals.ancillaryCollapsedSeries,
            csi: w.globals.ancillaryCollapsedSeriesIndices,
          },
        ]
        seriesToMakeVisible.forEach((r) => {
          const cs = /** @type {any} */ (r).cs
          const csi = /** @type {any} */ (r).csi
          this.riseCollapsedSeries(cs, csi, /** @type {number} */ (realIndex))
        })
      } else {
        this.hideSeries({ seriesEl, realIndex })
      }

      // Update ARIA attributes for accessibility (axis charts)
      if (w.config.chart.accessibility.enabled) {
        const legendItem = w.dom.baseEl.querySelector(
          `.apexcharts-legend-series[rel="${seriesCnt + 1}"]`,
        )
        if (legendItem) {
          const isCollapsed =
            w.globals.collapsedSeriesIndices.includes(realIndex) ||
            w.globals.ancillaryCollapsedSeriesIndices.includes(realIndex)
          legendItem.setAttribute(
            'aria-pressed',
            isCollapsed ? 'true' : 'false',
          )

          // Update aria-label - get text from legend text element
          const legendTextEl = legendItem.querySelector(
            '.apexcharts-legend-text',
          )
          const seriesName = legendTextEl
            ? legendTextEl.textContent
            : w.seriesData.seriesNames[seriesCnt]
          const statusText = isCollapsed ? 'hidden' : 'visible'
          legendItem.setAttribute(
            'aria-label',
            `${seriesName}, ${statusText}. Press Enter or Space to toggle.`,
          )
        }
      }
    } else {
      // for non-axis charts i.e pie / donut / polarArea / unit
      //
      // Legend click toggles the slice/category in and out of the chart, the
      // same way clicking a legend item hides/shows a series on axis charts.
      // Collapsing sets the slice value to 0, so it animates OUT (pie/donut/
      // polarArea redraw with the remaining slices recomputing their share;
      // unit's keyed-transition exit ghosts fade + collapse toward the centre)
      // and clicking again restores it. The legend item dims automatically via
      // collapsedSeries on the legend re-render below, and its `data:collapsed`
      // attribute flips so the next click reverses the toggle.
      w.globals.resized = true // use the update animation, not the initial draw
      w.globals.risingSeries = []

      if (isHidden) {
        this.riseCollapsedSeries(
          w.globals.collapsedSeries,
          w.globals.collapsedSeriesIndices,
          seriesCnt,
        )
      } else {
        const series = this.getSeriesAfterCollapsing({ realIndex: seriesCnt })
        this.lgCtx.updateSeries(
          series,
          w.config.chart.animations.dynamicAnimation.enabled,
        )
      }

      // Update ARIA attributes for accessibility (non-axis charts)
      if (w.config.chart.accessibility.enabled) {
        const legendItem = w.dom.baseEl.querySelector(
          `.apexcharts-legend-series[rel="${seriesCnt + 1}"]`,
        )
        if (legendItem) {
          const isCollapsed =
            w.globals.collapsedSeriesIndices.includes(seriesCnt)
          legendItem.setAttribute(
            'aria-pressed',
            isCollapsed ? 'true' : 'false',
          )

          // Update aria-label - get text from legend text element
          const legendTextEl = legendItem.querySelector(
            '.apexcharts-legend-text',
          )
          const seriesName = legendTextEl
            ? legendTextEl.textContent
            : w.seriesData.seriesNames[seriesCnt]
          const statusText = isCollapsed ? 'hidden' : 'visible'
          legendItem.setAttribute(
            'aria-label',
            `${seriesName}, ${statusText}. Press Enter or Space to toggle.`,
          )
        }
      }
    }
  }

  /**
   * Non-axis "slice" container. A pie/donut/polarArea slice is normally a
   * top-level series element (numeric form: `series = [n, n, n]`), but object
   * form (`series = [{ data: [{ x, y, drilldown }, ...] }]`, which pie/donut
   * drilldown requires) packs every slice as a data point inside a single
   * series. Return the array that actually holds the slice values so a
   * slice/legend index addresses the right thing. Scoped to the pie family so
   * unit charts (which share this non-axis path) are untouched.
   * @param {any[]} series
   * @returns {any[]}
   */
  _nonAxisSliceContainer(series) {
    const type = this.w.config.chart.type
    if (
      (type === 'pie' ||
        type === 'donut' ||
        type === 'polarArea' ||
        type === 'sunburst') &&
      series.length === 1 &&
      series[0] &&
      typeof series[0] === 'object' &&
      Array.isArray(series[0].data)
    ) {
      return series[0].data
    }
    return series
  }

  /**
   * Read a non-axis slice value (handles `{ x, y }` data points and plain
   * numbers).
   * @param {any} sliceEntry
   * @returns {number}
   */
  _readSliceValue(sliceEntry) {
    // Unit (pictogram) object form: a category is `{ name, data }` and its
    // weight is the number of data points (parseUnitSeries reads data.length),
    // not a `.y`. Snapshot the data array so rise can restore it verbatim.
    if (
      this.w.config.chart.type === 'unit' &&
      sliceEntry &&
      Array.isArray(sliceEntry.data)
    ) {
      return sliceEntry.data
    }
    return sliceEntry && typeof sliceEntry === 'object'
      ? sliceEntry.y
      : sliceEntry
  }

  /**
   * Write a non-axis slice value in place, preserving `{ x, drilldown, ... }`
   * on object data points.
   * @param {any[]} container
   * @param {number} i
   * @param {number} value
   */
  _writeSliceValue(container, i, value) {
    const entry = container[i]
    // Unit object form (see _readSliceValue): collapse empties the data array
    // (writing `.y = 0` is ignored because the dot count comes from data.length),
    // and rise restores the snapshot array. `value` is 0 to collapse or the
    // saved data array to restore.
    if (
      this.w.config.chart.type === 'unit' &&
      entry &&
      Array.isArray(entry.data)
    ) {
      entry.data = Array.isArray(value) ? value : []
      return
    }
    if (entry && typeof entry === 'object') {
      entry.y = value
    } else {
      container[i] = value
    }
  }

  /** @param {{realIndex: any}} opts */
  getSeriesAfterCollapsing({ realIndex }) {
    const w = this.w
    const gl = w.globals

    const series = Utils.clone(w.config.series)

    if (gl.axisCharts) {
      const yaxis = w.config.yaxis[gl.seriesYAxisReverseMap[realIndex]]

      const collapseData = {
        index: realIndex,
        data: series[realIndex].data.slice(),
        type: series[realIndex].type || w.config.chart.type,
        // The category name pins the hide across a data update that reorders or
        // regroups categories (e.g. a storyboard beat): the collapse is
        // reconciled by name, not index. See Series.reconcileCollapsedByName.
        name: (gl.seriesNames || [])[realIndex],
      }
      if (yaxis && yaxis.show && yaxis.showAlways) {
        if (gl.ancillaryCollapsedSeriesIndices.indexOf(realIndex) < 0) {
          gl.ancillaryCollapsedSeries.push(collapseData)
          gl.ancillaryCollapsedSeriesIndices.push(realIndex)
        }
      } else {
        if (gl.collapsedSeriesIndices.indexOf(realIndex) < 0) {
          gl.collapsedSeries.push(collapseData)
          gl.collapsedSeriesIndices.push(realIndex)

          const removeIndexOfRising = gl.risingSeries.indexOf(realIndex)
          gl.risingSeries.splice(removeIndexOfRising, 1)
        }
      }
    } else {
      // Guard against a double-collapse (e.g. a repeat legend click inside the
      // dynamic-animation window, before the re-render flips `data:collapsed`):
      // pushing the same index twice tips `allSeriesCollapsed` true below and
      // blanks the whole chart. Mirrors the axis branch above.
      if (gl.collapsedSeriesIndices.indexOf(realIndex) < 0) {
        const container = this._nonAxisSliceContainer(series)
        gl.collapsedSeries.push({
          index: realIndex,
          // Store the original slice VALUE so it can be restored on rise. In
          // object form this is a data point's `y`, not the whole series entry.
          data: this._readSliceValue(container[realIndex]),
          type: /** @type {any} */ (w.config.series[realIndex])?.type ?? 'line',
          // Pin the hide by category name so it survives a regroup (see above).
          name: (gl.seriesNames || [])[realIndex],
        })
        gl.collapsedSeriesIndices.push(realIndex)
      }
    }

    // For non-axis object-form pie/donut the slice count is the number of data
    // points, not `config.series.length` (which is 1) — otherwise collapsing a
    // single slice would wrongly flag every slice as collapsed and blank out.
    const seriesCount = gl.axisCharts
      ? w.config.series.length
      : this._nonAxisSliceContainer(series).length
    gl.allSeriesCollapsed =
      gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length ===
      seriesCount

    return this._getSeriesBasedOnCollapsedState(series)
  }

  /** @param {{seriesEl: any, realIndex: any}} opts */
  hideSeries({ seriesEl, realIndex }) {
    const w = this.w

    const series = this.getSeriesAfterCollapsing({
      realIndex,
    })

    const seriesChildren = seriesEl.childNodes
    for (let sc = 0; sc < seriesChildren.length; sc++) {
      if (
        seriesChildren[sc].classList.contains('apexcharts-series-markers-wrap')
      ) {
        if (seriesChildren[sc].classList.contains('apexcharts-hide')) {
          seriesChildren[sc].classList.remove('apexcharts-hide')
        } else {
          seriesChildren[sc].classList.add('apexcharts-hide')
        }
      }
    }

    this.lgCtx.updateSeries(
      series,
      w.config.chart.animations.dynamicAnimation.enabled,
    )
  }

  /**
   * @param {any[]} collapsedSeries
   * @param {number[]} seriesIndices
   * @param {number} realIndex
   */
  riseCollapsedSeries(collapsedSeries, seriesIndices, realIndex) {
    const w = this.w
    let series = Utils.clone(w.config.series)

    if (collapsedSeries.length > 0) {
      for (let c = 0; c < collapsedSeries.length; c++) {
        if (collapsedSeries[c].index === realIndex) {
          if (w.globals.axisCharts) {
            series[realIndex].data = collapsedSeries[c].data.slice()
            series[realIndex].hidden = false
          } else {
            // Restore the slice value in place (object-form pie/donut keeps its
            // data point's `{ x, drilldown }`; numeric pie just resets the number).
            const container = this._nonAxisSliceContainer(series)
            this._writeSliceValue(container, realIndex, collapsedSeries[c].data)
          }
          collapsedSeries.splice(c, 1)
          seriesIndices.splice(c, 1)
          w.globals.risingSeries.push(realIndex)
          c--
        }
      }

      series = this._getSeriesBasedOnCollapsedState(series)

      this.lgCtx.updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled,
      )
    }
  }

  /**
   * @param {any[]} series
   */
  _getSeriesBasedOnCollapsedState(series) {
    const w = this.w
    let collapsed = 0

    if (w.globals.axisCharts) {
      /**
       * @param {any} s
       * @param {number} sI
       */
      series.forEach((s, sI) => {
        if (
          !(
            w.globals.collapsedSeriesIndices.indexOf(sI) < 0 &&
            w.globals.ancillaryCollapsedSeriesIndices.indexOf(sI) < 0
          )
        ) {
          series[sI].data = []
          collapsed++
        }
      })
    } else {
      const container = this._nonAxisSliceContainer(series)
      /**
       * @param {any} s
       * @param {number} sI
       */
      container.forEach((s, sI) => {
        if (!(w.globals.collapsedSeriesIndices.indexOf(sI) < 0)) {
          this._writeSliceValue(container, sI, 0)
          collapsed++
        }
      })
    }

    const seriesCount = w.globals.axisCharts
      ? series.length
      : this._nonAxisSliceContainer(series).length
    w.globals.allSeriesCollapsed = collapsed === seriesCount

    return series
  }
}
