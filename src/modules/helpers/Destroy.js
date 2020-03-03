export default class Destroy {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  clear() {
    if (this.ctx.zoomPanSelection) {
      this.ctx.zoomPanSelection.destroy()
    }
    if (this.ctx.toolbar) {
      this.ctx.toolbar.destroy()
    }

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
    this.clearDomElements()
  }

  killSVG(draw) {
    draw.each(function(i, children) {
      this.removeClass('*')
      this.off()
      this.stop()
    }, true)
    draw.ungroup()
    draw.clear()
  }

  clearDomElements() {
    // detach document event
    this.ctx.eventList.forEach((event) => {
      document.removeEventListener(event, this.ctx.events.documentEvent)
    })

    const domEls = this.w.globals.dom

    if (this.ctx.el !== null) {
      // remove all child elements - resetting the whole chart
      while (this.ctx.el.firstChild) {
        this.ctx.el.removeChild(this.ctx.el.firstChild)
      }
    }

    this.killSVG(domEls.Paper)
    domEls.Paper.remove()

    domEls.elWrap = null
    domEls.elGraphical = null
    domEls.elAnnotations = null
    domEls.elLegendWrap = null
    domEls.baseEl = null
    domEls.elGridRect = null
    domEls.elGridRectMask = null
    domEls.elGridRectMarkerMask = null
    domEls.elDefs = null
  }
}
