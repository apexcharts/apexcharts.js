import CoreUtils from '../modules/CoreUtils'
import Graphics from '../modules/Graphics'
import Fill from '../modules/Fill'
import DataLabels from '../modules/DataLabels'
import Markers from '../modules/Markers'
import Scatter from './Scatter'
import Utils from '../utils/Utils'
import Helpers from './common/line/Helpers'
import { svgPath, spline } from '../libs/monotone-cubic'
/**
 * ApexCharts Line Class responsible for drawing Line / Area / RangeArea Charts.
 * This class is also responsible for generating values for Bubble/Scatter charts, so need to rename it to Axis Charts to avoid confusions
 * @module Line
 **/

class Line {
  constructor(ctx, xyRatios, isPointsChart) {
    this.ctx = ctx
    this.w = ctx.w

    this.xyRatios = xyRatios

    this.pointsChart =
      !(
        this.w.config.chart.type !== 'bubble' &&
        this.w.config.chart.type !== 'scatter'
      ) || isPointsChart

    this.scatter = new Scatter(this.ctx)

    this.noNegatives = this.w.globals.minX === Number.MAX_VALUE

    this.lineHelpers = new Helpers(this)
    this.markers = new Markers(this.ctx)

    this.prevSeriesY = []
    this.categoryAxisCorrection = 0
    this.yaxisIndex = 0
  }

