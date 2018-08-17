import Graphics from './Graphics'
import Dimensions from './Dimensions'

/**
 * ApexCharts Scroller Class for drawing the horizontal scrolling for panning into charts.
 *
 * @module Scroller
 **/

class Scroller {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  init (xyRatios) {
    this.xyRatios = xyRatios

    this.elScroller = null

    this.scrollerButtonLeft = null
    this.scrollerButtonRight = null
    this.scrollerArea = null

    this.gridRect = null

    this.scrollerConfig = this.w.config.chart.scroller
    this.scrollBtnSize = this.scrollerConfig.scrollButtons.size

    if (!this.w.globals.allSeriesCollapsed) {
      this.renderScroller()
    }
  }

  renderScroller () {
    const w = this.w
    const graphics = new Graphics(this.ctx)

    this.elScroller = graphics.group({
      class: 'apexcharts-scroller'
    })

    const dim = new Dimensions(this.ctx)
    const lgRectHeight = dim.getLegendsRect().height - (w.config.legend.position === 'bottom' ? w.config.legend.containerMargin.top : 0) - this.scrollBtnSize / 3
    const titleHeight = dim.getMainTitleCoords().height
    const subtitleHeight = dim.getSubTitleCoords().height

    let scrollerOffsetY = (w.config.legend.position === 'top' || w.config.legend.position === 'bottom') ? lgRectHeight + 15 : 15

    scrollerOffsetY = scrollerOffsetY + titleHeight + subtitleHeight

    this.elScroller.attr({
      transform: `translate(${this.scrollerConfig.offsetX + this.scrollerConfig.padding.left}, ${w.globals.svgHeight - this.scrollerConfig.height - this.scrollBtnSize + this.scrollerConfig.offsetY - scrollerOffsetY})`
    })

    this.renderScrollerTrack()
    this.renderScrollerThumb()

    w.globals.dom.elGraphical.add(this.elScroller)
  }

  renderScrollerTrack () {
    const w = this.w
    const graphics = new Graphics(this.ctx)

    let track = graphics.drawRect(0, 0, 0, 0, 4)

    let x = 0
    let y = -this.scrollerConfig.track.height / 2
    this.scrollerWidth = w.globals.gridWidth - this.scrollerConfig.padding.left - this.scrollerConfig.padding.right
    const height = this.scrollerConfig.track.height

    track.attr({
      id: 'apexcharts-scroller-track',
      class: 'apexcharts-scroller-track',
      x,
      y,
      width: this.scrollerWidth,
      height,
      fill: this.scrollerConfig.track.background,
      'fill-opacity': 1
    })

    this.elScroller.add(track)
  }

  renderScrollerThumb () {
    const w = this.w
    const graphics = new Graphics(this.ctx)

    let x = Math.abs(w.globals.initialminX - w.globals.minX) / this.xyRatios.initialXRatio
    let width = this.scrollerWidth - (Math.abs(w.globals.initialmaxX - w.globals.maxX) / this.xyRatios.initialXRatio) - x

    if (x > this.scrollerWidth) {
      x = this.scrollerWidth
    } else if (x < 0) {
      x = 0
    }
    if (width <= 1) {
      width = 1
    }
    this.scrollerThumb = graphics.drawRect(0, -this.scrollerConfig.thumb.height / 2, width, this.scrollerConfig.thumb.height, 4)
    this.scrollerThumb.attr({
      x,
      width,
      id: 'apexcharts-scroller-thumb',
      class: 'apexcharts-scroller-thumb',
      fill: this.scrollerConfig.thumb.background,
      fillOpacity: 1
    })

    this.elScroller.add(this.scrollerThumb)

    const constraint = {
      minY: -this.scrollerConfig.thumb.height / 2,
      maxY: this.scrollerConfig.thumb.height / 2
    }

    this.scrollerThumb
      .draggable(constraint)
      .on('dragmove', this.scrollerDragging.bind(this))
      .selectize().resize({
        constraint
      })
      .on('resizing', this.scrollerDragging.bind(this))

    this.styleScrollerButtons()
  }

  styleScrollerButtons () {
    const w = this.w
    const scrollerButtonLeft = w.globals.dom.baseEl.querySelector('.apexcharts-scroller .svg_select_points_l')
    const scrollerButtonRight = w.globals.dom.baseEl.querySelector('.apexcharts-scroller .svg_select_points_r')
    const scrollerButtons = [scrollerButtonLeft, scrollerButtonRight]
    for (let i = 0; i < scrollerButtons.length; i++) {
      const btn = scrollerButtons[i]
      Graphics.setAttrs(btn, {
        class: 'apexcharts-scrollbutton',
        r: this.scrollBtnSize,
        fill: this.scrollerConfig.scrollButtons.fillColor,
        stroke: this.scrollerConfig.scrollButtons.borderColor,
        'stroke-width': this.scrollerConfig.scrollButtons.borderWidth
      })
    }
  }

  scrollerDragging () {
    const w = this.w
    const xyRatios = this.xyRatios

    const scrollerRect = this.scrollerThumb.bbox()

    const minX = w.globals.initialminX + (scrollerRect.x * xyRatios.initialXRatio)
    const maxX = w.globals.initialminX + (scrollerRect.x + scrollerRect.width + this.scrollerConfig.padding.left + this.scrollerConfig.padding.right) * xyRatios.initialXRatio

    if (scrollerRect.x < 0 || scrollerRect.x2 > this.scrollerWidth) return

    this.ctx.updateOptionsInternal({
      xaxis: {
        min: minX,
        max: maxX
      }
    },
    false,
    false
    )
  }
}

export default Scroller
