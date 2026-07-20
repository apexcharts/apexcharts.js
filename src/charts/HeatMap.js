// @ts-check
import Animations, { computeStagger } from '../modules/Animations'
import Graphics from '../modules/Graphics'
import Fill from '../modules/Fill'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import Helpers from './common/treemap/Helpers'
import Filters from '../modules/Filters'
import { seriesEmitter } from '../renderers/Renderer'

/**
 * ApexCharts HeatMap Class.
 * @module HeatMap
 **/

export default class HeatMap {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   */
  constructor(w, ctx, xyRatios) {
    this.ctx = ctx
    this.w = w

    this.xRatio = xyRatios.xRatio
    this.yRatio = xyRatios.yRatio

    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation

    this.helpers = new Helpers(w, ctx)
    this.rectRadius = this.w.config.plotOptions.heatmap.radius
    this.strokeWidth = this.w.config.stroke.show
      ? this.w.config.stroke.width
      : 0
  }

  /**
   * @param {any[]} series
   */
  draw(series) {
    const w = this.w
    const graphics = new Graphics(this.w, this.ctx)

    // Strata (#2): when the canvas renderer is bundled and active, cells paint
    // to the canvas layer via the columnar rect store (one fillRect per cell,
    // no DOM node) instead of one SVG <rect> each. When it is not active,
    // `emit === graphics` and the SVG path below is unchanged. Interaction
    // (tooltip/hover) on canvas cells is a follow-up; canvas cells are
    // paint-only for now, so the per-cell class/attrs and event delegation are
    // skipped in that mode. Image-fill heatmaps route to SVG (the controller
    // declines canvas for image fills), so useCanvas is false there.
    const emit = seriesEmitter(this.ctx, graphics)
    const useCanvas = emit !== graphics && typeof emit.drawRectCell === 'function'

    const ret = graphics.group({
      class: 'apexcharts-heatmap',
    })

    ret.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)

    // width divided into equal parts
    const xDivision = w.layout.gridWidth / w.globals.dataPoints
    const yDivision = w.layout.gridHeight / w.seriesData.series.length

    // Continuous-X heatmap: when the x axis is numeric or datetime, place each
    // cell at its real x value with a width of the data's smallest gap, instead
    // of tiling cells by index. The x-axis then renders sparse proportional
    // ticks (via the standard isXNumeric path) rather than one label per cell.
    // Categorical heatmaps keep the index-based layout untouched.
    const isContinuousX =
      (w.config.xaxis.type === 'numeric' ||
        w.config.xaxis.type === 'datetime') &&
      w.axisFlags.isXNumeric &&
      this.xRatio > 0
    let binPx = xDivision
    if (isContinuousX) {
      const diff = w.globals.minXDiff
      binPx = Number.isFinite(diff) && diff > 0 ? diff / this.xRatio : xDivision
    }

    // Cell fill opacity for the canvas path (heatmap uses a single fill opacity;
    // default is 1, matching the opaque SVG cells).
    const cellFillOpacity = Array.isArray(w.config.fill.opacity)
      ? w.config.fill.opacity[0] ?? 1
      : w.config.fill.opacity ?? 1

    let y1 = 0
    let rev = false

    this.negRange = this.helpers.checkColorRange()

    const heatSeries = series.slice()

    if (w.config.yaxis[0].reversed) {
      rev = true
      heatSeries.reverse()
    }

