import Graphics from '../Graphics'
import Series from '../Series'

/**
 * ApexCharts Tooltip.Position Class to move the tooltip based on x and y position.
 *
 * @module Tooltip.Position
 **/

class Position {
  constructor (tooltipContext) {
    this.ttCtx = tooltipContext
    this.ctx = tooltipContext.ctx
    this.w = tooltipContext.w
  }

  /**
   * This will move the crosshair (the vertical/horz line that moves along with mouse)
   * Along with this, this function also calls the xaxisMove function
   * @memberof Position
   * @param {int} - cx = point's x position, wherever point's x is, you need to move crosshair
   */
  moveXCrosshairs (cx, j = null) {
    const ttCtx = this.ttCtx
    let w = this.w

    const xcrosshairs = ttCtx.getElXCrosshairs()

    let x = cx - ttCtx.xcrosshairsWidth / 2

    let tickAmount = w.globals.labels.slice().length
    if (j !== null) {
      x = (w.globals.gridWidth / tickAmount) * j
    }

    if (w.config.xaxis.crosshairs.width === 'tickWidth' || w.config.xaxis.crosshairs.width === 'barWidth') {
      if (x + ttCtx.xcrosshairsWidth > w.globals.gridWidth) {
        x = w.globals.gridWidth - ttCtx.xcrosshairsWidth
      }

      if (x < 0) {
        x = 0
      }
    } else {
      if (j !== null) {
        x = x + (w.globals.gridWidth / tickAmount) / 2
      }
    }

    if (xcrosshairs !== null) {
      xcrosshairs.setAttribute('x', x)
      xcrosshairs.classList.add('active')
    }

    if (ttCtx.blxaxisTooltip) {
      let tx = x
      if (w.config.xaxis.crosshairs.width === 'tickWidth' || w.config.xaxis.crosshairs.width === 'barWidth') {
        tx = x + ttCtx.xcrosshairsWidth / 2
      }
      this.moveXAxisTooltip(tx)
    }
  }

  /**
   * This will move the crosshair (the vertical/horz line that moves along with mouse)
   * Along with this, this function also calls the xaxisMove function
   * @memberof Position
   * @param {int} - cx = point's x position, wherever point's x is, you need to move crosshair
   */
  moveYCrosshairs (cy) {
    const ttCtx = this.ttCtx

    if (ttCtx.ycrosshairs !== null) {
      Graphics.setAttrs(ttCtx.ycrosshairs, {
        y1: cy,
        y2: cy
      })

      Graphics.setAttrs(ttCtx.ycrosshairsHidden, {
        y1: cy,
        y2: cy
      })
    }
  }

  /**
   ** AxisTooltip is the small rectangle which appears on x axis with x value, when user moves
   * @memberof Position
   * @param {int} - cx = point's x position, wherever point's x is, you need to move
   */
  moveXAxisTooltip (cx) {
    let w = this.w
    const ttCtx = this.ttCtx

    if (ttCtx.xaxisTooltip !== null) {
      ttCtx.xaxisTooltip.classList.add('active')

      let cy = ttCtx.xaxisOffY + w.config.xaxis.tooltip.offsetY + w.globals.translateY + 1

      let xaxisTTText = ttCtx.xaxisTooltip.getBoundingClientRect()
      let xaxisTTTextWidth = xaxisTTText.width

      cx = cx - (xaxisTTTextWidth / 2)

      if (!isNaN(cx)) {
        cx = cx + w.globals.translateX

        let textRect = 0
        const graphics = new Graphics(this.ctx)
        textRect = graphics.getTextRects(ttCtx.xaxisTooltipText.innerHTML)

        ttCtx.xaxisTooltipText.style.minWidth = textRect.width + 'px'
        ttCtx.xaxisTooltip.style.left = cx + 'px'
        ttCtx.xaxisTooltip.style.top = cy + 'px'
      }
    }
  }

