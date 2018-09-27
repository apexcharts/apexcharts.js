import Graphics from '../Graphics'

/**
 * ApexCharts YAxis Class for drawing Y-Axis.
 *
 * @module YAxis
 **/

class YAxis {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.xaxisFontSize = this.w.config.xaxis.labels.style.fontSize
    this.axisFontFamily = this.w.config.xaxis.labels.style.fontFamily
    this.isBarHorizontal = !!(this.w.config.chart.type === 'bar' &&
      this.w.config.plotOptions.bar.horizontal)

    this.xaxisForeColors = this.w.config.xaxis.labels.style.colors

    this.xAxisoffX = 0
    if (this.w.config.xaxis.position === 'bottom') {
      this.xAxisoffX = this.w.globals.gridHeight
    }
  }

  drawYaxis (xyRatios, realIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let yaxisFontSize = w.config.yaxis[realIndex].labels.style.fontSize
    let yaxisFontFamily = w.config.yaxis[realIndex].labels.style.fontFamily

    let elYaxis = graphics.group({
      class: 'apexcharts-yaxis',
      'rel': realIndex,
      'transform':
      'translate(' + w.globals.translateYAxisX[realIndex] + ', 0)'
    })

    let elYaxisTexts = graphics.group({
      'class': 'apexcharts-yaxis-texts-g'
    })

    elYaxis.add(elYaxisTexts)

    let tickAmount = w.globals.yAxisScale[realIndex].result.length - 1

    // labelsDivider is simply svg height/number of ticks
    let labelsDivider = w.globals.gridHeight / tickAmount + 0.1

    // initial label position = 0;
    let l = w.globals.translateY
    let lbFormatter = w.globals.yLabelFormatters[realIndex]

    if (w.config.yaxis[realIndex].labels.show) {
      for (let i = tickAmount; i >= 0; i--) {
        let val = w.globals.yAxisScale[realIndex].result[i]

        val = lbFormatter(val)

        let xPad = 20
        if (w.config.yaxis[realIndex].opposite) {
          xPad = xPad * -1
        }

        if (w.config.yaxis.length === 0) {
          xPad = 20
        }

        let label = graphics.drawText({
          x: xPad,
          y: l + tickAmount / 10 + w.config.yaxis[realIndex].labels.offsetY + 1,
          text: val,
          textAnchor: w.config.yaxis[realIndex].opposite ? 'start' : 'end',
          fontSize: yaxisFontSize,
          fontFamily: yaxisFontFamily,
          foreColor: w.config.yaxis[realIndex].labels.style.color,
          cssClass: 'apexcharts-yaxis-label ' + w.config.yaxis[realIndex].labels.style.cssClass
        })
        elYaxisTexts.add(label)
        l = l + labelsDivider
      }
    }

    if (w.config.yaxis[realIndex].title.text !== undefined) {
      let elYaxisTitle = graphics.group({
        'class': 'apexcharts-yaxis-title'
      })

      let x = 0
      if (w.config.yaxis[realIndex].opposite) {
        x = w.globals.translateYAxisX[realIndex]
      }
      let elYAxisTitleText = graphics.drawText({
        x,
        y: (w.globals.gridHeight / 2) + w.globals.translateY,
        text: w.config.yaxis[realIndex].title.text,
        textAnchor: 'end',
        foreColor: w.config.yaxis[realIndex].labels.style.color,
        fontSize: w.config.yaxis[realIndex].title.style.fontSize,
        fontFamily: w.config.yaxis[realIndex].title.style.fontFamily,
        cssClass: 'apexcharts-yaxis-title-text ' + w.config.yaxis[realIndex].title.style.cssClass
      })

      elYaxisTitle.add(elYAxisTitleText)

      elYaxis.add(elYaxisTitle)
    }

    let axisBorder = w.config.yaxis[realIndex].axisBorder
    if (axisBorder.show) {
      let x = 31 + axisBorder.offsetX
      if (w.config.yaxis[realIndex].opposite) {
        x = -31 - axisBorder.offsetX
      }

      let elVerticalLine = graphics.drawLine(
        x,
        w.globals.translateY + axisBorder.offsetY - 2,
        x,
        w.globals.gridHeight + w.globals.translateY + axisBorder.offsetY + 2,
        axisBorder.color
      )

      elYaxis.add(elVerticalLine)

      this.drawAxisTicks(x, tickAmount, axisBorder, w.config.yaxis[realIndex].axisTicks, realIndex, labelsDivider, elYaxis)
    }

    return elYaxis
  }

  // This actually becomes horizonal axis (for bar charts)
  drawYaxisInversed (realIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elXaxis = graphics.group({
      'class': 'apexcharts-xaxis apexcharts-yaxis-inversed'
    })

    let elXaxisTexts = graphics.group({
      'class': 'apexcharts-xaxis-texts-g',
      'transform':
      `translate(${w.globals.translateXAxisX}, ${w.globals.translateXAxisY})`
    })

    elXaxis.add(elXaxisTexts)

    let tickAmount = w.globals.yAxisScale[realIndex].result.length - 1

    // labelsDivider is simply svg width/number of ticks
    let labelsDivider = w.globals.gridWidth / tickAmount + 0.1

    // initial label position;
    let l = labelsDivider + w.config.xaxis.labels.offsetX
    let lbFormatter = w.globals.xLabelFormatter

    if (w.config.xaxis.labels.show) {
      for (let i = tickAmount; i >= 0; i--) {
        let val = w.globals.yAxisScale[realIndex].result[i]
        val = lbFormatter(val)

        let elTick = graphics.drawText({
          x: w.globals.gridWidth +
          w.globals.padHorizontal -
          (l - labelsDivider + w.config.xaxis.labels.offsetX),
          y: this.xAxisoffX + w.config.xaxis.labels.offsetY + 30,
          text: '',
          textAnchor: 'middle',
          foreColor: Array.isArray(this.xaxisForeColors) ? this.xaxisForeColors[realIndex] : this.xaxisForeColors,
          fontSize: this.xaxisFontSize,
          fontFamily: this.xaxisFontFamily,
          cssClass: 'apexcharts-xaxis-label ' + w.config.xaxis.labels.style.cssClass
        })

        elXaxisTexts.add(elTick)

        elTick.tspan(val)

        let elTooltipTitle = document.createElementNS(w.globals.svgNS, 'title')
        elTooltipTitle.textContent = val
        elTick.node.appendChild(elTooltipTitle)

        l = l + labelsDivider
      }
    }

    if (w.config.xaxis.title.text !== undefined) {
      let elYaxisTitle = graphics.group({
        'class': 'apexcharts-xaxis-title apexcharts-yaxis-title-inversed'
      })

      let elYAxisTitleText = graphics.drawText({
        x: w.globals.gridWidth / 2,
        y: this.xAxisoffX +
        parseInt(this.xaxisFontSize) +
        parseInt(w.config.xaxis.title.style.fontSize) +
        20,
        text: w.config.xaxis.title.text,
        textAnchor: 'middle',
        fontSize: w.config.xaxis.title.style.fontSize,
        fontFamily: w.config.xaxis.title.style.fontFamily,
        cssClass: 'apexcharts-xaxis-title-text ' + w.config.xaxis.title.style.cssClass
      })

      elYaxisTitle.add(elYAxisTitleText)

      elXaxis.add(elYaxisTitle)
    }

    let axisBorder = w.config.yaxis[realIndex].axisBorder
    if (axisBorder.show) {
      let elVerticalLine = graphics.drawLine(
        w.globals.padHorizontal + axisBorder.offsetX,
        1 + axisBorder.offsetY,
        w.globals.padHorizontal + axisBorder.offsetX,
        w.globals.gridHeight + axisBorder.offsetY,
        axisBorder.color
      )

      elXaxis.add(elVerticalLine)
    }

    return elXaxis
  }

  drawAxisTicks (x, tickAmount, axisBorder, axisTicks, realIndex, labelsDivider, elYaxis) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    // initial label position = 0;
    let t = w.globals.translateY

    if (axisTicks.show) {
      if (w.config.yaxis[realIndex].opposite === true) x = x + axisTicks.width

      for (let i = tickAmount; i >= 0; i--) {
        let tY = t + tickAmount / 10 + w.config.yaxis[realIndex].labels.offsetY - 1
        if (this.isBarHorizontal) {
          tY = labelsDivider * i
        }
        let elTick = graphics.drawLine(
          x + axisBorder.offsetX - axisTicks.width + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          x + axisBorder.offsetX + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          axisBorder.color
        )
        elYaxis.add(elTick)
        t = t + labelsDivider
      }
    }
  }

  yAxisTitleRotate (realIndex, yAxisOpposite) {
    let w = this.w

    let graphics = new Graphics(this.ctx)

    let yAxisLabelsCoord = {
      width: 0,
      height: 0
    }
    let yAxisTitleCoord = {
      width: 0,
      height: 0
    }

    let elYAxisLabelsWrap = w.globals.dom.baseEl.querySelector(
      ` .apexcharts-yaxis[rel='${realIndex}'] .apexcharts-yaxis-texts-g`
    )

    if (elYAxisLabelsWrap !== null) {
      yAxisLabelsCoord = elYAxisLabelsWrap.getBoundingClientRect()
    }

    let yAxisTitle = w.globals.dom.baseEl.querySelector(
      `.apexcharts-yaxis[rel='${realIndex}'] .apexcharts-yaxis-title text`
    )

    if (yAxisTitle !== null) {
      yAxisTitleCoord = yAxisTitle.getBoundingClientRect()
    }

    if (yAxisTitle !== null) {
      let x = this.xPaddingForYAxisTitle(realIndex, yAxisLabelsCoord, yAxisTitleCoord, yAxisOpposite)

      yAxisTitle.setAttribute(
        'x', x.xPos - (yAxisOpposite ? 10 : 0)
      )
    }

    if (yAxisTitle !== null) {
      let titleRotatingCenter = graphics.rotateAroundCenter(yAxisTitle)
      if (!yAxisOpposite) {
        yAxisTitle.setAttribute(
          'transform',
          `rotate(-90 ${titleRotatingCenter.x} ${titleRotatingCenter.y})`
        )
      } else {
        yAxisTitle.setAttribute(
          'transform',
          `rotate(90 ${titleRotatingCenter.x} ${titleRotatingCenter.y})`
        )
      }
    }
  }

  xPaddingForYAxisTitle (realIndex, yAxisLabelsCoord, yAxisTitleCoord, yAxisOpposite) {
    let w = this.w
    let oppositeAxisCount = 0

    let x = 0
    let padd = 20
    if (yAxisOpposite) {
      x = yAxisLabelsCoord.width +
      w.config.yaxis[realIndex].title.offsetX + padd + yAxisTitleCoord.width / 2 - 15

      oppositeAxisCount += 1

      if (oppositeAxisCount === 0) {
        x = x - 15
      }
    } else {
      x = yAxisLabelsCoord.width * -1 +
          w.config.yaxis[realIndex].title.offsetX + padd + yAxisTitleCoord.width / 2 - 15

      if (this.isBarHorizontal) {
        padd = 25
        x = yAxisLabelsCoord.width * -1 -
        w.config.yaxis[realIndex].title.offsetX - padd
      }
    }

    return {xPos: x, padd}
  }

  // sets the x position of the y-axis by counting the labels width, title width and any offset
  setYAxisXPosition (yaxisLabelCoords, ytitleCoords) {
    let w = this.w

    let xLeft = 0
    let xRight = 0
    let leftDrawnYs = 0 // already drawn y axis on left side
    let rightDrawnYs = 1 // already drawn y axis on right side
    let multipleYPadd = 20
    this.multipleYs = false

    if (w.config.yaxis.length > 1) {
      this.multipleYs = true
    }

    w.config.yaxis.map((yaxe, index) => {
      let yAxisWidth = (yaxisLabelCoords[index].width + ytitleCoords[index].width)

      let paddingForYAxisTitle = this.xPaddingForYAxisTitle(index, {
        width: yaxisLabelCoords[index].width
      }, {
        width: ytitleCoords[index].width
      }, yaxe.opposite)

      if (w.config.yaxis.length > 1) {
        // multiple yaxis
        yAxisWidth = yAxisWidth + Math.abs(paddingForYAxisTitle.padd)
      } else {
        // just a single y axis in axis chart
        if (yaxe.title.text === undefined) {
          yAxisWidth = yAxisWidth + Math.abs(paddingForYAxisTitle.padd) + 15
        } else {
          yAxisWidth = yAxisWidth + Math.abs(paddingForYAxisTitle.padd)
        }
      }

      if (!yaxe.opposite) {
        // left side y axis
        let offset = yAxisWidth + 5
        if (w.globals.ignoreYAxisIndexes.includes(index)) {
          offset = 0
        }

        if (this.multipleYs) {
          xLeft = w.globals.translateX - yAxisWidth - leftDrawnYs + multipleYPadd + (parseInt(w.config.yaxis[index].labels.style.fontSize) / 1.2) + yaxe.labels.offsetX
        } else {
          xLeft = w.globals.translateX - yAxisWidth + yaxisLabelCoords[index].width + yaxe.labels.offsetX
        }

        leftDrawnYs = leftDrawnYs + offset
        w.globals.translateYAxisX[index] = xLeft
      } else {
        // right side y axis
        xRight = w.globals.gridWidth + (w.globals.translateX) + rightDrawnYs + 30 + (w.globals.series.length - w.globals.collapsedSeries.length)

        w.globals.collapsedSeries.forEach((c) => {
          if (c.index === index) {
            rightDrawnYs = rightDrawnYs - yAxisWidth
          }
        })
        rightDrawnYs = rightDrawnYs + yAxisWidth
        w.globals.translateYAxisX[index] = xRight - yaxe.labels.offsetX
      }

      // w.globals.yAxisWidths.push(yAxisWidth)
    })
  }
}

module.exports = YAxis
