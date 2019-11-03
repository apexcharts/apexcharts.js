import Utils from '../../utils/Utils'

/**
 * ApexCharts Tooltip.Intersect Class.
 *
 * @module Tooltip.Intersect
 **/

class Intersect {
  constructor(tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
  }

  getAttr(e, attr) {
    return parseFloat(e.target.getAttribute(attr))
  }

  handleHeatTooltip({ e, opt, x, y }) {
    const ttCtx = this.ttCtx
    const w = this.w

    if (e.target.classList.contains('apexcharts-heatmap-rect')) {
      let i = this.getAttr(e, 'i')
      let j = this.getAttr(e, 'j')
      let cx = this.getAttr(e, 'cx')
      let cy = this.getAttr(e, 'cy')
      let width = this.getAttr(e, 'width')
      let height = this.getAttr(e, 'height')

      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j,
        shared: false
      })

      w.globals.capturedSeriesIndex = i
      w.globals.capturedDataPointIndex = j

      x = cx + ttCtx.tooltipRect.ttWidth / 2 + width
      y = cy + ttCtx.tooltipRect.ttHeight / 2 - height / 2

      ttCtx.tooltipPosition.moveXCrosshairs(cx + width / 2)

      if (x > w.globals.gridWidth / 2) {
        x = cx - ttCtx.tooltipRect.ttWidth / 2 + width
      }
      if (ttCtx.w.config.tooltip.followCursor) {
        const elGrid = ttCtx.getElGrid()
        const seriesBound = elGrid.getBoundingClientRect()
        // x = ttCtx.e.clientX - seriesBound.left
        y = ttCtx.e.clientY - seriesBound.top + w.globals.translateY / 2 - 10
      }
    }

    return {
      x,
      y
    }
  }

  handleMarkerTooltip({ e, opt, x, y }) {
    let w = this.w
    const ttCtx = this.ttCtx

    let i
    let j
    if (e.target.classList.contains('apexcharts-marker')) {
      let cx = parseInt(opt.paths.getAttribute('cx'))
      let cy = parseInt(opt.paths.getAttribute('cy'))
      let val = parseFloat(opt.paths.getAttribute('val'))

      j = parseInt(opt.paths.getAttribute('rel'))
      i =
        parseInt(
          opt.paths.parentNode.parentNode.parentNode.getAttribute('rel')
        ) - 1

      if (ttCtx.intersect) {
        const el = Utils.findAncestor(opt.paths, 'apexcharts-series')
        if (el) {
          i = parseInt(el.getAttribute('data:realIndex'))
        }
      }

      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j,
        shared: ttCtx.showOnIntersect ? false : w.config.tooltip.shared
      })

      if (e.type === 'mouseup') {
        ttCtx.markerClick(e, i, j)
      }

      w.globals.capturedSeriesIndex = i
      w.globals.capturedDataPointIndex = j

      x = cx
      y = cy + w.globals.translateY - ttCtx.tooltipRect.ttHeight * 1.4

      if (ttCtx.w.config.tooltip.followCursor) {
        const elGrid = ttCtx.getElGrid()
        const seriesBound = elGrid.getBoundingClientRect()
        y = ttCtx.e.clientY + w.globals.translateY - seriesBound.top
      }

      if (val < 0) {
        y = cy
      }
      ttCtx.marker.enlargeCurrentPoint(j, opt.paths, x, y)
    }

    return {
      x,
      y
    }
  }

  handleBarTooltip({ e, opt }) {
    const w = this.w
    const ttCtx = this.ttCtx

    const tooltipEl = ttCtx.getElTooltip()

    let bx = 0
    let x = 0
    let y = 0
    // let bW = 0
    let i = 0
    let strokeWidth
    let barXY = this.getBarTooltipXY({
      e,
      opt
    })
    i = barXY.i
    let barHeight = barXY.barHeight
    let j = barXY.j

    w.globals.capturedSeriesIndex = i
    w.globals.capturedDataPointIndex = j

    if (
      (w.globals.isBarHorizontal && ttCtx.hasBars()) ||
      !w.config.tooltip.shared
    ) {
      x = barXY.x
      y = barXY.y
      strokeWidth = Array.isArray(w.config.stroke.width)
        ? w.config.stroke.width[i]
        : w.config.stroke.width
      // bW = barXY.barWidth
      bx = x
    } else {
      if (!w.globals.comboCharts && !w.config.tooltip.shared) {
        bx = bx / 2
      }
    }

    // y is NaN, make it touch the bottom of grid area
    if (isNaN(y)) {
      y = w.globals.svgHeight - ttCtx.tooltipRect.ttHeight
    }

    // x exceeds gridWidth
    if (x + ttCtx.tooltipRect.ttWidth > w.globals.gridWidth) {
      x = x - ttCtx.tooltipRect.ttWidth
    } else if (x < 0) {
      x = x + ttCtx.tooltipRect.ttWidth
    }

    if (ttCtx.w.config.tooltip.followCursor) {
      const elGrid = ttCtx.getElGrid()
      const seriesBound = elGrid.getBoundingClientRect()
      y = ttCtx.e.clientY - seriesBound.top
    }

    // if tooltip is still null, querySelector
    if (ttCtx.tooltip === null) {
      ttCtx.tooltip = w.globals.dom.baseEl.querySelector('.apexcharts-tooltip')
    }

    if (!w.config.tooltip.shared) {
      if (w.globals.comboChartsHasBars) {
        ttCtx.tooltipPosition.moveXCrosshairs(bx + strokeWidth / 2)
      } else {
        ttCtx.tooltipPosition.moveXCrosshairs(bx)
      }
    }

    // move tooltip here
    if (
      !ttCtx.fixedTooltip &&
      (!w.config.tooltip.shared ||
        (w.globals.isBarHorizontal && ttCtx.hasBars()))
    ) {
      if (isReversed) {
        x = w.globals.gridWidth - x
      }
      tooltipEl.style.left = x + w.globals.translateX + 'px'

      const seriesIndex = parseInt(
        opt.paths.parentNode.getAttribute('data:realIndex')
      )

      const isReversed = w.globals.isMultipleYAxis
        ? w.config.yaxis[seriesIndex] && w.config.yaxis[seriesIndex].reversed
        : w.config.yaxis[0].reversed

      if (isReversed && !(w.globals.isBarHorizontal && ttCtx.hasBars())) {
        y = y + barHeight - (w.globals.series[i][j] < 0 ? barHeight : 0) * 2
      }
      if (ttCtx.tooltipRect.ttHeight + y > w.globals.gridHeight) {
        y =
          w.globals.gridHeight -
          ttCtx.tooltipRect.ttHeight +
          w.globals.translateY
        tooltipEl.style.top = y + 'px'
      } else {
        tooltipEl.style.top =
          y + w.globals.translateY - ttCtx.tooltipRect.ttHeight / 2 + 'px'
      }
    }
  }

  getBarTooltipXY({ e, opt }) {
    let w = this.w
    let j = null
    const ttCtx = this.ttCtx
    let i = 0
    let x = 0
    let y = 0
    let barWidth = 0
    let barHeight = 0

    const cl = e.target.classList

    if (
      cl.contains('apexcharts-bar-area') ||
      cl.contains('apexcharts-candlestick-area') ||
      cl.contains('apexcharts-rangebar-area')
    ) {
      let bar = e.target
      let barRect = bar.getBoundingClientRect()

      let seriesBound = opt.elGrid.getBoundingClientRect()

      let bh = barRect.height
      barHeight = barRect.height
      let bw = barRect.width

      let cx = parseInt(bar.getAttribute('cx'))
      let cy = parseInt(bar.getAttribute('cy'))
      barWidth = parseFloat(bar.getAttribute('barWidth'))
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX

      j = parseInt(bar.getAttribute('j'))
      i = parseInt(bar.parentNode.getAttribute('rel')) - 1

      if (w.globals.comboCharts) {
        i = parseInt(bar.parentNode.getAttribute('data:realIndex'))
      }

      // if (w.config.tooltip.shared) {
      // this check not needed  at the moment
      //   const yDivisor = w.globals.gridHeight / (w.globals.series.length)
      //   const hoverY = ttCtx.clientY - ttCtx.seriesBound.top

      //   j = Math.ceil(hoverY / yDivisor)
      // }

      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j,
        shared: ttCtx.showOnIntersect ? false : w.config.tooltip.shared
      })

      if (w.config.tooltip.followCursor) {
        if (w.globals.isBarHorizontal) {
          x = clientX - seriesBound.left + 15
          y =
            cy -
            ttCtx.dataPointsDividedHeight +
            bh / 2 -
            ttCtx.tooltipRect.ttHeight / 2
        } else {
          if (w.globals.isXNumeric) {
            x = cx - bw / 2
          } else {
            x = cx - ttCtx.dataPointsDividedWidth + bw / 2
          }
          y = e.clientY - seriesBound.top - ttCtx.tooltipRect.ttHeight / 2 - 15
        }
      } else {
        if (w.globals.isBarHorizontal) {
          x = cx
          if (x < ttCtx.xyRatios.baseLineInvertedY) {
            x = cx - ttCtx.tooltipRect.ttWidth
          }

          y =
            cy -
            ttCtx.dataPointsDividedHeight +
            bh / 2 -
            ttCtx.tooltipRect.ttHeight / 2
        } else {
          // if columns
          if (w.globals.isXNumeric) {
            x = cx - bw / 2
          } else {
            x = cx - ttCtx.dataPointsDividedWidth + bw / 2
          }

          y = cy // - ttCtx.tooltipRect.ttHeight / 2 + 10
        }
      }
    }

    return {
      x,
      y,
      barHeight,
      barWidth,
      i,
      j
    }
  }
}

export default Intersect
