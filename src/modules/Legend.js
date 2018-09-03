import Dimensions from './Dimensions'
import Graphics from './Graphics'
import Series from './Series'

/**
 * ApexCharts Legend Class to draw legend.
 *
 * @module Legend
 **/

class Legend {
  constructor (ctx, opts) {
    this.ctx = ctx
    this.w = ctx.w
    this.existingWidth = 0
    this.existingHeight = 0
    this.rowHeight = 20
    this.maxTextWidth = 0
    this.padding = 0
    this.noOfLegendColumns = 1
    this.textMaxWidthArr = []

    this.legendsArray = []

    this.onLegendClick = this.onLegendClick.bind(this)
    this.onLegendHovered = this.onLegendHovered.bind(this)
  }

  init () {
    const w = this.w

    const gl = w.globals
    const cnf = w.config

    if ((gl.series.length > 1 || !gl.axisCharts) && cnf.legend.show) {
      while (gl.dom.elLegendWrap.firstChild) {
        gl.dom.elLegendWrap.removeChild(gl.dom.elLegendWrap.firstChild)
      }

      this.drawLegends(cnf.chart.type, gl.series.length)

      if (cnf.legend.position === 'bottom' || cnf.legend.position === 'top') {
        this.legendAlignCenterHorz()
      } else if (
        cnf.legend.position === 'right' ||
        cnf.legend.position === 'left'
      ) {
        this.legendAlignVertical()
      }
    }
  }

  drawLegends (type, seriesLength) {
    let self = this
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let pSize = w.config.legend.markers.size
    let fontSize = w.config.legend.fontSize

    let marginHorz = w.config.legend.itemMargin.horizontal
    let marginVert = w.config.legend.itemMargin.vertical

    this.padding = pSize + w.config.legend.markers.strokeWidth
    let padding = this.padding

    // To get text's actual rect before it is rendered.
    // We append this text to some place and then we will delete this text after we are done
    let totalWidth = 0
    let currentRow = 1
    let currentCol = 0
    let legendNames = w.globals.seriesNames
    let fillcolor = w.globals.colors.slice()

    if (w.config.chart.type === 'heatmap') {
      const ranges = w.config.plotOptions.heatmap.colorScale.ranges
      legendNames = ranges.map((colorScale, index) => {
        return colorScale.name ? colorScale.name : colorScale.from + ' - ' + colorScale.to
      })
      fillcolor = ranges.map((color, index) => {
        return color.color
      })
    }
    let legendFormatter = w.globals.legendFormatter

    let virtualText

    for (let i = 0; i <= legendNames.length - 1; i++) {
      let horizontal =
        !!((w.config.legend.position === 'top' ||
        w.config.legend.position === 'bottom'))

      let y = 0
      let x = 0

      let width

      let text = legendFormatter(legendNames[i], { globals: w.globals, seriesIndex: i })

      let collapsedSeries = false
      if (w.globals.collapsedSeries.length > 0) {
        for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
          if (w.globals.collapsedSeries[c].index === i) {
            collapsedSeries = true
          }
        }
      }

      if (horizontal) {
        virtualText = graphics.drawText({
          x: this.existingWidth,
          y: 0,
          foreColor: 'transparent',
          opacity: 0,
          text,
          cssClass: 'apexcharts-virtual-text',
          fontSize
        })

        w.globals.dom.Paper.add(virtualText)
        let rect = virtualText.bbox()

        width = rect.width

        this.rowHeight = rect.height + marginVert

        x = this.existingWidth + padding + marginHorz

        if (
          this.existingWidth + width + padding + marginHorz >
          w.globals.svgWidth
        ) {
          currentRow = currentRow + 1

          this.existingWidth = 0
          x = this.existingWidth + padding + marginHorz
        }

        if (w.config.legend.position === 'bottom') {
          y = w.globals.svgHeight - this.rowHeight
        } else if (w.config.legend.position === 'top') {
          y = 0
        }

        y = y + this.rowHeight * currentRow
      } else {
        virtualText = graphics.drawText({
          x: 0,
          y: this.existingHeight,
          foreColor: 'transparent',
          opacity: 0,
          text,
          textAnchor: 'start',
          cssClass: 'apexcharts-virtual-text',
          fontSize
        })

        w.globals.dom.Paper.add(virtualText)

        let rect = virtualText.bbox()

        let height = rect.height
        this.rowHeight = height + marginVert

        this.textMaxWidthArr.push(rect.width)

        let width = this.getTextMaxWidth() + marginHorz

        currentRow = i + 1

        if (this.existingHeight + height + padding > w.globals.svgHeight) {
          currentCol = currentCol + 1

          this.existingHeight = 0
        }

        x = padding + currentCol * width
        y = this.existingHeight + height
      }

      // we are done with virtual texts, remove it
      virtualText.node.parentNode.removeChild(virtualText.node)

      let elPointOptions = {
        pSize: pSize,
        pRadius: w.config.legend.markers.radius,
        pWidth: w.config.legend.markers.strokeWidth,
        shape: w.config.legend.markers.shape,
        pointStrokeColor: w.config.legend.markers.strokeColor,
        pointFillColor: fillcolor[i],
        pointStrokeOpacity: 1,
        pointFillOpacity: 1,
        class: 'apexcharts-legend-point'
      }

      let offsetYPt = (pSize / 2) - 1 + w.config.legend.markers.strokeWidth

      let elColor = graphics.drawMarker(
        x - padding + w.config.legend.markers.offsetX - 4,
        y - padding + offsetYPt + w.config.legend.markers.offsetY - 1,
        elPointOptions
      ).attr({
        'rel': i + 1,
        'data:collapsed': collapsedSeries
      })

      if (collapsedSeries) {
        elColor.node.classList.add('inactive-legend')
      }

      let elTextOpts = {
        x: x,
        y: y,
        foreColor: w.config.legend.useSeriesColors ? w.globals.colors[i] : w.config.legend.labels.color,
        text,
        textAnchor: w.config.legend.textAnchor,
        fontSize: fontSize,
        cssClass: 'apexcharts-legend-text'
      }

      this.existingWidth = this.existingWidth + width + marginHorz + padding + 5
      this.existingHeight = this.existingHeight + this.rowHeight + padding / 4
      totalWidth = totalWidth + width + padding + marginHorz

      let elLegend = graphics.drawText(elTextOpts)

      w.globals.dom.elLegendWrap.add(elLegend)
      w.globals.dom.elLegendWrap.add(elColor)
      elLegend.node.classList.add('apexcharts-legend-series')
      elLegend.attr({
        'rel': i + 1,
        'data:collapsed': collapsedSeries
      })

      if (collapsedSeries) {
        elLegend.node.classList.add('inactive-legend')
      }

      if (!w.config.legend.onItemClick.toggleDataSeries) {
        elLegend.node.classList.add('no-click')
      }
    }

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

