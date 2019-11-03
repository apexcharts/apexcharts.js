import Graphics from '../Graphics'
import Utils from '../../utils/Utils'
import AxesUtils from './AxesUtils'

/**
 * ApexCharts YAxis Class for drawing Y-Axis.
 *
 * @module YAxis
 **/

export default class YAxis {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
    const w = this.w

    this.xaxisFontSize = w.config.xaxis.labels.style.fontSize
    this.axisFontFamily = w.config.xaxis.labels.style.fontFamily

    this.xaxisForeColors = w.config.xaxis.labels.style.colors

    this.xAxisoffX = 0
    if (w.config.xaxis.position === 'bottom') {
      this.xAxisoffX = w.globals.gridHeight
    }
    this.drawnLabels = []
    this.axesUtils = new AxesUtils(ctx)
  }

  drawYaxis(realIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let yaxisFontSize = w.config.yaxis[realIndex].labels.style.fontSize
    let yaxisFontFamily = w.config.yaxis[realIndex].labels.style.fontFamily

    let elYaxis = graphics.group({
      class: 'apexcharts-yaxis',
      rel: realIndex,
      transform: 'translate(' + w.globals.translateYAxisX[realIndex] + ', 0)'
    })

    if (!w.config.yaxis[realIndex].show) {
      return elYaxis
    }

    let elYaxisTexts = graphics.group({
      class: 'apexcharts-yaxis-texts-g'
    })

    elYaxis.add(elYaxisTexts)

    let tickAmount = w.globals.yAxisScale[realIndex].result.length - 1

    // labelsDivider is simply svg height/number of ticks
    let labelsDivider = w.globals.gridHeight / tickAmount + 0.1

    // initial label position = 0;
    let l = w.globals.translateY
    let lbFormatter = w.globals.yLabelFormatters[realIndex]

    let labels = w.globals.yAxisScale[realIndex].result.slice()
    if (w.config.yaxis[realIndex] && w.config.yaxis[realIndex].reversed) {
      labels.reverse()
    }

    if (w.config.yaxis[realIndex].labels.show) {
      for (let i = tickAmount; i >= 0; i--) {
        let val = labels[i]

        val = lbFormatter(val, i)

        let xPad = w.config.yaxis[realIndex].labels.padding
        if (w.config.yaxis[realIndex].opposite && w.config.yaxis.length !== 0) {
          xPad = xPad * -1
        }

        let label = graphics.drawText({
          x: xPad,
          y: l + tickAmount / 10 + w.config.yaxis[realIndex].labels.offsetY + 1,
          text: val,
          textAnchor: w.config.yaxis[realIndex].opposite ? 'start' : 'end',
          fontSize: yaxisFontSize,
          fontFamily: yaxisFontFamily,
          foreColor: w.config.yaxis[realIndex].labels.style.color,
          cssClass:
            'apexcharts-yaxis-label ' +
            w.config.yaxis[realIndex].labels.style.cssClass
        })
        elYaxisTexts.add(label)

        let labelRotatingCenter = graphics.rotateAroundCenter(label.node)
        if (w.config.yaxis[realIndex].labels.rotate !== 0) {
          label.node.setAttribute(
            'transform',
            `rotate(${w.config.yaxis[realIndex].labels.rotate} ${
              labelRotatingCenter.x
            } ${labelRotatingCenter.y})`
          )
        }
        l = l + labelsDivider
      }
    }

    if (w.config.yaxis[realIndex].title.text !== undefined) {
      let elYaxisTitle = graphics.group({
        class: 'apexcharts-yaxis-title'
      })

      let x = 0
      if (w.config.yaxis[realIndex].opposite) {
        x = w.globals.translateYAxisX[realIndex]
      }
      let elYAxisTitleText = graphics.drawText({
        x,
        y:
          w.globals.gridHeight / 2 +
          w.globals.translateY +
          w.config.yaxis[realIndex].title.offsetY,
        text: w.config.yaxis[realIndex].title.text,
        textAnchor: 'end',
        foreColor: w.config.yaxis[realIndex].title.style.color,
        fontSize: w.config.yaxis[realIndex].title.style.fontSize,
        fontFamily: w.config.yaxis[realIndex].title.style.fontFamily,
        cssClass:
          'apexcharts-yaxis-title-text ' +
          w.config.yaxis[realIndex].title.style.cssClass
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

      this.axesUtils.drawYAxisTicks(
        x,
        tickAmount,
        axisBorder,
        w.config.yaxis[realIndex].axisTicks,
        realIndex,
        labelsDivider,
        elYaxis
      )
    }

    return elYaxis
  }

  // This actually becomes horizonal axis (for bar charts)
  drawYaxisInversed(realIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elXaxis = graphics.group({
      class: 'apexcharts-xaxis apexcharts-yaxis-inversed'
    })

    let elXaxisTexts = graphics.group({
      class: 'apexcharts-xaxis-texts-g',
      transform: `translate(${w.globals.translateXAxisX}, ${
        w.globals.translateXAxisY
      })`
    })

    elXaxis.add(elXaxisTexts)

    let tickAmount = w.globals.yAxisScale[realIndex].result.length - 1

    // labelsDivider is simply svg width/number of ticks
    let labelsDivider = w.globals.gridWidth / tickAmount + 0.1

    // initial label position;
    let l = labelsDivider + w.config.xaxis.labels.offsetX

    let lbFormatter = w.globals.xLabelFormatter

    let labels = w.globals.yAxisScale[realIndex].result.slice()

    let timelineLabels = w.globals.invertedTimelineLabels
    if (timelineLabels.length > 0) {
      this.xaxisLabels = timelineLabels.slice()
      labels = timelineLabels.slice()
      tickAmount = labels.length
    }

    if (w.config.yaxis[realIndex] && w.config.yaxis[realIndex].reversed) {
      labels.reverse()
    }

    const tl = timelineLabels.length

    if (w.config.xaxis.labels.show) {
      for (
        let i = tl ? 0 : tickAmount;
        tl ? i < tl - 1 : i >= 0;
        tl ? i++ : i--
      ) {
        let val = labels[i]
        val = lbFormatter(val, i)

        let x =
          w.globals.gridWidth +
          w.globals.padHorizontal -
          (l - labelsDivider + w.config.xaxis.labels.offsetX)

        if (timelineLabels.length) {
          let label = this.axesUtils.getLabel(
            labels,
            timelineLabels,
            x,
            i,
            this.drawnLabels
          )
          x = label.x
          val = label.text
          this.drawnLabels.push(label.text)
        }

        let elTick = graphics.drawText({
          x: x,
          y: this.xAxisoffX + w.config.xaxis.labels.offsetY + 30,
          text: '',
          textAnchor: 'middle',
          foreColor: Array.isArray(this.xaxisForeColors)
            ? this.xaxisForeColors[realIndex]
            : this.xaxisForeColors,
          fontSize: this.xaxisFontSize,
          fontFamily: this.xaxisFontFamily,
          cssClass:
            'apexcharts-xaxis-label ' + w.config.xaxis.labels.style.cssClass
        })

        elXaxisTexts.add(elTick)

        elTick.tspan(val)

        let elTooltipTitle = document.createElementNS(w.globals.SVGNS, 'title')
        elTooltipTitle.textContent = val
        elTick.node.appendChild(elTooltipTitle)

        l = l + labelsDivider
      }
    }

    if (w.config.xaxis.title.text !== undefined) {
      let elYaxisTitle = graphics.group({
        class: 'apexcharts-xaxis-title apexcharts-yaxis-title-inversed'
      })

      let elYAxisTitleText = graphics.drawText({
        x: w.globals.gridWidth / 2,
        y:
          this.xAxisoffX +
          parseFloat(this.xaxisFontSize) +
          parseFloat(w.config.xaxis.title.style.fontSize) +
          20,
        text: w.config.xaxis.title.text,
        textAnchor: 'middle',
        fontSize: w.config.xaxis.title.style.fontSize,
        fontFamily: w.config.xaxis.title.style.fontFamily,
        cssClass:
          'apexcharts-xaxis-title-text ' + w.config.xaxis.title.style.cssClass
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

  yAxisTitleRotate(realIndex, yAxisOpposite) {
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
      let x = this.xPaddingForYAxisTitle(
        realIndex,
        yAxisLabelsCoord,
        yAxisTitleCoord,
        yAxisOpposite
      )

      yAxisTitle.setAttribute('x', x.xPos - (yAxisOpposite ? 10 : 0))
    }

    if (yAxisTitle !== null) {
      let titleRotatingCenter = graphics.rotateAroundCenter(yAxisTitle)
      if (!yAxisOpposite) {
        yAxisTitle.setAttribute(
          'transform',
          `rotate(-${w.config.yaxis[realIndex].title.rotate} ${
            titleRotatingCenter.x
          } ${titleRotatingCenter.y})`
        )
      } else {
        yAxisTitle.setAttribute(
          'transform',
          `rotate(${w.config.yaxis[realIndex].title.rotate} ${
            titleRotatingCenter.x
          } ${titleRotatingCenter.y})`
        )
      }
    }
  }

  xPaddingForYAxisTitle(
    realIndex,
    yAxisLabelsCoord,
    yAxisTitleCoord,
    yAxisOpposite
  ) {
    let w = this.w
    let oppositeAxisCount = 0

    let x = 0
    let padd = 10

    if (w.config.yaxis[realIndex].title.text === undefined || realIndex < 0) {
      return {
        xPos: x,
        padd: 0
      }
    }

    if (yAxisOpposite) {
      x =
        yAxisLabelsCoord.width +
        w.config.yaxis[realIndex].title.offsetX +
        yAxisTitleCoord.width / 2 +
        padd / 2

      oppositeAxisCount += 1

      if (oppositeAxisCount === 0) {
        x = x - padd / 2
      }
    } else {
      x =
        yAxisLabelsCoord.width * -1 +
        w.config.yaxis[realIndex].title.offsetX +
        padd / 2 +
        yAxisTitleCoord.width / 2

      if (w.globals.isBarHorizontal) {
        padd = 25
        x =
          yAxisLabelsCoord.width * -1 -
          w.config.yaxis[realIndex].title.offsetX -
          padd
      }
    }

    return {
      xPos: x,
      padd
    }
  }

  // sets the x position of the y-axis by counting the labels width, title width and any offset
  setYAxisXPosition(yaxisLabelCoords, yTitleCoords) {
    let w = this.w

    let xLeft = 0
    let xRight = 0
    let leftOffsetX = 21
    let rightOffsetX = 1

    if (w.config.yaxis.length > 1) {
      this.multipleYs = true
    }

    w.config.yaxis.map((yaxe, index) => {
      let shouldNotDrawAxis =
        w.globals.ignoreYAxisIndexes.indexOf(index) > -1 ||
        !yaxe.show ||
        yaxe.floating ||
        yaxisLabelCoords[index].width === 0

      let axisWidth = yaxisLabelCoords[index].width + yTitleCoords[index].width

      if (!yaxe.opposite) {
        xLeft = w.globals.translateX - leftOffsetX

        if (!shouldNotDrawAxis) {
          leftOffsetX = leftOffsetX + axisWidth + 20
        }

        w.globals.translateYAxisX[index] = xLeft + yaxe.labels.offsetX
      } else {
        if (w.globals.isBarHorizontal) {
          xRight = w.globals.gridWidth + w.globals.translateX - 1

          w.globals.translateYAxisX[index] = xRight - yaxe.labels.offsetX
        } else {
          xRight = w.globals.gridWidth + w.globals.translateX + rightOffsetX

          if (!shouldNotDrawAxis) {
            rightOffsetX = rightOffsetX + axisWidth + 20
          }

          w.globals.translateYAxisX[index] = xRight - yaxe.labels.offsetX + 20
        }
      }
    })
  }

  setYAxisTextAlignments() {
    const w = this.w

    let yaxis = w.globals.dom.baseEl.querySelectorAll(`.apexcharts-yaxis`)
    yaxis = Utils.listToArray(yaxis)
    yaxis.forEach((y, index) => {
      const yaxe = w.config.yaxis[index]
      // proceed only if user has specified alignment
      if (yaxe.labels.align !== undefined) {
        const yAxisInner = w.globals.dom.baseEl.querySelector(
          `.apexcharts-yaxis[rel='${index}'] .apexcharts-yaxis-texts-g`
        )
        let yAxisTexts = w.globals.dom.baseEl.querySelectorAll(
          `.apexcharts-yaxis[rel='${index}'] .apexcharts-yaxis-label`
        )

        yAxisTexts = Utils.listToArray(yAxisTexts)

        const rect = yAxisInner.getBoundingClientRect()

        if (yaxe.labels.align === 'left') {
          yAxisTexts.forEach((label, lI) => {
            label.setAttribute('text-anchor', 'start')
          })
          if (!yaxe.opposite) {
            yAxisInner.setAttribute('transform', `translate(-${rect.width}, 0)`)
          }
        } else if (yaxe.labels.align === 'center') {
          yAxisTexts.forEach((label, lI) => {
            label.setAttribute('text-anchor', 'middle')
          })
          yAxisInner.setAttribute(
            'transform',
            `translate(${(rect.width / 2) * (!yaxe.opposite ? -1 : 1)}, 0)`
          )
        } else if (yaxe.labels.align === 'right') {
          yAxisTexts.forEach((label, lI) => {
            label.setAttribute('text-anchor', 'end')
          })
          if (yaxe.opposite) {
            yAxisInner.setAttribute('transform', `translate(${rect.width}, 0)`)
          }
        }
      }
    })
  }
}
