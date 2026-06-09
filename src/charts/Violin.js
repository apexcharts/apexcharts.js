// @ts-check
import CoreUtils from '../modules/CoreUtils'
import Bar from './Bar'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import { spline, svgPath } from '../libs/monotone-cubic'
import { buildJitterGroups, renderJitter } from './common/Jitter'

/**
 * ApexCharts Violin Class — draws a symmetric density curve per category
 * (the "violin") plus optional individual observations ("jitter").
 *
 * Data is precomputed by the user: each point supplies a density profile
 * (the shape) and a flat array of raw observations (the jitter). See
 * Data.handleViolinData() for the data contract. The density profile and raw
 * points are read from the `w.violinData` slice.
 *
 * Performance: all jitter points for a series render as ONE <path> node
 * (circle/square sub-paths concatenated), never one element per point. Points
 * beyond `plotOptions.violin.points.maxPoints` are stride-thinned, and the
 * jitter offset is a deterministic index hash (no Math.random — SSR-safe).
 *
 * @module Violin
 **/
class Violin extends Bar {
  /**
   * @param {any[]} series
   * @param {string} ctype
   * @param {number} [seriesIndex]
   */
  // @ts-ignore -- Violin.draw has extra ctype param compared to Bar.draw
  draw(series, ctype, seriesIndex) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const fill = new Fill(this.w)

    this.violinOptions = w.config.plotOptions.violin
    this.pointsOptions = this.violinOptions.points
    this.bandwidthScale = this.violinOptions.bandwidthScale || 1
    // 'individual' → each violin scaled to its own peak density (all equal max
    // width). 'group' → all violins scaled to the densest one in the series, so
    // widths stay proportional to density across violins.
    this.normalize = this.violinOptions.normalize || 'individual'
    this.distributed = w.config.plotOptions.bar.distributed
    this.isHorizontal = w.config.plotOptions.bar.horizontal

    this.coreUtils = new CoreUtils(this.w)
    series = this.coreUtils.getLogSeries(series)
    this.series = series
    this.yRatio = this.coreUtils.getLogYRatios(this.yRatio)

    this.barHelpers.initVariables(series)

    const ret = graphics.group({
      class: 'apexcharts-violin-series apexcharts-plot-series',
    })

    for (let i = 0; i < series.length; i++) {
      /** @type {any} */ let x
      /** @type {any} */ let y

      const yArrj = []
      const xArrj = []

      const realIndex = w.globals.comboCharts
        ? /** @type {any} */ (seriesIndex)[i]
        : i
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex)

