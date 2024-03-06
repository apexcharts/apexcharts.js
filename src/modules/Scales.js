import Utils from '../utils/Utils'

export default class Scales {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // http://stackoverflow.com/questions/326679/choosing-an-attractive-linear-scale-for-a-graphs-y-axis
  // This routine creates the Y axis values for a graph.
  niceScale(yMin, yMax, index = 0) {
    const jsPrecision = 1e-11 // JS precision errors
    const w = this.w
    const gl = w.globals
    let axisCnf
    let maxTicks
    let gotMin
    let gotMax
    if (gl.isBarHorizontal) {
      axisCnf = w.config.xaxis
      gotMin = axisCnf.min !== undefined && axisCnf.min !== null
      gotMax = axisCnf.max !== undefined && axisCnf.min !== null
      // The most ticks we can fit into the svg chart dimensions
      maxTicks = (gl.svgWidth - 100) / 25 // Guestimate
    } else {
      axisCnf = w.config.yaxis[index]
      gotMin = axisCnf.min !== undefined && axisCnf.min !== null
      gotMax = axisCnf.max !== undefined && axisCnf.min !== null
      maxTicks = (gl.svgHeight - 100) / 15
    }
    let gotStepSize =
      axisCnf.stepSize !== undefined && axisCnf.stepSize !== null
    let gotTickAmount =
      axisCnf.tickAmount !== undefined && axisCnf.tickAmount !== null
    let ticks = gotTickAmount ? axisCnf.tickAmount : 10

    // In case we have a multi axis chart:
    // Ensure subsequent series start with the same tickAmount as series[0],
    // because the tick lines are drawn based on series[0]. This does not
    // override user defined options for any series.
    if (gl.isMultipleYAxis && !gotTickAmount && gl.multiAxisTickAmount > 0) {
      ticks = gl.multiAxisTickAmount
      gotTickAmount = true
    }

    if (ticks === 'dataPoints') {
      ticks = gl.dataPoints - 1
    } else {
      // Ensure ticks is an integer
      ticks = Math.abs(Math.round(ticks))
    }

    if (
      (yMin === Number.MIN_VALUE && yMax === 0) ||
      (!Utils.isNumber(yMin) && !Utils.isNumber(yMax)) ||
      (yMin === Number.MIN_VALUE && yMax === -Number.MAX_VALUE)
    ) {
      // when all values are 0
      yMin = 0
      yMax = ticks
      gl.allSeriesCollapsed = false
    }

    if (yMin > yMax) {
      // if somehow due to some wrong config, user sent max less than min,
      // adjust the min/max again
      console.warn(
        'axis.min cannot be greater than axis.max: swapping min and max'
      )
      let temp = yMax
      yMax = yMin
      yMin = temp
    } else if (yMin === yMax) {
      // If yMin and yMax are identical, then
      // adjust the yMin and yMax values to actually
      // make a graph. Also avoids division by zero errors.
      yMin = yMin === 0 ? 0 : yMin - 1 // choose an integer in case yValueDecimals=0
      yMax = yMax === 0 ? 2 : yMax + 1 // choose an integer in case yValueDecimals=0
    }

    // Calculate Min amd Max graphical labels and graph
    // increments.
    //
    // Output will be an array of the Y axis values that
    // encompass the Y values.
    let result = []

    if (ticks < 1) {
      ticks = 1
    }
    let tiks = ticks

    // Determine Range
    let range = Math.abs(yMax - yMin)

    if (axisCnf.forceNiceScale) {
      // Snap min or max to zero if close
      let proximityRatio = 0.15
      if (!gotMin && yMin > 0 && yMin / range < proximityRatio) {
        yMin = 0
        gotMin = true
      }
      if (!gotMax && yMax < 0 && -yMax / range < proximityRatio) {
        yMax = 0
        gotMax = true
      }
      range = Math.abs(yMax - yMin)
    }

    // Calculate a pretty step value based on ticks

    // Initial stepSize
    let stepSize = range / tiks
    let niceStep = stepSize
    let mag = Math.floor(Math.log10(niceStep))
    let magPow = Math.pow(10, mag)
    // ceil() is used below in conjunction with the values populating
    // niceScaleAllowedMagMsd[][] to ensure that (niceStep * tiks)
    // produces a range that doesn't clip data points after stretching
    // the raw range out a little to match the prospective new range.
    let magMsd = Math.ceil(niceStep / magPow)
    // See globals.js for info on what niceScaleAllowedMagMsd does
    magMsd = gl.niceScaleAllowedMagMsd[gl.yValueDecimal === 0 ? 0 : 1][magMsd]
    niceStep = magMsd * magPow

    // Initial stepSize
    stepSize = niceStep

    // Get step value
    if (
      gl.isBarHorizontal &&
      axisCnf.stepSize &&
      axisCnf.type !== 'datetime'
    ) {
      stepSize = axisCnf.stepSize
      gotStepSize = true
    } else if (gotStepSize) {
      stepSize = axisCnf.stepSize
    }
    if (gotStepSize) {
      if (axisCnf.forceNiceScale) {
        // Check that given stepSize is sane with respect to the range.
        //
        // The user can, by setting forceNiceScale = true,
        // define a stepSize that will be scaled to a useful value before
        // it's checked for consistency.
        //
        // If, for example, the range = 4 and the user defined stepSize = 8
        // (or 8000 or 0.0008, etc), then stepSize is inapplicable as
        // it is. Reducing it to 0.8 will fit with 5 ticks.
        //
        let stepMag = Math.floor(Math.log10(stepSize))
        stepSize *= Math.pow(10, mag - stepMag)
      }
    }

    // Start applying some rules
    if (gotMin && gotMax) {
      let crudeStep = range / tiks
      // min and max (range) cannot be changed
      if (gotTickAmount) {
        if (gotStepSize) {
          if (Utils.mod(range, stepSize) != 0) {
            // stepSize conflicts with range
            let gcdStep = Utils.getGCD(stepSize, crudeStep)
            // gcdStep is a multiple of range because crudeStep is a multiple.
            // gcdStep is also a multiple of stepSize, so it partially honoured
            // All three could be equal, which would be very nice
            // if the computed stepSize generates too many ticks they will be
            // reduced later, unless the number is prime, in which case,
            // the chart will display all of them or just one (plus the X axis)
            // depending on svg dimensions. Setting forceNiceScale: true will force
            // the display of at least the default number of ticks.
            if (crudeStep / gcdStep < 10) {
              stepSize = gcdStep
            } else {
              // stepSize conflicts and no reasonable adjustment, but must
              // honour tickAmount
              stepSize = crudeStep
            }
          } else {
            // stepSize fits
            if (Utils.mod(stepSize, crudeStep) == 0) {
              // crudeStep is a multiple of stepSize, or vice versa
              // we know crudeStep will generate tickAmount ticks
              stepSize = crudeStep
            } else {
              // stepSize conflicts with tickAmount
              // if the user is setting up a multi-axis chart and wants
              // synced axis ticks then they should not define stepSize
              // or ensure there is no conflict between any of their options
              // on any axis.
              crudeStep = stepSize
              // De-prioritizing ticks from now on
              gotTickAmount = false
            }
          }
        } else {
          // no user stepSize, honour ticks
          stepSize = crudeStep
        }
      } else {
        // default ticks in use, tiks can change
        if (gotStepSize) {
          if (Utils.mod(range, stepSize) == 0) {
            // bigStep fits
            crudeStep = stepSize
          } else {
            stepSize = crudeStep
          }
        } else {
          // no user stepSize
          tiks = Math.round(range / niceStep)
          crudeStep = range / tiks
          if (Utils.mod(range, stepSize) != 0) {
            // stepSize doesn't fit
            let gcdStep = Utils.getGCD(range, niceStep)
            if (niceStep / gcdStep < 10) {
              crudeStep = gcdStep
            }
            stepSize = crudeStep
          } else {
            // stepSize fits
            crudeStep = stepSize
          }
        }
      }
      tiks = Math.round(range / stepSize)
    } else {
      // Snap range to ticks
      if (!gotMin && !gotMax) {
        if (gotTickAmount) {
          // Allow a half-stepSize shift if series doesn't cross the X axis
          // to ensure graph doesn't clip. Not if it does cross, in order
          // to keep the 0 aligned with a grid line in multi axis charts.
          let shift = stepSize / ((yMax - yMin > yMax) ? 1 : 2)
          let tMin = shift * Math.floor(yMin / shift)
          if (Math.abs(tMin - yMin) <= shift / 2) {
            yMin = tMin
            yMax = yMin + stepSize * tiks
          } else {
            yMax = shift * Math.ceil(yMax / shift)
            yMin = yMax - stepSize * tiks
          }
        } else {
          yMin = stepSize * Math.floor(yMin / stepSize)
          yMax = stepSize * Math.ceil(yMax / stepSize)
        }
      } else if (gotMax) {
        if (gotTickAmount) {
          yMin = yMax - stepSize * tiks
        } else {
          yMin = stepSize * Math.floor(yMin / stepSize)
          }
      } else if (gotMin) {
        if (gotTickAmount) {
          yMax = yMin + stepSize * tiks
        } else {
          yMax = stepSize * Math.ceil(yMax / stepSize)
        }
      }
      range = Math.abs(yMax - yMin)
      // Final check and possible adjustment of stepSize to prevent
      // overridding the user's min or max choice.
      stepSize = Utils.getGCD(range, stepSize)
      tiks = Math.round(range / stepSize)
    }

    // Shrinkwrap ticks to the range
    if (!gotTickAmount && !(gotMin || gotMax)) {
      tiks = Math.ceil((range - jsPrecision) / (stepSize + jsPrecision))
      // No user tickAmount, or min or max, we are free to adjust to avoid a
      // prime number. This helps when reducing ticks for small svg dimensions.
      if (tiks > 16 && Utils.getPrimeFactors(tiks).length < 2) {
        tiks++
      }
    }

    // Record final tiks for use by other series that call niceScale().
    // Note: some don't, like logarithmicScale(), etc.
    if (gl.isMultipleYAxis && gl.multiAxisTickAmount == 0) {
      gl.multiAxisTickAmount = tiks
    }

    if (
      tiks > maxTicks &&
      (!(gotTickAmount || gotStepSize) || axisCnf.forceNiceScale)
    ) {
      // Reduce the number of ticks nicely if chart svg dimensions shrink too far.
      // The reduced tick set should always be a subset of the full set.
      //
      // This following products of prime factors method works as follows:
      // We compute the prime factors of the full tick count (tiks), then all the
      // possible products of those factors in order from smallest to biggest,
      // until we find a product P such that: tiks/P < maxTicks.
      //
      // Example:
      // Computing products of the prime factors of 30.
      //
      //   tiks | pf  |  1     2     3      4      5      6  <-- compute order
      //   --------------------------------------------------
      //     30 |  5  |              5             5      5  <-- Multiply all
      //        |  3  |        3            3      3      3  <-- primes in each
      //        |  2  |  2                  2             2  <-- column = P
      //   --------------------------------------------------
      //                15    10     6      5      2      1  <-- tiks/P
      //
      //   tiks = 30 has prime factors [2, 3, 5]
      //   The loop below computes the products [2,3,5,6,15,30].
      //   The last product of P = 2*3*5 is skipped since 30/P = 1.
      //   This yields tiks/P = [15,10,6,5,2,1], checked in order until
      //   tiks/P < maxTicks.
      //
      //   Pros:
      //      1) The ticks in the reduced set are always members of the
      //         full set of ticks.
      //   Cons:
      //      1) None: if tiks is prime, we get all or one, nothing between, so
      //      the worst case is to display all, which is the status quo. Really
      //      only a problem visually for larger tick numbers, say, > 7.
      //
      let pf = Utils.getPrimeFactors(tiks)
      let last = pf.length - 1
      let tt = tiks
      reduceLoop: for (var xFactors = 0; xFactors < last; xFactors++) {
        for (var lowest = 0; lowest <= last - xFactors; lowest++) {
          let stop = Math.min(lowest + xFactors, last)
          let t = tt
          let div = 1
          for (var next = lowest; next <= stop; next++) {
            div *= pf[next]
          }
          t /= div
          if (t < maxTicks) {
            tt = t
            break reduceLoop
          }
        }
      }
      // Only reduce tiks all the way down to 1 (increase stepSize to range)
      // if forceNiceScale = true, to give the user the option if tiks is
      // prime and > maxTicks, which may result in premature removal of all but
      // the last tick. It will not be immediately obvious why that has occured.
      if (tt === tiks && axisCnf.forceNiceScale) {
        stepSize = range
      } else {
        stepSize = range / tt
      }
    }

    // build Y label array.

    let val = yMin - stepSize
    // Ensure we don't under/over shoot due to JS precision errors.
    // This also fixes (amongst others):
    // https://github.com/apexcharts/apexcharts.js/issues/430
    let err = stepSize * jsPrecision
    do {
      val += stepSize
      result.push(Utils.stripNumber(val, 7))
    } while (yMax - val > err)

    return {
      result,
      niceMin: result[0],
      niceMax: result[result.length - 1],
    }
  }

