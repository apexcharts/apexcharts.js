import Graphics from '../Graphics'
import Utils from '../../utils/Utils'

export default class Helpers {
  constructor(lgCtx) {
    this.w = lgCtx.w
    this.lgCtx = lgCtx
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
        realIndex = parseInt(seriesEl.getAttribute('data:realIndex'), 10)
      } else {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        )
        realIndex = parseInt(seriesEl.getAttribute('rel'), 10) - 1
      }

      if (isHidden) {
        const seriesToMakeVisible = [
          {
            cs: w.globals.collapsedSeries,
            csi: w.globals.collapsedSeriesIndices
          },
          {
            cs: w.globals.ancillaryCollapsedSeries,
            csi: w.globals.ancillaryCollapsedSeriesIndices
          }
        ]
        seriesToMakeVisible.forEach((r) => {
          this.riseCollapsedSeries(r.cs, r.csi, realIndex)
        })
      } else {
        this.hideSeries({ seriesEl, realIndex })
      }
    } else {
      // for non-axis charts i.e pie / donuts
      let seriesEl = w.globals.dom.Paper.select(
        ` .apexcharts-series[rel='${seriesCnt + 1}'] path`
      )

      const type = w.config.chart.type
      if (type === 'pie' || type === 'polarArea' || type === 'donut') {
        let dataLabels = w.config.plotOptions.pie.donut.labels

        const graphics = new Graphics(this.lgCtx.ctx)
        graphics.pathMouseDown(seriesEl.members[0], null)
        this.lgCtx.ctx.pie.printDataLabelsInner(
          seriesEl.members[0].node,
          dataLabels
        )
      }

      seriesEl.fire('click')
    }
  }

  hideSeries({ seriesEl, realIndex }) {
    const w = this.w

    let series = Utils.clone(w.config.series)

    if (w.globals.axisCharts) {
      let shouldNotHideYAxis = false

      if (
        w.config.yaxis[realIndex] &&
        w.config.yaxis[realIndex].show &&
        w.config.yaxis[realIndex].showAlways
      ) {
        shouldNotHideYAxis = true
        if (w.globals.ancillaryCollapsedSeriesIndices.indexOf(realIndex) < 0) {
          w.globals.ancillaryCollapsedSeries.push({
            index: realIndex,
            data: series[realIndex].data.slice(),
            type: seriesEl.parentNode.className.baseVal.split('-')[1]
          })
          w.globals.ancillaryCollapsedSeriesIndices.push(realIndex)
        }
      }

      if (!shouldNotHideYAxis) {
        w.globals.collapsedSeries.push({
          index: realIndex,
          data: series[realIndex].data.slice(),
          type: seriesEl.parentNode.className.baseVal.split('-')[1]
        })
        w.globals.collapsedSeriesIndices.push(realIndex)

        let removeIndexOfRising = w.globals.risingSeries.indexOf(realIndex)

        w.globals.risingSeries.splice(removeIndexOfRising, 1)
      }
    } else {
      w.globals.collapsedSeries.push({
        index: realIndex,
        data: series[realIndex]
      })
      w.globals.collapsedSeriesIndices.push(realIndex)
    }

    let seriesChildren = seriesEl.childNodes
    for (let sc = 0; sc < seriesChildren.length; sc++) {
      if (
        seriesChildren[sc].classList.contains('apexcharts-series-markers-wrap')
      ) {
        if (seriesChildren[sc].classList.contains('apexcharts-hide')) {
          seriesChildren[sc].classList.remove('apexcharts-hide')
        } else {
          seriesChildren[sc].classList.add('apexcharts-hide')
        }
      }
    }

    w.globals.allSeriesCollapsed =
      w.globals.collapsedSeries.length === w.config.series.length

    series = this._getSeriesBasedOnCollapsedState(series)
    this.lgCtx.ctx.updateHelpers._updateSeries(
      series,
      w.config.chart.animations.dynamicAnimation.enabled
    )
  }

  riseCollapsedSeries(collapsedSeries, seriesIndices, realIndex) {
    const w = this.w
    let series = Utils.clone(w.config.series)

    if (collapsedSeries.length > 0) {
      for (let c = 0; c < collapsedSeries.length; c++) {
        if (collapsedSeries[c].index === realIndex) {
          if (w.globals.axisCharts) {
            series[realIndex].data = collapsedSeries[c].data.slice()
            collapsedSeries.splice(c, 1)
            seriesIndices.splice(c, 1)
            w.globals.risingSeries.push(realIndex)
          } else {
            series[realIndex] = collapsedSeries[c].data
            collapsedSeries.splice(c, 1)
            seriesIndices.splice(c, 1)
            w.globals.risingSeries.push(realIndex)
          }
        }
      }

      series = this._getSeriesBasedOnCollapsedState(series)

      this.lgCtx.ctx.updateHelpers._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      )
    }
  }

  _getSeriesBasedOnCollapsedState(series) {
    const w = this.w

    if (w.globals.axisCharts) {
      series.forEach((s, sI) => {
        if (w.globals.collapsedSeriesIndices.indexOf(sI) > -1) {
          series[sI].data = []
        }
      })
    } else {
      series.forEach((s, sI) => {
        if (w.globals.collapsedSeriesIndices.indexOf(sI) > -1) {
          series[sI] = 0
        }
      })
    }

    return series
  }
}
