import Graphics from './Graphics'
import Filters from './Filters'
import Utils from '../utils/Utils'

class Crosshairs {
  constructor(w) {
    this.w = w
  }

  drawXCrosshairs() {
    const w = this.w

    const graphics = new Graphics(this.w)
    const filters = new Filters(this.w)

    const crosshairGradient = w.config.xaxis.crosshairs.fill.gradient
    const crosshairShadow = w.config.xaxis.crosshairs.dropShadow

    const fillType = w.config.xaxis.crosshairs.fill.type
    const gradientFrom = crosshairGradient.colorFrom
    const gradientTo = crosshairGradient.colorTo
    const opacityFrom = crosshairGradient.opacityFrom
    const opacityTo = crosshairGradient.opacityTo
    const stops = crosshairGradient.stops

    const shadow = 'none'
    const dropShadow = crosshairShadow.enabled
    const shadowLeft = crosshairShadow.left
    const shadowTop = crosshairShadow.top
    const shadowBlur = crosshairShadow.blur
    const shadowColor = crosshairShadow.color
    const shadowOpacity = crosshairShadow.opacity

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
          stops,
          null
        )
      }

      let xcrosshairs = graphics.drawRect()
      if (w.config.xaxis.crosshairs.width === 1) {
        // to prevent drawing 2 lines, convert rect to line
        xcrosshairs = graphics.drawLine()
      }

      let gridHeight = w.layout.gridHeight
      if (!Utils.isNumber(gridHeight) || gridHeight < 0) {
        gridHeight = 0
      }
      let crosshairsWidth = w.config.xaxis.crosshairs.width
      if (!Utils.isNumber(crosshairsWidth) || crosshairsWidth < 0) {
        crosshairsWidth = 0
      }

      xcrosshairs.attr({
        class: 'apexcharts-xcrosshairs',
        x: 0,
        y: 0,
        y2: gridHeight,
        width: crosshairsWidth,
        height: gridHeight,
        fill: xcrosshairsFill,
        filter: shadow,
        'fill-opacity': w.config.xaxis.crosshairs.opacity,
        stroke: w.config.xaxis.crosshairs.stroke.color,
        'stroke-width': w.config.xaxis.crosshairs.stroke.width,
        'stroke-dasharray': w.config.xaxis.crosshairs.stroke.dashArray
      })

      if (dropShadow) {
        xcrosshairs = filters.dropShadow(xcrosshairs, {
          left: shadowLeft,
          top: shadowTop,
          blur: shadowBlur,
          color: shadowColor,
          opacity: shadowOpacity
        })
      }

      w.dom.elGraphical.add(xcrosshairs)
    }
  }

  drawYCrosshairs() {
    const w = this.w

    const graphics = new Graphics(this.w)

    const crosshair = w.config.yaxis[0].crosshairs
    const offX = w.globals.barPadForNumericAxis

    if (w.config.yaxis[0].crosshairs.show) {
      const ycrosshairs = graphics.drawLine(
        -offX,
        0,
        w.layout.gridWidth + offX,
        0,
        crosshair.stroke.color,
        crosshair.stroke.dashArray,
        crosshair.stroke.width
      )
      ycrosshairs.attr({
        class: 'apexcharts-ycrosshairs'
      })

      w.dom.elGraphical.add(ycrosshairs)
    }

    // draw an invisible crosshair to help in positioning the yaxis tooltip
    const ycrosshairsHidden = graphics.drawLine(
      -offX,
      0,
      w.layout.gridWidth + offX,
      0,
      crosshair.stroke.color,
      0,
      0
    )
    ycrosshairsHidden.attr({
      class: 'apexcharts-ycrosshairs-hidden'
    })

    w.dom.elGraphical.add(ycrosshairsHidden)
  }
}

export default Crosshairs
