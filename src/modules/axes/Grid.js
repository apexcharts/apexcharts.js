import CoreUtils from '../CoreUtils'
import Graphics from '../Graphics'
import XAxis from './XAxis'
import YAxis from './YAxis'

/**
 * ApexCharts Grid Class for drawing Cartesian Grid.
 *
 * @module Grid
 **/

class Grid {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    const w = this.w
    this.xaxisLabels = w.globals.labels.slice()

    this.isTimelineBar =
      w.config.xaxis.type === 'datetime' &&
      w.globals.seriesRangeBarTimeline.length

    if (w.globals.timelineLabels.length > 0) {
      //  timeline labels are there
      this.xaxisLabels = w.globals.timelineLabels.slice()
    }
    if (w.globals.invertedTimelineLabels.length > 0) {
      this.xaxisLabels = w.globals.invertedTimelineLabels.slice()
    }
  }

  // .when using sparklines or when showing no grid, we need to have a grid area which is reused at many places for other calculations as well
  drawGridArea(elGrid = null) {
    let w = this.w

    let graphics = new Graphics(this.ctx)

    if (elGrid === null) {
      elGrid = graphics.group({
        class: 'apexcharts-grid'
      })
    }

    let elVerticalLine = graphics.drawLine(
      w.globals.padHorizontal,
      1,
      w.globals.padHorizontal,
      w.globals.gridHeight,
      'transparent'
    )

    let elHorzLine = graphics.drawLine(
      w.globals.padHorizontal,
      w.globals.gridHeight,
      w.globals.gridWidth,
      w.globals.gridHeight,
      'transparent'
    )

    elGrid.add(elHorzLine)
    elGrid.add(elVerticalLine)

    return elGrid
  }

  drawGrid() {
    let w = this.w

    let xAxis = new XAxis(this.ctx)
    let yaxis = new YAxis(this.ctx)

    let gl = this.w.globals

    let elgrid = null

    if (gl.axisCharts) {
      // grid is drawn after xaxis and yaxis are drawn
      elgrid = this.renderGrid()
      gl.dom.elGraphical.add(elgrid.el)

      this.drawGridArea(elgrid.el)

      if (elgrid !== null) {
        xAxis.xAxisLabelCorrections(elgrid.xAxisTickWidth)
      }

      yaxis.setYAxisTextAlignments()
    }
  }

  // This mask will clip off overflowing graphics from the drawable area
  createGridMask() {
    let w = this.w
    let gl = w.globals
    const graphics = new Graphics(this.ctx)

    let strokeSize = Array.isArray(w.config.stroke.width)
      ? 0
      : w.config.stroke.width

    if (Array.isArray(w.config.stroke.width)) {
      let strokeMaxSize = 0
      w.config.stroke.width.forEach((m) => {
        strokeMaxSize = Math.max(strokeMaxSize, m)
      })
      strokeSize = strokeMaxSize
    }

    gl.dom.elGridRectMask = document.createElementNS(gl.SVGNS, 'clipPath')
    gl.dom.elGridRectMask.setAttribute('id', `gridRectMask${gl.cuid}`)

    gl.dom.elGridRectMarkerMask = document.createElementNS(gl.SVGNS, 'clipPath')
    gl.dom.elGridRectMarkerMask.setAttribute(
      'id',
      `gridRectMarkerMask${gl.cuid}`
    )

    gl.dom.elGridRect = graphics.drawRect(
      -strokeSize / 2,
      -strokeSize / 2,
      gl.gridWidth + strokeSize,
      gl.gridHeight + strokeSize,
      0,
      '#fff'
    )

    const coreUtils = new CoreUtils(this)
    coreUtils.getLargestMarkerSize()

    let markerSize = w.globals.markers.largestSize + 1

    gl.dom.elGridRectMarker = graphics.drawRect(
      -markerSize,
      -markerSize,
      gl.gridWidth + markerSize * 2,
      gl.gridHeight + markerSize * 2,
      0,
      '#fff'
    )
    gl.dom.elGridRectMask.appendChild(gl.dom.elGridRect.node)
    gl.dom.elGridRectMarkerMask.appendChild(gl.dom.elGridRectMarker.node)

    let defs = gl.dom.baseEl.querySelector('defs')
    defs.appendChild(gl.dom.elGridRectMask)
    defs.appendChild(gl.dom.elGridRectMarkerMask)
  }

  _drawGridLine({ x1, y1, x2, y2, parent }) {
    const w = this.w
    let strokeDashArray = w.config.grid.strokeDashArray

    const graphics = new Graphics(this)
    let line = graphics.drawLine(
      x1,
      y1,
      x2,
      y2,
      w.config.grid.borderColor,
      strokeDashArray
    )
    line.node.classList.add('apexcharts-gridline')
    parent.add(line)
  }

  _drawGridBandRect({ c, x1, y1, x2, y2, type, parent }) {
    const w = this.w
    const graphics = new Graphics(this.ctx)

    if (type === 'column' && w.config.xaxis.type === 'datetime') return

    const color = w.config.grid[type].colors[c]

    let rect = graphics.drawRect(
      x1,
      y1,
      x2,
      y2,
      0,
      color,
      w.config.grid[type].opacity
    )
    parent.add(rect)
    rect.node.classList.add(`apexcharts-grid-${type}`)
  }

  // actual grid rendering
  renderGrid() {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elg = graphics.group({
      class: 'apexcharts-grid'
    })
    let elgridLinesH = graphics.group({
      class: 'apexcharts-gridlines-horizontal'
    })
    let elgridLinesV = graphics.group({
      class: 'apexcharts-gridlines-vertical'
    })

    elg.add(elgridLinesH)
    elg.add(elgridLinesV)

    if (!w.config.grid.show) {
      elgridLinesV.hide()
      elgridLinesH.hide()
    }

    let tickAmount = 8
    for (let i = 0; i < w.globals.series.length; i++) {
      if (typeof w.globals.yAxisScale[i] !== 'undefined') {
        tickAmount = w.globals.yAxisScale[i].result.length - 1
      }
      if (tickAmount > 2) break
    }

    const datetimeLines = ({ xCount, x1, y1, x2, y2 }) => {
      for (let i = 0; i < xCount; i++) {
        x1 = this.xaxisLabels[i].position
        x2 = this.xaxisLabels[i].position
        if (
          w.config.grid.xaxis.lines.show &&
          x1 > 0 &&
          x1 < w.globals.gridWidth
        ) {
          this._drawGridLine({ x1, y1, x2, y2, parent: elgridLinesV })
        }

        let xAxis = new XAxis(this.ctx)
        if (i === xCount - 1) {
          if (!w.globals.skipLastTimelinelabel) {
            // skip drawing last label here
            xAxis.drawXaxisTicks(x1, elg)
          }
        } else {
          xAxis.drawXaxisTicks(x1, elg)
        }
      }
    }

    const categoryLines = ({ xCount, x1, y1, x2, y2 }) => {
      for (let i = 0; i < xCount; i++) {
        let x1Count = xCount
        if (w.globals.isXNumeric) {
          x1Count -= 1
        }

        x1 = x1 + w.globals.gridWidth / x1Count
        x2 = x1

        // skip the last line
        if (i === x1Count - 1) break

        if (w.config.grid.xaxis.lines.show) {
          this._drawGridLine({ x1, y1, x2, y2, parent: elgridLinesV })
        }

        let xAxis = new XAxis(this.ctx)
        xAxis.drawXaxisTicks(x1, elg)
      }
    }

    let xCount

    if (!w.globals.isBarHorizontal || this.isTimelineBar) {
      xCount = this.xaxisLabels.length

      // draw vertical lines
      if (w.config.grid.xaxis.lines.show || w.config.xaxis.axisTicks.show) {
        let x1 = w.globals.padHorizontal
        let y1 = 0
        let x2
        let y2 = w.globals.gridHeight

        if (
          w.globals.timelineLabels.length ||
          w.globals.invertedTimelineLabels.length
        ) {
          datetimeLines({ xCount, x1, y1, x2, y2 })
        } else {
          categoryLines({ xCount, x1, y1, x2, y2 })
        }
      }

      // draw horizontal lines
      if (w.config.grid.yaxis.lines.show) {
        let x1 = 0
        let y1 = 0
        let y2 = 0
        let x2 = w.globals.gridWidth
        let tA = tickAmount + 1

        if (this.isTimelineBar) {
          tA = w.globals.labels.length
        }

        for (let i = 0; i < tA; i++) {
          this._drawGridLine({ x1, y1, x2, y2, parent: elgridLinesH })

          y1 =
            y1 + w.globals.gridHeight / (this.isTimelineBar ? tA : tickAmount)

          y2 = y1
        }
      }
    } else {
      xCount = tickAmount

      // draw vertical lines
      if (w.config.grid.xaxis.lines.show || w.config.xaxis.axisTicks.show) {
        let x1 = w.globals.padHorizontal
        let y1 = 0
        let x2
        let y2 = w.globals.gridHeight
        for (let i = 0; i < xCount + 1; i++) {
          x1 = x1 + w.globals.gridWidth / xCount + 0.3
          x2 = x1

          // skip the last vertical line
          if (i === xCount - 1) break

          if (w.config.grid.xaxis.lines.show) {
            this._drawGridLine({ x1, y1, x2, y2, parent: elgridLinesV })
          }

          // skip the first vertical line
          let xAxis = new XAxis(this.ctx)
          xAxis.drawXaxisTicks(x1, elg)
        }
      }

      // draw horizontal lines
      if (w.config.grid.yaxis.lines.show) {
        let x1 = 0
        let y1 = 0
        let y2 = 0
        let x2 = w.globals.gridWidth

        for (let i = 0; i < w.globals.dataPoints + 1; i++) {
          this._drawGridLine({ x1, y1, x2, y2, parent: elgridLinesH })

          y1 = y1 + w.globals.gridHeight / w.globals.dataPoints
          y2 = y1
        }
      }
    }

    if (this.isTimelineBar) {
      tickAmount = w.globals.labels.length
    }

    this.drawGridBands(elg, xCount, tickAmount)
    return {
      el: elg,
      xAxisTickWidth: w.globals.gridWidth / xCount
    }
  }

  drawGridBands(elg, xCount, tickAmount) {
    const w = this.w

    // rows background bands
    if (
      w.config.grid.row.colors !== undefined &&
      w.config.grid.row.colors.length > 0
    ) {
      let x1 = 0
      let y1 = 0
      let y2 = w.globals.gridHeight / tickAmount
      let x2 = w.globals.gridWidth

      for (let i = 0, c = 0; i < tickAmount; i++, c++) {
        if (c >= w.config.grid.row.colors.length) {
          c = 0
        }
        this._drawGridBandRect({ c, x1, y1, x2, y2, parent: elg, type: 'row' })

        y1 = y1 + w.globals.gridHeight / tickAmount
      }
    }

    // columns background bands
    if (
      w.config.grid.column.colors !== undefined &&
      w.config.grid.column.colors.length > 0
    ) {
      const xc =
        w.config.xaxis.type === 'category' ||
        w.config.xaxis.convertedCatToNumeric
          ? xCount - 1
          : xCount
      let x1 = w.globals.padHorizontal
      let y1 = 0
      let x2 = w.globals.padHorizontal + w.globals.gridWidth / xc
      let y2 = w.globals.gridHeight
      for (let i = 0, c = 0; i < xCount; i++, c++) {
        if (c >= w.config.grid.column.colors.length) {
          c = 0
        }
        this._drawGridBandRect({
          c,
          x1,
          y1,
          x2,
          y2,
          parent: elg,
          type: 'column'
        })

        x1 = x1 + w.globals.gridWidth / xc
      }
    }
  }
}

export default Grid