  draw(series, ctype, seriesIndex, seriesRangeEnd) {
    let w = this.w
    let graphics = new Graphics(this.ctx)
    let type = w.globals.comboCharts ? ctype : w.config.chart.type
    let ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`,
    })

    const coreUtils = new CoreUtils(this.ctx, w)
    this.yRatio = this.xyRatios.yRatio
    this.zRatio = this.xyRatios.zRatio
    this.xRatio = this.xyRatios.xRatio
    this.baseLineY = this.xyRatios.baseLineY

    series = coreUtils.getLogSeries(series)
    this.yRatio = coreUtils.getLogYRatios(this.yRatio)

    // push all series in an array, so we can draw in reverse order (for stacked charts)
    let allSeries = []

    for (let i = 0; i < series.length; i++) {
      series = this.lineHelpers.sameValueSeriesFix(i, series)

      let realIndex = w.globals.comboCharts ? seriesIndex[i] : i
      let translationsIndex = this.yRatio.length > 1 ? realIndex: 0


      this._initSerieVariables(series, i, realIndex)

      let yArrj = [] // hold y values of current iterating series
      let y2Arrj = [] // holds y2 values in range-area charts
      let xArrj = [] // hold x values of current iterating series

      let x = w.globals.padHorizontal + this.categoryAxisCorrection
      let y = 1

      let linePaths = []
      let areaPaths = []

      this.ctx.series.addCollapsedClassToSeries(this.elSeries, realIndex)

      if (w.globals.isXNumeric && w.globals.seriesX.length > 0) {
        x = (w.globals.seriesX[realIndex][0] - w.globals.minX) / this.xRatio
      }

      xArrj.push(x)

      let pX = x
      let pY
      let pY2
      let prevX = pX
      let prevY = this.zeroY
      let prevY2 = this.zeroY
      let lineYPosition = 0

      // the first value in the current series is not null or undefined
      let firstPrevY = this.lineHelpers.determineFirstPrevY({
        i,
        series,
        prevY,
        lineYPosition,
        translationsIndex
      })
      prevY = firstPrevY.prevY
      if (w.config.stroke.curve === 'monotonCubic' && series[i][0] === null) {
        // we have to discard the y position if 1st dataPoint is null as it causes issues with monotoneCubic path creation
        yArrj.push(null)
      } else {
        yArrj.push(prevY)
      }
      pY = prevY

      // y2 are needed for range-area charts
      let firstPrevY2

      if (type === 'rangeArea') {
        firstPrevY2 = this.lineHelpers.determineFirstPrevY({
          i,
          series: seriesRangeEnd,
          prevY: prevY2,
          lineYPosition,
          translationsIndex
        })
        prevY2 = firstPrevY2.prevY
        pY2 = prevY2
        y2Arrj.push(prevY2)
      }

      let pathsFrom = this._calculatePathsFrom({
        type,
        series,
        i,
        realIndex,
        translationsIndex,
        prevX,
        prevY,
        prevY2,
      })

      const iteratingOpts = {
        type,
        series,
        realIndex,
        translationsIndex,
        i,
        x,
        y,
        pX,
        pY,
        pathsFrom,
        linePaths,
        areaPaths,
        seriesIndex,
        lineYPosition,
        xArrj,
        yArrj,
        y2Arrj,
        seriesRangeEnd,
      }

      let paths = this._iterateOverDataPoints({
        ...iteratingOpts,
        iterations: type === 'rangeArea' ? series[i].length - 1 : undefined,
        isRangeStart: true,
      })

      if (type === 'rangeArea') {
        let pathsFrom2 = this._calculatePathsFrom({
          series: seriesRangeEnd,
          i,
          realIndex,
          prevX,
          prevY: prevY2,
        })
        let rangePaths = this._iterateOverDataPoints({
          ...iteratingOpts,
          series: seriesRangeEnd,
          pY: pY2,
          pathsFrom: pathsFrom2,
          iterations: seriesRangeEnd[i].length - 1,
          isRangeStart: false,
        })

        if (w.globals.hasNullValues) {
          let segments = paths.linePaths.length / 2
          for (let s = 0; s < segments; s++) {
            paths.linePaths[s] = rangePaths.linePaths[s+2] + paths.linePaths[s]
          }
          paths.linePaths.splice(segments)
        } else {
          paths.linePaths[0] = rangePaths.linePath + paths.linePath
          paths.pathFromLine = rangePaths.pathFromLine + paths.pathFromLine
        }
      }

      this._handlePaths({ type, realIndex, i, paths })

      this.elSeries.add(this.elPointsMain)
      this.elSeries.add(this.elDataLabelsWrap)

      allSeries.push(this.elSeries)
    }

    if (typeof w.config.series[0]?.zIndex !== 'undefined') {
      allSeries.sort(
        (a, b) =>
          Number(a.node.getAttribute('zIndex')) -
          Number(b.node.getAttribute('zIndex'))
      )
    }

    if (w.config.chart.stacked) {
      for (let s = allSeries.length; s > 0; s--) {
        ret.add(allSeries[s - 1])
      }
    } else {
      for (let s = 0; s < allSeries.length; s++) {
        ret.add(allSeries[s])
      }
    }

    return ret
  }

  _initSerieVariables(series, i, realIndex) {
    const w = this.w
    const graphics = new Graphics(this.ctx)

    // width divided into equal parts
    this.xDivision =
      w.globals.gridWidth /
      (w.globals.dataPoints - (w.config.xaxis.tickPlacement === 'on' ? 1 : 0))

    this.strokeWidth = Array.isArray(w.config.stroke.width)
      ? w.config.stroke.width[realIndex]
      : w.config.stroke.width

    let translationsIndex = 0
    if (this.yRatio.length > 1) {
      this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex]
      translationsIndex = realIndex
    }

    this.isReversed =
      w.config.yaxis[this.yaxisIndex] &&
      w.config.yaxis[this.yaxisIndex].reversed

    // zeroY is the 0 value in y series which can be used in negative charts
    this.zeroY =
      w.globals.gridHeight -
      this.baseLineY[translationsIndex] -
      (this.isReversed ? w.globals.gridHeight : 0) +
      (this.isReversed ? this.baseLineY[translationsIndex] * 2 : 0)

    this.areaBottomY = this.zeroY
    if (
      this.zeroY > w.globals.gridHeight ||
      w.config.plotOptions.area.fillTo === 'end'
    ) {
      this.areaBottomY = w.globals.gridHeight
    }

    this.categoryAxisCorrection = this.xDivision / 2

    // el to which series will be drawn
    this.elSeries = graphics.group({
      class: `apexcharts-series`,
      zIndex:
        typeof w.config.series[realIndex].zIndex !== 'undefined'
          ? w.config.series[realIndex].zIndex
          : realIndex,
      seriesName: Utils.escapeString(w.globals.seriesNames[realIndex]),
    })

    // points
    this.elPointsMain = graphics.group({
      class: 'apexcharts-series-markers-wrap',
      'data:realIndex': realIndex,
    })

    // eldatalabels
    this.elDataLabelsWrap = graphics.group({
      class: 'apexcharts-datalabels',
      'data:realIndex': realIndex,
    })

    let longestSeries = series[i].length === w.globals.dataPoints
    this.elSeries.attr({
      'data:longestSeries': longestSeries,
      rel: i + 1,
      'data:realIndex': realIndex,
    })

    this.appendPathFrom = true
  }

  _calculatePathsFrom({ type, series, i, realIndex, translationsIndex, prevX, prevY, prevY2 }) {
    const w = this.w
    const graphics = new Graphics(this.ctx)
    let linePath, areaPath, pathFromLine, pathFromArea

    if (series[i][0] === null) {
      // when the first value itself is null, we need to move the pointer to a location where a null value is not found
      for (let s = 0; s < series[i].length; s++) {
        if (series[i][s] !== null) {
          prevX = this.xDivision * s
          prevY = this.zeroY - series[i][s] / this.yRatio[translationsIndex]
          linePath = graphics.move(prevX, prevY)
          areaPath = graphics.move(prevX, this.areaBottomY)
          break
        }
      }
    } else {
      linePath = graphics.move(prevX, prevY)

      if (type === 'rangeArea') {
        linePath = graphics.move(prevX, prevY2) + graphics.line(prevX, prevY)
      }
      areaPath =
        graphics.move(prevX, this.areaBottomY) + graphics.line(prevX, prevY)
    }

    pathFromLine = graphics.move(-1, this.zeroY) + graphics.line(-1, this.zeroY)
    pathFromArea = graphics.move(-1, this.zeroY) + graphics.line(-1, this.zeroY)

    if (w.globals.previousPaths.length > 0) {
      const pathFrom = this.lineHelpers.checkPreviousPaths({
        pathFromLine,
        pathFromArea,
        realIndex,
      })
      pathFromLine = pathFrom.pathFromLine
      pathFromArea = pathFrom.pathFromArea
    }

    return {
      prevX,
      prevY,
      linePath,
      areaPath,
      pathFromLine,
      pathFromArea,
    }
  }

  _handlePaths({ type, realIndex, i, paths }) {
    const w = this.w
    const graphics = new Graphics(this.ctx)
    const fill = new Fill(this.ctx)

    // push all current y values array to main PrevY Array
    this.prevSeriesY.push(paths.yArrj)

    // push all x val arrays into main xArr
    w.globals.seriesXvalues[realIndex] = paths.xArrj
    w.globals.seriesYvalues[realIndex] = paths.yArrj

    const forecast = w.config.forecastDataPoints
    if (forecast.count > 0 && type !== 'rangeArea') {
      const forecastCutoff =
        w.globals.seriesXvalues[realIndex][
          w.globals.seriesXvalues[realIndex].length - forecast.count - 1
        ]
      const elForecastMask = graphics.drawRect(
        forecastCutoff,
        0,
        w.globals.gridWidth,
        w.globals.gridHeight,
        0
      )
      w.globals.dom.elForecastMask.appendChild(elForecastMask.node)

      const elNonForecastMask = graphics.drawRect(
        0,
        0,
        forecastCutoff,
        w.globals.gridHeight,
        0
      )
      w.globals.dom.elNonForecastMask.appendChild(elNonForecastMask.node)
    }

    // these elements will be shown after area path animation completes
    if (!this.pointsChart) {
      w.globals.delayedElements.push({
        el: this.elPointsMain.node,
        index: realIndex,
      })
    }

    const defaultRenderedPathOptions = {
      i,
      realIndex,
      animationDelay: i,
      initialSpeed: w.config.chart.animations.speed,
      dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
      className: `apexcharts-${type}`,
    }

    if (type === 'area') {
      let pathFill = fill.fillPath({
        seriesNumber: realIndex,
      })

      for (let p = 0; p < paths.areaPaths.length; p++) {
        let renderedPath = graphics.renderPaths({
          ...defaultRenderedPathOptions,
          pathFrom: paths.pathFromArea,
          pathTo: paths.areaPaths[p],
          stroke: 'none',
          strokeWidth: 0,
          strokeLineCap: null,
          fill: pathFill,
        })

        this.elSeries.add(renderedPath)
      }
    }

    if (w.config.stroke.show && !this.pointsChart) {
      let lineFill = null
      if (type === 'line') {
        lineFill = fill.fillPath({
          seriesNumber: realIndex,
          i,
        })
      } else {
        if (w.config.stroke.fill.type === 'solid') {
          lineFill = w.globals.stroke.colors[realIndex]
        } else {
          const prevFill = w.config.fill
          w.config.fill = w.config.stroke.fill

          lineFill = fill.fillPath({
            seriesNumber: realIndex,
            i,
          })
          w.config.fill = prevFill
        }
      }

      // range-area paths are drawn using linePaths
      for (let p = 0; p < paths.linePaths.length; p++) {
        let pathFill = lineFill
        if (type === 'rangeArea') {
          pathFill = fill.fillPath({
            seriesNumber: realIndex,
          })
        }
        const linePathCommonOpts = {
          ...defaultRenderedPathOptions,
          pathFrom: paths.pathFromLine,
          pathTo: paths.linePaths[p],
          stroke: lineFill,
          strokeWidth: this.strokeWidth,
          strokeLineCap: w.config.stroke.lineCap,
          fill: type === 'rangeArea' ? pathFill : 'none',
        }
        let renderedPath = graphics.renderPaths(linePathCommonOpts)
        this.elSeries.add(renderedPath)
        renderedPath.attr('fill-rule', `evenodd`)

        if (forecast.count > 0 && type !== 'rangeArea') {
          let renderedForecastPath = graphics.renderPaths(linePathCommonOpts)

          renderedForecastPath.node.setAttribute(
            'stroke-dasharray',
            forecast.dashArray
          )

          if (forecast.strokeWidth) {
            renderedForecastPath.node.setAttribute(
              'stroke-width',
              forecast.strokeWidth
            )
          }

          this.elSeries.add(renderedForecastPath)
          renderedForecastPath.attr(
            'clip-path',
            `url(#forecastMask${w.globals.cuid})`
          )
          renderedPath.attr(
            'clip-path',
            `url(#nonForecastMask${w.globals.cuid})`
          )
        }
      }
    }
  }

  _iterateOverDataPoints({
    type,
    series,
    iterations,
    realIndex,
    translationsIndex,
    i,
    x,
    y,
    pX,
    pY,
    pathsFrom,
    linePaths,
    areaPaths,
    seriesIndex,
    lineYPosition,
    xArrj,
    yArrj,
    y2Arrj,
    isRangeStart,
    seriesRangeEnd,
  }) {
    const w = this.w
    let graphics = new Graphics(this.ctx)
    let yRatio = this.yRatio
    let { prevY, linePath, areaPath, pathFromLine, pathFromArea } = pathsFrom

    const minY = Utils.isNumber(w.globals.minYArr[realIndex])
      ? w.globals.minYArr[realIndex]
      : w.globals.minY

    if (!iterations) {
      iterations =
        w.globals.dataPoints > 1
          ? w.globals.dataPoints - 1
          : w.globals.dataPoints
    }

    const getY = (_y, lineYPos) => {
      return (
        lineYPos -
        _y / yRatio[translationsIndex] +
        (this.isReversed ? _y / yRatio[translationsIndex] : 0) * 2
      )
    }

    let y2 = y

    let stackSeries =
      (w.config.chart.stacked && !w.globals.comboCharts) ||
      (w.config.chart.stacked &&
        w.globals.comboCharts &&
        (!this.w.config.chart.stackOnlyBar ||
          this.w.config.series[realIndex]?.type === 'bar'))

    let pathState = 0
    let segmentStartX

    for (let j = 0; j < iterations; j++) {
      const isNull =
        typeof series[i][j + 1] === 'undefined' || series[i][j + 1] === null

      if (w.globals.isXNumeric) {
        let sX = w.globals.seriesX[realIndex][j + 1]
        if (typeof w.globals.seriesX[realIndex][j + 1] === 'undefined') {
          /* fix #374 */
          sX = w.globals.seriesX[realIndex][iterations - 1]
        }
        x = (sX - w.globals.minX) / this.xRatio
      } else {
        x = x + this.xDivision
      }

      if (stackSeries) {
        if (
          i > 0 &&
          w.globals.collapsedSeries.length < w.config.series.length - 1
        ) {
          // a collapsed series in a stacked bar chart may provide wrong result for the next series, hence find the prevIndex of prev series which is not collapsed - fixes apexcharts.js#1372
          const prevIndex = (pi) => {
            let pii = pi
            for (let cpi = 0; cpi < w.globals.series.length; cpi++) {
              if (w.globals.collapsedSeriesIndices.indexOf(pi) > -1) {
                pii--
                break
              }
            }

            return pii >= 0 ? pii : 0
          }
          lineYPosition = this.prevSeriesY[prevIndex(i - 1)][j + 1]
        } else {
          // the first series will not have prevY values
          lineYPosition = this.zeroY
        }
      } else {
        lineYPosition = this.zeroY
      }

      if (isNull) {
        y = getY(minY, lineYPosition)
      } else {
        y = getY(series[i][j + 1], lineYPosition)

        if (type === 'rangeArea') {
          y2 = getY(seriesRangeEnd[i][j + 1], lineYPosition)
        }
      }

      // push current X
      xArrj.push(x)

      // push current Y that will be used as next series's bottom position
      if (isNull && w.config.stroke.curve === 'smooth') {
        yArrj.push(null)
      } else {
        yArrj.push(y)
      }
      y2Arrj.push(y2)

      let pointsPos = this.lineHelpers.calculatePoints({
        series,
        x,
        y,
        realIndex,
        i,
        j,
        prevY,
      })

      let calculatedPaths = this._createPaths({
        type,
        series,
        i,
        realIndex,
        j,
        x,
        y,
        y2,
        xArrj,
        yArrj,
        y2Arrj,
        pX,
        pY,
        pathState,
        segmentStartX,
        linePath,
        areaPath,
        linePaths,
        areaPaths,
        seriesIndex,
        isRangeStart,
      })

      areaPaths = calculatedPaths.areaPaths
      linePaths = calculatedPaths.linePaths
      pX = calculatedPaths.pX
      pY = calculatedPaths.pY
      pathState = calculatedPaths.pathState
      segmentStartX = calculatedPaths.segmentStartX
      areaPath = calculatedPaths.areaPath
      linePath = calculatedPaths.linePath

      let curve
      if (Array.isArray(w.config.stroke.curve)) {
        if (Array.isArray(seriesIndex)) {
          curve = w.config.stroke.curve[seriesIndex[i]]
        } else {
          curve = w.config.stroke.curve[i]
        }
      }

      if (
        this.appendPathFrom &&
        !(curve === 'monotoneCubic' && type === 'rangeArea')
      ) {
        pathFromLine = pathFromLine + graphics.line(x, this.zeroY)
        pathFromArea = pathFromArea + graphics.line(x, this.zeroY)
      }

      this.handleNullDataPoints(series, pointsPos, i, j, realIndex)

      this._handleMarkersAndLabels({
        type,
        pointsPos,
        i,
        j,
        realIndex,
        isRangeStart,
      })
    }

    return {
      yArrj,
      xArrj,
      pathFromArea,
      areaPaths,
      pathFromLine,
      linePaths,
      linePath,
      areaPath,
    }
  }

  _handleMarkersAndLabels({ type, pointsPos, isRangeStart, i, j, realIndex }) {
    const w = this.w
    let dataLabels = new DataLabels(this.ctx)

    if (!this.pointsChart) {
      if (w.globals.series[i].length > 1) {
        this.elPointsMain.node.classList.add('apexcharts-element-hidden')
      }

      let elPointsWrap = this.markers.plotChartMarkers(
        pointsPos,
        realIndex,
        j + 1
      )
      if (elPointsWrap !== null) {
        this.elPointsMain.add(elPointsWrap)
      }
    } else {
      // scatter / bubble chart points creation
      this.scatter.draw(this.elSeries, j, {
        realIndex,
        pointsPos,
        zRatio: this.zRatio,
        elParent: this.elPointsMain,
      })
    }

    let drawnLabels = dataLabels.drawDataLabel({
      type,
      isRangeStart,
      pos: pointsPos,
      i: realIndex,
      j: j + 1,
    })
    if (drawnLabels !== null) {
      this.elDataLabelsWrap.add(drawnLabels)
    }
  }

  _createPaths({
    type,
    series,
    i,
    realIndex,
    j,
    x,
    y,
    xArrj,
    yArrj,
    y2,
    y2Arrj,
    pX,
    pY,
    pathState,
    segmentStartX,
    linePath,
    areaPath,
    linePaths,
    areaPaths,
    seriesIndex,
    isRangeStart,
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    const areaBottomY = this.areaBottomY

    let curve = w.config.stroke.curve
    if (Array.isArray(w.config.stroke.curve)) {
      if (Array.isArray(seriesIndex)) {
        curve = w.config.stroke.curve[seriesIndex[i]]
      } else {
        curve = w.config.stroke.curve[i]
      }
    }

    if (
      type === 'rangeArea' &&
      (w.globals.hasNullValues || w.config.forecastDataPoints.count > 0) &&
      curve === 'monotoneCubic'
    ) {
      curve = 'straight'
    }

    switch (curve) {
    case 'monotoneCubic':
      const shouldRenderMonotone =
        type === 'rangeArea'
          ? xArrj.length === w.globals.dataPoints
          : j === series[i].length - 2

      const smoothInputs = xArrj
        .map((_, i) => {
          return [xArrj[i], yArrj[i]]
        })
        .filter((_) => _[1] !== null)

      if (shouldRenderMonotone && smoothInputs.length > 1) {
        const points = spline.points(smoothInputs)

        linePath += svgPath(points)
        if (series[i][0] === null) {
          // if the first dataPoint is null, we use the linePath directly
          areaPath = linePath
        } else {
          // else, we append the areaPath
          areaPath += svgPath(points)
        }

        if (type === 'rangeArea' && isRangeStart) {
          // draw the line to connect y with y2; then draw the other end of range
          linePath += graphics.line(
            xArrj[xArrj.length - 1],
            y2Arrj[y2Arrj.length - 1]
          )

          const xArrjInversed = xArrj.slice().reverse()
          const y2ArrjInversed = y2Arrj.slice().reverse()
          const smoothInputsY2 = xArrjInversed.map((_, i) => {
            return [xArrjInversed[i], y2ArrjInversed[i]]
          })

          const pointsY2 = spline.points(smoothInputsY2)

          linePath += svgPath(pointsY2)

          // in range area, we don't have separate line and area path
          areaPath = linePath
        } else {
          areaPath +=
            graphics.line(
              smoothInputs[smoothInputs.length - 1][0],
              areaBottomY
            ) +
            graphics.line(smoothInputs[0][0], areaBottomY) +
            graphics.move(smoothInputs[0][0], smoothInputs[0][1]) +
            'z'
        }

        linePaths.push(linePath)
        areaPaths.push(areaPath)
      }
      break
    case 'smooth':
      let length = (x - pX) * 0.35
      if (w.globals.hasNullValues) {
        if (series[i][j] === null) {
          pathState = 0
        } else {
          switch (pathState) {
            case 0:
              // Beginning of segment
              segmentStartX = pX
              if (type === 'rangeArea' && isRangeStart) {
                linePath =
                    graphics.move(pX, y2Arrj[j])
                  + graphics.line(pX, pY)
              } else {
                linePath = graphics.move(pX, pY)
              }
              linePath += 
                  graphics.curve(pX + length, pY, x - length, y, x, y)
              areaPath =
                  graphics.move(pX + 1, pY)
                + graphics.curve(pX + length, pY, x - length, y, x, y)
              pathState = 1
            break
          case 1:
            // Continuing with segment
            if (series[i][j + 1] === null) {
              // Segment ends here
              if (type === 'rangeArea' && isRangeStart) {
                linePath += graphics.line(pX, y2)
              } else {
                linePath += graphics.move(pX, pY)
              }
              areaPath +=
                  graphics.line(pX, areaBottomY)
                + graphics.line(segmentStartX, areaBottomY)
                + 'z'
              linePaths.push(linePath)
              areaPaths.push(areaPath)
            } else {
              linePath +=
                  graphics.curve(pX + length, pY, x - length, y, x, y)
              areaPath +=
                  graphics.curve(pX + length, pY, x - length, y, x, y)
              if (j >= series[i].length - 2) {
                if (type === 'rangeArea' && isRangeStart) {
                  linePath +=
                      graphics.curve(x, y, x, y, x, y2)
                    + graphics.move(x, y2)
                } else {
                  linePath +=
                      graphics.move(x, y)
                }
                areaPath +=
                    graphics.curve(x, y, x, y, x, areaBottomY)
                  + graphics.move(x, y)
                  + 'z'
                linePaths.push(linePath)
                areaPaths.push(areaPath)
              }
            }
            break
          }
        }
      } else {
        linePath +=
            graphics.curve(pX + length, pY, x - length, y, x, y)
        areaPath +=
            graphics.curve(pX + length, pY, x - length, y, x, y)
      }

      pX = x
      pY = y

      if (j === series[i].length - 2) {
        // last loop, close path
        areaPath +=
          graphics.curve(pX, pY, x, y, x, areaBottomY) +
          graphics.move(x, y) +
          'z'

        if (type === 'rangeArea' && isRangeStart) {
          linePath +=
            graphics.curve(pX, pY, x, y, x, y2) +
            graphics.move(x, y2) +
            'z'
        } else {
          if (!w.globals.hasNullValues) {
            linePaths.push(linePath)
            areaPaths.push(areaPath)
          }
        }
      }
      break
    default:
      if (series[i][j + 1] === null) {
        linePath = linePath + graphics.move(x, y)

        const numericOrCatX = w.globals.isXNumeric
          ? (w.globals.seriesX[realIndex][j] - w.globals.minX) / this.xRatio
          : x - this.xDivision
        areaPath =
          areaPath +
          graphics.line(numericOrCatX, areaBottomY) +
          graphics.move(x, y) +
          'z'
      }
      if (series[i][j] === null) {
        linePath = linePath + graphics.move(x, y)
        areaPath = areaPath + graphics.move(x, areaBottomY)
      }

      switch (curve) {
      case 'stepline':
        linePath =
          linePath + graphics.line(x, null, 'H') + graphics.line(null, y, 'V')
        areaPath =
          areaPath + graphics.line(x, null, 'H') + graphics.line(null, y, 'V')
        break
      case 'linestep':
        linePath =
          linePath + graphics.line(null, y, 'V') + graphics.line(x, null, 'H')
        areaPath =
          areaPath + graphics.line(null, y, 'V') + graphics.line(x, null, 'H')
        break
      case 'straight':
        linePath = linePath + graphics.line(x, y)
        areaPath = areaPath + graphics.line(x, y)
        break
      }

      if (j === series[i].length - 2) {
        // last loop, close path
        areaPath =
          areaPath + graphics.line(x, areaBottomY) + graphics.move(x, y) + 'z'

        if (type === 'rangeArea' && isRangeStart) {
          linePath =
            linePath + graphics.line(x, y2) + graphics.move(x, y2) + 'z'
        } else {
          linePaths.push(linePath)
          areaPaths.push(areaPath)
        }
      }
      break
    }

    return {
      linePaths,
      areaPaths,
      pX,
      pY,
      pathState,
      segmentStartX,
      linePath,
      areaPath,
    }
  }

  handleNullDataPoints(series, pointsPos, i, j, realIndex) {
    const w = this.w
    if (
      (series[i][j] === null && w.config.markers.showNullDataPoints) ||
      series[i].length === 1
    ) {
      // fixes apexcharts.js#1282, #1252
      let elPointsWrap = this.markers.plotChartMarkers(
        pointsPos,
        realIndex,
        j + 1,
        this.strokeWidth - w.config.markers.strokeWidth / 2,
        true
      )
      if (elPointsWrap !== null) {
        this.elPointsMain.add(elPointsWrap)
      }
    }
  }
}

export default Line