  moveYAxisTooltip (index) {
    const w = this.w
    const ttCtx = this.ttCtx

    if (ttCtx.yaxisTTEls === null) {
      ttCtx.yaxisTTEls = w.globals.dom.baseEl.querySelectorAll('.apexcharts-yaxistooltip')
    }

    const ycrosshairsHiddenRect = parseInt(ttCtx.ycrosshairsHidden.getAttribute('y1'))
    let cy = w.globals.translateY + ycrosshairsHiddenRect

    const yAxisTTRect = ttCtx.yaxisTTEls[index].getBoundingClientRect()
    const yAxisTTHeight = yAxisTTRect.height
    let cx = w.globals.translateYAxisX[index] - 2

    if (w.config.yaxis[index].opposite) {
      cx = cx - 26
    }

    cy = cy - yAxisTTHeight / 2

    if (!w.globals.ignoreYAxisIndexes.includes(index)) {
      ttCtx.yaxisTTEls[index].classList.add('active')
      ttCtx.yaxisTTEls[index].style.top = cy + 'px'
      ttCtx.yaxisTTEls[index].style.left = cx + w.config.yaxis[index].tooltip.offsetX + 'px'
    } else {
      ttCtx.yaxisTTEls[index].classList.remove('active')
    }
  }

  /**
   ** moves the whole tooltip by changing x, y attrs
   * @memberof Position
   * @param {int} - cx = point's x position, wherever point's x is, you need to move tooltip
   * @param {int} - cy = point's y position, wherever point's y is, you need to move tooltip
   * @param {int} - r = point's radius
   */
  moveTooltip (cx, cy, r = null) {
    let w = this.w

    let ttCtx = this.ttCtx
    const tooltipEl = ttCtx.getElTooltip()
    let tooltipRect = ttCtx.tooltipRect

    let pointR = r !== null ? parseInt(r) : 1

    let x = parseInt(cx) + pointR + 5
    let y = parseInt(cy) + pointR / 2 // - tooltipRect.ttHeight / 2

    if (x > w.globals.gridWidth / 2) {
      x = x - tooltipRect.ttWidth - pointR - 15
    }

    if (x > w.globals.gridWidth - tooltipRect.ttWidth - 10) {
      x = w.globals.gridWidth - tooltipRect.ttWidth
    }

    if (x < -20) {
      x = -20
    }

    if (w.config.tooltip.followCursor) {
      const elGrid = ttCtx.getElGrid()
      const seriesBound = elGrid.getBoundingClientRect()
      y = ttCtx.e.clientY - seriesBound.top - tooltipRect.ttHeight / 2
    }

    if (tooltipRect.ttHeight + y > w.globals.gridHeight) {
      y = w.globals.gridHeight - tooltipRect.ttHeight / 2 - pointR
    }

    if (!isNaN(x)) {
      x = x + w.globals.translateX

      tooltipEl.style.left = x + 'px'
      tooltipEl.style.top = y + 'px'
    }
  }

  moveMarkers (i, j) {
    let w = this.w
    let ttCtx = this.ttCtx

    if (w.config.markers.size > 0) {
      let allPoints = w.globals.dom.baseEl.querySelectorAll(` .apexcharts-series[data\\:realIndex='${i}'] .apexcharts-marker`)
      for (let p = 0; p < allPoints.length; p++) {
        if (parseInt(allPoints[p].getAttribute('rel')) === j) {
          ttCtx.marker.resetPointsSize()
          ttCtx.marker.enlargeCurrentPoint(j, allPoints[p])
        }
      }
    } else {
      ttCtx.marker.resetPointsSize()
      this.moveDynamicPointOnHover(
        j,
        i
      )
    }
  }

