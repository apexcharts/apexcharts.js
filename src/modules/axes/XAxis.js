import Graphics from '../Graphics'
import YAxis from './YAxis'
import Formatters from '../Formatters'

/**
 * ApexCharts XAxis Class for drawing X-Axis.
 *
 * @module XAxis
 **/

class XAxis {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    const w = this.w
    this.xaxisLabels = w.globals.labels.slice()
    if (w.globals.timelineLabels.length > 0) {
      //  timeline labels are there
      this.xaxisLabels = w.globals.timelineLabels.slice()
    }
    if (w.config.xaxis.position === 'top') {
      this.offY = 0
    } else {
      this.offY = w.globals.gridHeight + 1
    }

    this.xaxisFontSize = w.config.xaxis.labels.style.fontSize
    this.xaxisForeColors = w.config.xaxis.labels.style.colors

    // For bars, we will only consider single y xais,
    // as we are not providing multiple yaxis for bar charts
    this.yaxis = w.config.yaxis[0]
  }

  drawXaxis () {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elXaxis = graphics.group({
      'class': 'apexcharts-xaxis'
    })

    let elXaxisTexts = graphics.group({
      'class': 'apexcharts-xaxis-texts-g',
      'transform':
      `translate(${w.globals.translateXAxisX}, ${w.globals.translateXAxisY})`
    })

    elXaxis.add(elXaxisTexts)

    let colWidth

    // initial x Position (keep adding column width in the loop)
    let xPos = w.globals.padHorizontal
    let labels = []

    for (let i = 0; i < this.xaxisLabels.length; i++) {
      labels.push(this.xaxisLabels[i])
    }

    if (
      w.config.chart.type === 'line' ||
      w.config.chart.type === 'area'
    ) {
      if (w.globals.dataXY) {
        colWidth = w.globals.gridWidth / (labels.length - 1)
        xPos = xPos + colWidth / 2 + w.config.xaxis.labels.offsetX
      } else {
        // no dataXY, only y values values and labels not provided
        if (w.globals.noLabelsProvided) {
          colWidth = w.globals.gridWidth / this.xaxisLabels.length
        } else {
          // labels provided
          colWidth = w.globals.gridWidth / labels.length
        }
        xPos = xPos + colWidth + w.config.xaxis.labels.offsetX
      }
    } else {
      if (w.globals.dataXY) {
        if (w.config.chart.type !== 'bar') {
          colWidth = w.globals.gridWidth / (this.xaxisLabels.length - 1)
          xPos = xPos + colWidth / 2 + w.config.xaxis.labels.offsetX
        } else {
          colWidth = w.globals.gridWidth / w.globals.labels.length
          xPos = xPos + colWidth / 2 + w.config.xaxis.labels.offsetX
        }
      } else {
        if (w.globals.noLabelsProvided && w.config.chart.type !== 'bar') {
          colWidth = w.globals.gridWidth / this.xaxisLabels.length
          xPos = xPos + colWidth / 2 + w.config.xaxis.labels.offsetX
        } else {
          colWidth = w.globals.gridWidth / labels.length
          xPos = xPos + colWidth + w.config.xaxis.labels.offsetX
        }
      }
    }

    let xlbFormatter = w.globals.xLabelFormatter

    let labelsLen = labels.length

    if (w.config.xaxis.labels.show) {
      for (let i = 0; i <= labelsLen - 1; i++) {
        let label = typeof labels[i] === 'undefined' ? '' : labels[i]

        let xFormat = new Formatters(this.ctx)
        label = xFormat.xLabelFormat(xlbFormatter, label)

        let x = xPos - colWidth / 2 + w.config.xaxis.labels.offsetX
        if (w.globals.timelineLabels.length > 0) {
          x = w.globals.timelineLabels[i].position
          label = w.globals.timelineLabels[i].value
        }

        let offsetYCorrection = 28
        if (w.globals.rotateXLabels) {
          offsetYCorrection = 22
        }
        let elTick = graphics.drawText({
          x: x,
          y: this.offY + w.config.xaxis.labels.offsetY + offsetYCorrection,
          text: '',
          textAnchor: 'middle',
          fontSize: this.xaxisFontSize,
          foreColor: this.xaxisForeColors[i],
          cssClass: 'apexcharts-xaxis-label ' + w.config.xaxis.labels.style.cssClass
        })

        elXaxisTexts.add(elTick)

        let elTooltipTitle = document.createElementNS(w.globals.svgNS, 'title')
        elTooltipTitle.innerHTML = label
        elTick.node.appendChild(elTooltipTitle)

        let elText = document.createElementNS(w.globals.svgNS, 'tspan')
        elText.innerHTML = label
        elTick.node.appendChild(elText)

        xPos = xPos + colWidth
      }
    }

    if (w.config.xaxis.title.text !== undefined) {
      let elXaxisTitle = graphics.group({
        class: 'apexcharts-xaxis-title'
      })

      let elXAxisTitleText = graphics.drawText({
        x: (w.globals.gridWidth / 2) + w.config.xaxis.title.offsetX,
        y: this.offY -
          parseInt(this.xaxisFontSize) +
          w.globals.xAxisLabelsHeight + w.config.xaxis.title.offsetY,
        text: w.config.xaxis.title.text,
        textAnchor: 'middle',
        fontSize: w.config.xaxis.title.style.fontSize,
        foreColor: w.config.xaxis.title.style.color,
        cssClass: 'apexcharts-xaxis-title-text ' + w.config.xaxis.title.style.cssClass
      })

      elXaxisTitle.add(elXAxisTitleText)

      elXaxis.add(elXaxisTitle)
    }

    if (w.config.xaxis.axisBorder.show) {
      let lineCorrection = 0
      if (w.config.chart.type === 'bar' && w.globals.dataXY) {
        lineCorrection = lineCorrection - 15
      }
      let elHorzLine = graphics.drawLine(
        w.globals.padHorizontal + lineCorrection + w.config.xaxis.axisBorder.offsetX,
        this.offY,
        w.globals.gridWidth,
        this.offY,
        w.config.xaxis.axisBorder.color
      )

      elXaxis.add(elHorzLine)
    }

    return elXaxis
  }

  // this actually becomes the vertical axis (for bar charts)
  drawXaxisInversed (realIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elYaxis = graphics.group({
      class: 'apexcharts-yaxis apexcharts-xaxis-inversed',
      'rel': realIndex
    })

    let elYaxisTexts = graphics.group({
      class: 'apexcharts-yaxis-texts-g apexcharts-xaxis-inversed-texts-g'
    })

    elYaxis.add(elYaxisTexts)

    let colHeight

    // initial x Position (keep adding column width in the loop)
    let yPos
    let labels = []

    for (let i = 0; i < this.xaxisLabels.length; i++) {
      labels.push(this.xaxisLabels[i])
    }

    colHeight = w.globals.gridHeight / labels.length
    yPos = -(colHeight / 2.2)

    let lbFormatter = w.config.yaxis[0].labels.formatter

    if (w.config.yaxis[0].labels.show) {
      for (let i = 0; i <= labels.length - 1; i++) {
        let label = typeof labels[i] === 'undefined' ? '' : labels[i]

        label = lbFormatter(label)

        let elTick = graphics.drawText({
          x: w.config.yaxis[0].labels.offsetX - 15,
          y: yPos + colHeight + w.config.yaxis[0].labels.offsetY,
          text: label,
          textAnchor: 'end',
          foreColor: w.config.yaxis[0].labels.style.colors[i],
          fontSize: w.config.yaxis[0].labels.style.fontSize,
          cssClass: 'apexcharts-yaxis-label ' + w.config.yaxis[0].labels.style.cssClass
        })

        elYaxisTexts.add(elTick)
        yPos = yPos + colHeight
      }
    }

    if (w.config.yaxis[0].title.text !== undefined) {
      let elXaxisTitle = graphics.group({
        class: 'apexcharts-yaxis-title apexcharts-xaxis-title-inversed'
      })

      let elXAxisTitleText = graphics.drawText({
        x: 0,
        y: w.globals.gridHeight / 2,
        text: w.config.yaxis[0].title.text,
        textAnchor: 'middle',
        foreColor: w.config.yaxis[0].title.style.color,
        fontSize: w.config.yaxis[0].title.style.fontSize,
        cssClass: 'apexcharts-yaxis-title-text ' + w.config.yaxis[0].title.style.cssClass
      })

      elXaxisTitle.add(elXAxisTitleText)

      elYaxis.add(elXaxisTitle)
    }

    if (w.config.xaxis.axisBorder.show) {
      let elHorzLine = graphics.drawLine(
        w.globals.padHorizontal + w.config.xaxis.axisBorder.offsetX,
        this.offY,
        w.globals.gridWidth,
        this.offY,
        this.yaxis.axisBorder.color
      )

      elYaxis.add(elHorzLine)

      // let x = w.globals.yAxisWidths[0] / 2
      // if (w.config.yaxis[0].opposite) {
      //   x = -w.globals.yAxisWidths[0] / 2
      // }

      let yaxis = new YAxis(this.ctx)

      yaxis.drawAxisTicks(0, labels.length, w.config.yaxis[0].axisBorder, w.config.yaxis[0].axisTicks, 0, colHeight, elYaxis)
    }

    return elYaxis
  }

  drawXaxisTicks (x1, appendToElement) {
    let w = this.w
    let x2 = x1

    if (x1 < 0 || x1 > w.globals.gridWidth) return

    let y1 = this.offY + w.config.xaxis.axisTicks.offsetY
    let y2 = y1 + w.config.xaxis.axisTicks.height

    if (w.config.xaxis.axisTicks.show) {
      let graphics = new Graphics(this.ctx)

      let line = graphics.drawLine(
        x1 + w.config.xaxis.axisTicks.offsetX,
        y1,
        x2 + w.config.xaxis.axisTicks.offsetX,
        y2,
        w.config.xaxis.axisTicks.color
      )

      // we are not returning anything, but appending directly to the element pased in param
      appendToElement.add(line)
      line.node.classList.add('apexcharts-xaxis-tick')
    }
  }

  getXAxisTicksPositions () {
    const w = this.w
    let xAxisTicksPositions = []

    const xCount = this.xaxisLabels.length
    let x1 = w.globals.padHorizontal

    if (w.globals.timelineLabels.length > 0) {
      for (let i = 0; i < xCount; i++) {
        x1 = this.xaxisLabels[i].position
        xAxisTicksPositions.push(x1)
      }
    } else {
      let xCountForCategoryCharts = xCount
      for (let i = 0; i < xCountForCategoryCharts; i++) {
        let x1Count = xCountForCategoryCharts
        if (w.globals.dataXY && w.config.chart.type !== 'bar') {
          x1Count -= 1
        }
        x1 = (x1 + w.globals.gridWidth / x1Count)
        xAxisTicksPositions.push(x1)
      }
    }

    return xAxisTicksPositions
  }

  // to rotate x-axis labels or to put ... for longer text in xaxis
  xAxisLabelCorrections () {
    let w = this.w

    let graphics = new Graphics(this.ctx)

    let xAxis = w.globals.dom.baseEl.querySelector(
      '.apexcharts-xaxis-texts-g'
    )

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

        xAxisTexts[xat].setAttribute(
          'text-anchor',
          `end`
        )

        let offsetHeight = 10

        xAxis.setAttribute('transform', `translate(0, ${-offsetHeight})`)

        let tSpan = xAxisTexts[xat].children

        if (w.config.xaxis.labels.trim) {
          graphics.placeTextWithEllipsis(
            tSpan[1],
            tSpan[1].innerHTML,
            w.config.xaxis.labels.maxHeight - 40
          )
        }
      }
    } else {
      let width = w.globals.gridWidth / w.globals.labels.length

      for (let xat = 0; xat < xAxisTexts.length; xat++) {
        let tSpan = xAxisTexts[xat].children

        if (w.config.xaxis.labels.trim && (w.config.chart.type !== 'bar' && w.config.plotOptions.bar.horizontal)) {
          graphics.placeTextWithEllipsis(tSpan[1], tSpan[1].innerHTML, width)
        }
      }
    }

    if (xAxisTexts.length > 0) {
      let firstLabelPos = xAxisTexts[0].getBBox()
      let lastLabelPos = xAxisTexts[xAxisTexts.length - 1].getBBox()

      if (firstLabelPos.x < -25) {
        xAxisTexts[0].remove()
      }

      if (lastLabelPos.x + lastLabelPos.width > w.globals.gridWidth) {
        xAxisTexts[xAxisTexts.length - 1].remove()
      }
    }

    if (yAxisTextsInversed.length > 0) {
      // truncate y axis in bar chart
      let firstLabelPosX = yAxisTextsInversed[yAxisTextsInversed.length - 1].getBBox()
      let lastLabelPosX = yAxisTextsInversed[0].getBBox()

      if (firstLabelPosX.x < -20) {
        yAxisTextsInversed[yAxisTextsInversed.length - 1].remove()
      }

      if (lastLabelPosX.x + lastLabelPosX.width > w.globals.gridWidth) {
        yAxisTextsInversed[0].remove()
      }

      // truncate y axis in bar chart
      for (let xat = 0; xat < xAxisTextsInversed.length; xat++) {
        graphics.placeTextWithEllipsis(
          xAxisTextsInversed[xat],
          xAxisTextsInversed[xat].innerHTML,
          w.config.yaxis[0].labels.maxWidth -
            parseInt(w.config.yaxis[0].title.style.fontSize) * 2 -
            20
        )
      }
    }
  }

  // renderXAxisBands() {
  //   let w = this.w;

  //   let plotBand = document.createElementNS(w.globals.svgNS, 'rect')
  //   w.globals.dom.elGraphical.add(plotBand)
  // }
}

module.exports = XAxis
