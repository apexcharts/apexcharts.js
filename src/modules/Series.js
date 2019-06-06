import Graphics from './Graphics'
import Utils from '../utils/Utils'

/**
 * ApexCharts Series Class for interation with the Series of the chart.
 *
 * @module Series
 **/

export default class Series {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  getAllSeriesEls() {
    return this.w.globals.dom.baseEl.querySelectorAll(`.apexcharts-series`)
  }

  getSeriesByName(seriesName) {
    return this.w.globals.dom.baseEl.querySelector(
      `[seriesName='${Utils.escapeString(seriesName)}']`
    )
  }

  addCollapsedClassToSeries(elSeries, index) {
    const w = this.w
    function iterateOnAllCollapsedSeries(series) {
      for (let cs = 0; cs < series.length; cs++) {
        if (series[cs].index === index) {
          elSeries.node.classList.add('apexcharts-series-collapsed')
        }
      }
    }

    iterateOnAllCollapsedSeries(w.globals.collapsedSeries)
    iterateOnAllCollapsedSeries(w.globals.ancillaryCollapsedSeries)
  }

  resetSeries(shouldUpdateChart = true) {
    const w = this.w

    let series = w.globals.initialSeries.slice()
    w.config.series = series

    w.globals.collapsedSeries = []
    w.globals.ancillaryCollapsedSeries = []
    w.globals.collapsedSeriesIndices = []
    w.globals.ancillaryCollapsedSeriesIndices = []
    w.globals.previousPaths = []

    if (shouldUpdateChart) {
      this.ctx._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      )
    }
  }

  toggleSeriesOnHover(e, targetElement) {
    const w = this.w

    let allSeriesEls = w.globals.dom.baseEl.querySelectorAll(
      `.apexcharts-series`
    )

    if (e.type === 'mousemove') {
      let seriesCnt = parseInt(targetElement.getAttribute('rel')) - 1

      let seriesEl = null
      if (w.globals.axisCharts || w.config.chart.type === 'radialBar') {
        if (w.globals.axisCharts) {
          seriesEl = w.globals.dom.baseEl.querySelector(
            `.apexcharts-series[data\\:realIndex='${seriesCnt}']`
          )
        } else {
          seriesEl = w.globals.dom.baseEl.querySelector(
            `.apexcharts-series[rel='${seriesCnt + 1}']`
          )
        }
      } else {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}'] path`
        )
      }

      for (let se = 0; se < allSeriesEls.length; se++) {
        allSeriesEls[se].classList.add('legend-mouseover-inactive')
      }

      if (seriesEl !== null) {
        if (!w.globals.axisCharts) {
          seriesEl.parentNode.classList.remove('legend-mouseover-inactive')
        }

        seriesEl.classList.remove('legend-mouseover-inactive')
      }
    } else if (e.type === 'mouseout') {
      for (let se = 0; se < allSeriesEls.length; se++) {
        allSeriesEls[se].classList.remove('legend-mouseover-inactive')
      }
    }
  }

  highlightRangeInSeries(e, targetElement) {
    const w = this.w
    const allHeatMapElements = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-heatmap-rect'
    )

    const allActive = function() {
      for (let i = 0; i < allHeatMapElements.length; i++) {
        allHeatMapElements[i].classList.remove('legend-mouseover-inactive')
      }
    }
    const allInactive = function() {
      for (let i = 0; i < allHeatMapElements.length; i++) {
        allHeatMapElements[i].classList.add('legend-mouseover-inactive')
      }
    }

    const selectedActive = function(range) {
      for (let i = 0; i < allHeatMapElements.length; i++) {
        const val = parseInt(allHeatMapElements[i].getAttribute('val'))
        if (val >= range.from && val <= range.to) {
          allHeatMapElements[i].classList.remove('legend-mouseover-inactive')
        }
      }
    }

    if (e.type === 'mousemove') {
      let seriesCnt = parseInt(targetElement.getAttribute('rel')) - 1
      allActive()
      allInactive()

      const range = w.config.plotOptions.heatmap.colorScale.ranges[seriesCnt]

      selectedActive(range)
    } else if (e.type === 'mouseout') {
      allActive()
    }
  }

  getActiveSeriesIndex() {
    const w = this.w
    let activeIndex = 0

    if (w.globals.series.length > 1) {
      // active series flag is required to know if user has not deactivated via legend click
      let firstActiveSeriesIndex = w.globals.series.map((series, index) => {
        if (
          series.length > 0 &&
          (w.config.series[index].type !== 'bar' &&
            w.config.series[index].type !== 'column')
        ) {
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
    }

    return activeIndex
  }

  getActiveConfigSeriesIndex() {
    const w = this.w
    let activeIndex = 0

    if (w.config.series.length > 1) {
      // active series flag is required to know if user has not deactivated via legend click
      let firstActiveSeriesIndex = w.config.series.map((series, index) => {
        if (series.data && series.data.length > 0) {
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
    }

    return activeIndex
  }

  getPreviousPaths() {
    let w = this.w

    w.globals.previousPaths = []

    function pushPaths(seriesEls, i, type) {
      let paths = seriesEls[i].childNodes
      let dArr = {
        type,
        paths: [],
        realIndex: seriesEls[i].getAttribute('data:realIndex')
      }

      for (let j = 0; j < paths.length; j++) {
        if (paths[j].hasAttribute('pathTo')) {
          let d = paths[j].getAttribute('pathTo')
          dArr.paths.push({
            d
          })
        }
      }

      w.globals.previousPaths.push(dArr)
    }

    let linePaths = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-line-series .apexcharts-series'
    )
    if (linePaths.length > 0) {
      for (let p = linePaths.length - 1; p >= 0; p--) {
        pushPaths(linePaths, p, 'line')
      }
    }

    let areapaths = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-area-series .apexcharts-series'
    )

    if (areapaths.length > 0) {
      for (let i = areapaths.length - 1; i >= 0; i--) {
        pushPaths(areapaths, i, 'area')
      }
    }

    let barPaths = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-bar-series .apexcharts-series'
    )
    if (barPaths.length > 0) {
      for (let p = 0; p < barPaths.length; p++) {
        pushPaths(barPaths, p, 'bar')
      }
    }

    let candlestickPaths = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-candlestick-series .apexcharts-series'
    )
    if (candlestickPaths.length > 0) {
      for (let p = 0; p < candlestickPaths.length; p++) {
        pushPaths(candlestickPaths, p, 'candlestick')
      }
    }

    let radarPaths = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-radar-series .apexcharts-series'
    )
    if (radarPaths.length > 0) {
      for (let p = 0; p < radarPaths.length; p++) {
        pushPaths(radarPaths, p, 'radar')
      }
    }

    let bubblepaths = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-bubble-series .apexcharts-series'
    )
    if (bubblepaths.length > 0) {
      for (let s = 0; s < bubblepaths.length; s++) {
        let seriesEls = w.globals.dom.baseEl.querySelectorAll(
          `.apexcharts-bubble-series .apexcharts-series[data\\:realIndex='${s}'] circle`
        )
        let dArr = []

        for (let i = 0; i < seriesEls.length; i++) {
          dArr.push({
            x: seriesEls[i].getAttribute('cx'),
            y: seriesEls[i].getAttribute('cy'),
            r: seriesEls[i].getAttribute('r')
          })
        }
        w.globals.previousPaths.push(dArr)
      }
    }

    let scatterpaths = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-scatter-series .apexcharts-series'
    )
    if (scatterpaths.length > 0) {
      for (let s = 0; s < scatterpaths.length; s++) {
        let seriesEls = w.globals.dom.baseEl.querySelectorAll(
          `.apexcharts-scatter-series .apexcharts-series[data\\:realIndex='${s}'] circle`
        )
        let dArr = []

        for (let i = 0; i < seriesEls.length; i++) {
          dArr.push({
            x: seriesEls[i].getAttribute('cx'),
            y: seriesEls[i].getAttribute('cy'),
            r: seriesEls[i].getAttribute('r')
          })
        }
        w.globals.previousPaths.push(dArr)
      }
    }

    let heatmapColors = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-heatmap .apexcharts-series'
    )

    if (heatmapColors.length > 0) {
      for (let h = 0; h < heatmapColors.length; h++) {
        let seriesEls = w.globals.dom.baseEl.querySelectorAll(
          `.apexcharts-heatmap .apexcharts-series[data\\:realIndex='${h}'] rect`
        )

        let dArr = []

        for (let i = 0; i < seriesEls.length; i++) {
          dArr.push({
            color: seriesEls[i].getAttribute('color')
          })
        }
        w.globals.previousPaths.push(dArr)
      }
    }

    if (!w.globals.axisCharts) {
      // for non-axis charts (i.e., circular charts, pathFrom is not usable. We need whole series)
      w.globals.previousPaths = w.globals.series
    }
  }

  handleNoData() {
    const w = this.w
    const me = this

    const noDataOpts = w.config.noData
    const graphics = new Graphics(me.ctx)

    let x = w.globals.svgWidth / 2
    let y = w.globals.svgHeight / 2
    let textAnchor = 'middle'

    w.globals.noData = true
    w.globals.animationEnded = true

    if (noDataOpts.align === 'left') {
      x = 10
      textAnchor = 'start'
    } else if (noDataOpts.align === 'right') {
      x = w.globals.svgWidth - 10
      textAnchor = 'end'
    }

    if (noDataOpts.verticalAlign === 'top') {
      y = 50
    } else if (noDataOpts.verticalAlign === 'bottom') {
      y = w.globals.svgHeight - 50
    }

    x = x + noDataOpts.offsetX
    y = y + parseInt(noDataOpts.style.fontSize) + 2

    if (noDataOpts.text !== undefined && noDataOpts.text !== '') {
      let titleText = graphics.drawText({
        x: x,
        y: y,
        text: noDataOpts.text,
        textAnchor: textAnchor,
        fontSize: noDataOpts.style.fontSize,
        fontFamily: noDataOpts.style.fontFamily,
        foreColor: noDataOpts.style.color,
        opacity: 1,
        class: 'apexcharts-text-nodata'
      })

      titleText.node.setAttribute('class', 'apexcharts-title-text')

      w.globals.dom.Paper.add(titleText)
    }
  }

  // When user clicks on legends, the collapsed series is filled with [0,0,0,...,0]
  // This is because we don't want to alter the series' length as it is used at many places
  setNullSeriesToZeroValues(series) {
    let w = this.w
    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length === 0) {
        for (let j = 0; j < series[w.globals.maxValsInArrayIndex].length; j++) {
          series[sl].push(0)
        }
      }
    }
    return series
  }

  hasAllSeriesEqualX() {
    let equalLen = true
    const w = this.w

    const filteredSerX = this.filteredSeriesX()

    for (let i = 0; i < filteredSerX.length - 1; i++) {
      if (filteredSerX[i][0] !== filteredSerX[i + 1][0]) {
        equalLen = false
        break
      }
    }

    w.globals.allSeriesHasEqualX = equalLen

    return equalLen
  }

  filteredSeriesX() {
    const w = this.w

    const filteredSeriesX = w.globals.seriesX.map((ser, index) => {
      if (ser.length > 0) {
        return ser
      } else {
        return []
      }
    })

    return filteredSeriesX
  }
}
