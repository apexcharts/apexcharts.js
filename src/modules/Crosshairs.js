import Graphics from './Graphics'
import Filters from './Filters'

class Crosshairs {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  drawXCrosshairs () {
    const w = this.w

    let graphics = new Graphics(this.ctx)
    let filters = new Filters(this.ctx)

    let crosshairGradient = w.config.xaxis.crosshairs.fill.gradient
    let crosshairShadow = w.config.xaxis.crosshairs.dropShadow

    let fillType = w.config.xaxis.crosshairs.fill.type
    let gradientFrom = crosshairGradient.colorFrom
    let gradientTo = crosshairGradient.colorTo
    let opacityFrom = crosshairGradient.opacityFrom
    let opacityTo = crosshairGradient.opacityTo
    let stops = crosshairGradient.stops

    let shadow = 'none'
    let dropShadow = crosshairShadow.enabled
    let shadowLeft = crosshairShadow.left
    let shadowTop = crosshairShadow.top
    let shadowBlur = crosshairShadow.blur
    let shadowOpacity = crosshairShadow.opacity

    let xcrosshairsFill = w.config.xaxis.crosshairs.fill.color

    if (w.config.xaxis.crosshairs.show) {
      if (fillType === 'gradient') {
        xcrosshairsFill = graphics.drawGradient(
          'vertical',
          gradientFrom,
          gradientTo,
          opacityFrom,
          opacityTo,
          null,
          stops
        )
      }

      let xcrosshairs = graphics.drawRect()
      xcrosshairs.attr({
        class: 'apexcharts-xcrosshairs',
        x: 0,
        y: 0,
        width: 0,
        height: w.globals.gridHeight,
        fill: xcrosshairsFill,
        filter: shadow,
        'fill-opacity': w.config.xaxis.crosshairs.opacity,
        'stroke': w.config.xaxis.crosshairs.stroke.color,
        'stroke-width': w.config.xaxis.crosshairs.stroke.width,
        'stroke-dasharray': w.config.xaxis.crosshairs.stroke.dashArray
      })

      if (dropShadow) {
        xcrosshairs = filters.dropShadow(xcrosshairs, {
          left: shadowLeft,
          top: shadowTop,
          blur: shadowBlur,
          opacity: shadowOpacity
        })
      }

      w.globals.dom.elGraphical.add(xcrosshairs)
    }
  }

  drawYCrosshairs () {
    const w = this.w

    let graphics = new Graphics(this.ctx)

    let crosshair = w.config.yaxis[0].crosshairs

    if (w.config.yaxis[0].crosshairs.show) {
      let ycrosshairs = graphics.drawLine(0, 0, w.globals.gridWidth, 0, crosshair.stroke.color, crosshair.stroke.dashArray, crosshair.stroke.width)
      ycrosshairs.attr({
        class: 'apexcharts-ycrosshairs'
      })

      w.globals.dom.elGraphical.add(ycrosshairs)
    }

    // draw an invisible crosshair to help in positioning the yaxis tooltip
    let ycrosshairsHidden = graphics.drawLine(0, 0, w.globals.gridWidth, 0, crosshair.stroke.color, 0, 0)
    ycrosshairsHidden.attr({
      class: 'apexcharts-ycrosshairs-hidden'
    })

    w.globals.dom.elGraphical.add(ycrosshairsHidden)
  }
}

export default Crosshairs