    for (
      let i = rev ? 0 : heatSeries.length - 1;
      rev ? i < heatSeries.length : i >= 0;
      rev ? i++ : i--
    ) {
      // el to which series will be drawn
      const elSeries = graphics.group({
        class: `apexcharts-series apexcharts-heatmap-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i,
      })
      Series.addCollapsedClassToSeries(this.w, elSeries, i)

      // Set up event delegation once per series group instead of per-cell
      // listeners. Canvas cells carry no DOM node, so there is nothing to
      // delegate to (tooltip/hover on canvas cells is a follow-up).
      if (!useCanvas) {
        graphics.setupEventDelegation(elSeries, '.apexcharts-heatmap-rect')
      }

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        const filters = new Filters(this.w)
        filters.dropShadow(elSeries, shadow, i)
      }

      let x1 = 0
      const shadeIntensity = w.config.plotOptions.heatmap.shadeIntensity

      let j = 0
      for (let dIndex = 0; dIndex < w.globals.dataPoints; dIndex++) {
        // Recognize gaps and align values based on x axis (index layout only;
        // continuous-X places every cell by its real value, so no gap skipping)
        if (
          !isContinuousX &&
          w.seriesData.seriesX.length &&
          !w.globals.allSeriesHasEqualX
        ) {
          if (
            w.globals.minX + w.globals.minXDiff * dIndex <
            w.seriesData.seriesX[i][j]
          ) {
            x1 = x1 + xDivision
            continue
          }
        }

        // Stop loop if index is out of array length
        if (j >= heatSeries[i].length) break

        // Cell width and left edge: value-based when continuous, else index.
        const cellW = isContinuousX ? binPx : xDivision
        if (isContinuousX) {
          const xVal = w.seriesData.seriesX[i]
            ? w.seriesData.seriesX[i][j]
            : null
          if (xVal == null || xVal !== xVal) {
            j++
            continue
          }
          x1 = (xVal - w.globals.minX) / this.xRatio - binPx / 2
        }

        const heatColor = this.helpers.getShadeColor(
          w.config.chart.type,
          i,
          j,
          this.negRange,
        )
        let color = heatColor.color
        const heatColorProps = heatColor.colorProps

        if (w.config.fill.type === 'image') {
          const fill = new Fill(this.w)

          color = fill.fillPath({
            seriesNumber: i,
            dataPointIndex: j,
            opacity: /** @type {any} */ (w.globals).hasNegs
              ? heatColorProps.percent < 0
                ? 1 - (1 + heatColorProps.percent / 100)
                : shadeIntensity + heatColorProps.percent / 100
              : heatColorProps.percent / 100,
            patternID: Utils.randomId(),
            width: w.config.fill.image.width
              ? w.config.fill.image.width
              : cellW,
            height: w.config.fill.image.height
              ? w.config.fill.image.height
              : yDivision,
          })
        }

        const radius = this.rectRadius
        const stroke = w.config.plotOptions.heatmap.useFillColorAsStroke
          ? color
          : w.globals.stroke.colors[0]

        if (useCanvas) {
          // Canvas: record a columnar cell (paint-only). No DOM node, no
          // per-cell class/attrs, and no enter/color animation (canvas paints
          // the final frame directly).
          emit.drawRectCell(x1, y1, cellW, yDivision, {
            fill: color,
            fillOpacity: cellFillOpacity,
            stroke,
            strokeWidth: this.strokeWidth,
            radius,
            seriesIndex: i,
            dataPointIndex: j,
          })
        } else {
          const rect = graphics.drawRect(x1, y1, cellW, yDivision, radius)
          rect.attr({
            cx: x1,
            cy: y1,
          })
          rect.node.classList.add('apexcharts-heatmap-rect')
          elSeries.add(rect)

          rect.attr({
            fill: color,
            i,
            index: i,
            j,
            val: series[i][j],
            'stroke-width': this.strokeWidth,
            stroke,
            color,
          })

          if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
            let speed = 1
            if (!w.globals.resized) {
              speed = w.config.chart.animations.speed
            }
            this.animateHeatMap(rect, x1, y1, cellW, yDivision, speed, i, j)
          }

          if (w.globals.dataChanged) {
            let speed = 1
            if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
              speed = this.dynamicAnim.speed

              let colorFrom =
                w.globals.previousPaths[i] &&
                w.globals.previousPaths[i][j] &&
                w.globals.previousPaths[i][j].color

              if (!colorFrom) colorFrom = 'rgba(255, 255, 255, 0)'

              this.animateHeatColor(
                rect,
                Utils.isColorHex(colorFrom)
                  ? colorFrom
                  : Utils.rgb2hex(colorFrom),
                Utils.isColorHex(color) ? color : Utils.rgb2hex(color),
                speed,
              )
            }
          }
        }

        const formatter = w.config.dataLabels.formatter
        const formattedText = formatter(w.seriesData.series[i][j], {
          value: w.seriesData.series[i][j],
          seriesIndex: i,
          dataPointIndex: j,
          w,
        })

        const dataLabels = this.helpers.calculateDataLabels({
          text: formattedText,
          x: x1 + cellW / 2,
          y: y1 + yDivision / 2,
          i,
          j,
          colorProps: heatColorProps,
          series: heatSeries,
        })
        if (dataLabels !== null) {
          elSeries.add(dataLabels)
        }

        if (!isContinuousX) x1 = x1 + xDivision
        j++
      }

      y1 = y1 + yDivision

      ret.add(elSeries)
    }

    // adjust yaxis labels for heatmap
    const yAxisScale = /** @type {any[]} */ (
      w.globals.yAxisScale[0].result.slice()
    )
    if (w.config.yaxis[0].reversed) {
      yAxisScale.unshift('')
    } else {
      yAxisScale.push('')
    }
    w.globals.yAxisScale[0].result = yAxisScale

    return ret
  }

  /**
   * @param {any} el
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {number} speed
   * @param {number} [row] - series index (heatmap row)
   * @param {number} [col] - data point index (heatmap column)
   */
  animateHeatMap(el, x, y, width, height, speed, row = 0, col = 0) {
    const w = this.w
    const animations = new Animations(this.w)

    // Diagonal-wave stagger: cells animate in order of (row + col), so the
    // reveal travels from top-left to bottom-right. Total stagger is capped
    // at ~half the animation speed regardless of grid size.
    const animCfg = w.config.chart.animations
    const gradCfg = animCfg.animateGradually
    const staggerEnabled = gradCfg && gradCfg.enabled !== false

    let delay = 0
    if (staggerEnabled) {
      const seriesCount = (w.seriesData.series || []).length || 1
      const pointsCount = w.globals.dataPoints || 1
      const maxDiag = seriesCount + pointsCount - 2
      const baseDelay = Math.min(
        gradCfg.delay || 0,
        (speed * 0.5) / Math.max(1, maxDiag),
      )
      delay = computeStagger({
        style: 'diagonal',
        index: col,
        row,
        col,
        baseDelay,
      })
    }

    animations.animateRect(
      el,
      {
        x: x + width / 2,
        y: y + height / 2,
        width: 0,
        height: 0,
      },
      {
        x,
        y,
        width,
        height,
      },
      speed,
      () => {
        animations.animationCompleted(el)
      },
      delay,
    )
  }

  /**
   * @param {any} el
   * @param {string} colorFrom
   * @param {string} colorTo
   * @param {number} speed
   */
  animateHeatColor(el, colorFrom, colorTo, speed) {
    el.attr({
      fill: colorFrom,
    })
      .animate(speed)
      .attr({
        fill: colorTo,
      })
  }
}
