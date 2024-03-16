/*
 ** Util functions which are dependent on ApexCharts instance
 */

class CoreUtils {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  static checkComboSeries(series) {
    let comboCharts = false
    let comboBarCount = 0
    let comboCount = 0

    // if user specified a type in series too, turn on comboCharts flag
    if (series.length && typeof series[0].type !== 'undefined') {
      series.forEach((s) => {
        if (
          s.type === 'bar' ||
          s.type === 'column' ||
          s.type === 'candlestick' ||
          s.type === 'boxPlot'
        ) {
          comboBarCount++
        }
        if (typeof s.type !== 'undefined') {
          comboCount++
        }
      })
    }
    if (comboCount > 0) {
      comboCharts = true
    }

    return {
      comboBarCount,
      comboCharts,
    }
  }

  /**
   * @memberof CoreUtils
   * returns the sum of all individual values in a multiple stacked series
   * Eg. w.globals.series = [[32,33,43,12], [2,3,5,1]]
   *  @return [34,36,48,13]
   **/
  getStackedSeriesTotals(excludedSeriesIndices = []) {
    const w = this.w
    let total = []

    if (w.globals.series.length === 0) return total

    for (
      let i = 0;
      i < w.globals.series[w.globals.maxValsInArrayIndex].length;
      i++
    ) {
      let t = 0
      for (let j = 0; j < w.globals.series.length; j++) {
        if (
          typeof w.globals.series[j][i] !== 'undefined' &&
          excludedSeriesIndices.indexOf(j) === -1
        ) {
          t += w.globals.series[j][i]
        }
      }
      total.push(t)
    }
    return total
  }

  // get total of the all values inside all series
  getSeriesTotalByIndex(index = null) {
    if (index === null) {
      // non-plot chart types - pie / donut / circle
      return this.w.config.series.reduce((acc, cur) => acc + cur, 0)
    } else {
      // axis charts - supporting multiple series
      return this.w.globals.series[index].reduce((acc, cur) => acc + cur, 0)
    }
  }

  /**
   * @memberof CoreUtils
   * returns the sum of values in a multiple stacked grouped charts
   * Eg. w.globals.series = [[32,33,43,12], [2,3,5,1], [43, 23, 34, 22]]
   * series 1 and 2 are in a group, while series 3 is in another group
   *  @return [[34, 36, 48, 12], [43, 23, 34, 22]]
   **/
  getStackedSeriesTotalsByGroups() {
    const w = this.w
    let total = []

    w.globals.seriesGroups.forEach((sg) => {
      let includedIndexes = []
      w.config.series.forEach((s, si) => {
        if (sg.indexOf(s.name) > -1) {
          includedIndexes.push(si)
        }
      })

      const excludedIndices = w.globals.series
        .map((_, fi) => (includedIndexes.indexOf(fi) === -1 ? fi : -1))
        .filter((f) => f !== -1)

      total.push(this.getStackedSeriesTotals(excludedIndices))
    })
    return total
  }

  isSeriesNull(index = null) {
    let r = []
    if (index === null) {
      // non-plot chart types - pie / donut / circle
      r = this.w.config.series.filter((d) => d !== null)
    } else {
      // axis charts - supporting multiple series
      r = this.w.config.series[index].data.filter((d) => d !== null)
    }

    return r.length === 0
  }

  seriesHaveSameValues(index) {
    return this.w.globals.series[index].every((val, i, arr) => val === arr[0])
  }

  getCategoryLabels(labels) {
    const w = this.w
    let catLabels = labels.slice()
    if (w.config.xaxis.convertedCatToNumeric) {
      catLabels = labels.map((i, li) => {
        return w.config.xaxis.labels.formatter(i - w.globals.minX + 1)
      })
    }
    return catLabels
  }
  // maxValsInArrayIndex is the index of series[] which has the largest number of items
  getLargestSeries() {
    const w = this.w
    w.globals.maxValsInArrayIndex = w.globals.series
      .map((a) => a.length)
      .indexOf(
        Math.max.apply(
          Math,
          w.globals.series.map((a) => a.length)
        )
      )
  }

  getLargestMarkerSize() {
    const w = this.w
    let size = 0

    w.globals.markers.size.forEach((m) => {
      size = Math.max(size, m)
    })

    if (w.config.markers.discrete && w.config.markers.discrete.length) {
      w.config.markers.discrete.forEach((m) => {
        size = Math.max(size, m.size)
      })
    }

    if (size > 0) {
      size += w.config.markers.hover.sizeOffset + 1
    }

    w.globals.markers.largestSize = size

    return size
  }

