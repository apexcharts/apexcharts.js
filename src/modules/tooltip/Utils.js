
/**
 * ApexCharts Tooltip.Utils Class to support Tooltip functionality.
 *
 * @module Tooltip.Utils
 **/

class Utils {
  constructor (tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
    this.ctx = tooltipContext.ctx
  }

  /**
  ** When hovering over series, you need to capture which series is being hovered on.
  ** This function will return both capturedseries index as well as inner index of that series
  * @memberof Utils
  * @param {object}
  * - context = chart's context
  * - hoverArea = the rect on which user hovers
  * - elGrid = dimensions of the hover rect (it can be different than hoverarea)
  * - lineSeriesWidth = Whatever series the user hovered on, get the width of it
  * @return {object}
  * - capturedSeries = i
  * - j is the inner index of the capturedSeries
  */
  getNearestValues ({ hoverArea, elGrid, clientX, clientY, hasBars }) {
    let w = this.w

    const hoverWidth = w.globals.gridWidth

    let xDivisor = hoverWidth / (w.globals.dataPoints - 1)

    const seriesBound = elGrid.getBoundingClientRect()

    if ((hasBars && w.globals.comboCharts) || hasBars) {
      xDivisor = hoverWidth / (w.globals.dataPoints)
    }

    let hoverX = clientX - seriesBound.left
    let hoverY = clientY - seriesBound.top

    const inRect = hoverX < 0 || hoverY < 0 || hoverX > w.globals.gridWidth || hoverY > w.globals.gridHeight

    if (inRect) {
      hoverArea.classList.remove('hovering-zoom')
      hoverArea.classList.remove('hovering-pan')
    } else {
      if (w.globals.zoomEnabled) {
        hoverArea.classList.remove('hovering-pan')
        hoverArea.classList.add('hovering-zoom')
      } else if (w.globals.panEnabled) {
        hoverArea.classList.remove('hovering-zoom')
        hoverArea.classList.add('hovering-pan')
      }
    }

    let j = Math.round(hoverX / xDivisor)

    if (hasBars) {
      j = Math.ceil(hoverX / xDivisor)
      j = j - 1
    }

    let capturedSeries = null
    let closest = null
    let seriesXValArr = []
    let seriesYValArr = []

    for (let s = 0; s < w.globals.seriesXvalues.length; s++) {
      seriesXValArr.push([w.globals.seriesXvalues[s][0] - 0.000001].concat(w.globals.seriesXvalues[s]))
    }

    seriesXValArr = seriesXValArr.map(seriesXVal => {
      return seriesXVal.filter(s => {
        return s
      })
    })

    seriesYValArr = w.globals.seriesYvalues.map(seriesYVal => {
      return seriesYVal.filter(s => {
        return s
      })
    })

    // if X axis type is not category and tooltip is not shared, then we need to find the cursor position and get the nearest value
    if (w.globals.isXNumeric) {
      closest = this.closestInMultiArray(hoverX, hoverY, seriesXValArr, seriesYValArr)
      capturedSeries = closest.index
      j = closest.j

      if (capturedSeries !== null) {
        // initial push, it should be a little smaller than the 1st val
        seriesXValArr = w.globals.seriesXvalues[capturedSeries]

        closest = this.closestInArray(hoverX, seriesXValArr)

        j = closest.index
      }
    }

    if (!j || j < 1) j = 0

    return {
      capturedSeries,
      j,
      hoverX,
      hoverY
    }
  }