  linearScale(yMin, yMax, ticks = 10, index = 0, step = undefined) {
    let range = Math.abs(yMax - yMin)

    ticks = this._adjustTicksForSmallRange(ticks, index, range)

    if (ticks === 'dataPoints') {
      ticks = this.w.globals.dataPoints - 1
    }

    if (!step) {
      step = range / ticks
    }

    if (ticks === Number.MAX_VALUE) {
      ticks = 5
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
      niceMax: result[result.length - 1],
    }
  }

  logarithmicScaleNice(yMin, yMax, base) {
    // Basic validation to avoid for loop starting at -inf.
    if (yMax <= 0) yMax = Math.max(yMin, base)
    if (yMin <= 0) yMin = Math.min(yMax, base)

    const logs = []

    const logMax = Math.ceil(Math.log(yMax) / Math.log(base) + 1) // Get powers of base for our max and min
    const logMin = Math.floor(Math.log(yMin) / Math.log(base))

    for (let i = logMin; i < logMax; i++) {
      logs.push(Math.pow(base, i))
    }

    return {
      result: logs,
      niceMin: logs[0],
      niceMax: logs[logs.length - 1],
    }
  }

  logarithmicScale(yMin, yMax, base) {
    // Basic validation to avoid for loop starting at -inf.
    if (yMax <= 0) yMax = Math.max(yMin, base)
    if (yMin <= 0) yMin = Math.min(yMax, base)

    const logs = []

    // Get the logarithmic range.
    const logMax = Math.log(yMax) / Math.log(base)
    const logMin = Math.log(yMin) / Math.log(base)

    // Get the exact logarithmic range.
    // (This is the exact number of multiples of the base there are between yMin and yMax).
    const logRange = logMax - logMin

    // Round the logarithmic range to get the number of ticks we will create.
    // If the chosen min/max values are multiples of each other WRT the base, this will be neat.
    // If the chosen min/max aren't, we will at least still provide USEFUL ticks.
    const ticks = Math.round(logRange)

    // Get the logarithmic spacing between ticks.
    const logTickSpacing = logRange / ticks

    // Create as many ticks as there is range in the logs.
    for (
      let i = 0, logTick = logMin;
      i < ticks;
      i++, logTick += logTickSpacing
    ) {
      logs.push(Math.pow(base, logTick))
    }

    // Add a final tick at the yMax.
    logs.push(Math.pow(base, logMax))

    return {
      result: logs,
      niceMin: yMin,
      niceMax: yMax,
    }
  }

