import Graphics from '../Graphics'
import AxesUtils from './AxesUtils'

/**
 * ApexCharts XAxis Class for drawing X-Axis.
 *
 * @module XAxis
 **/

export default class XAxis {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    const w = this.w
    this.xaxisLabels = w.globals.labels.slice()
    if (w.globals.timescaleLabels.length > 0 && !w.globals.isBarHorizontal) {
      //  timeline labels are there and chart is not rangeabr timeline
      this.xaxisLabels = w.globals.timescaleLabels.slice()
    }

    this.drawnLabels = []

    if (w.config.xaxis.position === 'top') {
      this.offY = 0
    } else {
      this.offY = w.globals.gridHeight + 1
    }
    this.offY = this.offY + w.config.xaxis.axisBorder.offsetY
    this.isCategoryBarHorizontal =
      w.config.chart.type === 'bar' && w.config.plotOptions.bar.horizontal

    this.xaxisFontSize = w.config.xaxis.labels.style.fontSize
    this.xaxisFontFamily = w.config.xaxis.labels.style.fontFamily
    this.xaxisForeColors = w.config.xaxis.labels.style.colors
    this.xaxisBorderWidth = w.config.xaxis.axisBorder.width
    if (this.isCategoryBarHorizontal) {
      this.xaxisBorderWidth = w.config.yaxis[0].axisBorder.width.toString()
    }

    if (this.xaxisBorderWidth.indexOf('%') > -1) {
      this.xaxisBorderWidth =
        (w.globals.gridWidth * parseInt(this.xaxisBorderWidth, 10)) / 100
    } else {
      this.xaxisBorderWidth = parseInt(this.xaxisBorderWidth, 10)
    }
    this.xaxisBorderHeight = w.config.xaxis.axisBorder.height

