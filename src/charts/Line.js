import Graphics from '../modules/Graphics'
import Fill from '../modules/Fill'
import DataLabels from '../modules/DataLabels'
import Markers from '../modules/Markers'
import Scatter from './Scatter'

/**
 * ApexCharts Line Class responsible for drawing Line / Area Charts.
 * This class is also responsible for generating values for Bubble/Scatter charts, so need to rename it to Axis Charts to avoid confusions
 * @module Line
 **/

class Line {
  constructor (ctx, xyRatios) {
    this.ctx = ctx
    this.w = ctx.w

    this.xyRatios = xyRatios

    this.pointsChart = !(this.w.config.chart.type !== 'bubble' &&
      this.w.config.chart.type !== 'scatter')

    if (this.pointsChart) {
      this.scatter = new Scatter(this.ctx)
    }

    this.noNegatives = this.w.globals.minX === Number.MAX_VALUE

    this.yaxisIndex = 0
  }

  draw (series, ptype, seriesIndex) {
    let w = this.w

    let graphics = new Graphics(this.ctx)
    let fill = new Fill(this.ctx)

    let type = w.globals.comboCharts ? ptype : w.config.chart.type

    let ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`,
      'clip-path': `url(#gridRectMask${w.globals.cuid})`
    })

    let yRatio = this.xyRatios.yRatio
    let zRatio = this.xyRatios.zRatio
    let xRatio = this.xyRatios.xRatio
    let baseLineY = this.xyRatios.baseLineY

    // push all series in an array, so we can draw in reverse order (for stacked charts)
    let allSeries = []

    let prevSeriesY = []

    let categoryAxisCorrection = 0

