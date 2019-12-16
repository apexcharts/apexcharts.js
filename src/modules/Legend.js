import CoreUtils from './CoreUtils'
import Dimensions from './Dimensions'
import Graphics from './Graphics'
import Pie from '../charts/Pie'
import Series from './Series'
import Utils from '../utils/Utils'

/**
 * ApexCharts Legend Class to draw legend.
 *
 * @module Legend
 **/

class Legend {
  constructor(ctx, opts) {
    this.ctx = ctx
    this.w = ctx.w

    this.onLegendClick = this.onLegendClick.bind(this)
    this.onLegendHovered = this.onLegendHovered.bind(this)

    this.isBarsDistributed =
      this.w.config.chart.type === 'bar' &&
      this.w.config.plotOptions.bar.distributed &&
      this.w.config.series.length === 1
  }

  init() {
    const w = this.w

    const gl = w.globals
    const cnf = w.config

    const showLegendAlways =
      (cnf.legend.showForSingleSeries && gl.series.length === 1) ||
      this.isBarsDistributed ||
      gl.series.length > 1

    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      while (gl.dom.elLegendWrap.firstChild) {
        gl.dom.elLegendWrap.removeChild(gl.dom.elLegendWrap.firstChild)
      }

      this.drawLegends()
      if (!Utils.isIE11()) {
        this.appendToForeignObject()
      } else {
        // IE11 doesn't supports foreignObject, hence append it to <head>
        document
          .getElementsByTagName('head')[0]
          .appendChild(this.getLegendStyles())
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

  getLegendStyles() {
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
        line-height: normal;	
      }	
      .apexcharts-legend.position-bottom .apexcharts-legend-series, .apexcharts-legend.position-top .apexcharts-legend-series{	
        display: flex;	
        align-items: center;	
      }	
      .apexcharts-legend-text {	
        position: relative;	
        font-size: 14px;	
      }	
      .apexcharts-legend-text *, .apexcharts-legend-marker * {	
        pointer-events: none;	
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
      .apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series {	
        display: none !important;	
      }	
      .inactive-legend {	
        opacity: 0.45;	
      }`

    var rules = document.createTextNode(text)

    stylesheet.appendChild(rules)

    return stylesheet
  }

  appendToForeignObject() {
    const gl = this.w.globals

    gl.dom.elLegendForeign = document.createElementNS(gl.SVGNS, 'foreignObject')

    let elForeign = gl.dom.elLegendForeign

    elForeign.setAttribute('x', 0)
    elForeign.setAttribute('y', 0)
    elForeign.setAttribute('width', gl.svgWidth)
    elForeign.setAttribute('height', gl.svgHeight)
    gl.dom.elLegendWrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')

    elForeign.appendChild(gl.dom.elLegendWrap)
    elForeign.appendChild(this.getLegendStyles())

    gl.dom.Paper.node.insertBefore(elForeign, gl.dom.elGraphical.node)
  }

  drawLegends() {
    let self = this
    let w = this.w

    let fontFamily = w.config.legend.fontFamily

    let legendNames = w.globals.seriesNames
    let fillcolor = w.globals.colors.slice()

    if (w.config.chart.type === 'heatmap') {
      const ranges = w.config.plotOptions.heatmap.colorScale.ranges
      legendNames = ranges.map((colorScale) => {
        return colorScale.name
          ? colorScale.name
          : colorScale.from + ' - ' + colorScale.to
      })
      fillcolor = ranges.map((color) => {
        return color.color
      })
    } else if (this.isBarsDistributed) {
      legendNames = w.globals.labels.slice()
    }
    let legendFormatter = w.globals.legendFormatter

    let isLegendInversed = w.config.legend.inverseOrder

    for (
      let i = isLegendInversed ? legendNames.length - 1 : 0;
      isLegendInversed ? i >= 0 : i <= legendNames.length - 1;
      isLegendInversed ? i-- : i++
    ) {
      let text = legendFormatter(legendNames[i], { seriesIndex: i, w })

      let collapsedSeries = false
      let ancillaryCollapsedSeries = false
      if (w.globals.collapsedSeries.length > 0) {
        for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
          if (w.globals.collapsedSeries[c].index === i) {
            collapsedSeries = true
          }
        }
      }

      if (w.globals.ancillaryCollapsedSeriesIndices.length > 0) {
        for (
          let c = 0;
          c < w.globals.ancillaryCollapsedSeriesIndices.length;
          c++
        ) {
          if (w.globals.ancillaryCollapsedSeriesIndices[c] === i) {
            ancillaryCollapsedSeries = true
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

      // override fill color with custom legend.markers.fillColors
      if (
        w.config.legend.markers.fillColors &&
        w.config.legend.markers.fillColors[i]
      ) {
        mStyle.background = w.config.legend.markers.fillColors[i]
      }

      mStyle.height = Array.isArray(mHeight)
        ? parseFloat(mHeight[i]) + 'px'
        : parseFloat(mHeight) + 'px'
      mStyle.width = Array.isArray(mWidth)
        ? parseFloat(mWidth[i]) + 'px'
        : parseFloat(mWidth) + 'px'
      mStyle.left = Array.isArray(mOffsetX) ? mOffsetX[i] : mOffsetX
      mStyle.top = Array.isArray(mOffsetY) ? mOffsetY[i] : mOffsetY
      mStyle.borderWidth = Array.isArray(mBorderWidth)
        ? mBorderWidth[i]
        : mBorderWidth
      mStyle.borderColor = Array.isArray(mBorderColor)
        ? mBorderColor[i]
        : mBorderColor
      mStyle.borderRadius = Array.isArray(mBorderRadius)
        ? parseFloat(mBorderRadius[i]) + 'px'
        : parseFloat(mBorderRadius) + 'px'

      if (w.config.legend.markers.customHTML) {
        if (Array.isArray(w.config.legend.markers.customHTML)) {
          elMarker.innerHTML = w.config.legend.markers.customHTML[i]()
        } else {
          elMarker.innerHTML = w.config.legend.markers.customHTML()
        }
      }

      Graphics.setAttrs(elMarker, {
        rel: i + 1,
        'data:collapsed': collapsedSeries || ancillaryCollapsedSeries
      })

      if (collapsedSeries || ancillaryCollapsedSeries) {
        elMarker.classList.add('inactive-legend')
      }

      let elLegend = document.createElement('div')

      let elLegendText = document.createElement('span')
      elLegendText.classList.add('apexcharts-legend-text')
      elLegendText.innerHTML = text

      let textColor = w.config.legend.labels.useSeriesColors
        ? w.globals.colors[i]
        : w.config.legend.labels.colors

      if (!textColor) {
        textColor = w.config.chart.foreColor
      }

      elLegendText.style.color = textColor

      elLegendText.style.fontSize = parseFloat(w.config.legend.fontSize) + 'px'
      elLegendText.style.fontFamily = fontFamily || w.config.chart.fontFamily

      Graphics.setAttrs(elLegendText, {
        rel: i + 1,
        i: i,
        'data:default-text': encodeURIComponent(text),
        'data:collapsed': collapsedSeries || ancillaryCollapsedSeries
      })

      elLegend.appendChild(elMarker)
      elLegend.appendChild(elLegendText)

      const coreUtils = new CoreUtils(this.ctx)
      if (!w.config.legend.showForZeroSeries) {
        const total = coreUtils.getSeriesTotalByIndex(i)

        if (
          total === 0 &&
          coreUtils.seriesHaveSameValues(i) &&
          !coreUtils.isSeriesNull(i) &&
          w.globals.collapsedSeriesIndices.indexOf(i) === -1 &&
          w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1
        ) {
          elLegend.classList.add('apexcharts-hidden-zero-series')
        }
      }

      if (!w.config.legend.showForNullSeries) {
        if (
          coreUtils.isSeriesNull(i) &&
          w.globals.collapsedSeriesIndices.indexOf(i) === -1 &&
          w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1
        ) {
          elLegend.classList.add('apexcharts-hidden-null-series')
        }
      }

      w.globals.dom.elLegendWrap.appendChild(elLegend)
      w.globals.dom.elLegendWrap.classList.add(w.config.legend.horizontalAlign)
      // w.globals.dom.elLegendWrap.classList.add(w.config.legend.verticalAlign)
      w.globals.dom.elLegendWrap.classList.add(
        'position-' + w.config.legend.position
      )

      elLegend.classList.add('apexcharts-legend-series')
      elLegend.style.margin = `${w.config.legend.itemMargin.horizontal}px ${
        w.config.legend.itemMargin.vertical
      }px`
      w.globals.dom.elLegendWrap.style.width = w.config.legend.width
        ? w.config.legend.width + 'px'
        : ''
      w.globals.dom.elLegendWrap.style.height = w.config.legend.height
        ? w.config.legend.height + 'px'
        : ''

      Graphics.setAttrs(elLegend, {
        rel: i + 1,
        'data:collapsed': collapsedSeries || ancillaryCollapsedSeries
      })

      if (collapsedSeries || ancillaryCollapsedSeries) {
        elLegend.classList.add('inactive-legend')
      }

      if (!w.config.legend.onItemClick.toggleDataSeries) {
        elLegend.classList.add('no-click')
      }
    }

    // for now - just prevent click on heatmap legend - and allow hover only
    const clickAllowed =
      w.config.chart.type !== 'heatmap' && !this.isBarsDistributed

    if (clickAllowed && w.config.legend.onItemClick.toggleDataSeries) {
      w.globals.dom.elWrap.addEventListener('click', self.onLegendClick, true)
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

  getLegendBBox() {
    const w = this.w
    let currLegendsWrap = w.globals.dom.baseEl.querySelector(
      '.apexcharts-legend'
    )
    let currLegendsWrapRect = currLegendsWrap.getBoundingClientRect()

    let currLegendsWrapWidth = currLegendsWrapRect.width
    let currLegendsWrapHeight = currLegendsWrapRect.height

    return {
      clwh: currLegendsWrapHeight,
      clww: currLegendsWrapWidth
    }
  }

  setLegendWrapXY(offsetX, offsetY) {
    let w = this.w

    let elLegendWrap = w.globals.dom.baseEl.querySelector('.apexcharts-legend')

    const legendRect = elLegendWrap.getBoundingClientRect()

    let x = 0
    let y = 0

    if (w.config.legend.position === 'bottom') {
      y = y + (w.globals.svgHeight - legendRect.height / 2)
    } else if (w.config.legend.position === 'top') {
      const dim = new Dimensions(this.ctx)
      const titleH = dim.getTitleSubtitleCoords('title').height
      const subtitleH = dim.getTitleSubtitleCoords('subtitle').height

      y =
        y +
        (titleH > 0 ? titleH - 10 : 0) +
        (subtitleH > 0 ? subtitleH - 10 : 0)
    }

    elLegendWrap.style.position = 'absolute'

    x = x + offsetX + w.config.legend.offsetX
    y = y + offsetY + w.config.legend.offsetY

    elLegendWrap.style.left = x + 'px'
    elLegendWrap.style.top = y + 'px'

    if (w.config.legend.position === 'bottom') {
      elLegendWrap.style.top = 'auto'
      elLegendWrap.style.bottom = 10 + w.config.legend.offsetY + 'px'
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

  legendAlignHorizontal() {
    let w = this.w

    let elLegendWrap = w.globals.dom.baseEl.querySelector('.apexcharts-legend')

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
      offsetY =
        titleRect.height +
        subtitleRect.height +
        w.config.title.margin +
        w.config.subtitle.margin -
        15
    }

    this.setLegendWrapXY(offsetX, offsetY)
  }

  legendAlignVertical() {
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

  onLegendHovered(e) {
    const w = this.w

    const hoverOverLegend =
      e.target.classList.contains('apexcharts-legend-text') ||
      e.target.classList.contains('apexcharts-legend-marker')

    if (w.config.chart.type !== 'heatmap' && !this.isBarsDistributed) {
      if (!e.target.classList.contains('inactive-legend') && hoverOverLegend) {
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

  onLegendClick(e) {
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

      const markerClick = this.w.config.legend.markers.onClick
      if (
        typeof markerClick === 'function' &&
        e.target.classList.contains('apexcharts-legend-marker')
      ) {
        markerClick(this.ctx, seriesCnt, this.w)
        this.ctx.fireEvent('legendMarkerClick', [this.ctx, seriesCnt, this.w])
      }

      this.toggleDataSeries(seriesCnt, isHidden)
    }
  }

  toggleDataSeries(seriesCnt, isHidden) {
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
        this.riseCollapsedSeries(
          w.globals.collapsedSeries,
          w.globals.collapsedSeriesIndices,
          realIndex
        )
        this.riseCollapsedSeries(
          w.globals.ancillaryCollapsedSeries,
          w.globals.ancillaryCollapsedSeriesIndices,
          realIndex
        )
      } else {
        if (w.globals.axisCharts) {
          let shouldNotHideYAxis = false

          if (
            w.config.yaxis[realIndex] &&
            w.config.yaxis[realIndex].show &&
            w.config.yaxis[realIndex].showAlways
          ) {
            shouldNotHideYAxis = true
            if (
              w.globals.ancillaryCollapsedSeriesIndices.indexOf(realIndex) < 0
            ) {
              w.globals.ancillaryCollapsedSeries.push({
                index: realIndex,
                data: w.config.series[realIndex].data.slice(),
                type: seriesEl.parentNode.className.baseVal.split('-')[1]
              })
              w.globals.ancillaryCollapsedSeriesIndices.push(realIndex)
            }
          }

          if (!shouldNotHideYAxis) {
            w.globals.collapsedSeries.push({
              index: realIndex,
              data: w.config.series[realIndex].data.slice(),
              type: seriesEl.parentNode.className.baseVal.split('-')[1]
            })
            w.globals.collapsedSeriesIndices.push(realIndex)

            let removeIndexOfRising = w.globals.risingSeries.indexOf(realIndex)

            w.globals.risingSeries.splice(removeIndexOfRising, 1)
          }

          // TODO: AVOID mutating the user's config object below
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

        w.globals.allSeriesCollapsed =
          w.globals.collapsedSeries.length === w.globals.series.length

        this.ctx._updateSeries(
          w.config.series,
          w.config.chart.animations.dynamicAnimation.enabled
        )
      }
    } else {
      // for non-axis charts i.e pie / donuts
      let seriesEl = w.globals.dom.Paper.select(
        ` .apexcharts-series[rel='${seriesCnt + 1}'] path`
      )

      const type = w.config.chart.type
      if (type === 'pie' || type === 'donut') {
        let dataLabels = w.config.plotOptions.pie.donut.labels

        const graphics = new Graphics(this.ctx)
        const pie = new Pie(this.ctx)
        graphics.pathMouseDown(seriesEl.members[0], null)
        pie.printDataLabelsInner(seriesEl.members[0].node, dataLabels)
      }

      seriesEl.fire('click')
    }
  }

  riseCollapsedSeries(series, seriesIndices, realIndex) {
    const w = this.w

    if (series.length > 0) {
      for (let c = 0; c < series.length; c++) {
        if (series[c].index === realIndex) {
          if (w.globals.axisCharts) {
            w.config.series[realIndex].data = series[c].data.slice()
            series.splice(c, 1)
            seriesIndices.splice(c, 1)
            w.globals.risingSeries.push(realIndex)
          } else {
            w.config.series[realIndex] = series[c].data
            series.splice(c, 1)
            seriesIndices.splice(c, 1)
            w.globals.risingSeries.push(realIndex)
          }
          this.ctx._updateSeries(
            w.config.series,
            w.config.chart.animations.dynamicAnimation.enabled
          )
        }
      }
    }
  }
}

export default Legend
