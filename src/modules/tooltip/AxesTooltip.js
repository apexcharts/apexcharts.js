/**
 * ApexCharts Tooltip.AxesTooltip Class.
 *
 * @module Tooltip.AxesTooltip
 **/

class AxesTooltip {
  constructor (tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
  }

  /**
   * This method adds the secondary tooltip which appears below x axis
   * @memberof Tooltip
   **/
  drawXaxisTooltip () {
    let w = this.w
    const ttCtx = this.ttCtx

    const isBottom = w.config.xaxis.position === 'bottom'

    ttCtx.xaxisOffY = isBottom ? w.globals.gridHeight + 1 : 1
    const tooltipCssClass = isBottom ? 'apexcharts-xaxistooltip apexcharts-xaxistooltip-bottom' : 'apexcharts-xaxistooltip apexcharts-xaxistooltip-top'

    let renderTo = w.globals.dom.elWrap

    if (ttCtx.blxaxisTooltip) {
      let xaxisTooltip = w.globals.dom.baseEl.querySelector('.apexcharts-xaxistooltip')

      if (xaxisTooltip === null) {
        ttCtx.xaxisTooltip = document.createElement('div')
        ttCtx.xaxisTooltip.setAttribute('class', tooltipCssClass)

        renderTo.appendChild(ttCtx.xaxisTooltip)

        ttCtx.xaxisTooltipText = document.createElement('div')
        ttCtx.xaxisTooltipText.classList.add('apexcharts-xaxistooltip-text')

        ttCtx.xaxisTooltip.appendChild(ttCtx.xaxisTooltipText)
      }
    }
  }

  /**
   * This method adds the secondary tooltip which appears below x axis
   * @memberof Tooltip
   **/
  drawYaxisTooltip () {
    let w = this.w
    const ttCtx = this.ttCtx

    for (let i = 0; i < w.config.yaxis.length; i++) {
      const isRight = w.config.yaxis[i].opposite || w.config.yaxis[i].crosshairs.opposite

      ttCtx.yaxisOffX = isRight ? w.globals.gridWidth + 1 : 1
      const tooltipCssClass = isRight
        ? `apexcharts-yaxistooltip apexcharts-yaxistooltip-${i} apexcharts-yaxistooltip-right` : `apexcharts-yaxistooltip apexcharts-yaxistooltip-${i} apexcharts-yaxistooltip-left`

      let renderTo = w.globals.dom.elWrap

      if (ttCtx.blyaxisTooltip) {
        let yaxisTooltip = w.globals.dom.baseEl.querySelector(`.apexcharts-yaxistooltip apexcharts-yaxistooltip-${i}`)

        if (yaxisTooltip === null) {
          ttCtx.yaxisTooltip = document.createElement('div')
          ttCtx.yaxisTooltip.setAttribute('class', tooltipCssClass)

          renderTo.appendChild(ttCtx.yaxisTooltip)

          if (i === 0) ttCtx.yaxisTooltipText = []

          ttCtx.yaxisTooltipText.push(document.createElement('div'))
          ttCtx.yaxisTooltipText[i].classList.add('apexcharts-yaxistooltip-text')

          ttCtx.yaxisTooltip.appendChild(ttCtx.yaxisTooltipText[i])
        }
      }
    }
  }

  /**
   * @memberof Tooltip
   **/
  setXCrosshairWidth () {
    let w = this.w
    const ttCtx = this.ttCtx

    // set xcrosshairs width
    ttCtx.xcrosshairs = w.globals.dom.baseEl.querySelector(
      '.apexcharts-xcrosshairs'
    )
    ttCtx.xcrosshairsWidth = parseInt(w.config.xaxis.crosshairs.width)

    if (!w.globals.comboCharts) {
      if (w.config.xaxis.crosshairs.width === 'tickWidth') {
        let count = w.globals.labels.length
        ttCtx.xcrosshairsWidth = w.globals.gridWidth / count
      } else if (w.config.xaxis.crosshairs.width === 'barWidth') {
        let bar = w.globals.dom.baseEl.querySelector(
          '.apexcharts-bar-area'
        )
        if (bar !== null) {
          let barWidth = parseFloat(bar.getAttribute('barWidth'))
          ttCtx.xcrosshairsWidth = barWidth
        } else {
          ttCtx.xcrosshairsWidth = 1
        }
      }
    } else {
      let bar = w.globals.dom.baseEl.querySelector(
        '.apexcharts-bar-area'
      )
      if (bar !== null && w.config.xaxis.crosshairs.width === 'barWidth') {
        let barWidth = parseFloat(bar.getAttribute('barWidth'))
        ttCtx.xcrosshairsWidth = barWidth
      } else {
        if (w.config.xaxis.crosshairs.width === 'tickWidth') {
          let count = w.globals.labels.length
          ttCtx.xcrosshairsWidth = w.globals.gridWidth / count
        }
      }
    }

    if (
      w.config.chart.type === 'bar' &&
      w.config.plotOptions.bar.horizontal
    ) {
      ttCtx.xcrosshairsWidth = 0
    }
    if (ttCtx.xcrosshairs !== null) {
      ttCtx.xcrosshairs.setAttribute('width', ttCtx.xcrosshairsWidth)
    }
  }

  handleYCrosshair () {
    let w = this.w
    const ttCtx = this.ttCtx

    // set ycrosshairs height
    ttCtx.ycrosshairs = w.globals.dom.baseEl.querySelector(
      '.apexcharts-ycrosshairs'
    )

    ttCtx.ycrosshairsHidden = w.globals.dom.baseEl.querySelector(
      '.apexcharts-ycrosshairs-hidden'
    )
  }

  drawYaxisTooltipText (index, clientY, seriesBound, xyRatios) {
    const ttCtx = this.ttCtx
    const w = this.w

    let lbFormatter = w.globals.yLabelFormatters[index]

    if (ttCtx.blyaxisTooltip) {
      const hoverY = (clientY - seriesBound.top) * xyRatios.yRatio[index]
      const height = w.globals.maxYArr[index] - w.globals.minYArr[index]

      const val = w.globals.minYArr[index] + (height - hoverY)

      ttCtx.tooltipPosition.moveYCrosshairs(clientY - seriesBound.top)
      ttCtx.yaxisTooltipText[index].innerHTML = lbFormatter(val)
      ttCtx.tooltipPosition.moveYAxisTooltip(index)
    }
  }
}

export default AxesTooltip