    for (let i = 0; i < series.length; i++) {
      // width divided into equal parts

      let xDivision = w.globals.gridWidth / w.globals.dataPoints
      let realIndex = w.globals.comboCharts ? seriesIndex[i] : i

      if (yRatio.length > 1) {
        this.yaxisIndex = realIndex
      }

      let yArrj = [] // hold y values of current iterating series
      let xArrj = [] // hold x values of current iterating series

      // zeroY is the 0 value in y series which can be used in negative charts
      let zeroY = w.globals.gridHeight - baseLineY[this.yaxisIndex]

      let areaBottomY = zeroY
      if (zeroY > w.globals.gridHeight) {
        areaBottomY = w.globals.gridHeight
      }

      categoryAxisCorrection = xDivision / 2

      let x = w.globals.padHorizontal + categoryAxisCorrection
      let y = 1
      if (w.globals.dataXY) {
        x = (w.globals.seriesX[realIndex][0] - w.globals.minX) / xRatio
      }

      xArrj.push(x)

      let linePath, areaPath, pathFromLine, pathFromArea

      let linePaths = []
      let areaPaths = []

      // el to which series will be drawn
      let elSeries = graphics.group({
        class: 'apexcharts-series'
      })

      // points
      let elPointsMain = graphics.group({
        class: 'apexcharts-series-markers-wrap'
      })

      // eldatalabels
      let elDataLabelsWrap = graphics.group({
        class: 'apexcharts-datalabels'
      })

      for (let cs = 0; cs < w.globals.collapsedSeries.length; cs++) {
        if (w.globals.collapsedSeries[cs].index === realIndex) {
          elSeries.node.classList.add('apexcharts-series-collapsed')
        }
      }

      let longestSeries = series[i].length === w.globals.dataPoints
      elSeries.attr({
        'data:longestSeries': longestSeries,
        'rel': i + 1,
        'data:realIndex': realIndex
      })

      this.appendPathFrom = true

      let pX = x
      let pY

      let prevX = pX
      let prevY = zeroY // w.globals.svgHeight;

      let lineYPosition = 0

      // the first value in the current series is not null or undefined
      let firstPrevY = this.determineFirstPrevY({
        i,
        series,
        yRatio: yRatio[this.yaxisIndex],
        zeroY,
        prevY,
        prevSeriesY,
        lineYPosition
      })
      prevY = firstPrevY.prevY

      yArrj.push(prevY)
      pY = prevY

      if (series[i][0] === null) {
        // when the first value itself is null, we need to move the pointer to a location where a null value is not found
        for (let s = 0; s < series[i].length; s++) {
          if (series[i][s] !== null) {
            prevX = xDivision * s
            prevY = (zeroY - series[i][s] / yRatio[this.yaxisIndex])
            linePath = graphics.move(prevX, prevY)
            areaPath = graphics.move(prevX, areaBottomY)
            break
          }
        }
      } else {
        linePath = graphics.move(prevX, prevY)
        areaPath = graphics.move(prevX, areaBottomY) + graphics.line(prevX, prevY)
      }

      pathFromLine = graphics.move(-1, zeroY) + graphics.line(-1, zeroY)
      pathFromArea = graphics.move(-1, zeroY) + graphics.line(-1, zeroY)

      if (w.globals.previousPaths.length > 0) {
        const pathFrom = this.checkPreviousPaths({ pathFromLine, pathFromArea, realIndex })
        pathFromLine = pathFrom.pathFromLine
        pathFromArea = pathFrom.pathFromArea
      }

      for (let j = 0; j < w.globals.dataPoints - 1; j++) {
        if (w.globals.dataXY) {
          x = (w.globals.seriesX[realIndex][j + 1] - w.globals.minX) / xRatio
        } else {
          x = x + xDivision
        }

        if (w.config.chart.stacked) {
          if (
            i > 0 &&
            w.globals.collapsedSeries.length < w.config.series.length - 1
          ) {
            lineYPosition = prevSeriesY[i - 1][j + 1]
          } else {
            // the first series will not have prevY values
            lineYPosition = zeroY
          }

          if (typeof series[i][j + 1] === 'undefined' || series[i][j + 1] === null) {
            y = lineYPosition - (w.globals.minY) / yRatio[this.yaxisIndex]
          } else {
            y = (lineYPosition - series[i][j + 1] / yRatio[this.yaxisIndex])
          }
        } else {
          if (typeof series[i][j + 1] === 'undefined' || series[i][j + 1] === null) {
            y = zeroY - (w.globals.minY) / yRatio[this.yaxisIndex]
          } else {
            y = (zeroY - series[i][j + 1] / yRatio[this.yaxisIndex])
          }
        }

        // push current X
        xArrj.push(x)

        // push current Y that will be used as next series's bottom position
        yArrj.push(y)

        let calculatedPaths = this.createPaths({
          series,
          i,
          j,
          x,
          y,
          xDivision,
          pX,
          pY,
          areaBottomY,
          linePath,
          areaPath,
          linePaths,
          areaPaths
        })

        areaPaths = calculatedPaths.areaPaths
        linePaths = calculatedPaths.linePaths
        pX = calculatedPaths.pX
        pY = calculatedPaths.pY
        areaPath = calculatedPaths.areaPath
        linePath = calculatedPaths.linePath

        if (this.appendPathFrom) {
          pathFromLine = pathFromLine + graphics.line(x, zeroY)
          pathFromArea = pathFromArea + graphics.line(x, zeroY)
        }

        let pointsPos = this.calculatePoints({
          series,
          x,
          y,
          realIndex,
          i,
          j,
          prevY,
          categoryAxisCorrection,
          xRatio
        })

        if (!this.pointsChart) {
          let markers = new Markers(this.ctx)
          let elPointsWrap = markers.plotChartMarkers(pointsPos, realIndex, j + 1)
          if (elPointsWrap !== null) {
            elPointsMain.add(elPointsWrap)
          }
        } else {
          // scatter / bubble chart points creation
          this.scatter.draw(elSeries, j, {
            realIndex,
            pointsPos,
            zRatio,
            elParent: elPointsMain
          })
        }

        let dataLabels = new DataLabels(this.ctx)
        let drawnLabels = dataLabels.drawDataLabel(pointsPos, realIndex, j + 1)
        if (drawnLabels !== null) {
          elDataLabelsWrap.add(drawnLabels)
        }
      }

      // push all current y values array to main PrevY Array
      prevSeriesY.push(yArrj)

      // push all x val arrays into main xArr
      w.globals.seriesXvalues[realIndex] = xArrj
      w.globals.seriesYvalues[realIndex] = yArrj

      // these elements will be shown after area path animation completes
      if (!this.pointsChart) {
        w.globals.delayedElements.push({el: elPointsMain.node, index: realIndex})
      }

      if (w.config.stroke.show && !this.pointsChart) {
        let lineFill = null
        if (type === 'line') {
          // fillable lines only for lineChart
          lineFill = fill.fillPath(elSeries, {
            seriesNumber: realIndex,
            i: i
          })
        } else {
          lineFill = w.globals.stroke.colors[realIndex]
        }

        for (let p = 0; p < linePaths.length; p++) {
          let renderedPath = graphics.renderPaths({
            i,
            realIndex,
            pathFrom: pathFromLine,
            pathTo: linePaths[p],
            stroke: lineFill,
            strokeWidth: Array.isArray(w.config.stroke.width) ? w.config.stroke.width[realIndex] : w.config.stroke.width,
            strokeLineCap: w.config.stroke.lineCap,
            fill: 'none',
            animationDelay: i,
            initialSpeed: w.config.chart.animations.speed,
            dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
            className: 'apexcharts-line',
            id: 'apexcharts-line'
          })

          elSeries.add(renderedPath)
        }
      }

      // we have drawn the lines, now if it is area chart, we need to fill paths
      if (type === 'area') {
        let pathFill = fill.fillPath(elSeries, {
          seriesNumber: realIndex
        })

        for (let p = 0; p < areaPaths.length; p++) {
          let renderedPath = graphics.renderPaths({
            i,
            realIndex,
            pathFrom: pathFromArea,
            pathTo: areaPaths[p],
            stroke: 'none',
            strokeWidth: 0,
            strokeLineCap: null,
            fill: pathFill,
            animationDelay: i,
            initialSpeed: w.config.chart.animations.speed,
            dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
            className: 'apexcharts-area',
            id: 'apexcharts-area'
          })

          elSeries.add(renderedPath)
        }
      }

      elSeries.add(elPointsMain)
      elSeries.add(elDataLabelsWrap)

      allSeries.push(elSeries)
    }