  getTextMaxWidth () {
    let largestWidth = 0
    for (let i = 0; i < this.textMaxWidthArr.length; i++) {
      largestWidth = Math.max(largestWidth, this.textMaxWidthArr[i])
    }
    this.maxTextWidth = largestWidth
    return largestWidth
  }

  getLegendBBox () {
    const w = this.w

    let currLegendsWrapRect = w.globals.dom.baseEl.querySelector('.apexcharts-legend')
      .getBBox()
    let currLegendsWrapWidth = currLegendsWrapRect.width
    let currLegendsWrapHeight = currLegendsWrapRect.height

    return {
      clwh: currLegendsWrapHeight,
      clww: currLegendsWrapWidth
    }
  }

  translateLegendPoints (offsetX, offsetY = null) {
    const w = this.w

    let points = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-legend-point'
    )

    for (let lp = 0; lp < points.length; lp++) {
      if (offsetY === null) {
        let y = points[lp].getAttribute('transform')
        if (y.indexOf(',') > -1) {
          offsetY = parseFloat(y.split(',')[1])
        } else if (y.indexOf(' ') > -1) {
          offsetY = parseFloat(y.split(' ')[1])
        }
        if (!offsetY) { offsetY = 0 }
      }
      points[lp].setAttribute(
        'transform',
        'translate(' + offsetX + ',' + offsetY + ')'
      )
    }
  }

  setLegendXY (offsetX, offsetY) {
    let w = this.w

    let legends = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-legend-series'
    )

    for (let l = 0; l < legends.length; l++) {
      let currX = parseInt(legends[l].getAttribute('x'))
      let currY = parseInt(legends[l].getAttribute('y'))

      Graphics.setAttrs(legends[l], {
        x: currX + offsetX,
        y: currY + offsetY
      })
    }

    this.setLegendWrapXY()
  }

  setLegendWrapXY () {
    let w = this.w

    let elLegendWrap = w.globals.dom.baseEl.querySelector(
      '.apexcharts-legend'
    )

    const legendRect = elLegendWrap.getBBox()
    const legendTopPlusHeight = legendRect.y + legendRect.height

    let x = w.config.legend.containerMargin.left - w.config.legend.containerMargin.right
    let y = w.config.legend.containerMargin.top - w.config.legend.markers.size - 3

    if (w.config.legend.position === 'bottom') {
      if (w.globals.dataXY && w.config.chart.scroller.enabled) {
        y = y - w.config.chart.scroller.height + 1
      }

      if (legendTopPlusHeight - 10 > w.globals.svgHeight) {
        y = y - (w.globals.svgHeight - legendRect.y + legendRect.height) / 8
      }
    }

    if (w.config.legend.position === 'top') {
      const dim = new Dimensions(this.ctx)
      const titleH = dim.getMainTitleCoords().height
      const subtitleH = dim.getSubTitleCoords().height

      y = y + (titleH > 0 ? titleH - 10 : 0) + (subtitleH > 0 ? subtitleH - 10 : 0)
    }

    if (w.config.legend.position === 'right' || w.config.legend.position === 'left') {
      if (y < w.config.legend.markers.size) y = w.config.legend.markers.size
    }

    console.log(y)

    elLegendWrap.setAttribute('transform', `translate(${x}, ${y})`)
  }

  legendAlignCenterHorz () {
    let w = this.w

    let lRect = this.getLegendBBox()

    let dimensions = new Dimensions(this.ctx)
    let titleRect = dimensions.getMainTitleCoords()
    let subtitleRect = dimensions.getSubTitleCoords()

    let offsetX = 20
    let offsetY = 0

    if (w.config.legend.horizontalAlign === 'right') {
      offsetX = w.globals.svgWidth - lRect.clww - offsetX
    } else if (w.config.legend.horizontalAlign === 'center') {
      offsetX = (w.globals.svgWidth - lRect.clww) / 2
    }

    // the whole legend box is set to bottom
    if (w.config.legend.position === 'bottom') {
      offsetY = -lRect.clwh / 1.8
    } else if (w.config.legend.position === 'top') {
      offsetY = titleRect.height + subtitleRect.height + w.config.title.margin + w.config.subtitle.margin - 15
    }

    offsetX = offsetX + w.config.legend.offsetX
    offsetY = offsetY + w.config.legend.offsetY

    this.setLegendXY(offsetX, offsetY)
    this.translateLegendPoints(offsetX, offsetY)
  }

  legendAlignVertical () {
    let w = this.w

    let lRect = this.getLegendBBox()

    let offsetCorrection = lRect.clwh + this.rowHeight * 1.2 <
      w.globals.svgHeight
      ? this.rowHeight
      : this.rowHeight / 2
    let offsetY = 20
    let offsetX = 0

    if (w.config.legend.position === 'left') {
      offsetX = w.config.legend.markers.size + 10
    }

    if (w.config.legend.verticalAlign === 'bottom') {
      offsetY = w.globals.svgHeight - lRect.clwh - offsetY
    } else if (w.config.legend.verticalAlign === 'middle') {
      offsetY = (w.globals.svgHeight - lRect.clwh) / 2 - offsetCorrection
    }

    offsetX = offsetX + w.config.legend.offsetX
    offsetY = offsetY + w.config.legend.offsetY

    this.setLegendXY(offsetX, offsetY)
    this.translateLegendPoints(offsetX, offsetY)

    if (w.config.legend.position === 'right') {
      this.moveLegendsToRight()
    }
  }

  moveLegendsToRight () {
    let w = this.w
    let lRect = this.getLegendBBox()

    let offsetX = w.globals.svgWidth - lRect.clww - this.padding / 2

    this.setLegendXY(offsetX, 0)
    this.translateLegendPoints(offsetX + w.config.legend.offsetX, null)
  }

  onLegendHovered (e) {
    const w = this.w

    const hoverOverLegend = (e.target.classList.contains('apexcharts-legend-text') ||
      e.target.classList.contains('apexcharts-legend-point'))

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
        let series = new Series(this.ctx)
        series.highlightRangeInSeries(e, e.target)
      }
    }
  }

  onLegendClick (e) {
    let w = this.w
    let me = this
    if (
      e.target.classList.contains('apexcharts-legend-text') ||
      e.target.classList.contains('apexcharts-legend-point')
    ) {
      let seriesCnt = parseInt(e.target.getAttribute('rel')) - 1

      if (w.globals.axisCharts || w.config.chart.type === 'radialBar') {
        w.globals.resized = true // we don't want initial animations again

        let seriesEl = null

        let isHidden = e.target.getAttribute('data:collapsed')

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

        if (isHidden === 'true') {
          if (w.globals.collapsedSeries.length > 0) {
            for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
              if (w.globals.collapsedSeries[c].index === realIndex) {
                if (w.globals.axisCharts) {
                  w.config.series[realIndex].data = w.globals.collapsedSeries[c].data.slice()
                  w.globals.collapsedSeries.splice(c, 1)
                  w.globals.risingSeries.push(realIndex)
                } else {
                  w.config.series[realIndex] = w.globals.collapsedSeries[c].data
                  w.globals.collapsedSeries.splice(c, 1)
                  w.globals.risingSeries.push(realIndex)
                }
                me.ctx.updateSeriesInternal(w.config.series, w.globals.initialConfig.chart.animations.dynamicAnimation.enabled)
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

            let removeIndexOfRising = w.globals.risingSeries.indexOf(realIndex)

            w.globals.risingSeries.splice(removeIndexOfRising, 1)

            // mutating the user's config object here
            w.config.series[realIndex].data = []
          } else {
            w.globals.collapsedSeries.push({
              index: realIndex,
              data: w.config.series[realIndex]
            })
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

          me.ctx.updateSeriesInternal(w.config.series, w.globals.initialConfig.chart.animations.dynamicAnimation.enabled)
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
}

export default Legend
