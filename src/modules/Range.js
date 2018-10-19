import Utils from '../utils/Utils'

/**
 * Range is used to generates values between min and max.
 *
 * @module Range
 **/

class Range {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  init () {
    this.handleMinYMaxY()
    this.handleMinXMaxX()
    this.handleMinZMaxZ()
  }

  // http://stackoverflow.com/questions/326679/choosing-an-attractive-linear-scale-for-a-graphs-y-axiss
  // This routine creates the Y axis values for a graph.
  niceScale (yMin, yMax, ticks = 10) {
    if (
      (yMin === Number.MIN_VALUE && yMax === 0) ||
      (!Utils.isNumber(yMin) && !Utils.isNumber(yMax))
    ) {
      // when all values are 0
      yMin = 0
      yMax = 1
      ticks = 1
      let justRange = this.justRange(yMin, yMax, ticks)
      return justRange
    }

    if (yMin > yMax) {
      // if somehow due to some wrong config, user sent max less than min,
      // adjust the min/max again
      console.warn('yaxis.min cannot be greater than yaxis.max')
      yMax = yMin + 0.1
    } else if (yMin === yMax) {
      // If yMin and yMax are identical, then
      // adjust the yMin and yMax values to actually
      // make a graph. Also avoids division by zero errors.
      yMin = yMin - 0.1 // some small value
      yMax = yMax + 0.1 // some small value
    }

    // Calculate Min amd Max graphical labels and graph
    // increments.  The number of ticks defaults to
    // 10 which is the SUGGESTED value.  Any tick value
    // entered is used as a suggested value which is
    // adjusted to be a 'pretty' value.
    //
    // Output will be an array of the Y axis values that
    // encompass the Y values.
    let result = []

    // Determine Range
    let range = yMax - yMin
    let tiks = ticks + 1
    // Adjust ticks if needed
    if (tiks < 2) {
      tiks = 2
    } else if (tiks > 2) {
      tiks -= 2
    }

    // Get raw step value
    let tempStep = range / tiks
    // Calculate pretty step value

    let mag = Math.floor(this.log10(tempStep))
    let magPow = Math.pow(10, mag)
    let magMsd = parseInt(tempStep / magPow)
    let stepSize = magMsd * magPow

    // build Y label array.
    // Lower and upper bounds calculations
    let lb = stepSize * Math.floor(yMin / stepSize)
    let ub = stepSize * Math.ceil((yMax / stepSize))
    // Build array
    let val = lb
    while (1) {
      result.push(val)
      val += stepSize
      if (val > ub) { break }
    }

    // TODO: need to remove this condition below which makes this function tightly coupled with w.
    if (this.w.config.yaxis[0].max === undefined &&
      this.w.config.yaxis[0].min === undefined) {
      return {
        result,
        niceMin: result[0],
        niceMax: result[result.length - 1]
      }
    } else {
      result = []
      let v = yMin
      result.push(v)
      let valuesDivider = Math.abs(yMax - yMin) / ticks
      for (let i = 0; i <= ticks - 1; i++) {
        v = v + valuesDivider
        result.push(v)
      }

      return {
        result,
        niceMin: result[0],
        niceMax: result[result.length - 1]
      }
    }
  }

  justRange (yMin, yMax, ticks = 10) {
    let range = Math.abs(yMax - yMin)

    let step = range / ticks
    if (ticks === Number.MAX_VALUE) {
      ticks = 10; step = 1
    }

    let result = []
    let v = yMin

    while (ticks >= 0) {
      result.push(v)
      v = v + step
      ticks -= 1
    }

    return {
      result,
      niceMin: result[0],
      niceMax: result[result.length - 1]
    }
  }

  getMinYMaxY (startingIndex, minValInSeries, len) {
    const gl = this.w.globals
    let maxY = -Number.MAX_VALUE
    let minY = Number.MIN_VALUE

    const series = gl.series
    let seriesMin = series
    let seriesMax = series

    if (this.w.config.chart.type === 'candlestick') {
      seriesMin = gl.seriesCandleL
      seriesMax = gl.seriesCandleH
    }

    for (let i = startingIndex; i < len; i++) {
      gl.dataPoints = Math.max(gl.dataPoints, series[i].length)
      if (Utils.isIE()) {
        minY = Math.min(...seriesMin[i], 0)
      }

      for (let j = 0; j < gl.series[i].length; j++) {
        if (series[i][j] !== null && Utils.isNumber(series[i][j])) {
          maxY = Math.max(maxY, seriesMax[i][j])
          minValInSeries = Math.min(minValInSeries, seriesMin[i][j])
          if (Utils.isFloat(series[i][j])) {
            gl.yValueDecimal = Math.max(gl.yValueDecimal, series[i][j].toString().split('.')[1].length)
          }
          if (minY > seriesMin[i][j] && seriesMin[i][j] < 0) {
            minY = seriesMin[i][j]
          }
        } else {
          gl.hasNullValues = true
        }
      }
    }

    return { minY, maxY, minValInSeries }
  }

