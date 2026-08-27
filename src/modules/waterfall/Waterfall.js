// @ts-check
/**
 * The waterfall connector layer.
 *
 * A waterfall's columns float, so without something joining them the reader has
 * to guess whether the next bar starts where the last one stopped: the
 * connectors are what make the chart read as one continuous walk rather than a
 * row of unrelated floats. They are also the one part of a waterfall that
 * cannot be expressed as configuration on a bar chart, because there is no such
 * element to configure.
 *
 * Each connector is a single segment at the running total after bar `j`,
 * spanning the gap to bar `j + 1`. That level is bar `j`'s own far edge for
 * every kind of bar (a step bar ends at the new total, and a subtotal / total
 * bar's far edge IS the total it restates), so the geometry the renderer
 * committed to is the only input needed and the connectors cannot land
 * anywhere else.
 *
 * @module modules/waterfall/Waterfall
 */
import Graphics from '../Graphics'
import { Environment } from '../../utils/Environment.js'

export default class Waterfall {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
  }

  /** @returns {boolean} */
  isActive() {
    return this.w.config.chart.requestedType === 'waterfall'
  }

  /**
   * Draw (or redraw) the connector layer into the graphical group.
   *
   * Called from both render paths and safe to call on a chart that is not a
   * waterfall, has connectors switched off, or drew no columns.
   */
  drawConnectors() {
    const w = this.w
    if (!this.isActive()) return

    const cfg = w.config.plotOptions?.waterfall?.connectors
    if (!cfg || cfg.show === false) return

    const host = w.dom.elGraphical
    const geo = w.waterfallData && w.waterfallData.geometry
    if (!host || !geo) return

    // The fast update path redraws the series into the existing graphical
    // group, so a stale layer would accumulate one copy per update.
    this.removeConnectors()

    const graphics = new Graphics(w, this.ctx)
    const group = graphics.group({ class: 'apexcharts-waterfall-connectors' })

    const color = cfg.color || w.config.grid.borderColor
    const strokeWidth = cfg.strokeWidth == null ? 1 : cfg.strokeWidth
    const dashArray = cfg.strokeDashArray == null ? 3 : cfg.strokeDashArray

    let drawn = 0
    for (let i = 0; i < geo.length; i++) {
      const bars = geo[i]
      if (!Array.isArray(bars)) continue

      for (let j = 0; j < bars.length - 1; j++) {
        const a = bars[j]
        const b = bars[j + 1]
        // A hole draws no bar, so there is nothing to join it to. Reaching
        // across it would assert a step the data does not make.
        if (!a || !b) continue

        // Bars that touch (columnWidth at 100%) leave no gap to draw in, and a
        // zero-length segment is a DOM node nobody can see.
        const gap = b.slotStart - a.slotEnd
        if (!(gap > 0.5)) continue

        // Horizontal bars run along x, so the connector is the vertical
        // segment at the level bar `j` reached; vertical bars are the mirror.
        const line = a.horizontal
          ? graphics.drawLine(
              a.levelEnd,
              a.slotEnd,
              a.levelEnd,
              b.slotStart,
              color,
              dashArray,
              strokeWidth,
            )
          : graphics.drawLine(
              a.slotEnd,
              a.levelEnd,
              b.slotStart,
              a.levelEnd,
              color,
              dashArray,
              strokeWidth,
            )

        line.node.classList.add('apexcharts-waterfall-connector')
        group.add(line)
        drawn++
      }
    }

    if (!drawn) return

    // Same mask the bars carry, so a connector at a level outside the current
    // y window is clipped instead of drawn across the axis.
    group.attr('clip-path', `url(#gridRectBarMask${w.globals.cuid})`)

    // Above the bars, below the axis chrome. On the full render the axes do not
    // exist yet and appending is already correct; the fast update path redraws
    // series into a tree that has them, so there the layer has to be slotted in
    // rather than appended on top of the axis line and ticks.
    const xaxisEl = host.node.querySelector('.apexcharts-xaxis')
    if (xaxisEl) {
      host.node.insertBefore(group.node, xaxisEl)
    } else {
      host.add(group)
    }

    this.holdUntilBarsLand(group)
  }

  /** Drop the connector layer, if one is present. */
  removeConnectors() {
    const host = this.w.dom.elGraphical
    const prev =
      host && host.node.querySelector('.apexcharts-waterfall-connectors')
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev)
  }

  /**
   * Connectors describe where the bars END UP, so drawn at full opacity while
   * the bars are still growing they hang in mid-air over nothing. Held hidden
   * and faded in with the rest of the delayed chrome once the bars land.
   *
   * When there is no animation to wait for, `showDelayedElements` has already
   * run for this render, so registering would leave the layer hidden for good.
   *
   * @param {any} group
   */
  holdUntilBarsLand(group) {
    const w = this.w
    const animate =
      Environment.isBrowser() &&
      w.globals.shouldAnimate &&
      !w.globals.animationEnded
    if (!animate) return

    group.node.classList.add('apexcharts-element-hidden')
    w.globals.delayedElements.push({ el: group.node, holdUntilComplete: true })
  }
}