    for (let s = allSeries.length; s > 0; s--) {
      ret.add(allSeries[s - 1])
    }

    return ret
  }

  createPaths ({
    series,
    i,
    j,
    x,
    y,
    pX,
    pY,
    xDivision,
    areaBottomY,
    linePath,
    areaPath,
    linePaths,
    areaPaths
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    // logic of smooth curve derived from chartist
    // CREDITS: https://gionkunz.github.io/chartist-js/
    if (w.config.stroke.curve === 'smooth') {
      let length = (x - pX) * 0.35
      if (w.globals.hasNullValues) {
        if (series[i][j] !== null) {
          if (series[i][j + 1] !== null) {
            linePath =
              graphics.move(pX, pY) +
              graphics.curve(pX + length, pY, x - length, y, x + 1, y)
            areaPath =
              graphics.move(pX + 1, pY) +
              graphics.curve(pX + length, pY, x - length, y, x + 1, y) +
              graphics.line(x, areaBottomY) +
              graphics.line(pX, areaBottomY) +
              'z'
          } else {
            linePath = graphics.move(pX, pY)
            areaPath = graphics.move(pX, pY) + 'z'
          }
        }

        linePaths.push(linePath)
        areaPaths.push(areaPath)
      } else {
        linePath = linePath + graphics.curve(pX + length, pY, x - length, y, x, y)
        areaPath = areaPath + graphics.curve(pX + length, pY, x - length, y, x, y)
      }

      pX = x
      pY = y

      if (j === series[i].length - 2) {
        // last loop, close path
        areaPath = areaPath + graphics.curve(pX, areaBottomY, x, areaBottomY, x, areaBottomY) + 'z'
        if (!w.globals.hasNullValues) {
          linePaths.push(linePath)
          areaPaths.push(areaPath)
        }
      }
    } else {
      if (series[i][j + 1] === null) {
        linePath = linePath + graphics.move(x, y)
        areaPath = areaPath + graphics.line(x - xDivision, areaBottomY) + graphics.move(x, y)
      }
      if (series[i][j] === null) {
        linePath = linePath + graphics.move(x, y)
        areaPath = areaPath + graphics.move(x, areaBottomY)
      }
      linePath = linePath + graphics.line(x, y)
      areaPath = areaPath + graphics.line(x, y)

      if (j === series[i].length - 2) {
        // last loop, close path
        areaPath = areaPath + graphics.line(x, areaBottomY) + 'z'
        linePaths.push(linePath)
        areaPaths.push(areaPath)
      }
    }

    return {
      linePaths,
      areaPaths,
      pX,
      pY,
      linePath,
      areaPath
    }
  }

  calculatePoints ({
    series,
    realIndex,
    x,
    y,
    i,
    j,
    prevY,
    categoryAxisCorrection,
    xRatio
  }) {
    let w = this.w

    let ptX = []
    let ptY = []

    if (j === 0) {
      let xPT1st = categoryAxisCorrection + w.config.markers.offsetX
      // the first point for line series
      // we need to check whether it's not a time series, because a time series may
      // start from the middle of the x axis
      if (w.globals.dataXY) {
        xPT1st =
          (w.globals.seriesX[realIndex][0] - w.globals.minX) / xRatio +
          w.config.markers.offsetX
      }

      // push 2 points for the first data values
      ptX.push(xPT1st)
      ptY.push(
        series[i][0] !== null ? prevY + w.config.markers.offsetY : null
      )
      ptX.push(x + w.config.markers.offsetX)
      ptY.push(
        series[i][j + 1] !== null ? y + w.config.markers.offsetY : null
      )
    } else {
      ptX.push(x + w.config.markers.offsetX)
      ptY.push(
        series[i][j + 1] !== null ? y + w.config.markers.offsetY : null
      )
    }

    let pointsPos = {
      x: ptX,
      y: ptY
    }

    return pointsPos
  }

  checkPreviousPaths ({ pathFromLine, pathFromArea, realIndex }) {
    let w = this.w

    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      let gpp = w.globals.previousPaths[pp]

      if (
        (gpp.type === 'line' || gpp.type === 'area') && gpp.paths.length > 0 &&
        parseInt(gpp.realIndex) === parseInt(realIndex)
      ) {
        if (gpp.type === 'line') {
          this.appendPathFrom = false
          pathFromLine = w.globals.previousPaths[pp].paths[0].d
        } else if (gpp.type === 'area') {
          this.appendPathFrom = false
          pathFromLine = w.globals.previousPaths[pp].paths[0].d
          pathFromArea = w.globals.previousPaths[pp].paths[1].d
        }
      }
    }

    return {
      pathFromLine,
      pathFromArea
    }
  }

  determineFirstPrevY ({
    i,
    series,
    yRatio,
    zeroY,
    prevY,
    prevSeriesY,
    lineYPosition
  }) {
    let w = this.w
    if (typeof series[i][0] !== 'undefined') {
      if (w.config.chart.stacked) {
        if (i > 0) {
          // 1st y value of previous series
          lineYPosition = prevSeriesY[i - 1][0]
        } else {
          // the first series will not have prevY values
          lineYPosition = zeroY
        }
        prevY = (lineYPosition - series[i][0] / yRatio)
      } else {
        prevY = (zeroY - series[i][0] / yRatio)
      }
    } else {
      // the first value in the current series is null

      if (w.config.chart.stacked) {
        if (i > 0) {
          // check again for undefined value (undefined value will occur when we clear the series while user clicks on legend to hide serieses)
          if (typeof series[i][0] === 'undefined') {
            for (let s = i - 1; s >= 0; s--) {
              // for loop to get to 1st previous value until we get it
              if (series[s][0] !== null && typeof series[s][0] !== 'undefined') {
                lineYPosition = prevSeriesY[s][0]
                prevY = (lineYPosition)
                break
              }
            }
          }
        }
      }
    }
    return {
      prevY,
      lineYPosition
    }
  }
}

export default Line