  handleMinYMaxY () {
    let gl = this.w.globals
    let cnf = this.w.config
    gl.maxY = -Number.MAX_VALUE
    gl.minY = Number.MIN_VALUE
    const yaxis = cnf.yaxis

    let minValInSeries = Number.MAX_VALUE

    if (gl.isMultipleYAxis) {
      // we need to get minY and maxY for multiple y axis
      for (let i = 0; i < gl.series.length; i++) {
        const minYMaxYArr = this.getMinYMaxY(i, minValInSeries, i + 1)
        gl.minYArr.push(minYMaxYArr.minY)
        gl.maxYArr.push(minYMaxYArr.maxY)
        minValInSeries = minYMaxYArr.minValInSeries
      }
    }

    // and then, get the minY and maxY from all series
    const minYMaxY = this.getMinYMaxY(0, minValInSeries, gl.series.length)
    gl.minY = minYMaxY.minY; gl.maxY = minYMaxY.maxY
    minValInSeries = minYMaxY.minValInSeries

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
              poss = poss + parseInt(gl.series[i][j]) + 1
            } else {
              negs = negs + parseInt(gl.series[i][j])
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
    if (cnf.chart.type === 'line' || cnf.chart.type === 'area' || cnf.chart.type === 'candlestick') {
      if (gl.minY === Number.MIN_VALUE && minValInSeries !== Number.MAX_SAFE_INTEGER) {
        let diff = gl.maxY - minValInSeries
        if (minValInSeries >= 0 && minValInSeries <= 10) {
          // if minY is already 0/low value, we don't want to go negatives here - so this check is essential.
          diff = 0
        }
        gl.minY = (minValInSeries - (diff * 5) / 100)
        gl.maxY = (gl.maxY + (diff * 5) / 100)
      }
    }

    cnf.yaxis.map((yaxe, index) => {
      // override all min/max values by user defined values (y axis)
      if (
        yaxe.max !== undefined &&
        typeof yaxe.max === 'number'
      ) {
        gl.maxYArr[index] = yaxe.max

        // gl.maxY is for single y-axis chart, it will be ignored in multi-yaxis
        gl.maxY = yaxis[0].max
      }
      if (
        yaxe.min !== undefined &&
        typeof yaxe.min === 'number'
      ) {
        gl.minYArr[index] = yaxe.min

        // gl.minY is for single y-axis chart, it will be ignored in multi-yaxis
        gl.minY = yaxis[0].min
      }
    })

    // after getting the yAxisScale, we need to call this function to recalculate the minYmaxY
    let reCalculateMinMaxY = (startingIndex, minY, maxY) => {
      // user didn't provide tickAmount as well as y values are in small range
      let ticksY = yaxis[startingIndex]
      if (typeof ticksY !== 'undefined') {
        ticksY = ticksY.tickAmount
      } else {
        ticksY = 8
      }

      if (typeof gl.yAxisScale[startingIndex] === 'undefined') {
        gl.yAxisScale[startingIndex] = []
      }
      if (maxY === -Number.MAX_VALUE || !Utils.isNumber(maxY)) {
        // no value in series. draw blank grid
        gl.yAxisScale[startingIndex] = this.justRange(
          0,
          5,
          5
        )
      } else {
        gl.allSeriesCollapsed = false

        gl.yAxisScale[startingIndex] = this.niceScale(
          minY,
          maxY,
          ticksY
        )
      }
    }

    // for multi y-axis we need different scales for each
    if (gl.isMultipleYAxis) {
      const minYArr = gl.minYArr.concat([])
      const maxYArr = gl.maxYArr.concat([])

      let scalesIndices = []
      // here, we loop through the yaxis array and find the item which has "seriesName" property
      cnf.yaxis.forEach((yaxe, i) => {
        let index = i
        cnf.series.forEach((s, si) => {
          // if seriesName matches and that series is not collapsed, we use that scale
          if (s.name === yaxe.seriesName && !gl.collapsedSeriesIndices.indexOf(si) > -1) {
            index = si

            if (i !== si) {
              scalesIndices.push({index: si, similarIndex: i, alreadyExists: true})
            } else {
              scalesIndices.push({index: si})
            }
          }
        })

        let minY = minYArr[index]
        let maxY = maxYArr[index]

        reCalculateMinMaxY(i, minY, maxY)

        gl.minYArr[i] = gl.yAxisScale[i].niceMin
        gl.maxYArr[i] = gl.yAxisScale[i].niceMax
      })

      // we got the scalesIndices array in the above code, but we need to filter out the items which doesn't have same scales
      const similarIndices = []
      scalesIndices.forEach((scale) => {
        if (scale.alreadyExists) {
          similarIndices.push(scale.index)
          similarIndices.push(scale.similarIndex)
        }
      })

      // then, we remove duplicates from the similarScale array
      let uniqueSimilarIndices = similarIndices.filter(function (item, pos) {
        return similarIndices.indexOf(item) === pos
      })

      let sameScaleMinYArr = []
      let sameScaleMaxYArr = []
      minYArr.forEach((minYValue, yi) => {
        // let sameScaleMin = null
        uniqueSimilarIndices.forEach((scale) => {
          // we compare only the yIndex which exists in the uniqueSimilarIndices array
          if (yi === scale) {
            sameScaleMinYArr.push({ key: yi, value: minYValue })
            sameScaleMaxYArr.push({ key: yi, value: maxYArr[yi] })
          }
        })
      })

      let sameScaleMin = null
      let sameScaleMax = null
      sameScaleMinYArr.forEach((s, i) => {
        sameScaleMin = Math.min(sameScaleMinYArr[i].value, s.value)
      })
      sameScaleMaxYArr.forEach((s, i) => {
        sameScaleMax = Math.min(sameScaleMaxYArr[i].value, s.value)
      })

      minYArr.forEach((min, i) => {
        sameScaleMinYArr.forEach((s, si) => {
          let minY = sameScaleMin
          let maxY = sameScaleMax
          if (s.key === i) {
            if (cnf.yaxis[i].min !== undefined) {
              minY = cnf.yaxis[i].min
            }
            if (cnf.yaxis[i].max !== undefined) {
              maxY = cnf.yaxis[i].max
            }
            reCalculateMinMaxY(i, minY, maxY)
            gl.minYArr[i] = gl.yAxisScale[i].niceMin
            gl.maxYArr[i] = gl.yAxisScale[i].niceMax
          }
        })
      })
    } else {
      reCalculateMinMaxY(0, gl.minY, gl.maxY)
      gl.minY = gl.yAxisScale[0].niceMin
      gl.maxY = gl.yAxisScale[0].niceMax
      gl.minYArr[0] = gl.yAxisScale[0].niceMin
      gl.maxYArr[0] = gl.yAxisScale[0].niceMax
    }
  }