  /**
   * @memberof Core
   * returns the sum of all values in a series
   * Eg. w.globals.series = [[32,33,43,12], [2,3,5,1]]
   *  @return [120, 11]
   **/
  getSeriesTotals() {
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

  getSeriesTotalsXRange(minX, maxX) {
    const w = this.w

    const seriesTotalsXRange = w.globals.series.map((ser, index) => {
      let total = 0

      for (let j = 0; j < ser.length; j++) {
        if (
          w.globals.seriesX[index][j] > minX &&
          w.globals.seriesX[index][j] < maxX
        ) {
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
  getPercentSeries() {
    const w = this.w

    w.globals.seriesPercent = w.globals.series.map((ser, index) => {
      let seriesPercent = []
      if (Array.isArray(ser)) {
        for (let j = 0; j < ser.length; j++) {
          let total = w.globals.stackedSeriesTotals[j]
          let percent = 0
          if (total) {
            percent = (100 * ser[j]) / total
          }
          seriesPercent.push(percent)
        }
      } else {
        const total = w.globals.seriesTotals.reduce((acc, val) => acc + val, 0)
        let percent = (100 * ser) / total
        seriesPercent.push(percent)
      }

      return seriesPercent
    })
  }

  getCalculatedRatios() {
    let w = this.w
    let gl = w.globals

    let yRatio = []
    let invertedYRatio = 0
    let xRatio = 0
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

    invertedYRatio = gl.yRange / gl.gridWidth
    invertedXRatio = gl.xRange / gl.gridHeight
    zRatio = (gl.zRange / gl.gridHeight) * 16

    if (!zRatio) {
      zRatio = 1
    }

    if (gl.minY !== Number.MIN_VALUE && Math.abs(gl.minY) !== 0) {
      // Negative numbers present in series
      gl.hasNegs = true
    }

    // Check we have a map as series may still to be added/updated.
    if (w.globals.seriesYAxisReverseMap.length > 0) {
      let scaleBaseLineYScale = (y, i) => {
        let yAxis = w.config.yaxis[w.globals.seriesYAxisReverseMap[i]]
        let sign = y < 0 ? -1 : 1
        y = Math.abs(y)
        if (yAxis.logarithmic) {
          y = this.getBaseLog(yAxis.logBase, y)
        }
        return -sign * y / yRatio[i]
      }
      if (gl.isMultipleYAxis) {
        baseLineY = []
        // baseline variables is the 0 of the yaxis which will be needed when there are negatives
        for (let i = 0; i < yRatio.length; i++) {
          baseLineY.push(scaleBaseLineYScale(gl.minYArr[i], i))
        }
      } else {
        baseLineY = []
        baseLineY.push(scaleBaseLineYScale(gl.minY, 0))

        if (gl.minY !== Number.MIN_VALUE && Math.abs(gl.minY) !== 0) {
          baseLineInvertedY = -gl.minY / invertedYRatio // this is for bar chart
          baseLineX = gl.minX / xRatio
        }
      }
    } else {
      baseLineY = []
      baseLineY.push(0)
      baseLineInvertedY = 0
      baseLineX = 0
    }

    return {
      yRatio,
      invertedYRatio,
      zRatio,
      xRatio,
      invertedXRatio,
      baseLineInvertedY,
      baseLineY,
      baseLineX,
    }
  }

  getLogSeries(series) {
    const w = this.w

    w.globals.seriesLog = series.map((s, i) => {
      let yAxisIndex = w.globals.seriesYAxisReverseMap[i]
      if (w.config.yaxis[yAxisIndex] && w.config.yaxis[yAxisIndex].logarithmic) {
        return s.map((d) => {
          if (d === null) return null
          return this.getLogVal(w.config.yaxis[yAxisIndex].logBase, d, i)
        })
      } else {
        return s
      }
    })

    return w.globals.invalidLogScale ? series : w.globals.seriesLog
  }
  getBaseLog(base, value) {
    return Math.log(value) / Math.log(base)
  }
  getLogVal(b, d, seriesIndex) {
    if (d <= 0) {
      return 0 // Should be Number.NEGATIVE_INFINITY
    }
    const w = this.w
    const min_log_val =
      w.globals.minYArr[seriesIndex] === 0
        ? -1 // make sure we dont calculate log of 0
        : this.getBaseLog(b, w.globals.minYArr[seriesIndex])
    const max_log_val =
      w.globals.maxYArr[seriesIndex] === 0
        ? 0 // make sure we dont calculate log of 0
        : this.getBaseLog(b, w.globals.maxYArr[seriesIndex])
    const number_of_height_levels = max_log_val - min_log_val
    if (d < 1) return d / number_of_height_levels
    const log_height_value = this.getBaseLog(b, d) - min_log_val
    return log_height_value / number_of_height_levels
  }

  getLogYRatios(yRatio) {
    const w = this.w
    const gl = this.w.globals

    gl.yLogRatio = yRatio.slice()

    gl.logYRange = gl.yRange.map((yRange, i) => {
      let yAxisIndex = w.globals.seriesYAxisReverseMap[i]
      if (w.config.yaxis[yAxisIndex] && this.w.config.yaxis[yAxisIndex].logarithmic) {
        let maxY = -Number.MAX_VALUE
        let minY = Number.MIN_VALUE
        let range = 1
        gl.seriesLog.forEach((s, si) => {
          s.forEach((v) => {
            if (w.config.yaxis[si] && w.config.yaxis[si].logarithmic) {
              maxY = Math.max(v, maxY)
              minY = Math.min(v, minY)
            }
          })
        })

        range = Math.pow(gl.yRange[i], Math.abs(minY - maxY) / gl.yRange[i])

        gl.yLogRatio[i] = range / gl.gridHeight
        return range
      }
    })

    return gl.invalidLogScale ? yRatio.slice() : gl.yLogRatio
  }

  // Some config objects can be array - and we need to extend them correctly
  static extendArrayProps(configInstance, options, w) {
    if (options?.yaxis) {
      options = configInstance.extendYAxis(options, w)
    }
    if (options?.annotations) {
      if (options.annotations.yaxis) {
        options = configInstance.extendYAxisAnnotations(options)
      }
      if (options?.annotations?.xaxis) {
        options = configInstance.extendXAxisAnnotations(options)
      }
      if (options?.annotations?.points) {
        options = configInstance.extendPointAnnotations(options)
      }
    }

    return options
  }
}

export default CoreUtils
