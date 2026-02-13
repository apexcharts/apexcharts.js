import apexchartsLegendCSS from '../../assets/apexcharts-legend.css'
import Utils from '../../utils/Utils'
import Graphics from '../Graphics'

export default class Helpers {
  constructor(lgCtx) {
    this.w = lgCtx.w
    this.lgCtx = lgCtx
  }

  getLegendStyles() {
    let stylesheet = document.createElement('style')
    stylesheet.setAttribute('type', 'text/css')
    const nonce =
      this.lgCtx.ctx?.opts?.chart?.nonce || this.w.config.chart.nonce
    if (nonce) {
      stylesheet.setAttribute('nonce', nonce)
    }

    const rule = document.createTextNode(apexchartsLegendCSS)
    stylesheet.appendChild(rule)
    return stylesheet
  }

  getLegendDimensions() {
    const w = this.w
    let currLegendsWrap =
      w.globals.dom.baseEl.querySelector('.apexcharts-legend')
    let { width: currLegendsWrapWidth, height: currLegendsWrapHeight } =
      currLegendsWrap.getBoundingClientRect()

    return {
      clwh: currLegendsWrapHeight,
      clww: currLegendsWrapWidth,
    }
  }

  appendToForeignObject() {
    const gl = this.w.globals

    if (this.w.config.chart.injectStyleSheet !== false) {
      gl.dom.elLegendForeign.appendChild(this.getLegendStyles())
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
        if (!seriesEl) return
        realIndex = parseInt(seriesEl.getAttribute('data:realIndex'), 10)
      } else {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        )
        if (!seriesEl) return
        realIndex = parseInt(seriesEl.getAttribute('rel'), 10) - 1
      }

      if (isHidden) {
        const seriesToMakeVisible = [
          {
            cs: w.globals.collapsedSeries,
            csi: w.globals.collapsedSeriesIndices,
          },
          {
            cs: w.globals.ancillaryCollapsedSeries,
            csi: w.globals.ancillaryCollapsedSeriesIndices,
          },
        ]
        seriesToMakeVisible.forEach((r) => {
          this.riseCollapsedSeries(r.cs, r.csi, realIndex)
        })
      } else {
        this.hideSeries({ seriesEl, realIndex })
      }
    } else {
      // for non-axis charts i.e pie / donuts
      let seriesEl = w.globals.dom.Paper.findOne(
        ` .apexcharts-series[rel='${seriesCnt + 1}'] path`
      )

      const type = w.config.chart.type
      if (type === 'pie' || type === 'polarArea' || type === 'donut') {
        let dataLabels = w.config.plotOptions.pie.donut.labels

        const graphics = new Graphics(this.lgCtx.ctx)
        graphics.pathMouseDown(seriesEl, null)
        this.lgCtx.ctx.pie.printDataLabelsInner(seriesEl.node, dataLabels)
      }

      seriesEl.fire('click')
    }
  }

  getSeriesAfterCollapsing({ realIndex }) {
    const w = this.w
    const gl = w.globals

    let series = Utils.clone(w.config.series)

    if (gl.axisCharts) {
      let yaxis = w.config.yaxis[gl.seriesYAxisReverseMap[realIndex]]

      const collapseData = {
        index: realIndex,
        data: series[realIndex].data.slice(),
        type: series[realIndex].type || w.config.chart.type,
      }
      if (yaxis && yaxis.show && yaxis.showAlways) {
        if (gl.ancillaryCollapsedSeriesIndices.indexOf(realIndex) < 0) {
          gl.ancillaryCollapsedSeries.push(collapseData)
          gl.ancillaryCollapsedSeriesIndices.push(realIndex)
        }
      } else {
        if (gl.collapsedSeriesIndices.indexOf(realIndex) < 0) {
          gl.collapsedSeries.push(collapseData)
          gl.collapsedSeriesIndices.push(realIndex)

          let removeIndexOfRising = gl.risingSeries.indexOf(realIndex)
          gl.risingSeries.splice(removeIndexOfRising, 1)
        }
      }
    } else {
      gl.collapsedSeries.push({
        index: realIndex,
        data: series[realIndex],
      })
      gl.collapsedSeriesIndices.push(realIndex)
    }

    gl.allSeriesCollapsed =
      gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length ===
      w.config.series.length

    return this._getSeriesBasedOnCollapsedState(series)
  }

  hideSeries({ seriesEl, realIndex }) {
    const w = this.w

    let series = this.getSeriesAfterCollapsing({
      realIndex,
    })

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
          } else {
            series[realIndex] = collapsedSeries[c].data
          }
          if (typeof series[realIndex] !== 'number') {
            series[realIndex].hidden = false
          }
          collapsedSeries.splice(c, 1)
          seriesIndices.splice(c, 1)
          w.globals.risingSeries.push(realIndex)
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
    let collapsed = 0

    if (w.globals.axisCharts) {
      series.forEach((s, sI) => {
        if (
          !(
            w.globals.collapsedSeriesIndices.indexOf(sI) < 0 &&
            w.globals.ancillaryCollapsedSeriesIndices.indexOf(sI) < 0
          )
        ) {
          series[sI].data = []
          collapsed++
        }
      })
    } else {
      series.forEach((s, sI) => {
        if (!w.globals.collapsedSeriesIndices.indexOf(sI) < 0) {
          series[sI] = 0
          collapsed++
        }
      })
    }

    w.globals.allSeriesCollapsed = collapsed === series.length

    return series
  }
}
