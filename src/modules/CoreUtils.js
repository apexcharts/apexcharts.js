/*
 ** Util functions which are dependent on ApexCharts instance
 */

class CoreUtils {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  /**
   * @memberof CoreUtils
   * returns the sum of all individual values in a multiple stacked series
   * Eg. w.globals.series = [[32,33,43,12], [2,3,5,1]]
   *  @return [34,36,48,13]
   **/
  getStackedSeriesTotals () {
    const w = this.w
    let total = []

    for (let i = 0; i < w.globals.series[w.globals.maxValsInArrayIndex].length; i++) {
      let t = 0
      for (let j = 0; j < w.globals.series.length; j++) {
        t += w.globals.series[j][i]
      }
      total.push(t)
    }
    w.globals.stackedSeriesTotals = total
    return total
  }

  // get total of the all values inside all series
  getSeriesTotalByIndex (index = null) {
    if (index === null) {
      // non-plot chart types - pie / donut / circle
      return this.w.config.series.reduce((acc, cur) => {
        return acc + cur
      }, 0)
    } else {
      // axis charts - supporting multiple series
      return this.w.config.series[index].data.reduce((acc, cur) => {
        return acc + cur
      }, 0)
    }
  }

  // maxValsInArrayIndex is the index of series[] which has the largest number of items
  getLargestSeries () {
    const w = this.w
    w.globals.maxValsInArrayIndex = w.globals.series
      .map(function (a) {
        return a.length
      })
      .indexOf(
        Math.max.apply(
          Math,
          w.globals.series.map(function (a) {
            return a.length
          })
        )
      )
  }

  /**
   * @memberof Core
   * returns the sum of all values in a series
   * Eg. w.globals.series = [[32,33,43,12], [2,3,5,1]]
   *  @return [120, 11]
   **/
  getSeriesTotals () {
    const w = this.w

    w.globals.seriesTotals = w.globals.series.map((ser, index) => {
      let total = 0

      if (Array.isArray(ser)) {
        for (let j = 0; j < ser.length; j++) {
          total += ser[j]
        }
      } else {
        // for pie/donuts/gauges
        total += ser
      }

      return total
    })
  }

  getSeriesTotalsXRange (minX, maxX) {
    const w = this.w

    const seriesTotalsXRange = w.globals.series.map((ser, index) => {
      let total = 0

      for (let j = 0; j < ser.length; j++) {
        if (w.globals.seriesX[index][j] > minX && w.globals.seriesX[index][j] < maxX) {
          total += ser[j]
        }
      }

      return total
    })

    return seriesTotalsXRange
  }

  /**
   * @memberof CoreUtils
   * returns the percentage value of all individual values which can be used in a 100% stacked series
   * Eg. w.globals.series = [[32, 33, 43, 12], [2, 3, 5, 1]]
   *  @return [[94.11, 91.66, 89.58, 92.30], [5.88, 8.33, 10.41, 7.7]]
   **/
  getPercentSeries () {
    const w = this.w

    w.globals.seriesPercent = w.globals.series.map((ser, index) => {
      let seriesPercent = []
      if (Array.isArray(ser)) {
        for (let j = 0; j < ser.length; j++) {
          const total = w.globals.stackedSeriesTotals[j]
          let percent = (100 * ser[j]) / total
          seriesPercent.push(percent)
        }
      } else {
        const total = w.globals.seriesTotals.reduce((acc, val) => {
          return acc + val
        }, 0)
        let percent = (100 * ser) / total
        seriesPercent.push(percent)
      }

      return seriesPercent
    })
  }

  getCalculatedRatios () {
    let gl = this.w.globals

    let yRatio = []
    let invertedYRatio = 0
    let xRatio = 0
    let initialXRatio = 0
    let invertedXRatio = 0
    let zRatio = 0
    let baseLineY = []
    let baseLineInvertedY = 0.1
    let baseLineX = 0

    gl.yRange = []
    if (gl.isMultipleYAxis) {
      for (let i = 0; i < gl.minYArr.length; i++) {
        gl.yRange.push(Math.abs(gl.minYArr[i] - gl.maxYArr[i]))
        baseLineY.push(0)
      }
    } else {
      gl.yRange.push(Math.abs(gl.minY - gl.maxY))
    }
    gl.xRange = Math.abs(gl.maxX - gl.minX)
    gl.zRange = Math.abs(gl.maxZ - gl.minZ)

    // multiple y axis
    for (let i = 0; i < gl.yRange.length; i++) {
      yRatio.push(gl.yRange[i] / gl.gridHeight)
    }

    xRatio = gl.xRange / gl.gridWidth
    initialXRatio = Math.abs(gl.initialmaxX - gl.initialminX) / gl.gridWidth

    invertedYRatio = gl.yRange / gl.gridWidth
    invertedXRatio = gl.xRange / gl.gridHeight
    zRatio = gl.zRange / gl.gridHeight * 16

    if (gl.minY !== Number.MIN_VALUE && Math.abs(gl.minY) !== 0) {
      // Negative numbers present in series
      gl.hasNegs = true
      baseLineY = []

      // baseline variables is the 0 of the yaxis which will be needed when there are negatives
      if (gl.isMultipleYAxis) {
        for (let i = 0; i < yRatio.length; i++) {
          baseLineY.push(-gl.minYArr[i] / yRatio[i])
        }
      } else {
        baseLineY.push(-gl.minY / yRatio[0])
      }

      baseLineInvertedY = -gl.minY / invertedYRatio // this is for bar chart
      baseLineX = gl.minX / xRatio
    } else {
      baseLineY.push(0)
    }

    return {
      yRatio,
      invertedYRatio,
      zRatio,
      xRatio,
      initialXRatio,
      invertedXRatio,
      baseLineInvertedY,
      baseLineY,
      baseLineX
    }
  }

  getLogSeries (series) {
    const w = this.w

    w.globals.seriesLog = series.map((s, i) => {
      if (w.config.yaxis[i].logarithmic) {
        return s.map((d) => {
          if (d === null) return null

          const logVal = Math.log(d) / Math.log(w.globals.maxYArr[i] - w.globals.minYArr[i])

          return logVal
        })
      } else {
        return s
      }
    })

    return w.globals.seriesLog
  }

  getLogYRatios (yRatio) {
    const gl = this.w.globals

    gl.yLogRatio = []

    gl.logYRange = gl.yRange.map((yRange, i) => {
      if (this.w.config.yaxis[i].logarithmic) {
        let maxY = Number.MIN_SAFE_INTEGER
        let minY = Number.MAX_SAFE_INTEGER
        let range = 1
        gl.seriesLog.forEach((s, si) => {
          s.forEach((v) => {
            maxY = Math.max(v, maxY)
            minY = Math.min(v, minY)
          })
        })

        range = Math.pow(gl.yRange[i], parseInt(Math.abs(minY - maxY)) / gl.yRange[i])

        gl.yLogRatio.push(range / gl.gridHeight)
        return range
      } else {
        gl.yLogRatio.push(yRatio)
        return yRatio
      }
    })

    return gl.yLogRatio
  }

  // Some config objects can be array - and we need to extend them correctly
  static extendArrayProps (configInstance, options) {
    if (options.yaxis) {
      options = configInstance.extendYAxis(options)
    }
    if (options.annotations) {
      if (options.annotations.yaxis) {
        options = configInstance.extendYAxisAnnotations(options)
      }
      if (options.annotations.xaxis) {
        options = configInstance.extendXAxisAnnotations(options)
      }
      if (options.annotations.points) {
        options = configInstance.extendPointAnnotations(options)
      }
    }

    return options
  }
}

export default CoreUtils