      const elSeries = graphics.group({
        class: 'apexcharts-series',
        seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
        rel: i + 1,
        'data:realIndex': realIndex,
      })

      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex)

      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1
      }

      let translationsIndex = 0
      if (this.yRatio.length > 1) {
        this.yaxisIndex = /** @type {any} */ (
          w.globals.seriesYAxisReverseMap[realIndex]
        )[0]
        translationsIndex = realIndex
      }

      const initPositions = this.barHelpers.initialPositions(realIndex)
      const {
        y: initY,
        barHeight,
        yDivision,
        zeroW,
        x: initX,
        barWidth,
        xDivision,
        zeroH,
      } = initPositions

      y = initY
      x = initX

      xArrj.push(x + (barWidth ?? 0) / 2)

      const elDataLabelsWrap = graphics.group({
        class: 'apexcharts-datalabels',
        'data:realIndex': realIndex,
      })

      // For 'group' normalization, the densest violin in this series sets the
      // width scale for all of them (preserves relative widths).
      this.seriesMaxWeight = 0
      if (this.normalize === 'group') {
        const dens = w.violinData.seriesViolinDensity[realIndex] || []
        dens.forEach((/** @type {any} */ d) => {
          if (d && d.maxWeight > this.seriesMaxWeight) {
            this.seriesMaxWeight = d.maxWeight
          }
        })
      }

      // Jitter <path>s per violin (per data point), so each can be filled with
      // its own colour. With a value colour-scale each violin yields one path
      // per shade bucket. Either way it's O(violins × shades), never O(points).
      /** @type {{groups:{fill:string|null, d:string}[], j:number}[]} */
      const pointsByViolin = []

      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex)

        const paths = this.isHorizontal
          ? this.drawHorizontalViolin({
              indexes: { i, j, realIndex, translationsIndex },
              y,
              yDivision,
              barHeight,
              zeroW,
            })
          : this.drawVerticalViolin({
              indexes: { i, j, realIndex, translationsIndex },
              x,
              xDivision,
              barWidth,
              zeroH,
            })

        x = paths.x
        y = paths.y

        if (j > 0) {
          xArrj.push(paths.center)
        }
        yArrj.push(paths.alongRepresentative)

        const pointGroups = this.buildPointsSubPath({
          realIndex,
          j,
          center: paths.center,
          halfExtent: paths.halfExtent,
          alongFn: paths.alongFn,
          density: paths.density,
          maxWeight: paths.maxWeight,
        })
        if (pointGroups.length) pointsByViolin.push({ groups: pointGroups, j })

        const pathFill = fill.fillPath({
          // distributed → color per category (data point) instead of per series
          seriesNumber: this.distributed ? j : realIndex,
          dataPointIndex: j,
          color: this.distributed ? w.globals.colors[j] : undefined,
          value: series[i][j],
        })

        this.renderSeries({
          realIndex,
          pathFill,
          lineFill: w.globals.stroke.colors[realIndex],
          j,
          i,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          x,
          y,
          series,
          columnGroupIndex,
          barHeight,
          barWidth,
          elDataLabelsWrap,
          visibleSeries: this.visibleI,
          type: 'violin',
        })

        // Bar's renderSeries anchors cx/cy at the (placeholder) bar geometry,
        // which for a violin lands at the axis baseline — so the shared
        // tooltip would stick to the chart base. Re-anchor the body path's
        // value-axis coordinate to the representative position (density mode)
        // so the tooltip sits at the middle of the violin instead.
        const bodyEl = elSeries.node.querySelector(
          `path.apexcharts-violin-area[j='${j}']`,
        )
        if (bodyEl && isFinite(paths.alongRepresentative)) {
          bodyEl.setAttribute(
            this.isHorizontal ? 'cx' : 'cy',
            `${paths.alongRepresentative}`,
          )
        }
      }

      // Jitter overlay (shared module): one packed path per violin, drawn over
      // the bodies and revealed gradually after the body paths animate.
      renderJitter({
        graphics,
        w,
        elSeries,
        pointsByCat: pointsByViolin,
        options: this.pointsOptions,
        distributed: this.distributed,
        realIndex,
        wrapClass: 'apexcharts-violin-points-wrap',
        pointClass: 'apexcharts-violin-points',
      })

      w.globals.seriesXvalues[realIndex] = xArrj
      w.globals.seriesYvalues[realIndex] = yArrj

      ret.add(elSeries)
    }

    return ret
  }

  /** @param {{indexes: any, x: any, xDivision: any, barWidth: any, zeroH: any}} opts */
  drawVerticalViolin({ indexes, x, xDivision, barWidth, zeroH }) {
    const w = this.w
    const { realIndex, j, translationsIndex } = indexes
    const yRatio = this.yRatio[translationsIndex]

    if (w.axisFlags.isXNumeric) {
      x =
        (w.seriesData.seriesX[realIndex][j] - w.globals.minX) / this.xRatio -
        barWidth / 2
    }

    const barXPosition = x + barWidth * this.visibleI
    const center = barXPosition + barWidth / 2
    const halfExtent = barWidth / 2

    const density = this.getDensity(realIndex, j)
    const maxWeight = this.effectiveMaxWeight(density)
    /** @param {number} v */
    const alongFn = (v) => zeroH - this.logVal(v, realIndex) / yRatio

    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center,
      halfExtent,
      maxWeight,
      vertical: true,
      alongFn,
      collapsed: false,
    })

    let pathFrom
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo)
    } else {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center,
        halfExtent,
        maxWeight,
        vertical: true,
        alongFn,
        collapsed: true,
      })
    }

    if (!w.axisFlags.isXNumeric) {
      x = x + xDivision
    }

    return {
      pathTo,
      pathFrom,
      x,
      y: zeroH,
      center,
      halfExtent,
      alongFn,
      density,
      maxWeight,
      alongRepresentative: alongFn(this.series[indexes.i][j] ?? 0),
    }
  }

  /** @param {{indexes: any, y: any, yDivision: any, barHeight: any, zeroW: any}} opts */
  drawHorizontalViolin({ indexes, y, yDivision, barHeight, zeroW }) {
    const w = this.w
    const { realIndex, j } = indexes
    const yRatio = this.invertedYRatio

    if (w.axisFlags.isXNumeric) {
      y =
        (w.seriesData.seriesX[realIndex][j] - w.globals.minX) /
          this.invertedXRatio -
        barHeight / 2
    }

    const barYPosition = y + barHeight * this.visibleI
    const center = barYPosition + barHeight / 2
    const halfExtent = barHeight / 2

    const density = this.getDensity(realIndex, j)
    const maxWeight = this.effectiveMaxWeight(density)
    /** @param {number} v */
    const alongFn = (v) => zeroW + this.logVal(v, realIndex) / yRatio

    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center,
      halfExtent,
      maxWeight,
      vertical: false,
      alongFn,
      collapsed: false,
    })

    let pathFrom
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo)
    } else {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center,
        halfExtent,
        maxWeight,
        vertical: false,
        alongFn,
        collapsed: true,
      })
    }

    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision
    }

    return {
      pathTo,
      pathFrom,
      x: zeroW,
      y,
      center,
      halfExtent,
      alongFn,
      maxWeight,
      density,
      alongRepresentative: alongFn(this.series[indexes.i][j] ?? 0),
    }
  }

  /**
   * Read the parsed density for one violin and return sorted, de-duplicated
   * nodes (strictly increasing value — a hard requirement for the spline).
   * @param {number} realIndex
   * @param {number} j
   */
  getDensity(realIndex, j) {
    const w = this.w
    const d = w.violinData.seriesViolinDensity[realIndex]?.[j]
    if (!d || !d.values.length) {
      return { nodes: [], maxWeight: 0 }
    }
    const order = d.values.map(
      (/** @type {any} */ _, /** @type {any} */ k) => k,
    )
    order.sort(
      (/** @type {number} */ a, /** @type {number} */ b) =>
        d.values[a] - d.values[b],
    )
    /** @type {{v:number, w:number}[]} */
    const nodes = []
    let prevV = null
    for (const k of order) {
      const v = d.values[k]
      if (prevV !== null && v === prevV) continue
      nodes.push({ v, w: d.weights[k] })
      prevV = v
    }
    return { nodes, maxWeight: d.maxWeight }
  }

  /**
   * The peak weight used to scale a violin's width: its own ('individual') or
   * the densest violin in the series ('group', preserving relative widths).
   * @param {{maxWeight:number}} density
   */
  effectiveMaxWeight(density) {
    return this.normalize === 'group' && this.seriesMaxWeight > 0
      ? this.seriesMaxWeight
      : density.maxWeight
  }

  /**
   * Build the closed, smooth violin outline. The value axis is the monotonic
   * parameter for the spline (vertical → Y, horizontal → X); the spline is fed
   * with that axis first and the control points swapped back to screen space.
   *
   * @param {{nodes:{v:number,w:number}[], center:number, halfExtent:number, maxWeight:number, vertical:boolean, alongFn:(v:number)=>number, collapsed:boolean}} opts
   */
  buildBodyPath({
    nodes,
    center,
    halfExtent,
    maxWeight,
    vertical,
    alongFn,
    collapsed,
  }) {
    const graphics = new Graphics(this.w)
    if (nodes.length === 0) {
      // Degenerate: a zero-length centerline at the category center.
      const a = alongFn(0)
      return vertical
        ? graphics.move(center, a) + graphics.line(center, a)
        : graphics.move(a, center) + graphics.line(a, center)
    }

    /** @param {number} weight */
    const wpxOf = (weight) => {
      if (collapsed || maxWeight <= 0) return 0
      const wp = (weight / maxWeight) * halfExtent * this.bandwidthScale
      return Math.min(halfExtent, Math.max(0, wp))
    }

    /** @type {[number,number][]} */ const rightPts = []
    /** @type {[number,number][]} */ const leftPts = []
    for (let k = 0; k < nodes.length; k++) {
      const a = alongFn(nodes[k].v)
      const wp = wpxOf(nodes[k].w)
      if (vertical) {
        rightPts.push([center + wp, a])
        leftPts.push([center - wp, a])
      } else {
        rightPts.push([a, center + wp])
        leftPts.push([a, center - wp])
      }
    }
    leftPts.reverse()

    return (
      this.smoothSegment(rightPts, vertical, false) +
      this.smoothSegment(leftPts, vertical, true) +
      'z'
    )
  }

  /**
   * Emit one edge as a smooth (monotone-cubic) path segment, or a polyline
   * when there are too few nodes for a spline.
   *
   * @param {[number,number][]} screenPts ordered screen points for this edge
   * @param {boolean} monotonicIsY true when the value axis is vertical
   * @param {boolean} continued false → start with M; true → start with L (joins the previous edge)
   */
  smoothSegment(screenPts, monotonicIsY, continued) {
    const graphics = new Graphics(this.w)
    const first = screenPts[0]
    let d = continued
      ? graphics.line(first[0], first[1])
      : graphics.move(first[0], first[1])

    const usePolyline =
      screenPts.length < 3 || !this.strictlyMonotonic(screenPts, monotonicIsY)
    if (usePolyline) {
      for (let k = 1; k < screenPts.length; k++) {
        d += graphics.line(screenPts[k][0], screenPts[k][1])
      }
      return d
    }

    // monotone-cubic spline needs the monotonic coordinate first
    const input = screenPts.map(([px, py]) =>
      monotonicIsY ? [py, px] : [px, py],
    )
    const bez = spline.points(input)
    const out = monotonicIsY ? bez.map(swapPairs) : bez
    d += svgPath(out)
    return d
  }

  /**
   * @param {[number,number][]} screenPts
   * @param {boolean} monotonicIsY
   */
  strictlyMonotonic(screenPts, monotonicIsY) {
    const axis = monotonicIsY ? 1 : 0
    for (let k = 1; k < screenPts.length; k++) {
      if (screenPts[k][axis] === screenPts[k - 1][axis]) return false
    }
    return true
  }

  /**
   * Build the jitter sub-paths for one violin, grouped for rendering. Returns
   * `[]` when points are hidden or absent. Normally one group (single dot
   * colour); with `points.colorScale` the dots are bucketed by value into shade
   * groups, each carrying its ramp colour. Offsets are a deterministic index
   * hash (SSR-safe); points beyond maxPoints are stride-thinned.
   *
   * @param {{realIndex:number, j:number, center:number, halfExtent:number, alongFn:(v:number)=>number, density:{nodes:{v:number,w:number}[], maxWeight:number}, maxWeight:number}} opts
   * @returns {{fill:string|null, d:string}[]}
   */
  buildPointsSubPath({
    realIndex,
    j,
    center,
    halfExtent,
    alongFn,
    density,
    maxWeight,
  }) {
    return buildJitterGroups({
      w: this.w,
      points: this.w.violinData.seriesViolinPoints[realIndex]?.[j],
      seedA: realIndex,
      seedB: j,
      center,
      halfExtent,
      alongFn,
      isHorizontal: this.isHorizontal,
      options: this.pointsOptions,
      // Violin clamps jitter to the density half-width at each value so dots
      // stay inside the shape.
      clampAt: (v) => this.halfWidthAtValue(v, density, halfExtent, maxWeight),
    })
  }

  /**
   * Density half-width (pixels) at a given value — used to keep jitter inside
   * the violin. Linear interpolation between the two nearest density nodes.
   * @param {number} value
   * @param {{nodes:{v:number,w:number}[], maxWeight:number}} density
   * @param {number} halfExtent
   * @param {number} [maxWeightOverride] use the group max for 'group' normalize
   */
  halfWidthAtValue(value, density, halfExtent, maxWeightOverride) {
    const { nodes } = density
    const maxWeight =
      maxWeightOverride != null ? maxWeightOverride : density.maxWeight
    if (!nodes.length || maxWeight <= 0) return 0
    /** @param {number} weight */
    const toPx = (weight) =>
      Math.min(
        halfExtent,
        (weight / maxWeight) * halfExtent * this.bandwidthScale,
      )

    if (value <= nodes[0].v) return toPx(nodes[0].w)
    if (value >= nodes[nodes.length - 1].v)
      return toPx(nodes[nodes.length - 1].w)
    for (let k = 1; k < nodes.length; k++) {
      if (value <= nodes[k].v) {
        const a = nodes[k - 1]
        const b = nodes[k]
        const t = b.v === a.v ? 0 : (value - a.v) / (b.v - a.v)
        return toPx(a.w + (b.w - a.w) * t)
      }
    }
    return 0
  }

  /**
   * Apply the y-axis log transform to a value when that axis is logarithmic,
   * mirroring BoxCandleStick. Linear axes return the value unchanged.
   * @param {number} value
   * @param {number} realIndex
   */
  logVal(value, realIndex) {
    return /** @type {any} */ (this.coreUtils).getLogValAtSeriesIndex(
      value,
      realIndex,
    )
  }
}

/**
 * Swap each adjacent (a,b) pair inside a spline control-point array so a path
 * built in (monotonic, cross) space is emitted in (x, y) screen space.
 * @param {number[]} arr
 * @returns {number[]}
 */
function swapPairs(arr) {
  const out = []
  for (let k = 0; k < arr.length; k += 2) {
    out.push(arr[k + 1], arr[k])
  }
  return out
}


export default Violin
