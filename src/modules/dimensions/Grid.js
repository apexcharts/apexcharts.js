export default class DimGrid {
  constructor(dCtx) {
    this.w = dCtx.w
    this.dCtx = dCtx
  }

  gridPadForColumnsInNumericAxis(gridWidth) {
    const w = this.w

    const type = w.config.chart.type

    let barWidth = 0
    let seriesLen =
      type === 'bar' || type === 'rangeBar' ? w.config.series.length : 1

    if (w.globals.comboBarCount > 0) {
      seriesLen = w.globals.comboBarCount
    }
    w.globals.collapsedSeries.forEach((c) => {
      if (c.type === 'bar' || c.type === 'rangeBar') {
        seriesLen = seriesLen - 1
      }
    })
    if (w.config.chart.stacked) {
      seriesLen = 1
    }

    const hasBar =
      type === 'bar' || type === 'rangeBar' || w.globals.comboBarCount > 0

    if (
      hasBar &&
      w.globals.isXNumeric &&
      !w.globals.isBarHorizontal &&
      seriesLen > 0
    ) {
      let xRatio = 0
      let xRange = Math.abs(w.globals.initialMaxX - w.globals.initialMinX)

      xRatio = xRange / gridWidth

      let xDivision
      // max barwidth should be equal to minXDiff to avoid overlap
      if (w.globals.minXDiff && w.globals.minXDiff / xRatio > 0) {
        xDivision = w.globals.minXDiff / xRatio
      }

      barWidth =
        ((xDivision / seriesLen) *
          parseInt(w.config.plotOptions.bar.columnWidth, 10)) /
        100

      if (barWidth < 1) {
        barWidth = 1
      }

      barWidth = barWidth / (seriesLen > 1 ? 1 : 1.5) + 10

      w.globals.barPadForNumericAxis = barWidth - 5
    }
    return barWidth
  }

  gridPadFortitleSubtitle() {
    const w = this.w
    const gl = w.globals
    let gridShrinkOffset =
      this.dCtx.isSparkline || !w.globals.axisCharts ? 0 : 10

    const titleSubtitle = ['title', 'subtitle']

    titleSubtitle.forEach((t) => {
      if (w.config[t].text !== undefined) {
        gridShrinkOffset += w.config[t].margin
      } else {
        gridShrinkOffset +=
          this.dCtx.isSparkline || !w.globals.axisCharts ? 0 : 5
      }
    })

    const nonAxisOrMultiSeriesCharts =
      w.config.series.length > 1 ||
      !w.globals.axisCharts ||
      w.config.legend.showForSingleSeries

    if (
      w.config.legend.show &&
      w.config.legend.position === 'bottom' &&
      !w.config.legend.floating &&
      nonAxisOrMultiSeriesCharts
    ) {
      gridShrinkOffset += 10
    }

    let titleCoords = this.dCtx.dimHelpers.getTitleSubtitleCoords('title')
    let subtitleCoords = this.dCtx.dimHelpers.getTitleSubtitleCoords('subtitle')

    gl.gridHeight =
      gl.gridHeight -
      titleCoords.height -
      subtitleCoords.height -
      gridShrinkOffset

    gl.translateY =
      gl.translateY +
      titleCoords.height +
      subtitleCoords.height +
      gridShrinkOffset
  }

  setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords) {
    let w = this.w
    w.config.yaxis.map((yaxe, index) => {
      if (
        w.globals.ignoreYAxisIndexes.indexOf(index) === -1 &&
        !w.config.yaxis[index].floating &&
        w.config.yaxis[index].show
      ) {
        if (yaxe.opposite) {
          w.globals.translateX =
            w.globals.translateX -
            (yaxisLabelCoords[index].width + yTitleCoords[index].width) -
            parseInt(w.config.yaxis[index].labels.style.fontSize, 10) / 1.2 -
            12
        }
      }
    })
  }
}
