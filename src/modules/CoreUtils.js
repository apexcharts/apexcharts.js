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
