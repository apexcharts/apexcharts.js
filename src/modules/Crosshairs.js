// @ts-check
import Graphics from './Graphics'
import Filters from './Filters'
import Utils from '../utils/Utils'

class Crosshairs {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
  }

  drawXCrosshairs() {
    const w = this.w

    // Idempotent: the fast update path redraws crosshairs without a full
    // teardown, so drop a previously drawn one instead of accumulating.
    w.dom.elGraphical.node
      .querySelectorAll(':scope > .apexcharts-xcrosshairs')
      .forEach((/** @type {any} */ el) => el.remove())

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
          [],
        )
      }

      // width === 1 draws a line (a filled rect would show as two edges);
      // any other width is a filled band rect. Create ONLY the element we
      // keep: graphics.drawRect()/drawLine() append to the Paper immediately,
      // so creating a rect and then swapping to a line orphans a classless
      // 0x0 rect on the svg root. That was invisible under the full render
      // (the whole subtree is torn down) but leaked one rect per data-only
      // fast update, which preserves the DOM.
      let xcrosshairs =
        w.config.xaxis.crosshairs.width === 1
          ? graphics.drawLine(0, 0, 0, 0)
          : graphics.drawRect()

      let gridHeight = w.layout.gridHeight
      if (!Utils.isNumber(gridHeight) || gridHeight < 0) {
        gridHeight = 0
      }
      let crosshairsWidth = w.config.xaxis.crosshairs.width
      if (!Utils.isNumber(crosshairsWidth) || Number(crosshairsWidth) < 0) {
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
        'stroke-dasharray': w.config.xaxis.crosshairs.stroke.dashArray,
      })

      if (dropShadow) {
        xcrosshairs = filters.dropShadow(xcrosshairs, {
          left: shadowLeft,
          top: shadowTop,
          blur: shadowBlur,
          color: shadowColor,
          opacity: shadowOpacity,
        })
      }

      w.dom.elGraphical.add(xcrosshairs)
    }
  }

  drawYCrosshairs() {
    const w = this.w

    // Idempotent (see drawXCrosshairs)
    w.dom.elGraphical.node
      .querySelectorAll(
        ':scope > .apexcharts-ycrosshairs, :scope > .apexcharts-ycrosshairs-hidden',
      )
      .forEach((/** @type {any} */ el) => el.remove())

    const graphics = new Graphics(this.w)

    const crosshair = /** @type {any[]} */ (w.config.yaxis)[0].crosshairs
    const offX = w.globals.barPadForNumericAxis

    if (/** @type {any[]} */ (w.config.yaxis)[0].crosshairs.show) {
      const ycrosshairs = graphics.drawLine(
        -offX,
        0,
        w.layout.gridWidth + offX,
        0,
        crosshair.stroke.color,
        crosshair.stroke.dashArray,
        crosshair.stroke.width,
      )
      ycrosshairs.attr({
        class: 'apexcharts-ycrosshairs',
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
      0,
    )
    ycrosshairsHidden.attr({
      class: 'apexcharts-ycrosshairs-hidden',
    })

    w.dom.elGraphical.add(ycrosshairsHidden)
  }
}

export default Crosshairs