  _adjustTicksForSmallRange(ticks, index, range) {
    let newTicks = ticks
    if (
      typeof index !== 'undefined' &&
      this.w.config.yaxis[index].labels.formatter &&
      this.w.config.yaxis[index].tickAmount === undefined
    ) {
      const formattedVal = Number(
        this.w.config.yaxis[index].labels.formatter(1)
      )
      if (Utils.isNumber(formattedVal) && this.w.globals.yValueDecimal === 0) {
        newTicks = Math.ceil(range)
      }
    }
    return newTicks < ticks ? newTicks : ticks
  }

  setYScaleForIndex(index, minY, maxY) {
    const gl = this.w.globals
    const cnf = this.w.config

    let y = gl.isBarHorizontal ? cnf.xaxis : cnf.yaxis[index]

    if (typeof gl.yAxisScale[index] === 'undefined') {
      gl.yAxisScale[index] = []
    }

    let range = Math.abs(maxY - minY)

    if (y.logarithmic && range <= 5) {
      gl.invalidLogScale = true
    }

    if (y.logarithmic && range > 5) {
      gl.allSeriesCollapsed = false
      gl.yAxisScale[index] = y.forceNiceScale
        ? this.logarithmicScaleNice(minY, maxY, y.logBase)
        : this.logarithmicScale(minY, maxY, y.logBase)
    } else {
      if (maxY === -Number.MAX_VALUE || !Utils.isNumber(maxY)) {
        // no data in the chart. Either all series collapsed or user passed a blank array
        gl.yAxisScale[index] = this.linearScale(
          0,
          10,
          10,
          index,
          cnf.yaxis[index].stepSize
        )
      } else {
        // there is some data. Turn off the allSeriesCollapsed flag
        gl.allSeriesCollapsed = false
        gl.yAxisScale[index] = this.niceScale(minY, maxY, index)
      }
    }
  }