    // For bars, we will only consider single y xais,
    // as we are not providing multiple yaxis for bar charts
    this.yaxis = w.config.yaxis[0]
    this.axesUtils = new AxesUtils(ctx)
  }

  drawXaxis() {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elXaxis = graphics.group({
      class: 'apexcharts-xaxis',
      transform: `translate(${w.config.xaxis.offsetX}, ${w.config.xaxis.offsetY})`
    })

    let elXaxisTexts = graphics.group({
      class: 'apexcharts-xaxis-texts-g',
      transform: `translate(${w.globals.translateXAxisX}, ${w.globals.translateXAxisY})`
    })

    elXaxis.add(elXaxisTexts)

    let colWidth

    // initial x Position (keep adding column width in the loop)
    let xPos = w.globals.padHorizontal
    let labels = []

    for (let i = 0; i < this.xaxisLabels.length; i++) {
      labels.push(this.xaxisLabels[i])
    }

    if (w.globals.isXNumeric) {
      colWidth = w.globals.gridWidth / (labels.length - 1)
      xPos = xPos + colWidth / 2 + w.config.xaxis.labels.offsetX
    } else {
      colWidth = w.globals.gridWidth / labels.length
      xPos = xPos + colWidth + w.config.xaxis.labels.offsetX
    }

    let labelsLen = labels.length

    if (w.config.xaxis.labels.show) {
      for (let i = 0; i <= labelsLen - 1; i++) {
        let x = xPos - colWidth / 2 + w.config.xaxis.labels.offsetX

        let label = this.axesUtils.getLabel(
          labels,
          w.globals.timescaleLabels,
          x,
          i,
          this.drawnLabels
        )
        // const textRect = graphics.getTextRects(label.text)

        this.drawnLabels.push(label.text)

        let offsetYCorrection = 28
        if (w.globals.rotateXLabels) {
          offsetYCorrection = 22
        }
        let elTick = graphics.drawText({
          x: label.x,
          y: this.offY + w.config.xaxis.labels.offsetY + offsetYCorrection,
          text: '',
          textAnchor: 'middle',
          fontWeight: label.isBold ? 600 : 400,
          fontSize: this.xaxisFontSize,
          fontFamily: this.xaxisFontFamily,
          foreColor: Array.isArray(this.xaxisForeColors)
            ? this.xaxisForeColors[i]
            : this.xaxisForeColors,
          cssClass:
            'apexcharts-xaxis-label ' + w.config.xaxis.labels.style.cssClass
        })

        if (i === 0) {
          // check if first label is being cropped
          const firstTextRect = graphics.getTextRects(label.text)

          const divideBy =
            w.globals.rotateXLabels || w.config.xaxis.labels.rotateAlways
              ? 1
              : 2

          if (
            w.globals.skipFirstTimelinelabel ||
            (label.x + firstTextRect.width / divideBy >
              w.globals.dom.elGraphical.x() &&
              label.x <= 0)
          ) {
            label.text = ''
          }
        }

        if (i === labelsLen - 1) {
          // check if last label is being cropped

          const lastTextRect = graphics.getTextRects(label.text)

          if (
            w.globals.skipLastTimelinelabel ||
            lastTextRect.width / 2 + label.x >
              w.globals.gridWidth + w.globals.x2SpaceAvailable ||
            label.x > w.globals.gridWidth
          ) {
            label.text = ''
          }
        }

        elXaxisTexts.add(elTick)

        graphics.addTspan(elTick, label.text, this.xaxisFontFamily)

        let elTooltipTitle = document.createElementNS(w.globals.SVGNS, 'title')
        elTooltipTitle.textContent = label.text
        elTick.node.appendChild(elTooltipTitle)

        xPos = xPos + colWidth
      }
    }

    if (w.config.xaxis.title.text !== undefined) {
      let elXaxisTitle = graphics.group({
        class: 'apexcharts-xaxis-title'
      })

      let elXAxisTitleText = graphics.drawText({
        x: w.globals.gridWidth / 2 + w.config.xaxis.title.offsetX,
        y:
          this.offY -
          parseFloat(this.xaxisFontSize) +
          w.globals.xAxisLabelsHeight +
          w.config.xaxis.title.offsetY,
        text: w.config.xaxis.title.text,
        textAnchor: 'middle',
        fontSize: w.config.xaxis.title.style.fontSize,
        fontFamily: w.config.xaxis.title.style.fontFamily,
        foreColor: w.config.xaxis.title.style.color,
        cssClass:
          'apexcharts-xaxis-title-text ' + w.config.xaxis.title.style.cssClass
      })

      elXaxisTitle.add(elXAxisTitleText)

      elXaxis.add(elXaxisTitle)
    }

    if (w.config.xaxis.axisBorder.show) {
      let lineCorrection = 0
      if (w.config.chart.type === 'bar' && w.globals.isXNumeric) {
        lineCorrection = lineCorrection - 15
      }
      let elHorzLine = graphics.drawLine(
        w.globals.padHorizontal +
          lineCorrection +
          w.config.xaxis.axisBorder.offsetX,
        this.offY,
        this.xaxisBorderWidth,
        this.offY,
        w.config.xaxis.axisBorder.color,
        0,
        this.xaxisBorderHeight
      )

      elXaxis.add(elHorzLine)
    }

    return elXaxis
  }

  // this actually becomes the vertical axis (for bar charts)
  drawXaxisInversed(realIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let translateYAxisX = w.config.yaxis[0].opposite
      ? w.globals.translateYAxisX[realIndex]
      : 0

    let elYaxis = graphics.group({
      class: 'apexcharts-yaxis apexcharts-xaxis-inversed',
      rel: realIndex
    })

    let elYaxisTexts = graphics.group({
      class: 'apexcharts-yaxis-texts-g apexcharts-xaxis-inversed-texts-g',
      transform: 'translate(' + translateYAxisX + ', 0)'
    })

    elYaxis.add(elYaxisTexts)

    let colHeight

    // initial x Position (keep adding column width in the loop)
    let yPos
    let labels = []

    if (w.config.yaxis[realIndex].show) {
      for (let i = 0; i < this.xaxisLabels.length; i++) {
        labels.push(this.xaxisLabels[i])
      }
    }

    colHeight = w.globals.gridHeight / labels.length
    yPos = -(colHeight / 2.2)

    let lbFormatter = w.globals.yLabelFormatters[0]

    const ylabels = w.config.yaxis[0].labels

    if (ylabels.show) {
      for (let i = 0; i <= labels.length - 1; i++) {
        let label = typeof labels[i] === 'undefined' ? '' : labels[i]

        label = lbFormatter(label, {
          seriesIndex: realIndex,
          dataPointIndex: i,
          w
        })

        let elLabel = graphics.drawText({
          x: ylabels.offsetX - 15,
          y: yPos + colHeight + ylabels.offsetY,
          text: label,
          textAnchor: this.yaxis.opposite ? 'start' : 'end',
          foreColor: ylabels.style.color
            ? ylabels.style.color
            : ylabels.style.colors[i],
          fontSize: ylabels.style.fontSize,
          fontFamily: ylabels.style.fontFamily,
          cssClass: 'apexcharts-yaxis-label ' + ylabels.style.cssClass
        })

        elYaxisTexts.add(elLabel)

        if (w.config.yaxis[realIndex].labels.rotate !== 0) {
          let labelRotatingCenter = graphics.rotateAroundCenter(elLabel.node)
          elLabel.node.setAttribute(
            'transform',
            `rotate(${w.config.yaxis[realIndex].labels.rotate} 0 ${labelRotatingCenter.y})`
          )
        }
        yPos = yPos + colHeight
      }
    }

    if (w.config.yaxis[0].title.text !== undefined) {
      let elXaxisTitle = graphics.group({
        class: 'apexcharts-yaxis-title apexcharts-xaxis-title-inversed',
        transform: 'translate(' + translateYAxisX + ', 0)'
      })

      let elXAxisTitleText = graphics.drawText({
        x: 0,
        y: w.globals.gridHeight / 2,
        text: w.config.yaxis[0].title.text,
        textAnchor: 'middle',
        foreColor: w.config.yaxis[0].title.style.color,
        fontSize: w.config.yaxis[0].title.style.fontSize,
        fontFamily: w.config.yaxis[0].title.style.fontFamily,
        cssClass:
          'apexcharts-yaxis-title-text ' +
          w.config.yaxis[0].title.style.cssClass
      })

      elXaxisTitle.add(elXAxisTitleText)

      elYaxis.add(elXaxisTitle)
    }

    let offX = 0
    if (this.isCategoryBarHorizontal && w.config.yaxis[0].opposite) {
      offX = w.globals.gridWidth
    }
    const axisBorder = w.config.xaxis.axisBorder
    if (axisBorder.show) {
      let elVerticalLine = graphics.drawLine(
        w.globals.padHorizontal + axisBorder.offsetX + offX,
        1 + axisBorder.offsetY,
        w.globals.padHorizontal + axisBorder.offsetX + offX,
        w.globals.gridHeight + axisBorder.offsetY,
        axisBorder.color,
        0,
        axisBorder.width
      )

      elYaxis.add(elVerticalLine)
    }

    if (w.config.yaxis[0].axisTicks.show) {
      this.axesUtils.drawYAxisTicks(
        offX,
        labels.length,
        w.config.yaxis[0].axisBorder,
        w.config.yaxis[0].axisTicks,
        0,
        colHeight,
        elYaxis
      )
    }

    return elYaxis
  }

  drawXaxisTicks(x1, appendToElement) {
    let w = this.w
    let x2 = x1

    if (x1 < 0 || x1 - 2 > w.globals.gridWidth) return

    let y1 = this.offY + w.config.xaxis.axisTicks.offsetY
    let y2 = y1 + w.config.xaxis.axisTicks.height

    if (w.config.xaxis.axisTicks.show) {
      let graphics = new Graphics(this.ctx)

      let line = graphics.drawLine(
        x1 + w.config.xaxis.axisTicks.offsetX,
        y1 + w.config.xaxis.offsetY,
        x2 + w.config.xaxis.axisTicks.offsetX,
        y2 + w.config.xaxis.offsetY,
        w.config.xaxis.axisTicks.color
      )

      // we are not returning anything, but appending directly to the element pased in param
      appendToElement.add(line)
      line.node.classList.add('apexcharts-xaxis-tick')
    }
  }

  getXAxisTicksPositions() {
    const w = this.w
    let xAxisTicksPositions = []

    const xCount = this.xaxisLabels.length
    let x1 = w.globals.padHorizontal

    if (w.globals.timescaleLabels.length > 0) {
      for (let i = 0; i < xCount; i++) {
        x1 = this.xaxisLabels[i].position
        xAxisTicksPositions.push(x1)
      }
    } else {
      let xCountForCategoryCharts = xCount
      for (let i = 0; i < xCountForCategoryCharts; i++) {
        let x1Count = xCountForCategoryCharts
        if (w.globals.isXNumeric && w.config.chart.type !== 'bar') {
          x1Count -= 1
        }
        x1 = x1 + w.globals.gridWidth / x1Count
        xAxisTicksPositions.push(x1)
      }
    }

    return xAxisTicksPositions
  }

  // to rotate x-axis labels or to put ... for longer text in xaxis
  xAxisLabelCorrections() {
    let w = this.w

    let graphics = new Graphics(this.ctx)

    let xAxis = w.globals.dom.baseEl.querySelector('.apexcharts-xaxis-texts-g')

    let xAxisTexts = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-xaxis-texts-g text'
    )
    let yAxisTextsInversed = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-yaxis-inversed text'
    )
    let xAxisTextsInversed = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-xaxis-inversed-texts-g text'
    )

    if (w.globals.rotateXLabels || w.config.xaxis.labels.rotateAlways) {
      for (let xat = 0; xat < xAxisTexts.length; xat++) {
        let textRotatingCenter = graphics.rotateAroundCenter(xAxisTexts[xat])
        textRotatingCenter.y = textRotatingCenter.y - 1 // + tickWidth/4;
        textRotatingCenter.x = textRotatingCenter.x + 1

        xAxisTexts[xat].setAttribute(
          'transform',
          `rotate(${w.config.xaxis.labels.rotate} ${textRotatingCenter.x} ${textRotatingCenter.y})`
        )

        xAxisTexts[xat].setAttribute('text-anchor', `end`)

        let offsetHeight = 10

        xAxis.setAttribute('transform', `translate(0, ${-offsetHeight})`)

        let tSpan = xAxisTexts[xat].childNodes

        if (w.config.xaxis.labels.trim) {
          graphics.placeTextWithEllipsis(
            tSpan[0],
            tSpan[0].textContent,
            w.config.xaxis.labels.maxHeight -
              (w.config.legend.position === 'bottom' ? 20 : 10)
          )
        }
      }
    } else {
      let width = w.globals.gridWidth / (w.globals.labels.length + 1)

      for (let xat = 0; xat < xAxisTexts.length; xat++) {
        let tSpan = xAxisTexts[xat].childNodes

        if (w.config.xaxis.labels.trim && w.config.xaxis.type !== 'datetime') {
          graphics.placeTextWithEllipsis(tSpan[0], tSpan[0].textContent, width)
        }
      }
    }

    if (yAxisTextsInversed.length > 0) {
      // truncate rotated y axis in bar chart (x axis)
      let firstLabelPosX = yAxisTextsInversed[
        yAxisTextsInversed.length - 1
      ].getBBox()
      let lastLabelPosX = yAxisTextsInversed[0].getBBox()

      if (firstLabelPosX.x < -20) {
        yAxisTextsInversed[
          yAxisTextsInversed.length - 1
        ].parentNode.removeChild(
          yAxisTextsInversed[yAxisTextsInversed.length - 1]
        )
      }

      if (
        lastLabelPosX.x + lastLabelPosX.width > w.globals.gridWidth &&
        !w.globals.isBarHorizontal
      ) {
        yAxisTextsInversed[0].parentNode.removeChild(yAxisTextsInversed[0])
      }

      // truncate rotated x axis in bar chart (y axis)
      for (let xat = 0; xat < xAxisTextsInversed.length; xat++) {
        graphics.placeTextWithEllipsis(
          xAxisTextsInversed[xat],
          xAxisTextsInversed[xat].textContent,
          w.config.yaxis[0].labels.maxWidth -
            parseFloat(w.config.yaxis[0].title.style.fontSize) * 2 -
            20
        )
      }
    }
  }

  // renderXAxisBands() {
  //   let w = this.w;

  //   let plotBand = document.createElementNS(w.globals.SVGNS, 'rect')
  //   w.globals.dom.elGraphical.add(plotBand)
  // }
}