  closestInMultiArray (hoverX, hoverY, Xarrays, Yarrays) {
    let w = this.w
    let activeIndex = 0
    let currIndex = null
    let j = -1

    if (w.globals.series.length > 1) {
      activeIndex = this.getFirstActiveXArray(Xarrays)
    } else {
      currIndex = 0
    }

    let currY = Yarrays[activeIndex][0]
    let currX = Xarrays[activeIndex][0]

    let diffX = Math.abs(hoverX - currX)
    let diffY = Math.abs(hoverY - currY)
    let diff = diffY + diffX

    Yarrays.map((arrY, arrIndex) => {
      arrY.map((y, innerKey) => {
        let newdiffY = Math.abs(hoverY - Yarrays[arrIndex][innerKey])
        let newdiffX = Math.abs(hoverX - Xarrays[arrIndex][innerKey])
        let newdiff = newdiffX + newdiffY

        if (newdiff < diff) {
          diff = newdiff
          diffX = newdiffX
          diffY = newdiffY
          currIndex = arrIndex
          j = innerKey
        }
      })
    })

    return {
      index: currIndex,
      j
    }
  }

  getFirstActiveXArray (Xarrays) {
    let activeIndex = 0

    let firstActiveSeriesIndex = Xarrays.map((xarr, index) => {
      if (xarr.length > 0) {
        return index
      } else {
        return -1
      }
    })

    for (let a = 0; a < firstActiveSeriesIndex.length; a++) {
      if (firstActiveSeriesIndex[a] !== -1) {
        activeIndex = firstActiveSeriesIndex[a]
        break
      }
    }

    return activeIndex
  }

  closestInArray (val, arr) {
    let curr = arr[0]
    let currIndex = null
    let diff = Math.abs(val - curr)

    for (let i = 0; i < arr.length; i++) {
      let newdiff = Math.abs(val - arr[i])
      if (newdiff < diff) {
        diff = newdiff
        curr = arr[i]
        currIndex = i
      }
    }

    return {
      index: currIndex
    }
  }

  /**
  * When there are multiple series, it is possible to have different x values for each series.
  * But it may be possible in those multiple series, that there is same x value for 2 or more
  * series.
  * @memberof Utils
  * @param {int}
  * - j = is the inner index of series -> (series[i][j])
  * @return {bool}
  */
  isXoverlap (j) {
    let w = this.w
    let xSameForAllSeriesJArr = []

    const seriesX = w.globals.seriesX.filter(s => {
      return typeof s[0] !== 'undefined'
    })

    if (seriesX.length > 0) {
      for (let i = 0; i < seriesX.length - 1; i++) {
        if (
          typeof seriesX[i][j] !== 'undefined' &&
          typeof seriesX[i + 1][j] !== 'undefined'
        ) {
          if (seriesX[i][j] !== seriesX[i + 1][j]) {
            xSameForAllSeriesJArr.push('unEqual')
          }
        }
      }
    }

    if (xSameForAllSeriesJArr.length === 0) {
      return true
    }

    return false
  }

  isinitialSeriesSameLen () {
    let sameLen = true

    const initialSeries = this.w.globals.initialSeries

    for (let i = 0; i < initialSeries.length - 1; i++) {
      if (initialSeries[i].data.length !== initialSeries[i + 1].data.length) {
        sameLen = false
        break
      }
    }

    return sameLen
  }

  getBarsHeight (allbars) {
    let bars = [...allbars]
    const totalHeight = bars.reduce((acc, bar) => {
      return acc + bar.getBBox().height
    }, 0)

    return totalHeight
  }

  toggleAllTooltipSeriesGroups (state) {
    let w = this.w
    const ttCtx = this.ttCtx

    if (ttCtx.allTooltipSeriesGroups.length === 0) {
      ttCtx.allTooltipSeriesGroups = w.globals.dom.baseEl.querySelectorAll('.apexcharts-tooltip-series-group')
    }

    let allTooltipSeriesGroups = ttCtx.allTooltipSeriesGroups
    for (let i = 0; i < allTooltipSeriesGroups.length; i++) {
      if (state === 'enable') {
        allTooltipSeriesGroups[i].classList.add('active')
        allTooltipSeriesGroups[i].style.display = w.config.tooltip.items.display
      } else {
        allTooltipSeriesGroups[i].classList.remove('active')
        allTooltipSeriesGroups[i].style.display = 'none'
      }
    }
  }
}

module.exports = Utils
