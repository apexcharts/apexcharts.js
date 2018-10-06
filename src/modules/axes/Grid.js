import Animations from '../Animations'
import Graphics from '../Graphics'
import XAxis from './XAxis'

/**
 * ApexCharts Grid Class for drawing Cartesian Grid.
 *
 * @module Grid
 **/

class Grid {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    const w = this.w
    this.anim = new Animations(this.ctx)
    this.xaxisLabels = w.globals.labels.slice()

    this.animX = w.config.grid.xaxis.lines.animate && w.config.chart.animations.enabled
    this.animY = w.config.grid.yaxis.lines.animate && w.config.chart.animations.enabled

    if (w.globals.timelineLabels.length > 0) {
      //  timeline labels are there
      this.xaxisLabels = w.globals.timelineLabels.slice()
    }
  }

  // .when using sparklines or when showing no grid, we need to have a grid area which is reused at many places for other calculations as well
  drawGridArea (elGrid = null) {
    let w = this.w

    let graphics = new Graphics(this.ctx)

    if (elGrid === null) {
      elGrid = graphics.group({
        'class': 'apexcharts-grid'
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

  // actual grid
  renderGrid () {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let strokeDashArray = w.config.grid.strokeDashArray

    let elg = graphics.group({
      'class': 'apexcharts-grid'
    })

    let tickAmount = 8
    for (let i = 0; i < w.globals.series.length; i++) {
      if (typeof w.globals.yAxisScale[i] !== 'undefined') {
        tickAmount = w.globals.yAxisScale[i].result.length - 1
      }
      if (tickAmount > 2) break
    }

    let xCount

    let inversedGrid = !!(w.config.plotOptions.bar.horizontal &&
      w.config.chart.type === 'bar')

    if (!inversedGrid) {
      xCount = this.xaxisLabels.length

      // draw vertical lines
      if (w.config.grid.xaxis.lines.show || w.config.xaxis.axisTicks.show) {
        let x1 = w.globals.padHorizontal
        let y1 = 0
        let x2
        let y2 = w.globals.gridHeight

        if (w.globals.timelineLabels.length > 0) {
          for (let i = 0; i < xCount; i++) {
            x1 = this.xaxisLabels[i].position; x2 = this.xaxisLabels[i].position
            if (w.config.grid.xaxis.lines.show) {
              let line = graphics.drawLine(
                x1,
                y1,
                x2,
                y2,
                w.config.grid.borderColor,
                strokeDashArray
              )
              line.node.classList.add('apexcharts-gridline')
              elg.add(line)

              if (this.animX) {
                this.animateLine(line, {x1: 0, x2: 0}, {x1: x1, x2})
              }
            }

            let xAxis = new XAxis(this.ctx)
            xAxis.drawXaxisTicks(x1, elg)
          }
        } else {
          let xCountForCategoryCharts = xCount
          for (let i = 0; i < xCountForCategoryCharts; i++) {
            let x1Count = xCountForCategoryCharts
            if (w.globals.dataXY && w.config.chart.type !== 'bar') {
              x1Count -= 1
            }

            x1 = (x1 + w.globals.gridWidth / x1Count)
            x2 = x1

            // skip the last line
            if (i === x1Count - 1) break

            if (w.config.grid.xaxis.lines.show) {
              let line = graphics.drawLine(
                x1,
                y1,
                x2,
                y2,
                w.config.grid.borderColor,
                strokeDashArray
              )

              line.node.classList.add('apexcharts-gridline')
              elg.add(line)

              if (this.animX) {
                this.animateLine(line, {x1: 0, x2: 0}, {x1: x1, x2})
              }
            }

            let xAxis = new XAxis(this.ctx)
            xAxis.drawXaxisTicks(x1, elg)
          }
        }
      }

      // draw horizontal lines
      if (w.config.grid.yaxis.lines.show) {
        let x1 = 0
        let y1 = 0
        let y2 = 0
        let x2 = w.globals.gridWidth
        for (let i = 0; i < tickAmount + 1; i++) {
          let line = graphics.drawLine(
            x1,
            y1,
            x2,
            y2,
            w.config.grid.borderColor,
            strokeDashArray
          )
          elg.add(line)
          line.node.classList.add('apexcharts-gridline')

          if (this.animY) {
            this.animateLine(line, {y1: y1 + 20, y2: y2 + 20}, {y1: y1, y2})
          }

          y1 = y1 + w.globals.gridHeight / tickAmount
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
          x1 = (x1 + w.globals.gridWidth / xCount) + 0.3
          x2 = x1

          // skip the last vertical line
          if (i === xCount - 1) break

          if (w.config.grid.xaxis.lines.show) {
            let line = graphics.drawLine(
              x1,
              y1,
              x2,
              y2,
              w.config.grid.borderColor,
              strokeDashArray
            )

            line.node.classList.add('apexcharts-gridline')
            elg.add(line)

            if (this.animX) {
              this.animateLine(line, {x1: 0, x2: 0}, {x1: x1, x2})
            }
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
          let line = graphics.drawLine(
            x1,
            y1,
            x2,
            y2,
            w.config.grid.borderColor,
            strokeDashArray
          )
          elg.add(line)
          line.node.classList.add('apexcharts-gridline')

          if (this.animY) {
            this.animateLine(line, {y1: y1 + 20, y2: y2 + 20}, {y1: y1, y2})
          }

          y1 = y1 + w.globals.gridHeight / w.globals.dataPoints
          y2 = y1
        }
      }
    }

    this.drawGridBands(elg, xCount, tickAmount)
    return {
      el: elg,
      xAxisTickWidth: (w.globals.gridWidth / xCount)
    }
  }

  drawGridBands (elg, xCount, tickAmount) {
    const w = this.w
    const graphics = new Graphics(this.ctx)

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
        const color = w.config.grid.row.colors[c]
        let rect = graphics.drawRect(
          x1,
          y1,
          x2,
          y2,
          0,
          color,
          w.config.grid.row.opacity
        )
        elg.add(rect)
        rect.node.classList.add('apexcharts-gridRow')

        y1 = y1 + w.globals.gridHeight / tickAmount
      }
    }

    // columns background bands
    if (
      w.config.grid.column.colors !== undefined &&
      w.config.grid.column.colors.length > 0
    ) {
      let x1 = w.globals.padHorizontal
      let y1 = 0
      let x2 = w.globals.padHorizontal + (w.globals.gridWidth / xCount)
      let y2 = w.globals.gridHeight
      for (let i = 0, c = 0; i < xCount; i++, c++) {
        if (c >= w.config.grid.column.colors.length) {
          c = 0
        }
        const color = w.config.grid.column.colors[c]
        let rect = graphics.drawRect(
          x1,
          y1,
          x2,
          y2,
          0,
          color,
          w.config.grid.column.opacity
        )
        rect.node.classList.add('apexcharts-gridColumn')
        elg.add(rect)

        x1 = (x1 + w.globals.gridWidth / xCount)
      }
    }
  }
  animateLine (line, from, to) {
    const w = this.w

    let initialAnim = w.config.chart.animations

    if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
      let speed = initialAnim.speed
      this.anim.animateLine(line, from, to, speed)
    }
  }
}

export default Grid