  setXScale(minX, maxX) {
    const w = this.w
    const gl = w.globals
    let diff = Math.abs(maxX - minX)
    if (maxX === -Number.MAX_VALUE || !Utils.isNumber(maxX)) {
      // no data in the chart. Either all series collapsed or user passed a blank array
      gl.xAxisScale = this.linearScale(0, 10, 10)
    } else {
      gl.xAxisScale = this.linearScale(
        minX,
        maxX,
        w.config.xaxis.tickAmount
          ? w.config.xaxis.tickAmount
          : diff < 10 && diff > 1
          ? diff + 1
          : 10,
        0,
        w.config.xaxis.stepSize
      )
    }
    return gl.xAxisScale
  }

  setMultipleYScales() {
    const gl = this.w.globals
    const cnf = this.w.config

    const minYArr = gl.minYArr
    const maxYArr = gl.maxYArr

    let axisSeriesMap = []
    let unassignedSeriesIndices = []
    cnf.series.forEach((s, i) => {unassignedSeriesIndices.push(i)})
    let unassignedYAxisIndices = []
    // here, we loop through the yaxis array and find the item which has "seriesName" property
    cnf.yaxis.forEach((yaxe, yi) => {
      // Allow seriesName to be either a string (for backward compatibility),
      // in which case, handle multiple yaxes referencing the same series.
      // or an array of strings so that a yaxis can reference multiple series.
      // Feature request #4237
      if (yaxe.seriesName) {
        let seriesNames = []
        if (Array.isArray(yaxe.seriesName)) {
          seriesNames = yaxe.seriesName
        } else {
          seriesNames.push(yaxe.seriesName)
        }
        axisSeriesMap[yi] = []
        seriesNames.forEach((name) => {
          cnf.series.forEach((s, si) => {
            // if seriesName matches we use that scale.
            if (s.name === name) {
              axisSeriesMap[yi].push(si)
              let remove = unassignedSeriesIndices.indexOf(si)
              unassignedSeriesIndices.splice(remove, 1)
            }
          })
        })
      } else {
        unassignedYAxisIndices.push(yi)
      }
    })
    // All series referenced directly by yaxes have been assigned to those axes.
    // Any series so far unassigned will be assigned to any yaxes that have yet
    // to reference series directly, one-for-one in order of appearance, with
    // all left-over series assigned to the last such yaxis. This captures the
    // default single and multiaxis config options which simply includes zero,
    // one or as many yaxes as there are series but do not reference them by name.
    let lastUnassignedYAxis
    unassignedYAxisIndices.forEach((yi) => {
      lastUnassignedYAxis = yi
      axisSeriesMap[yi] = []
      if (unassignedSeriesIndices) {
        axisSeriesMap[yi].push([unassignedSeriesIndices[0]])
        unassignedSeriesIndices.shift()
      }
    })

    if (lastUnassignedYAxis) {
      unassignedSeriesIndices.forEach((i) => {
        axisSeriesMap[lastUnassignedYAxis].push(i)
      })
    }

    gl.seriesYAxisMap = axisSeriesMap.map((x) => x)
    this.sameScaleInMultipleAxes(minYArr, maxYArr, axisSeriesMap)
  }

