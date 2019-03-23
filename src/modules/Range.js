import Utils from '../utils/Utils'
import Scales from './Scales'

/**
 * Range is used to generates values between min and max.
 *
 * @module Range
 **/

class Range {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.isBarHorizontal = !!(
      this.w.config.chart.type === 'bar' &&
      this.w.config.plotOptions.bar.horizontal
    )

    this.scales = new Scales(ctx)
  }

  init() {
    this.setYRange()
    this.setXRange()
    this.setZRange()
  }

  getMinYMaxY(
    startingIndex,
    lowestY = Number.MAX_VALUE,
    highestY = -Number.MAX_VALUE,
    len = null
  ) {
    const gl = this.w.globals
    let maxY = -Number.MAX_VALUE
    let minY = Number.MIN_VALUE

    if (len === null) {
      len = startingIndex + 1
    }

    const series = gl.series
    let seriesMin = series
    let seriesMax = series

    if (this.w.config.chart.type === 'candlestick') {
      seriesMin = gl.seriesCandleL
      seriesMax = gl.seriesCandleH
    }

    for (let i = startingIndex; i < len; i++) {
      gl.dataPoints = Math.max(gl.dataPoints, series[i].length)

      for (let j = 0; j < gl.series[i].length; j++) {
        if (series[i][j] !== null && Utils.isNumber(series[i][j])) {
          maxY = Math.max(maxY, seriesMax[i][j])
          lowestY = Math.min(lowestY, seriesMin[i][j])
          highestY = Math.max(highestY, seriesMin[i][j])
          if (Utils.isFloat(series[i][j])) {
            gl.yValueDecimal = Math.max(
              gl.yValueDecimal,
              series[i][j].toString().split('.')[1].length
            )
          }
          if (minY > seriesMin[i][j] && seriesMin[i][j] < 0) {
            minY = seriesMin[i][j]
          }
        } else {
          gl.hasNullValues = true
        }
      }
    }

    return {
      minY,
      maxY,
      lowestY,
      highestY
    }
  }

  setYRange() {
    let gl = this.w.globals
    let cnf = this.w.config
    gl.maxY = -Number.MAX_VALUE
    gl.minY = Number.MIN_VALUE

    let lowestYInAllSeries = Number.MAX_VALUE

    if (gl.isMultipleYAxis) {
      // we need to get minY and maxY for multiple y axis
      for (let i = 0; i < gl.series.length; i++) {
        const minYMaxYArr = this.getMinYMaxY(i, lowestYInAllSeries, null, i + 1)
        gl.minYArr.push(minYMaxYArr.minY)
        gl.maxYArr.push(minYMaxYArr.maxY)
        lowestYInAllSeries = minYMaxYArr.lowestY
      }
    }

    // and then, get the minY and maxY from all series
    const minYMaxY = this.getMinYMaxY(
      0,
      lowestYInAllSeries,
      null,
      gl.series.length
    )
    gl.minY = minYMaxY.minY
    gl.maxY = minYMaxY.maxY
    lowestYInAllSeries = minYMaxY.lowestY

    if (cnf.chart.stacked) {
      // for stacked charts, we calculate each series's parallel values. i.e, series[0][j] + series[1][j] .... [series[i.length][j]] and get the max out of it
      let stackedPoss = []
      let stackedNegs = []

      for (let j = 0; j < gl.series[gl.maxValsInArrayIndex].length; j++) {
        let poss = 0
        let negs = 0
        for (let i = 0; i < gl.series.length; i++) {
          if (gl.series[i][j] !== null && Utils.isNumber(gl.series[i][j])) {
            if (gl.series[i][j] > 0) {
              // 0.0001 fixes #185 when values are very small
              poss = poss + parseFloat(gl.series[i][j]) + 0.0001
            } else {
              negs = negs + parseFloat(gl.series[i][j])
            }
          }

          if (i === gl.series.length - 1) {
            // push all the totals to the array for future use
            stackedPoss.push(poss)
            stackedNegs.push(negs)
          }
        }
      }

      // get the max/min out of the added parallel values
      for (let z = 0; z < stackedPoss.length; z++) {
        gl.maxY = Math.max(gl.maxY, stackedPoss[z])
        gl.minY = Math.min(gl.minY, stackedNegs[z])
      }
    }

    // if the numbers are too big, reduce the range
    // for eg, if number is between 100000-110000, putting 0 as the lowest value is not so good idea. So change the gl.minY for line/area/candlesticks
    if (
      cnf.chart.type === 'line' ||
      cnf.chart.type === 'area' ||
      cnf.chart.type === 'candlestick'
    ) {
      if (
        gl.minY === Number.MIN_VALUE &&
        lowestYInAllSeries !== -Number.MAX_VALUE
      ) {
        let diff = gl.maxY - lowestYInAllSeries
        if (lowestYInAllSeries >= 0 && lowestYInAllSeries <= 10) {
          // if minY is already 0/low value, we don't want to go negatives here - so this check is essential.
          diff = 0
        }

        gl.minY = lowestYInAllSeries - (diff * 5) / 100
        /* fix https://github.com/apexcharts/apexcharts.js/issues/426 */
        gl.maxY = gl.maxY + (diff * 5) / 100
      }
    }

    cnf.yaxis.map((yaxe, index) => {
      // override all min/max values by user defined values (y axis)
      if (yaxe.max !== undefined) {
        if (typeof yaxe.max === 'number') {
          gl.maxYArr[index] = yaxe.max
        } else if (typeof yaxe.max === 'function') {
          gl.maxYArr[index] = yaxe.max(gl.maxY)
        }

        // gl.maxY is for single y-axis chart, it will be ignored in multi-yaxis
        gl.maxY = gl.maxYArr[index]
      }
      if (yaxe.min !== undefined) {
        if (typeof yaxe.min === 'number') {
          gl.minYArr[index] = yaxe.min
        } else if (typeof yaxe.min === 'function') {
          gl.minYArr[index] = yaxe.min(gl.minY)
        }
        // gl.minY is for single y-axis chart, it will be ignored in multi-yaxis
        gl.minY = gl.minYArr[index]
      }
    })

    // for horizontal bar charts, we need to check xaxis min/max as user may have specified there
    if (this.isBarHorizontal) {
      if (cnf.xaxis.min !== undefined && typeof cnf.xaxis.min === 'number') {
        gl.minY = cnf.xaxis.min
      }

      if (cnf.xaxis.max !== undefined && typeof cnf.xaxis.max === 'number') {
        gl.maxY = cnf.xaxis.max
      }
    }

    // for multi y-axis we need different scales for each
    if (gl.isMultipleYAxis) {
      this.scales.setMultipleYScales()
      gl.minY = lowestYInAllSeries
      gl.yAxisScale.forEach((scale, i) => {
        gl.minYArr[i] = scale.niceMin
        gl.maxYArr[i] = scale.niceMax
      })
    } else {
      this.scales.setYScaleForIndex(0, gl.minY, gl.maxY)
      gl.minY = gl.yAxisScale[0].niceMin
      gl.maxY = gl.yAxisScale[0].niceMax
      gl.minYArr[0] = gl.yAxisScale[0].niceMin
      gl.maxYArr[0] = gl.yAxisScale[0].niceMax
    }
  }

  setXRange() {
    let gl = this.w.globals
    let cnf = this.w.config

    const isXNumeric =
      cnf.xaxis.type === 'numeric' ||
      cnf.xaxis.type === 'datetime' ||
      (cnf.xaxis.type === 'category' && !gl.noLabelsProvided)

    // minX maxX starts here
    if (gl.isXNumeric) {
      for (let i = 0; i < gl.series.length; i++) {
        if (gl.labels[i]) {
          for (let j = 0; j < gl.labels[i].length; j++) {
            if (gl.labels[i][j] !== null && Utils.isNumber(gl.labels[i][j])) {
              gl.maxX = Math.max(gl.maxX, gl.labels[i][j])
              gl.initialmaxX = Math.max(gl.maxX, gl.labels[i][j])
              gl.minX = Math.min(gl.minX, gl.labels[i][j])
              gl.initialminX = Math.min(gl.minX, gl.labels[i][j])
            }
          }
        }
      }
    }

    if (gl.noLabelsProvided) {
      if (cnf.xaxis.categories.length === 0) {
        gl.maxX = gl.labels[gl.labels.length - 1]
        gl.initialmaxX = gl.labels[gl.labels.length - 1]
        gl.minX = 1
        gl.initialminX = 1
      }
    }

    // for numeric xaxis, we need to adjust some padding left and right for bar charts
    if (
      gl.comboChartsHasBars ||
      cnf.chart.type === 'candlestick' ||
      (cnf.chart.type === 'bar' && cnf.xaxis.type !== 'category')
    ) {
      if (cnf.xaxis.type !== 'category') {
        const minX =
          gl.minX -
          ((gl.svgWidth / gl.dataPoints) *
            (Math.abs(gl.maxX - gl.minX) / gl.svgWidth)) /
            2
        gl.minX = minX
        gl.initialminX = minX
        const maxX =
          gl.maxX +
          ((gl.svgWidth / gl.dataPoints) *
            (Math.abs(gl.maxX - gl.minX) / gl.svgWidth)) /
            2
        gl.maxX = maxX
        gl.initialmaxX = maxX
      }
    }

    if (gl.isXNumeric || gl.noLabelsProvided) {
      let ticks

      if (cnf.xaxis.tickAmount === undefined) {
        ticks = Math.round(gl.svgWidth / 150)

        // no labels provided and total number of dataPoints is less than 20
        if (cnf.xaxis.type === 'numeric' && gl.dataPoints < 20) {
          ticks = gl.dataPoints - 1
        }

        // this check is for when ticks exceeds total datapoints and that would result in duplicate labels
        if (ticks > gl.dataPoints && gl.dataPoints !== 0) {
          ticks = gl.dataPoints - 1
        }
      } else if (cnf.xaxis.tickAmount === 'dataPoints') {
        ticks = gl.series[gl.maxValsInArrayIndex].length - 1
      } else {
        ticks = cnf.xaxis.tickAmount
      }

      // override all min/max values by user defined values (x axis)
      if (cnf.xaxis.max !== undefined && typeof cnf.xaxis.max === 'number') {
        gl.maxX = cnf.xaxis.max
      }
      if (cnf.xaxis.min !== undefined && typeof cnf.xaxis.min === 'number') {
        gl.minX = cnf.xaxis.min
      }

      // if range is provided, adjust the new minX
      if (cnf.xaxis.range !== undefined) {
        gl.minX = gl.maxX - cnf.xaxis.range
      }

      if (gl.minX !== Number.MAX_VALUE && gl.maxX !== -Number.MAX_VALUE) {
        gl.xAxisScale = this.scales.linearScale(gl.minX, gl.maxX, ticks)
      } else {
        gl.xAxisScale = this.scales.linearScale(1, ticks, ticks)
        if (gl.noLabelsProvided && gl.labels.length > 0) {
          gl.xAxisScale = this.scales.linearScale(
            1,
            gl.labels.length,
            ticks - 1
          )
          gl.seriesX = gl.labels.slice()
        }
      }
      // we will still store these labels as the count for this will be different (to draw grid and labels placement)
      if (isXNumeric) {
        gl.labels = gl.xAxisScale.result.slice()
      }
    }

    if (gl.minX === gl.maxX) {
      // single dataPoint
      if (cnf.xaxis.type === 'datetime') {
        const newMinX = new Date(gl.minX)
        newMinX.setDate(newMinX.getDate() - 2)
        gl.minX = new Date(newMinX).getTime()

        const newMaxX = new Date(gl.maxX)
        newMaxX.setDate(newMaxX.getDate() + 2)
        gl.maxX = new Date(newMaxX).getTime()
      } else if (
        cnf.xaxis.type === 'numeric' ||
        (cnf.xaxis.type === 'category' && !gl.noLabelsProvided)
      ) {
        gl.minX = gl.minX - 2
        gl.maxX = gl.maxX + 2
      }
    }
  }

  setZRange() {
    let gl = this.w.globals

    // minZ, maxZ starts here
    if (gl.isDataXYZ) {
      for (let i = 0; i < gl.series.length; i++) {
        if (typeof gl.seriesZ[i] !== 'undefined') {
          for (let j = 0; j < gl.seriesZ[i].length; j++) {
            if (gl.seriesZ[i][j] !== null && Utils.isNumber(gl.seriesZ[i][j])) {
              gl.maxZ = Math.max(gl.maxZ, gl.seriesZ[i][j])
              gl.minZ = Math.min(gl.minZ, gl.seriesZ[i][j])
            }
          }
        }
      }
    }
  }
}

export default Range
