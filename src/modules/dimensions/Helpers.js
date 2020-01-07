import Utils from '../../utils/Utils'

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
    let w = this.w
    let width = 0
    let height = 0

    const floating =
      type === 'title' ? w.config.title.floating : w.config.subtitle.floating

    let el = w.globals.dom.baseEl.querySelector(`.apexcharts-${type}-text`)

    if (el !== null && !floating) {
      let coord = el.getBoundingClientRect()
      width = coord.width
      height = w.globals.axisCharts ? coord.height + 5 : coord.height
    }

    return {
      width,
      height
    }
  }

  getLegendsRect() {
    let w = this.w

    let elLegendWrap = w.globals.dom.baseEl.querySelector('.apexcharts-legend')
    let lgRect = Object.assign({}, Utils.getBoundingClientRect(elLegendWrap))

    if (
      elLegendWrap !== null &&
      !w.config.legend.floating &&
      w.config.legend.show
    ) {
      this.dCtx.lgRect = {
        x: lgRect.x,
        y: lgRect.y,
        height: lgRect.height,
        width: lgRect.height === 0 ? 0 : lgRect.width
      }
    } else {
      this.dCtx.lgRect = {
        x: 0,
        y: 0,
        height: 0,
        width: 0
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

    return lgRect
  }
}
