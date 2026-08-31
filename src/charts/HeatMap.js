// @ts-check
import Animations, { computeStagger } from '../modules/Animations'
import Graphics from '../modules/Graphics'
import Fill from '../modules/Fill'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import Helpers from './common/treemap/Helpers'
import Filters from '../modules/Filters'
import { seriesEmitter } from '../renderers/Renderer'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import { SVGNS } from '../svg/math'

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
    this.shape = this.w.config.plotOptions.heatmap.shape || 'rect'
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

    const ret = graphics.group({
      class: 'apexcharts-heatmap',
    })

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

    // Cell shape. 'hexagon' is a layout, not just a path: it only tessellates
    // with alternate rows offset by half a cell, which is meaningless when
    // cells sit at their real x values, so continuous-X falls back to rect.
    // 'circle' and 'diamond' are per-cell inscriptions and work in any layout.
    let shape = this.shape
    if (isContinuousX && shape === 'hexagon') {
      shape = 'rect'
    }

    // Strata (#2): when the canvas renderer is bundled and active, cells paint
    // to the canvas layer via the columnar rect store (one fillRect per cell,
    // no DOM node) instead of one SVG <rect> each. When it is not active,
    // `emit === graphics` and the SVG path below is unchanged. Interaction
    // (tooltip/hover) on canvas cells is a follow-up; canvas cells are
    // paint-only for now, so the per-cell class/attrs and event delegation are
    // skipped in that mode. Image-fill heatmaps route to SVG (the controller
    // declines canvas for image fills), and so do non-rect cell shapes: the
    // canvas cell store is rect-only (drawRectCell), so shaped cells always
    // render as SVG <path>s rather than growing a columnar path store here.
    const emit = seriesEmitter(this.ctx, graphics)
    const useCanvas =
      shape === 'rect' &&
      emit !== graphics &&
      typeof emit.drawRectCell === 'function'

    if (shape === 'hexagon') {
      this.applyHexagonClipPath(ret, graphics, xDivision, yDivision)
    } else {
      ret.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)
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

      // Honeycomb rows: alternate VISUAL rows (y1 order, so reversed y axes
      // stay alternating) shift a quarter cell left/right. The relative offset
      // between neighbouring rows is the half cell tessellation requires,
      // while the lattice stays centred under the column ticks (every row is
      // a quarter cell off its tick, instead of half the rows dead-on and the
      // other half a full half-cell off) and the grid-box overhang is a
      // symmetric cellW/4 per side.
      const visualRow = Math.round(y1 / yDivision)
      const rowOffset =
        shape === 'hexagon'
          ? ((visualRow % 2 === 0 ? -1 : 1) * xDivision) / 4
          : 0

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

        // Corner radius is a rect concept; the other shapes ignore it.
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
          // SVG cell: a <rect> for the default shape, a <path> for the shaped
          // cells. Both carry the same 'apexcharts-heatmap-rect' class and
          // i/j/val attrs (tooltip event delegation, keyboard navigation and
          // legend-range highlighting all resolve cells through them), and the
          // same cx/cy convention (the cell box's top-left, in grid space).
          const isRectCell = shape === 'rect'
          const cell = isRectCell
            ? graphics.drawRect(x1, y1, cellW, yDivision, radius)
            : graphics.drawPath({
                d: this.cellShapePath(
                  shape,
                  x1 + rowOffset,
                  y1,
                  cellW,
                  yDivision,
                ),
                stroke,
                strokeWidth: this.strokeWidth,
                fill: color,
                fillOpacity: 1,
              })
          cell.attr({
            cx: x1 + rowOffset,
            cy: y1,
          })
          cell.node.classList.add('apexcharts-heatmap-rect')
          elSeries.add(cell)

          cell.attr({
            fill: color,
            i,
            index: i,
            j,
            val: series[i][j],
            'stroke-width': this.strokeWidth,
            stroke,
            color,
          })

          if (!isRectCell) {
            // A <path> has no geometry attributes of its own; the tooltip and
            // keyboard navigation read the cell box off width/height (and the
            // cx/cy above, which for hexagon rows already carry the row
            // offset, so cx + width / 2 is the cell's true visual centre).
            cell.attr({
              width: cellW,
              height: yDivision,
            })
          }

          if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
            let speed = 1
            if (!w.globals.resized) {
              speed = w.config.chart.animations.speed
            }
            if (isRectCell) {
              this.animateHeatMap(cell, x1, y1, cellW, yDivision, speed, i, j)
            } else {
              // A <path> has no x/y/width/height to tween, so shaped cells
              // scale in from their own centre (transform-box: fill-box) with
              // the same diagonal-wave stagger the rect cells get.
              const animations = new Animations(this.w)
              animations.animatePop(cell, {
                speed,
                delay: this.enterStaggerDelay(speed, i, j),
                onComplete: () => {
                  animations.animationCompleted(cell)
                },
              })
            }
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
                cell,
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

        // Labels sit at the cell's visual centre, so offset hexagon rows carry
        // their labels with them. Width budget is unchanged even for hexagons:
        // the vertical edges span the middle 2/3 of the row pitch, so at the
        // centreline (where the single-line label sits) the hexagon is its
        // full cell width.
        const dataLabels = this.helpers.calculateDataLabels({
          text: formattedText,
          x: x1 + rowOffset + cellW / 2,
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
    const animations = new Animations(this.w)

    const delay = this.enterStaggerDelay(speed, row, col)

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
   * Diagonal-wave stagger for a cell's enter animation: cells animate in
   * order of (row + col), so the reveal travels from top-left to
   * bottom-right. Total stagger is capped at ~half the animation speed
   * regardless of grid size. Shared by the rect geometry tween and the
   * shaped-cell scale-in so every shape reveals with the same wave.
   *
   * @param {number} speed
   * @param {number} row - series index (heatmap row)
   * @param {number} col - data point index (heatmap column)
   */
  enterStaggerDelay(speed, row, col) {
    const w = this.w
    const gradCfg = w.config.chart.animations.animateGradually
    if (!gradCfg || gradCfg.enabled === false) {
      return 0
    }
    const seriesCount = (w.seriesData.series || []).length || 1
    const pointsCount = w.globals.dataPoints || 1
    const maxDiag = seriesCount + pointsCount - 2
    const baseDelay = Math.min(
      gradCfg.delay || 0,
      (speed * 0.5) / Math.max(1, maxDiag),
    )
    return computeStagger({
      style: 'diagonal',
      index: col,
      row,
      col,
      baseDelay,
    })
  }

  /**
   * SVG path for a non-rect cell. x/y/width/height describe the cell's own
   * box (for hexagons, x already includes the row's honeycomb offset).
   *
   * - 'circle': inscribed in the cell box, radius = half the shorter side.
   * - 'diamond': the rhombus joining the box edges' midpoints, so neighbours
   *   touch at those midpoints.
   * - 'hexagon': a pointy-top hexagon stretched to the cell width and 4/3 of
   *   the row pitch tall. With alternate rows offset by half a cell this is
   *   the exact tessellating size: the row pitch stays gridHeight / nRows
   *   (nothing else in the layout pipeline changes) and each hexagon overlaps
   *   the neighbouring rows by a sixth of the pitch. In-row neighbours share
   *   the full vertical edge; diagonal neighbours share a full slanted edge.
   *
   * @param {string} shape
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @returns {string}
   */
  cellShapePath(shape, x, y, width, height) {
    const cx = x + width / 2
    const cy = y + height / 2

    if (shape === 'circle') {
      const r = Math.min(width, height) / 2
      return (
        `M ${cx - r} ${cy} ` +
        `a ${r} ${r} 0 1 0 ${r * 2} 0 ` +
        `a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`
      )
    }

    if (shape === 'diamond') {
      return (
        `M ${cx} ${y} L ${x + width} ${cy} ` +
        `L ${cx} ${y + height} L ${x} ${cy} Z`
      )
    }

    // hexagon: top vertex, right edge, bottom vertex, left edge
    const x2 = x + width
    return (
      `M ${cx} ${y - height / 6} ` +
      `L ${x2} ${y + height / 6} ` +
      `L ${x2} ${y + (height * 5) / 6} ` +
      `L ${cx} ${y + (height * 7) / 6} ` +
      `L ${x} ${y + (height * 5) / 6} ` +
      `L ${x} ${y + height / 6} Z`
    )
  }

  /**
   * Hexagon rows overhang the grid box: a quarter cell horizontally (the
   * alternating quarter-cell row offsets) and a sixth of the row pitch
   * vertically (a tessellating hexagon is 4/3 of the pitch tall). The shared
   * gridRectMask would slice that overhang, so the heatmap group gets its own
   * clip rect sized to the lattice's true extent. Scoped to this group only:
   * the grid border, annotations and every other gridRectMask consumer keep
   * the exact grid box.
   *
   * @param {any} elGroup
   * @param {Graphics} graphics
   * @param {number} xDivision
   * @param {number} yDivision
   */
  applyHexagonClipPath(elGroup, graphics, xDivision, yDivision) {
    const w = this.w
    // same stroke-safety margin convention as Grid.createGridMask
    const pad = this.strokeWidth / 2 + 2
    const clipId = `heatmapHexMask${w.globals.cuid}`
    const defs = w.dom.elDefs.node

    const prev = defs.querySelector(`clipPath[id="${clipId}"]`)
    if (prev && prev.parentNode) {
      prev.parentNode.removeChild(prev)
    }

    const clipPath = BrowserAPIs.createElementNS(SVGNS, 'clipPath')
    clipPath.setAttribute('id', clipId)
    clipPath.appendChild(
      graphics.drawRect(
        -xDivision / 4 - pad,
        -yDivision / 6 - pad,
        w.layout.gridWidth + xDivision / 2 + pad * 2,
        w.layout.gridHeight + yDivision / 3 + pad * 2,
        0,
        '#fff',
      ).node,
    )
    defs.appendChild(clipPath)

    elGroup.attr('clip-path', `url(#${clipId})`)
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