  sameScaleInMultipleAxes(minYArr, maxYArr, axisSeriesMap) {
    const cnf = this.w.config
    const gl = this.w.globals

    // The current config method to map multiple series to a y axis is to
    // include one yaxis config per series but set each yaxis seriesName to the
    // same series name. This relies on indexing equivalence to map series to
    // an axis: series[n] => yaxis[n]. This needs to be retained for compatibility.
    // But we introduce an alternative that explicitly configures yaxis elements
    // with the series that will be referenced to them (seriesName: []). This
    // only requires including the yaxis elements that will be seen on the chart.
    // Old way:
    // ya: s
    // 0: 0
    // 1: 1
    // 2: 1
    // 3: 1
    // 4: 1
    // Axes 0..4 are all scaled and all will be rendered unless the axes are
    // show: false. If the chart is stacked, it's assumed that series 1..4 are
    // the contributing series. This is not particularly intuitive.
    // New way:
    // ya: s
    // 0: [0]
    // 1: [1,2,3,4]
    // If the chart is stacked, it can be assumed that any axis with multiple
    // series is stacked.

    // First things first, convert the old to the new.
    let emptyAxes = []
    axisSeriesMap.forEach((axisSeries, ai) => {
      for (let si = ai + 1; si < axisSeriesMap.length; si++) {
        let iter = axisSeries.values()
        for (const val of iter) {
          let i = axisSeriesMap[si].indexOf(val)
          if (i !== -1) {
            axisSeries.push(si) // add series index to current yaxis
            axisSeriesMap[si].splice(i, 1) // remove it from its old yaxis
          }
        }
        if (axisSeriesMap[si].length < 1 && emptyAxes.indexOf(si) === -1) {
          emptyAxes.push(si)
        }
      }
    })
    for (let i = emptyAxes.length - 1; i >= 0; i--) {
      axisSeriesMap.splice(emptyAxes[i], 1)
    }

    // Compute min..max for each yaxis
    // 
    axisSeriesMap.forEach((axisSeries, ai) => {
      let minY = Number.MAX_VALUE
      let maxY = -Number.MAX_VALUE
      if (cnf.chart.stacked) {
        let sumSeries = gl.seriesX[axisSeries[0]].map((x) => Number.MIN_VALUE)
        let posSeries = gl.seriesX[axisSeries[0]].map((x) => Number.MIN_VALUE)
        let negSeries = gl.seriesX[axisSeries[0]].map((x) => Number.MIN_VALUE)
        // The first series bound to the axis sets the type for stacked series
        let seriesType = cnf.series[axisSeries[0]].type
        for (let i = 0; i < axisSeries.length; i++) {
          // Sum all series for this yaxis at each corresponding datapoint
          // For bar and column charts we need to keep positive and negative
          // values separate.
          let si = axisSeries[i]
          if (gl.collapsedSeriesIndices.indexOf(si) === -1) {
            for (let j = 0; j < gl.series[si].length; j++) {
              let val = gl.series[si][j]
              if (val >= 0) {
                posSeries[j] += val
              } else {
                negSeries[j] += val
              }
              sumSeries[j] += val
            }
          }
        }
        if (seriesType === 'bar') {
          minY = Math.min.apply(null, negSeries)
          maxY = Math.max.apply(null, posSeries)
        } else {
          minY = Math.min.apply(null, sumSeries)
          maxY = Math.max.apply(null, sumSeries)
        }
      } else {
        for (let i = 0; i < axisSeries.length; i++) {
          minY = Math.min(minY, minYArr[axisSeries[i]])
        }
        for (let i = 0; i < axisSeries.length; i++) {
          maxY = Math.max(maxY, maxYArr[axisSeries[i]])
        }
      }
      if (cnf.yaxis[ai].min !== undefined) {
        if (typeof cnf.yaxis[ai].min === 'function') {
          minY = cnf.yaxis[ai].min(minY)
        } else {
          minY = cnf.yaxis[ai].min
        }
      }
      if (cnf.yaxis[ai].max !== undefined) {
        if (typeof cnf.yaxis[ai].max === 'function') {
          maxY = cnf.yaxis[ai].max(maxY)
        } else {
          maxY = cnf.yaxis[ai].max
        }
      }
      // Set the scale for this yaxis
      this.setYScaleForIndex(ai, minY, maxY)
      // Set individual series min and max to nice values
      axisSeries.forEach((si) => {
        minYArr[si] = gl.yAxisScale[ai].niceMin
        maxYArr[si] = gl.yAxisScale[ai].niceMax
      })
    })
  }
}
