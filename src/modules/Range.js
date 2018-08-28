import Utils from '../utils/Utils'

/**
 * Range is used to generates values between min and max.
 *
 * @module Range
 **/

class Range {
  constructor (ctx, checkComboCharts) {
    this.ctx = ctx
    this.w = ctx.w
    this.checkComboCharts = checkComboCharts
  }

  init () {
    this.handleMinYMaxY()
    this.handleMinXMaxX()
    this.handleMinZMaxZ()
  }

  // http://stackoverflow.com/questions/326679/choosing-an-attractive-linear-scale-for-a-graphs-y-axiss
  // This routine creates the Y axis values for a graph.
  niceScale (yMin, yMax, ticks = 10, toFixed) {
    if ((yMin === Number.MIN_VALUE && yMax === 0) || (!Utils.isNumber(yMin) && !Utils.isNumber(yMax))) {
      // when all values are 0
      yMin = 0
      yMax = 1
      ticks = 1
      let justRange = this.justRange(yMin, yMax, ticks)
      return justRange
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
    // If yMin and yMax are identical, then
    // adjust the yMin and yMax values to actually
    // make a graph. Also avoids division by zero errors.
    if (yMin === yMax) {
      yMin = yMin - 10 // some small value
      yMax = yMax + 10 // some small value
    }
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

    // TODO: need to remove this stupid condition below which makes this function tightly coupled.
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
        if (v % 1 !== 0 && typeof (toFixed) !== 'undefined') {
          v = parseFloat(v.toFixed(toFixed))
        }
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
      range = 10; ticks = 10; step = 1
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

  handleMinYMaxY () {
    let gl = this.w.globals
    let cnf = this.w.config
    gl.maxY = -Number.MAX_VALUE
    gl.minY = Number.MIN_VALUE
    const yaxis = cnf.yaxis

    let minValInSeries = Number.MAX_VALUE

    const getMinYMaxY = (startingIndex, len) => {
      let maxY = -Number.MAX_VALUE
      let minY = Number.MIN_VALUE

      for (let i = startingIndex; i < len; i++) {
        gl.dataPoints = Math.max(gl.dataPoints, gl.series[i].length)
        if (Utils.isIE()) {
          minY = Math.min(...gl.series[i])
        }

        for (let j = 0; j < gl.series[i].length; j++) {
          if (gl.series[i][j] !== null && Utils.isNumber(gl.series[i][j])) {
            maxY = Math.max(maxY, gl.series[i][j])
            minValInSeries = Math.min(minValInSeries, gl.series[i][j])
            if (Utils.isFloat(gl.series[i][j])) {
              gl.yValueDecimal = Math.max(gl.yValueDecimal, gl.series[i][j].toString().split('.')[1].length)
            }
            if (minY > gl.series[i][j] && gl.series[i][j] < 0) {
              minY = gl.series[i][j]
            }
          } else {
            gl.hasNullValues = true
          }
        }
      }

      return { minY, maxY }
    }

    if (gl.isMultipleYAxis) {
      // we need to get minY and maxY for multiple y axis
      for (let i = 0; i < gl.series.length; i++) {
        const minYMaxYArr = getMinYMaxY(i, i + 1)
        gl.minYArr.push(minYMaxYArr.minY)
        gl.maxYArr.push(minYMaxYArr.maxY)
      }
    }

    // and then, get the minY and maxY from all series
    const minYMaxY = getMinYMaxY(0, gl.series.length)
    gl.minY = minYMaxY.minY; gl.maxY = minYMaxY.maxY

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
              poss = poss + parseInt(gl.series[i][j])
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
    // for eg, if number is between 10000-12000, putting 0 as the lowest value is not so good idea
    if (cnf.chart.type === 'line' || cnf.chart.type === 'area') {
      if (gl.minY === Number.MIN_VALUE && minValInSeries !== Number.MAX_SAFE_INTEGER) {
        gl.minY = Math.round(minValInSeries - ((minValInSeries * 2 / 100)))
        gl.maxY = Math.round(gl.maxY + ((gl.maxY * 2 / 100)))
      }
    }

    cnf.yaxis.map((yaxe, index) => {
      // override all min/max values by user defined values (y axis)
      if (
        yaxe.max !== undefined &&
        typeof yaxe.max === 'number'
      ) {
        gl.maxYArr[index] = yaxe.max
        gl.maxY = yaxis[0].max
      }
      if (
        yaxis[0].min !== undefined &&
        typeof yaxis[0].min === 'number'
      ) {
        gl.minYArr[index] = yaxe.min
        gl.minY = yaxis[0].min
      }
    })

    let reCalculateMinMaxY = (startingIndex, minY, maxY) => {
      // user didn't provide tickAmount as well as y values are in small range
      let ticksY = yaxis[startingIndex]
      if (typeof ticksY !== 'undefined') {
        ticksY = ticksY.tickAmount
      } else {
        ticksY = 8
      }

      if (maxY === -Number.MAX_VALUE || !Utils.isNumber(maxY)) {
        // no value in series. draw blank grid
        gl.yAxisScale.push(this.justRange(
          0,
          1,
          1
        ))
      } else {
        gl.allSeriesCollapsed = false
        gl.yAxisScale.push(this.niceScale(
          minY,
          maxY,
          ticksY
        ))
      }
    }

    if (gl.isMultipleYAxis) {
      for (let i = 0; i < gl.series.length; i++) {
        reCalculateMinMaxY(i, gl.minYArr[i], gl.maxYArr[i])
        gl.minYArr[i] = gl.yAxisScale[i].niceMin
        gl.maxYArr[i] = gl.yAxisScale[i].niceMax
      }
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
    if (gl.dataXY) {
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

    this.checkComboCharts()

    // for bars in numeric xaxis, we need to adjust some padding left and right
    if ((gl.comboCharts || cnf.chart.type === 'bar') && (cnf.xaxis.type === 'datetime' || gl.dataXY)) {
      const minX = gl.minX - (gl.svgWidth / (gl.dataPoints)) * (Math.abs(gl.maxX - gl.minX) / gl.svgWidth)
      gl.minX = minX
      gl.initialminX = minX
      const maxX = gl.maxX + (gl.svgWidth / (gl.dataPoints)) * (Math.abs(gl.maxX - gl.minX) / gl.svgWidth)
      gl.maxX = maxX
      gl.initialmaxX = maxX
    }

    let niceXRange = new Range(this.ctx)
    if (gl.dataXY || gl.noLabelsProvided) {
      let ticks

      if (cnf.xaxis.tickAmount === undefined) {
        ticks = Math.round(gl.svgWidth / 150)

        if (ticks > gl.dataPoints && gl.dataPoints !== 0) {
          ticks = gl.dataPoints - 1
        }
      } else {
        ticks = cnf.xaxis.tickAmount
        if (!gl.noLabelsProvided) {
          ticks = cnf.xaxis.tickAmount - 3
        }
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
    if (gl.dataXYZ) {
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
