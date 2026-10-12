// @ts-check
/**
 * ApexCharts Tooltip.AxesTooltip Class.
 * This file deals with the x-axis and y-axis tooltips.
 *
 * @module Tooltip.AxesTooltip
 **/

import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import TooltipUtils from './Utils'

class AxesTooltip {
  /**
   * @param {import('./Tooltip').default} tooltipContext
   */
  constructor(tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
  }

  /**
   * This method adds the secondary tooltip which appears below x axis
   * @memberof Tooltip
   **/
  drawXaxisTooltip() {
    const w = this.w
    const ttCtx = this.ttCtx

    const isBottom = w.config.xaxis.position === 'bottom'

    ttCtx.xaxisOffY = isBottom
      ? w.layout.gridHeight + 1
      : -w.layout.xAxisHeight - w.config.xaxis.axisTicks.height + 3
    const tooltipCssClass = isBottom
      ? 'apexcharts-xaxistooltip apexcharts-xaxistooltip-bottom'
      : 'apexcharts-xaxistooltip apexcharts-xaxistooltip-top'

    const renderTo = w.dom.elWrap

    if (ttCtx.isXAxisTooltipEnabled) {
      const xaxisTooltip = w.dom.baseEl.querySelector(
        '.apexcharts-xaxistooltip',
      )

      if (xaxisTooltip === null) {
        ttCtx.xaxisTooltip = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'div',
        )
        ttCtx.xaxisTooltip.setAttribute(
          'class',
          tooltipCssClass + ' apexcharts-theme-' + w.config.tooltip.theme,
        )

        renderTo.appendChild(ttCtx.xaxisTooltip)

        ttCtx.xaxisTooltipText = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'div',
        )
        ttCtx.xaxisTooltipText.classList.add('apexcharts-xaxistooltip-text')

        ttCtx.xaxisTooltipText.style.fontFamily =
          w.config.xaxis.tooltip.style.fontFamily || w.config.chart.fontFamily
        ttCtx.xaxisTooltipText.style.fontSize =
          w.config.xaxis.tooltip.style.fontSize

        ttCtx.xaxisTooltip.appendChild(ttCtx.xaxisTooltipText)
      }
    }
  }

  /**
   * This method adds the secondary tooltip which appears below x axis
   * @memberof Tooltip
   **/
  drawYaxisTooltip() {
    const w = this.w
    const ttCtx = this.ttCtx

    for (let i = 0; i < w.config.yaxis.length; i++) {
      // No node for an axis whose tooltip is off (the default): the nodes
      // are found by axis index (Tooltip.getYaxisTTEls), not DOM order.
      if (!ttCtx.yaxisTooltips[i]) continue
      const isRight =
        w.config.yaxis[i].opposite || w.config.yaxis[i].crosshairs.opposite

      ttCtx.yaxisOffX = isRight ? w.layout.gridWidth + 1 : 1
      const tooltipCssClass = isRight
        ? `apexcharts-yaxistooltip apexcharts-yaxistooltip-${i} apexcharts-yaxistooltip-right`
        : `apexcharts-yaxistooltip apexcharts-yaxistooltip-${i} apexcharts-yaxistooltip-left`

      const renderTo = w.dom.elWrap

      // Compound selector (both classes on the same element). The former
      // `.apexcharts-yaxistooltip apexcharts-yaxistooltip-${i}` was a
      // descendant combinator with a bare (never-matching) second term, so
      // the query always returned null and a fresh tooltip div was appended
      // on every call. The full render tore the subtree down so it was hidden;
      // the data-only fast path preserves it, leaking two divs per update.
      const yaxisTooltip = w.dom.baseEl.querySelector(
        `.apexcharts-yaxistooltip.apexcharts-yaxistooltip-${i}`,
      )

      if (yaxisTooltip === null) {
        ttCtx.yaxisTooltip = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'div',
        )
        ttCtx.yaxisTooltip.setAttribute(
          'class',
          tooltipCssClass + ' apexcharts-theme-' + w.config.tooltip.theme,
        )

        renderTo.appendChild(ttCtx.yaxisTooltip)

        ;/** @type {any} */ (ttCtx.yaxisTooltipText ||= [])[i] =
          BrowserAPIs.createElementNS('http://www.w3.org/1999/xhtml', 'div')
        ;/** @type {any} */ (ttCtx.yaxisTooltipText)[i].classList.add(
          'apexcharts-yaxistooltip-text',
        )

        ttCtx.yaxisTooltip.appendChild(
          /** @type {any} */ (ttCtx.yaxisTooltipText)[i],
        )
      }
    }
  }

  /**
   * @memberof Tooltip
   **/
  setXCrosshairWidth() {
    const w = this.w
    const ttCtx = this.ttCtx

    // set xcrosshairs width
    const xcrosshairs = ttCtx.getElXCrosshairs()
    const cfg = w.config.xaxis.crosshairs.width
    let width = parseInt(cfg, 10)

    if (cfg === 'tickWidth') {
      width = w.layout.gridWidth / w.labelData.labels.length
    } else if (cfg === 'barWidth') {
      const bar = w.dom.baseEl.querySelector('.apexcharts-bar-area')
      width = bar ? parseFloat(bar.getAttribute('barWidth') ?? '0') : 1
    }
    // A keyword with nothing to measure (no labels, no bar) still draws.
    ttCtx.xcrosshairsWidth = Number.isFinite(width) ? width : 1

    if (w.globals.isBarHorizontal) {
      ttCtx.xcrosshairsWidth = 0
    }
    if (xcrosshairs !== null && ttCtx.xcrosshairsWidth > 0) {
      xcrosshairs.setAttribute('width', String(ttCtx.xcrosshairsWidth))
    }
  }

  handleYCrosshair() {
    const w = this.w
    const ttCtx = this.ttCtx

    // set ycrosshairs height
    ttCtx.ycrosshairs = w.dom.baseEl.querySelector('.apexcharts-ycrosshairs')

    ttCtx.ycrosshairsHidden = w.dom.baseEl.querySelector(
      '.apexcharts-ycrosshairs-hidden',
    )
  }

  /**
   * @param {number} index
   * @param {number} clientY
   */
  drawYaxisTooltipText(index, clientY) {
    const ttCtx = this.ttCtx
    const w = this.w
    const gl = w.globals
    const yAxisSeriesArr = gl.seriesYAxisMap[index]

    if (ttCtx.yaxisTooltips[index] && yAxisSeriesArr.length > 0) {
      const lbFormatter = w.formatters.yLabelFormatters[index]
      const elGrid = ttCtx.getElGrid()
      if (!elGrid) return
      // From the plot's top, where the y scale starts: the grid group's box
      // starts a pixel lower, which drew the crosshair a pixel above the
      // pointer.
      const seriesBound = TooltipUtils.plotRect(w)

      // We can use the index of any series referenced by the Yaxis
      // because they will all return the same value.
      const seriesIndex = yAxisSeriesArr[0]
      const yaxis = w.config.yaxis[index]
      const min = gl.minYArr[seriesIndex]
      const max = gl.maxYArr[seriesIndex]
      // Plot px, as the crosshair is drawn in: a screen distance is divided
      // by the CSS zoom to get there.
      const hoverY = (clientY - seriesBound.top) / seriesBound.zoom
      // How far up the axis the pointer is, 0 at min and 1 at max, read
      // through log space on a logarithmic axis (the inverse of
      // CoreUtils.getLogVal).
      const frac = yaxis.reversed
        ? hoverY / w.layout.gridHeight
        : 1 - hoverY / w.layout.gridHeight
      let val = min + frac * (max - min)
      if (yaxis.logarithmic) {
        const b = yaxis.logBase
        const lo = min === 0 ? -1 : Math.log(min) / Math.log(b)
        const hi = max === 0 ? 0 : Math.log(max) / Math.log(b)
        val = Math.pow(b, lo + frac * (hi - lo))
      }

      ttCtx.tooltipPosition.moveYCrosshairs(hoverY)
      ;/** @type {any} */ (ttCtx.yaxisTooltipText)[index].innerHTML =
        lbFormatter(val)
      ttCtx.tooltipPosition.moveYAxisTooltip(index)
    }
  }
}

export default AxesTooltip
