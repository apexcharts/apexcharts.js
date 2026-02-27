import Utils from '../../utils/Utils'
import Graphics from '../Graphics'

export default class Helpers {
  constructor(dCtx) {
    this.w = dCtx.w
    this.dCtx = dCtx
  }

  /**
   * Get Chart Title/Subtitle Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getTitleSubtitleCoords(type) {
    const w = this.w
    let width = 0
    let height = 0

    const floating =
      type === 'title' ? w.config.title.floating : w.config.subtitle.floating

    const el = w.dom.baseEl.querySelector(`.apexcharts-${type}-text`)

    if (el !== null && !floating) {
      const coord = el.getBoundingClientRect()
      width = coord.width
      height = w.globals.axisCharts ? coord.height + 5 : coord.height
    }

    return {
      width,
      height,
    }
  }

  getLegendsRect() {
    const w = this.w

    const elLegendWrap = w.dom.elLegendWrap

    if (
      !w.config.legend.height &&
      (w.config.legend.position === 'top' ||
        w.config.legend.position === 'bottom')
    ) {
      // avoid legend to take up all the space
      elLegendWrap.style.maxHeight = w.globals.svgHeight / 2 + 'px'
    }

    const lgRect = Object.assign({}, Utils.getBoundingClientRect(elLegendWrap))

    if (
      elLegendWrap !== null &&
      !w.config.legend.floating &&
      w.config.legend.show
    ) {
      this.dCtx.lgRect = {
        x: lgRect.x,
        y: lgRect.y,
        height: lgRect.height,
        width: lgRect.height === 0 ? 0 : lgRect.width,
      }
    } else {
      this.dCtx.lgRect = {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
      }
    }

    // if legend takes up all of the chart space, we need to restrict it.
    if (
      w.config.legend.position === 'left' ||
      w.config.legend.position === 'right'
    ) {
      if (this.dCtx.lgRect.width * 1.5 > w.globals.svgWidth) {
        this.dCtx.lgRect.width = w.globals.svgWidth / 1.5
      }
    }

    return this.dCtx.lgRect
  }

  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getDatalabelsRect() {
    const w = this.w

    const allLabels = []

    w.config.series.forEach((serie, seriesIndex) => {
      serie.data.forEach((datum, dataPointIndex) => {
        const getText = (v) => {
          return w.config.dataLabels.formatter(v, {
            seriesIndex,
            dataPointIndex,
            w,
          })
        }

        const labelText = getText(w.seriesData.series[seriesIndex][dataPointIndex])

        allLabels.push(labelText)
      })
    })

    const val = Utils.getLargestStringFromArr(allLabels)

    const graphics = new Graphics(this.w)
    const dataLabelsStyle = w.config.dataLabels.style
    const labelrect = graphics.getTextRects(
      val,
      parseInt(dataLabelsStyle.fontSize),
      dataLabelsStyle.fontFamily
    )

    return {
      width: labelrect.width * 1.05,
      height: labelrect.height,
    }
  }

  getLargestStringFromMultiArr(val, arr) {
    const w = this.w
    let valArr = val
    if (w.axisFlags.isMultiLineX) {
      // if the xaxis labels has multiline texts (array)
      const maxArrs = arr.map((xl) => {
        return Array.isArray(xl) ? xl.length : 1
      })
      const maxArrLen = Math.max(...maxArrs)
      const maxArrIndex = maxArrs.indexOf(maxArrLen)
      valArr = arr[maxArrIndex]
    }

    return valArr
  }
}