  handleMinXMaxX () {
    let gl = this.w.globals; let cnf = this.w.config

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
      gl.maxX = gl.labels[gl.labels.length - 1]
      gl.initialmaxX = gl.labels[gl.labels.length - 1]
      gl.minX = 1
      gl.initialminX = 1
    }

    // for datetime xaxis, we need to adjust some padding left and right as it cuts the markers and dataLabels when it's drawn over egde.
    // If user willingly disables this option, then skip
    if (cnf.grid.padding.left !== 0 && cnf.grid.padding.right !== 0) {
      if (cnf.xaxis.type !== 'category') {
        const minX = gl.minX - (gl.svgWidth / gl.dataPoints) * (Math.abs(gl.maxX - gl.minX) / gl.svgWidth) / 3
        gl.minX = minX
        gl.initialminX = minX
        const maxX = gl.maxX + (gl.svgWidth / gl.dataPoints) * (Math.abs(gl.maxX - gl.minX) / gl.svgWidth) / 3
        gl.maxX = maxX
        gl.initialmaxX = maxX
      }
    }

    let niceXRange = new Range(this.ctx)
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
      if (
        cnf.xaxis.max !== undefined &&
        typeof cnf.xaxis.max === 'number'
      ) {
        gl.maxX = cnf.xaxis.max
      }
      if (
        cnf.xaxis.min !== undefined &&
        typeof cnf.xaxis.min === 'number'
      ) {
        gl.minX = cnf.xaxis.min
      }

      // if range is provided, adjust the new minX
      if (cnf.xaxis.range !== undefined) {
        gl.minX = gl.maxX - cnf.xaxis.range
      }

      if (gl.minX !== Number.MAX_VALUE && gl.maxX !== -Number.MAX_VALUE) {
        gl.xAxisScale = niceXRange.justRange(
          gl.minX,
          gl.maxX,
          ticks
        )

        // we will still store these labels as the count for this will be different (to draw grid and labels placement)
        gl.labels = gl.xAxisScale.result.slice()
      } else {
        gl.xAxisScale = niceXRange.justRange(1, ticks, ticks)
        if (gl.noLabelsProvided && gl.labels.length > 0) {
          gl.xAxisScale = niceXRange.justRange(1, gl.labels.length, ticks - 1)
          gl.seriesX = gl.labels.slice()
        }
        gl.labels = gl.xAxisScale.result.slice()
      }
    }
  }

  handleMinZMaxZ () {
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

  log10 (x) { return Math.log(x) / Math.LN10 };
}

export default Range
