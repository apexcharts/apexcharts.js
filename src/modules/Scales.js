import Utils from '../utils/Utils'

export default class Range {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
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
      let linearScale = this.linearScale(yMin, yMax, ticks)
      return linearScale
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
      yMin = yMin === 0 ? 0 : yMin - 0.1 // some small value
      yMax = yMax === 0 ? 2 : yMax + 0.1 // some small value
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

    let mag = Math.floor(Utils.log10(tempStep))
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
      if (val > ub) {
        break
      }
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

  linearScale (yMin, yMax, ticks = 10) {
    let range = Math.abs(yMax - yMin)

    let step = range / ticks
    if (ticks === Number.MAX_VALUE) {
      ticks = 10
      step = 1
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

  logarithmicScale (index, yMin, yMax, ticks) {
    const w = this.w

    if (yMin < 0 || yMin === Number.MIN_VALUE) yMin = 0.01

    const base = w.config.yaxis[index].logBase

    let min = Math.log(yMin) / Math.log(base)
    let max = Math.log(yMax) / Math.log(base)

    let range = Math.abs(yMax - yMin)

    let step = range / ticks

    let result = []
    let v = yMin

    while (ticks >= 0) {
      result.push(v)
      v = v + step
      ticks -= 1
    }

    const logs = result.map((niceNumber, i) => {
      if (niceNumber <= 0) {
        niceNumber = 0.01
      }

      // calculate adjustment factor
      var scale = (max - min) / (yMax - yMin)

      const logVal = Math.pow(base, min + scale * (niceNumber - min))
      return Math.round(logVal / Utils.roundToBase(logVal, base)) * Utils.roundToBase(logVal, base)
    })

    // Math.floor may have rounded the value to 0, revert back to 1
    if (logs[0] === 0) logs[0] = 1

    return {
      result: logs,
      niceMin: logs[0],
      niceMax: logs[logs.length - 1]
    }
  }

  setYScaleForIndex (index, minY, maxY) {
    const gl = this.w.globals
    const cnf = this.w.config

    let y = cnf.yaxis[index]

    if (typeof gl.yAxisScale[index] === 'undefined') {
      gl.yAxisScale[index] = []
    }

    if (cnf.yaxis[index].logarithmic) {
      gl.allSeriesCollapsed = false
      gl.yAxisScale[index] = this.logarithmicScale(
        index,
        minY,
        maxY,
        y.tickAmount ? y.tickAmount : Math.floor(Math.log10(maxY))
      )
    } else {
      if (maxY === -Number.MAX_VALUE || !Utils.isNumber(maxY)) {
        // no data in the chart. Either all series collapsed or user passed a blank array
        gl.yAxisScale[index] = this.linearScale(
          0,
          5,
          5
        )
      } else {
        // there is some data. Turn off the allSeriesCollapsed flag
        gl.allSeriesCollapsed = false

        gl.yAxisScale[index] = this.niceScale(
          minY,
          maxY,
          y.tickAmount ? y.tickAmount : 6
        )
      }
    }
  }

  setMultipleYScales () {
    const gl = this.w.globals
    const cnf = this.w.config

    const minYArr = gl.minYArr.concat([])
    const maxYArr = gl.maxYArr.concat([])

    let scalesIndices = []
    // here, we loop through the yaxis array and find the item which has "seriesName" property
    cnf.yaxis.forEach((yaxe, i) => {
      let index = i
      cnf.series.forEach((s, si) => {
        // if seriesName matches and that series is not collapsed, we use that scale
        if (s.name === yaxe.seriesName && gl.collapsedSeriesIndices.indexOf(si) === -1) {
          index = si

          if (i !== si) {
            scalesIndices.push({
              index: si,
              similarIndex: i,
              alreadyExists: true
            })
          } else {
            scalesIndices.push({
              index: si
            })
          }
        }
      })

      let minY = minYArr[index]
      let maxY = maxYArr[index]

      this.setYScaleForIndex(i, minY, maxY)
    })

    this.sameScaleInMultipleAxes(minYArr, maxYArr, scalesIndices)
  }

  sameScaleInMultipleAxes (minYArr, maxYArr, scalesIndices) {
    const cnf = this.w.config

    // we got the scalesIndices array in the above code, but we need to filter out the items which doesn't have same scales
    let similarIndices = []
    scalesIndices.forEach((scale) => {
      if (scale.alreadyExists) {
        if (typeof similarIndices[scale.index] === 'undefined') {
          similarIndices[scale.index] = []
        }
        similarIndices[scale.index].push(scale.index)
        similarIndices[scale.index].push(scale.similarIndex)
      }
    })

    function intersect (a, b) {
      return a.filter(value => b.indexOf(value) !== -1)
    }

    similarIndices.forEach((si, i) => {
      similarIndices.forEach((sj, j) => {
        if (i !== j) {
          if (intersect(si, sj).length > 0) {
            similarIndices[i] = similarIndices[i].concat(similarIndices[j])
          }
        }
      })
    })

    // then, we remove duplicates from the similarScale array
    let uniqueSimilarIndices = similarIndices.map(function (item) {
      return item.filter((i, pos) => {
        return item.indexOf(i) === pos
      })
    })

    // sort further to remove whole duplicate arrays later
    let sortedIndices = uniqueSimilarIndices.map((s) => {
      return s.sort()
    })

    // remove undefined items
    similarIndices = similarIndices.filter((s) => {
      return !!s
    })

    let indices = sortedIndices.slice()
    let stringIndices = indices.map((ind) => {
      return JSON.stringify(ind)
    })
    indices = indices.filter((ind, p) => {
      return stringIndices.indexOf(JSON.stringify(ind)) === p
    })

    let sameScaleMinYArr = []
    let sameScaleMaxYArr = []
    minYArr.forEach((minYValue, yi) => {
      indices.forEach((scale, i) => {
        // we compare only the yIndex which exists in the indices array
        if (scale.includes(yi)) {
          if (typeof sameScaleMinYArr[i] === 'undefined') {
            sameScaleMinYArr[i] = []
            sameScaleMaxYArr[i] = []
          }
          sameScaleMinYArr[i].push({
            key: yi,
            value: minYValue
          })
          sameScaleMaxYArr[i].push({
            key: yi,
            value: maxYArr[yi]
          })
        }
      })
    })

    let sameScaleMin = Array(indices.length).fill().map((e, i) => Number.MAX_SAFE_INTEGER)
    let sameScaleMax = Array(indices.length).fill().map((e, i) => Number.MIN_SAFE_INTEGER)

    sameScaleMinYArr.forEach((s, i) => {
      s.forEach((sc, j) => {
        sameScaleMin[i] = Math.min(sc.value, sameScaleMin[i])
      })
    })

    sameScaleMaxYArr.forEach((s, i) => {
      s.forEach((sc, j) => {
        sameScaleMax[i] = Math.max(sc.value, sameScaleMax[i])
      })
    })

    minYArr.forEach((min, i) => {
      sameScaleMaxYArr.forEach((s, si) => {
        let minY = sameScaleMin[si]
        let maxY = sameScaleMax[si]

        s.forEach((ind, k) => {
          if (s[k].key === i) {
            if (cnf.yaxis[i].min !== undefined) {
              minY = cnf.yaxis[i].min
            }
            if (cnf.yaxis[i].max !== undefined) {
              maxY = cnf.yaxis[i].max
            }

            this.setYScaleForIndex(i, minY, maxY)
          }
        })
      })
    })
  }
}
