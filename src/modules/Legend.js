import CoreUtils from './CoreUtils'
import Dimensions from './Dimensions'
import Graphics from './Graphics'
import Series from './Series'
import Utils from '../utils/Utils'

/**
 * ApexCharts Legend Class to draw legend.
 *
 * @module Legend
 **/

class Legend {
  constructor (ctx, opts) {
    this.ctx = ctx
    this.w = ctx.w

    this.onLegendClick = this.onLegendClick.bind(this)
    this.onLegendHovered = this.onLegendHovered.bind(this)
  }

  init () {
    const w = this.w

    const gl = w.globals
    const cnf = w.config

    const showLegendAlways = (cnf.legend.showForSingleSeries && gl.series.length === 1) || gl.series.length > 1

    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      while (gl.dom.elLegendWrap.firstChild) {
        gl.dom.elLegendWrap.removeChild(gl.dom.elLegendWrap.firstChild)
      }

      this.drawLegends()
      if (!Utils.isIE11()) {
        this.appendToForeignObject()
      } else {
        // IE11 doesn't supports foreignObject, hence append it to <head>
        document.getElementsByTagName('head')[0].appendChild(this.getLegendStyles())
      }

      if (cnf.legend.position === 'bottom' || cnf.legend.position === 'top') {
        this.legendAlignHorizontal()
      } else if (
        cnf.legend.position === 'right' ||
        cnf.legend.position === 'left'
      ) {
        this.legendAlignVertical()
      }
    }
  }

  appendToForeignObject () {
    const gl = this.w.globals

    var elForeign = document.createElementNS(gl.svgNS, 'foreignObject')

    elForeign.setAttribute('x', 0)
    elForeign.setAttribute('y', 0)
    elForeign.setAttribute('width', gl.svgWidth)
    elForeign.setAttribute('height', gl.svgHeight)
    gl.dom.elLegendWrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')

    elForeign.appendChild(gl.dom.elLegendWrap)
    elForeign.appendChild(this.getLegendStyles())

    gl.dom.Paper.node.insertBefore(elForeign, gl.dom.elGraphical.node)
  }

  drawLegends () {
    let self = this
    let w = this.w

    let fontFamily = w.config.legend.fontFamily

    let legendNames = w.globals.seriesNames
    let fillcolor = w.globals.colors.slice()

    if (w.config.chart.type === 'heatmap') {
      const ranges = w.config.plotOptions.heatmap.colorScale.ranges
      legendNames = ranges.map((colorScale) => {
        return colorScale.name ? colorScale.name : colorScale.from + ' - ' + colorScale.to
      })
      fillcolor = ranges.map((color) => {
        return color.color
      })
    }
    let legendFormatter = w.globals.legendFormatter

    for (let i = 0; i <= legendNames.length - 1; i++) {
      let text = legendFormatter(legendNames[i], { seriesIndex: i, w })

      let collapsedSeries = false
      if (w.globals.collapsedSeries.length > 0) {
        for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
          if (w.globals.collapsedSeries[c].index === i) {
            collapsedSeries = true
          }
        }
      }

      let elMarker = document.createElement('span')
      elMarker.classList.add('apexcharts-legend-marker')

      let mOffsetX = w.config.legend.markers.offsetX
      let mOffsetY = w.config.legend.markers.offsetY
      let mHeight = w.config.legend.markers.height
      let mWidth = w.config.legend.markers.width
      let mBorderWidth = w.config.legend.markers.strokeWidth
      let mBorderColor = w.config.legend.markers.strokeColor
      let mBorderRadius = w.config.legend.markers.radius

      let mStyle = elMarker.style

      mStyle.background = fillcolor[i]
      mStyle.color = fillcolor[i]
      mStyle.height = Array.isArray(mHeight) ? parseFloat(mHeight[i]) + 'px' : parseFloat(mHeight) + 'px'
      mStyle.width = Array.isArray(mWidth) ? parseFloat(mWidth[i]) + 'px' : parseFloat(mWidth) + 'px'
      mStyle.left = Array.isArray(mOffsetX) ? mOffsetX[i] : mOffsetX
      mStyle.top = Array.isArray(mOffsetY) ? mOffsetY[i] : mOffsetY
      mStyle.borderWidth = Array.isArray(mBorderWidth) ? mBorderWidth[i] : mBorderWidth
      mStyle.borderColor = Array.isArray(mBorderColor) ? mBorderColor[i] : mBorderColor
      mStyle.borderRadius = Array.isArray(mBorderRadius) ? parseFloat(mBorderRadius[i]) + 'px' : parseFloat(mBorderRadius) + 'px'

      if (w.config.legend.markers.customHTML) {
        if (Array.isArray(w.config.legend.markers.customHTML)) {
          elMarker.innerHTML = w.config.legend.markers.customHTML[i]()
        } else {
          elMarker.innerHTML = w.config.legend.markers.customHTML()
        }
      }

      Graphics.setAttrs(elMarker, {
        'rel': i + 1,
        'data:collapsed': collapsedSeries
      })

      if (collapsedSeries) {
        elMarker.classList.add('inactive-legend')
      }

      let elLegend = document.createElement('div')

      let elLegendText = document.createElement('span')
      elLegendText.classList.add('apexcharts-legend-text')
      elLegendText.innerHTML = text

      let textColor = w.config.legend.labels.useSeriesColors ? w.globals.colors[i] : w.config.legend.labels.colors

      if (!textColor) {
        textColor = w.config.chart.foreColor
      }

      elLegendText.style.color = textColor

      elLegendText.style.fontSize = parseFloat(w.config.legend.labels.fontSize) + 'px'
      elLegendText.style.fontFamily = fontFamily || w.config.chart.fontFamily

      Graphics.setAttrs(elLegendText, {
        'rel': i + 1,
        'data:collapsed': collapsedSeries
      })

      elLegend.appendChild(elMarker)
      elLegend.appendChild(elLegendText)

      if (!w.config.legend.showForZeroSeries) {
        const coreUtils = new CoreUtils(this.ctx)
        const total = coreUtils.getSeriesTotalByIndex(i)

        if (total === 0 && coreUtils.seriesHaveSameValues(i) && w.globals.collapsedSeriesIndices.indexOf(i) === -1) {
          elLegend.classList.add('apexcharts-hidden-zero-series')
        }
      }

      w.globals.dom.elLegendWrap.appendChild(elLegend)
      w.globals.dom.elLegendWrap.classList.add(w.config.legend.horizontalAlign)
      // w.globals.dom.elLegendWrap.classList.add(w.config.legend.verticalAlign)
      w.globals.dom.elLegendWrap.classList.add('position-' + w.config.legend.position)

      elLegend.classList.add('apexcharts-legend-series')
      elLegend.style.margin = `${w.config.legend.itemMargin.horizontal}px ${w.config.legend.itemMargin.vertical}px`
      w.globals.dom.elLegendWrap.style.width = w.config.legend.width ? w.config.legend.width + 'px' : ''
      w.globals.dom.elLegendWrap.style.height = w.config.legend.height ? w.config.legend.height + 'px' : ''

      Graphics.setAttrs(elLegend, {
        'rel': i + 1,
        'data:collapsed': collapsedSeries
      })

      if (collapsedSeries) {
        elLegend.classList.add('inactiv`e-legend')
      }

      if (!w.config.legend.onItemClick.toggleDataSeries) {
        elLegend.classList.add('no-click')
      }
    }

    // for now - just prevent click on heatmap legend - and allow hover only
    const clickAllowed = w.config.chart.type !== 'heatmap'

    if (clickAllowed && w.config.legend.onItemClick.toggleDataSeries) {
      w.globals.dom.elWrap.addEventListener(
        'click',
        self.onLegendClick,
        true
      )
    }

    if (w.config.legend.onItemHover.highlightDataSeries) {
      w.globals.dom.elWrap.addEventListener(
        'mousemove',
        self.onLegendHovered,
        true
      )
      w.globals.dom.elWrap.addEventListener(
        'mouseout',
        self.onLegendHovered,
        true
      )
    }
  }

  getLegendBBox () {
    const w = this.w
    let currLegendsWrap = w.globals.dom.baseEl.querySelector('.apexcharts-legend')
    let currLegendsWrapRect = currLegendsWrap.getBoundingClientRect()

    let currLegendsWrapWidth = currLegendsWrapRect.width
    let currLegendsWrapHeight = currLegendsWrapRect.height

    return {
      clwh: currLegendsWrapHeight,
      clww: currLegendsWrapWidth
    }
  }

  setLegendWrapXY (offsetX, offsetY) {
    let w = this.w

    let elLegendWrap = w.globals.dom.baseEl.querySelector(
      '.apexcharts-legend'
    )

    const legendRect = elLegendWrap.getBoundingClientRect()

    let x = 0
    let y = 0

    if (w.config.legend.position === 'bottom') {
      y = y + (w.globals.svgHeight - legendRect.height / 2)
    } else if (w.config.legend.position === 'top') {
      const dim = new Dimensions(this.ctx)
      const titleH = dim.getTitleSubtitleCoords('title').height
      const subtitleH = dim.getTitleSubtitleCoords('subtitle').height

      y = y + (titleH > 0 ? titleH - 10 : 0) + (subtitleH > 0 ? subtitleH - 10 : 0)
    }

    x = x + offsetX + w.config.legend.offsetX
    y = y + offsetY + w.config.legend.offsetY

    elLegendWrap.style.position = 'absolute'

    elLegendWrap.style.left = x + 'px'
    elLegendWrap.style.top = y + 'px'

    if (w.config.legend.position === 'bottom') {
      elLegendWrap.style.top = 'auto'
      elLegendWrap.style.bottom = 10 - w.config.legend.offsetY + 'px'
    } else if (w.config.legend.position === 'right') {
      elLegendWrap.style.left = 'auto'
      elLegendWrap.style.right = 25 + w.config.legend.offsetX + 'px'
    }

    if (elLegendWrap.style.width) {
      elLegendWrap.style.width = parseInt(w.config.legend.width) + 'px'
    }

    if (elLegendWrap.style.height) {
      elLegendWrap.style.height = parseInt(w.config.legend.height) + 'px'
    }
  }

  legendAlignHorizontal () {
    let w = this.w

    let elLegendWrap = w.globals.dom.baseEl.querySelector(
      '.apexcharts-legend'
    )

    elLegendWrap.style.right = 0

    let lRect = this.getLegendBBox()

    let dimensions = new Dimensions(this.ctx)
    let titleRect = dimensions.getTitleSubtitleCoords('title')
    let subtitleRect = dimensions.getTitleSubtitleCoords('subtitle')

    let offsetX = 20
    let offsetY = 0

    // the whole legend box is set to bottom
    if (w.config.legend.position === 'bottom') {
      offsetY = -lRect.clwh / 1.8
    } else if (w.config.legend.position === 'top') {
      offsetY = titleRect.height + subtitleRect.height + w.config.title.margin + w.config.subtitle.margin - 15
    }

    this.setLegendWrapXY(offsetX, offsetY)
  }

  legendAlignVertical () {
    let w = this.w

    let lRect = this.getLegendBBox()

    let offsetY = 20
    let offsetX = 0

    if (w.config.legend.position === 'left') {
      offsetX = 20
    }

    if (w.config.legend.position === 'right') {
      offsetX = w.globals.svgWidth - lRect.clww - 10
    }

    this.setLegendWrapXY(offsetX, offsetY)
  }

  onLegendHovered (e) {
    const w = this.w

    const hoverOverLegend = (e.target.classList.contains('apexcharts-legend-text') ||
      e.target.classList.contains('apexcharts-legend-marker'))

    if (w.config.chart.type !== 'heatmap') {
      if (
        !e.target.classList.contains('inactive-legend') &&
        hoverOverLegend) {
        let series = new Series(this.ctx)
        series.toggleSeriesOnHover(e, e.target)
      }
    } else {
      // for heatmap handling
      if (hoverOverLegend) {
        let seriesCnt = parseInt(e.target.getAttribute('rel')) - 1
        this.ctx.fireEvent('legendHover', [this.ctx, seriesCnt, this.w])

        let series = new Series(this.ctx)
        series.highlightRangeInSeries(e, e.target)
      }
    }
  }

  onLegendClick (e) {
    if (
      e.target.classList.contains('apexcharts-legend-text') ||
      e.target.classList.contains('apexcharts-legend-marker')
    ) {
      let seriesCnt = parseInt(e.target.getAttribute('rel')) - 1
      let isHidden = e.target.getAttribute('data:collapsed') === 'true'

      const legendClick = this.w.config.chart.events.legendClick
      if (typeof legendClick === 'function') {
        legendClick(this.ctx, seriesCnt, this.w)
      }

      this.ctx.fireEvent('legendClick', [this.ctx, seriesCnt, this.w])

      this.toggleDataSeries(seriesCnt, isHidden)
    }
  }

  getLegendStyles () {
    var stylesheet = document.createElement('style')
    stylesheet.setAttribute('type', 'text/css')

    const text = `
    
      .apexcharts-legend {
        display: flex;
        overflow: auto;
        padding: 0 10px;
      }

      .apexcharts-legend.position-bottom, .apexcharts-legend.position-top {
        flex-wrap: wrap
      }
      .apexcharts-legend.position-right, .apexcharts-legend.position-left {
        flex-direction: column;
        bottom: 0;
      }

      .apexcharts-legend.position-bottom.left, .apexcharts-legend.position-top.left, .apexcharts-legend.position-right, .apexcharts-legend.position-left {
        justify-content: flex-start;
      }

      .apexcharts-legend.position-bottom.center, .apexcharts-legend.position-top.center {
        justify-content: center;  
      }

      .apexcharts-legend.position-bottom.right, .apexcharts-legend.position-top.right {
        justify-content: flex-end;
      }

      .apexcharts-legend-series {
        cursor: pointer;
      }

      .apexcharts-legend.position-bottom .apexcharts-legend-series, .apexcharts-legend.position-top .apexcharts-legend-series{
        display: flex;
        align-items: center;
      }

      .apexcharts-legend-text {
        position: relative;
        font-size: 14px;
      }

      .apexcharts-legend-marker {
        position: relative;
        display: inline-block;
        cursor: pointer;
        margin-right: 3px;
      }
      
      .apexcharts-legend.right .apexcharts-legend-series, .apexcharts-legend.left .apexcharts-legend-series{
        display: inline-block;
      }

      .apexcharts-legend-series.no-click {
        cursor: auto;
      }

      .apexcharts-legend .apexcharts-hidden-zero-series {
        display: none !important;
      }

      .inactive-legend {
        opacity: 0.45;
      }`

    var rules = document.createTextNode(text)

    stylesheet.appendChild(rules)

    return stylesheet
  }

  resetToggleDataSeries () {
    const w = this.w

    let seriesEls = null

    let realIndexes = []

    if (w.globals.axisCharts) {
      seriesEls = w.globals.dom.baseEl.querySelectorAll(
        `.apexcharts-series[data\\:realIndex]`
      )

      seriesEls.forEach(v => {
        realIndexes.push(parseInt(v.getAttribute('data:realIndex')))
      })
    } else {
      seriesEls = w.globals.dom.baseEl.querySelectorAll(
        `.apexcharts-series[rel]`
      )
      seriesEls.forEach(v => {
        realIndexes.push(parseInt(v.getAttribute('rel')) - 1)
      })
    }

    realIndexes.sort()

    if (w.globals.collapsedSeries.length > 0) {
      let risingSeries = w.globals.risingSeries.slice()
      let series = w.config.series.slice()

      for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
        let index = realIndexes.indexOf(w.globals.collapsedSeries[c].index)

        if (index !== -1) {
          if (w.globals.axisCharts) {
            series[index].data = w.globals.collapsedSeries.slice()[c].data.slice()
          } else {
            series[index] = w.globals.collapsedSeries.slice()[c].data
          }
          risingSeries.push(index)
        }
      }
      w.globals.collapsedSeries = []
      w.globals.collapsedSeriesIndices = []
      w.globals.risingSeries = risingSeries
      w.config.series = series
      this.ctx._updateSeries(w.config.series, w.config.chart.animations.dynamicAnimation.enabled)
    }
  }

  toggleDataSeries (seriesCnt, isHidden) {
    const w = this.w
    if (w.globals.axisCharts || w.config.chart.type === 'radialBar') {
      w.globals.resized = true // we don't want initial animations again

      let seriesEl = null

      let realIndex = null

      // yes, make it null. 1 series will rise at a time
      w.globals.risingSeries = []

      if (w.globals.axisCharts) {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[data\\:realIndex='${seriesCnt}']`
        )
        realIndex = parseInt(seriesEl.getAttribute('data:realIndex'))
      } else {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        )
        realIndex = parseInt(seriesEl.getAttribute('rel')) - 1
      }

      if (isHidden) {
        if (w.globals.collapsedSeries.length > 0) {
          for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
            if (w.globals.collapsedSeries[c].index === realIndex) {
              if (w.globals.axisCharts) {
                w.config.series[realIndex].data = w.globals.collapsedSeries[c].data.slice()
                w.globals.collapsedSeries.splice(c, 1)
                w.globals.collapsedSeriesIndices.splice(c, 1)
                w.globals.risingSeries.push(realIndex)
              } else {
                w.config.series[realIndex] = w.globals.collapsedSeries[c].data
                w.globals.collapsedSeries.splice(c, 1)
                w.globals.collapsedSeriesIndices.splice(c, 1)
                w.globals.risingSeries.push(realIndex)
              }
              this.ctx._updateSeries(w.config.series, w.config.chart.animations.dynamicAnimation.enabled)
            }
          }
        }
      } else {
        if (w.globals.axisCharts) {
          w.globals.collapsedSeries.push({
            index: realIndex,
            data: w.config.series[realIndex].data.slice(),
            type: seriesEl.parentNode.className.baseVal.split('-')[1]
          })
          w.globals.collapsedSeriesIndices.push(realIndex)

          let removeIndexOfRising = w.globals.risingSeries.indexOf(realIndex)

          w.globals.risingSeries.splice(removeIndexOfRising, 1)

          // mutating the user's config object here
          w.config.series[realIndex].data = []
        } else {
          w.globals.collapsedSeries.push({
            index: realIndex,
            data: w.config.series[realIndex]
          })
          w.globals.collapsedSeriesIndices.push(realIndex)
          w.config.series[realIndex] = 0
        }

        let seriesChildren = seriesEl.childNodes
        for (let sc = 0; sc < seriesChildren.length; sc++) {
          if (
            seriesChildren[sc].classList.contains(
              'apexcharts-series-markers-wrap'
            )
          ) {
            if (seriesChildren[sc].classList.contains('apexcharts-hide')) {
              seriesChildren[sc].classList.remove('apexcharts-hide')
            } else {
              seriesChildren[sc].classList.add('apexcharts-hide')
            }
          }
        }

        w.globals.allSeriesCollapsed = w.globals.collapsedSeries.length === w.globals.series.length

        this.ctx._updateSeries(w.config.series, w.config.chart.animations.dynamicAnimation.enabled)
      }
    } else {
      // for non-axis charts i.e pie / donuts
      let seriesEl = w.globals.dom.Paper.select(
        ` .apexcharts-series[rel='${seriesCnt + 1}'] path`
      )

      seriesEl.fire('click')
    }
  }
}

export default Legend