  // This function is used when you need to show markers/points only on hover -
  // DIFFERENT X VALUES in multiple series
  moveDynamicPointOnHover (j, capturedSeries) {
    let w = this.w
    let ttCtx = this.ttCtx
    let cx = 0
    let cy = 0

    let pointsArr = w.globals.pointsArray

    let hoverSize = w.config.markers.hover.size
    cx = pointsArr[capturedSeries][j][0]
    cy = pointsArr[capturedSeries][j][1] ? pointsArr[capturedSeries][j][1] : 0

    let point = w.globals.dom.baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${capturedSeries}'] .apexcharts-series-markers circle`
    )

    point.setAttribute('r', hoverSize)

    point.setAttribute('cx', cx)
    point.setAttribute('cy', cy)
    // point.style.opacity = w.config.markers.hover.opacity

    this.moveXCrosshairs(cx)

    if (!ttCtx.fixedTooltip) {
      this.moveTooltip(cx, cy, hoverSize)
    }
  }

  // This function is used when you need to show markers/points only on hover -
  // SAME X VALUES in multiple series
  moveDynamicPointsOnHover (j) {
    const ttCtx = this.ttCtx
    let w = ttCtx.w
    let cx = 0
    let cy = 0
    let activeSeries = 0

    let pointsArr = w.globals.pointsArray

    let series = new Series(this.ctx)
    activeSeries = series.getActiveSeriesIndex()

    let hoverSize = w.config.markers.hover.size
    if (pointsArr[activeSeries]) {
      cx = pointsArr[activeSeries][j][0]
      cy = pointsArr[activeSeries][j][1]
    }

    let points = null
    const allPoints = ttCtx.getAllMarkers()

    if (allPoints !== null) {
      points = allPoints
    } else {
      points = w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-series-markers circle'
      )
    }

    if (points !== null) {
      for (let p = 0; p < points.length; p++) {
        let pointArr = pointsArr[p]

        if (pointArr && pointArr.length) {
          let pcy = pointsArr[p][j][1]
          points[p].setAttribute('cx', cx)
          let realIndex = parseInt(
            points[p].parentNode.parentNode.parentNode.getAttribute(
              'data:realIndex'
            )
          )

          if (pcy !== null) {
            points[realIndex] && points[realIndex].setAttribute('r', hoverSize)
            points[realIndex] && points[realIndex].setAttribute('cy', pcy)
          } else {
            points[realIndex] && points[realIndex].setAttribute('r', 0)
          }
        }
      }
    }

    this.moveXCrosshairs(cx)

    if (!ttCtx.fixedTooltip) {
      let tcy = cy || w.globals.gridHeight
      this.moveTooltip(cx, tcy, hoverSize)
    }
  }

  moveStickyTooltipOverBars (j) {
    const w = this.w
    const ttCtx = this.ttCtx

    let jBar = w.globals.dom.baseEl.querySelector(`.apexcharts-bar-series .apexcharts-series[rel='1'] path[j='${j}'], .apexcharts-candlestick-series .apexcharts-series[rel='1'] path[j='${j}']`)

    let bcx = jBar ? parseFloat(jBar.getAttribute('cx')) : 0
    let bcy = 0
    let bw = jBar ? parseFloat(jBar.getAttribute('barWidth')) : 0

    if (w.globals.dataXY) {
      bcx = bcx - bw / 2
    } else {
      bcx = ttCtx.xAxisTicksPositions[j - 1] + (ttCtx.dataPointsDividedWidth / 2)
      if (isNaN(bcx)) {
        bcx = ttCtx.xAxisTicksPositions[j] - (ttCtx.dataPointsDividedWidth / 2)
      }
    }

    // tooltip will move vertically along with mouse as it is a shared tooltip
    const elGrid = ttCtx.getElGrid()
    let seriesBound = elGrid.getBoundingClientRect()

    bcy = ttCtx.e.clientY - seriesBound.top - ttCtx.tooltipRect.ttHeight / 2

    this.moveXCrosshairs(bcx)

    if (!ttCtx.fixedTooltip) {
      let tcy = bcy || w.globals.gridHeight
      this.moveTooltip(bcx, tcy)
    }
  }
}
module.exports = Position
