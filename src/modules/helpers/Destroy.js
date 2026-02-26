import PerformanceCache from '../../utils/PerformanceCache'
import { Environment } from '../../utils/Environment.js'

export default class Destroy {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  clear({ isUpdating }) {
    if (this.ctx.zoomPanSelection) {
      this.ctx.zoomPanSelection.destroy()
    }
    if (this.ctx.toolbar) {
      this.ctx.toolbar.destroy()
    }

    // Cleanup ResizeObserver
    if (
      this.w.globals.resizeObserver &&
      typeof this.w.globals.resizeObserver.disconnect === 'function'
    ) {
      this.w.globals.resizeObserver.disconnect()
      this.w.globals.resizeObserver = null
    }

    // Clear all performance caches
    PerformanceCache.invalidateAll(this.w)

    this.ctx.animations = null
    this.ctx.axes = null
    this.ctx.annotations = null
    this.ctx.core = null
    this.ctx.data = null
    this.ctx.grid = null
    this.ctx.series = null
    this.ctx.responsive = null
    this.ctx.theme = null
    this.ctx.formatters = null
    this.ctx.titleSubtitle = null
    this.ctx.legend = null
    this.ctx.dimensions = null
    this.ctx.options = null
    this.ctx.crosshairs = null
    this.ctx.zoomPanSelection = null
    this.ctx.updateHelpers = null
    this.ctx.toolbar = null
    this.ctx.localization = null
    this.ctx.w.globals.tooltip = null
    this.clearDomElements({ isUpdating })
  }

  killSVG(draw) {
    draw.each(function () {
      this.removeClass('*')
      this.off()
      // this.stop()
    }, true)
    // draw.ungroup()
    draw.clear()
  }

  clearDomElements({ isUpdating }) {
    const domEls = this.w.dom

    if (Environment.isBrowser()) {
      const elSVG = domEls.Paper.node
      // fixes apexcharts.js#1654 & vue-apexcharts#256
      if (elSVG.parentNode && elSVG.parentNode.parentNode && !isUpdating) {
        elSVG.parentNode.parentNode.style.minHeight = 'unset'
      }

      // detach root event
      const baseEl = domEls.baseEl
      if (baseEl) {
        // see https://github.com/apexcharts/vue-apexcharts/issues/275
        this.ctx.eventList.forEach((event) => {
          baseEl.removeEventListener(event, this.ctx.events.documentEvent)
        })
      }

      if (this.ctx.el !== null) {
        // remove all child elements - resetting the whole chart
        while (this.ctx.el.firstChild) {
          this.ctx.el.removeChild(this.ctx.el.firstChild)
        }
      }

      this.killSVG(domEls.Paper)
      domEls.Paper.remove()
    }

    domEls.elWrap = null
    domEls.elGraphical = null
    domEls.elLegendWrap = null
    domEls.elLegendForeign = null
    domEls.baseEl = null
    domEls.elGridRect = null
    domEls.elGridRectMask = null
    domEls.elGridRectBarMask = null
    domEls.elGridRectMarkerMask = null
    domEls.elForecastMask = null
    domEls.elNonForecastMask = null
    domEls.elDefs = null
  }
}
