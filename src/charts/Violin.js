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
 * ApexCharts Violin Class — draws a density curve per category (the
 * "violin") plus optional individual observations ("jitter").
 *
 * The body is symmetric by default; `plotOptions.violin.side` cuts it to a
 * half-violin, `plotOptions.violin.box` adds a five-number box lane, and
 * `plotOptions.violin.points.position` moves the jitter into its own lane.
 * Those three together are the raincloud chart type (an alias of violin);
 * each is equally available to a plain violin.
 *
 * Data is precomputed by the user: each point supplies a density profile
 * (the shape), a flat array of raw observations (the jitter) and optionally
 * a five-number summary (the box). See Data.handleViolinData() for the data
 * contract. All three are read from the `w.violinData` slice.
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
    this.boxOptions = this.violinOptions.box || {}
    // Cross-axis signs: which side the density is drawn on (0 = symmetric)
    // and which side the jitter lane sits on (0 = centered on the slot).
    // Hidden points carve no lane: a raincloud minus its rain reflows that
    // space to the cloud instead of keeping a dead strip.
    this.cloudSign = crossSign(this.violinOptions.side)
    this.rainSign =
      this.pointsOptions.show === false
        ? 0
        : crossSign(this.pointsOptions.position)
    this.boxShown = this.boxOptions.show === true
    this.boxFrac = this.boxShown ? laneFrac(this.boxOptions.width, 0.15) : 0
    this.rainFrac = laneFrac(this.pointsOptions.laneWidth, 0.4)
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
          cloudBase: paths.cloudBase,
          cloudMaxPx: paths.cloudMaxPx,
          rainCenter: paths.rainCenter,
          rainHalfPx: paths.rainHalfPx,
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

        // Box lane (raincloud "umbrella" / violin box overlay): sibling paths
        // with the same `j`, rendered AFTER the cx/cy re-anchor above so the
        // body stays the first DOM match every tooltip positioner grabs.
        if (paths.boxPaths) {
          const boxStrokeWidth = this.boxOptions.strokeWidth ?? 1
          paths.boxPaths.forEach((bp) => {
            this.renderSeries({
              realIndex,
              pathFill: bp.filled
                ? this.boxOptions.fillColor || pathFill
                : 'none',
              lineFill: w.globals.stroke.colors[realIndex],
              j,
              i,
              pathFrom: bp.pathFrom,
              pathTo: bp.pathTo,
              strokeWidth: boxStrokeWidth,
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
              classes: 'apexcharts-raincloud-box',
            })
          })
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

    const lanes = resolveLanes({
      halfExtent,
      cloudSign: this.cloudSign ?? 0,
      rainSign: this.rainSign ?? 0,
      boxFrac: this.boxFrac ?? 0,
      rainFrac: this.rainFrac ?? 0,
    })
    const cloudBase = center + lanes.cloudBaseOff

    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center: cloudBase,
      halfExtent: lanes.cloudMaxPx,
      maxWeight,
      vertical: true,
      alongFn,
      collapsed: false,
      sideSign: this.cloudSign,
    })

    let pathFrom = null
    // Cross-type morph (unit -> violin): grow out of the captured dot cloud
    // rather than out of a collapsed centreline, so collapsing is the inverse
    // of the explode. Same precedence as bar/Helpers.js.
    const morphFrom = this.ctx?.morphTypeChange?.getInitialPathFor(realIndex, j)
    if (morphFrom) {
      pathFrom = morphFrom
    } else if (w.globals.previousPaths.length > 0) {
      // Keyed survivor → morph; shape-changed → snap; entering → null
      // (falls through to the collapsed-centerline enter below).
      pathFrom = this.getPreviousPath(realIndex, j, pathTo)
    }
    if (pathFrom == null) {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center: cloudBase,
        halfExtent: lanes.cloudMaxPx,
        maxWeight,
        vertical: true,
        alongFn,
        collapsed: true,
        sideSign: this.cloudSign,
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
      cloudBase,
      cloudMaxPx: lanes.cloudMaxPx,
      rainCenter: center + lanes.rainCenterOff,
      rainHalfPx: lanes.rainHalfPx,
      boxPaths: this.buildBoxSubPaths({
        realIndex,
        j,
        boxCenter: center + lanes.boxCenterOff,
        boxHalfPx: lanes.boxHalfPx,
        alongFn,
        vertical: true,
      }),
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

    const lanes = resolveLanes({
      halfExtent,
      cloudSign: this.cloudSign ?? 0,
      rainSign: this.rainSign ?? 0,
      boxFrac: this.boxFrac ?? 0,
      rainFrac: this.rainFrac ?? 0,
    })
    const cloudBase = center + lanes.cloudBaseOff

    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center: cloudBase,
      halfExtent: lanes.cloudMaxPx,
      maxWeight,
      vertical: false,
      alongFn,
      collapsed: false,
      sideSign: this.cloudSign,
    })

    let pathFrom = null
    // Cross-type morph (unit -> violin): grow out of the captured dot cloud
    // rather than out of a collapsed centreline, so collapsing is the inverse
    // of the explode. Same precedence as bar/Helpers.js.
    const morphFrom = this.ctx?.morphTypeChange?.getInitialPathFor(realIndex, j)
    if (morphFrom) {
      pathFrom = morphFrom
    } else if (w.globals.previousPaths.length > 0) {
      // Keyed survivor → morph; shape-changed → snap; entering → null
      // (falls through to the collapsed-centerline enter below).
      pathFrom = this.getPreviousPath(realIndex, j, pathTo)
    }
    if (pathFrom == null) {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center: cloudBase,
        halfExtent: lanes.cloudMaxPx,
        maxWeight,
        vertical: false,
        alongFn,
        collapsed: true,
        sideSign: this.cloudSign,
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
      cloudBase,
      cloudMaxPx: lanes.cloudMaxPx,
      rainCenter: center + lanes.rainCenterOff,
      rainHalfPx: lanes.rainHalfPx,
      boxPaths: this.buildBoxSubPaths({
        realIndex,
        j,
        boxCenter: center + lanes.boxCenterOff,
        boxHalfPx: lanes.boxHalfPx,
        alongFn,
        vertical: false,
      }),
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
   * Symmetric (`sideSign` 0): the curve mirrors around `center`, whose maximum
   * half-width is `halfExtent`. One-sided (`sideSign` ±1, the raincloud
   * "cloud" / half-violin): `center` is the flat BASELINE, the curve bulges up
   * to `halfExtent` px toward the signed side, and the return edge is a
   * straight run along the baseline.
   *
   * @param {{nodes:{v:number,w:number}[], center:number, halfExtent:number, maxWeight:number, vertical:boolean, alongFn:(v:number)=>number, collapsed:boolean, sideSign?:number}} opts
   */
  buildBodyPath({
    nodes,
    center,
    halfExtent,
    maxWeight,
    vertical,
    alongFn,
    collapsed,
    sideSign = 0,
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
      // One-sided: the "outer" edge carries the whole curve on the signed
      // side and the "inner" edge collapses onto the baseline. Deliberately
      // still emitted as two spline segments over the same nodes (the inner
      // one is collinear, so it renders as a straight edge): the path keeps
      // the symmetric body's command structure, so a violin <-> raincloud
      // type change tweens instead of snapping on a shape mismatch.
      const outer = sideSign === 0 ? center + wp : center + sideSign * wp
      const inner = sideSign === 0 ? center - wp : center
      if (vertical) {
        rightPts.push([outer, a])
        leftPts.push([inner, a])
      } else {
        rightPts.push([a, outer])
        leftPts.push([a, inner])
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
   * Build the five-number box sub-paths for one category — the raincloud
   * "umbrella", or a violin box overlay. Two sub-paths so each can carry its
   * own fill: the whisker stems + caps (stroke only) and the q1-q3 rect with
   * its median tick (filled). Both are rendered through renderSeries (same
   * `j`, multiple sibling paths — the BoxCandleStick pattern), so they
   * animate and morph like any mark. Deliberately no outlier dots: the
   * rain/jitter layer draws every observation already.
   *
   * Returns null when the box is off or the datum has no summary; entering
   * paths collapse cross-wise onto the box lane's centerline so the box grows
   * sideways in sync with the cloud.
   *
   * @param {{realIndex:number, j:number, boxCenter:number, boxHalfPx:number, alongFn:(v:number)=>number, vertical:boolean}} opts
   * @returns {{pathTo:string, pathFrom:string, filled:boolean}[] | null}
   */
  buildBoxSubPaths({ realIndex, j, boxCenter, boxHalfPx, alongFn, vertical }) {
    const w = this.w
    if (!this.boxShown || boxHalfPx <= 0) return null
    const summary = w.violinData.seriesViolinSummary[realIndex]?.[j]
    if (!summary) return null

    const capHalf =
      boxHalfPx * Math.min(1, Math.max(0, this.boxOptions.capWidth ?? 0.5))
    const [lo, q1, med, q3, hi] = summary.map((v) => alongFn(v))

    /**
     * @param {number} half whisker-cap half-length
     * @param {number} boxHalf box half-width
     */
    const build = (half, boxHalf) => {
      const graphics = new Graphics(this.w)
      /**
       * @param {number} cross
       * @param {number} along
       * @returns {[number, number]}
       */
      const pt = (cross, along) => (vertical ? [cross, along] : [along, cross])
      /** @param {[number,number][]} pts */
      const seg = (pts) =>
        pts
          .map(
            ([px, py], k) =>
              (k === 0 ? graphics.move(px, py) : graphics.line(px, py)),
          )
          .join('')
      const c = boxCenter
      const whiskers =
        seg([pt(c, lo), pt(c, q1)]) +
        seg([pt(c, q3), pt(c, hi)]) +
        seg([pt(c - half, lo), pt(c + half, lo)]) +
        seg([pt(c - half, hi), pt(c + half, hi)])
      const box =
        seg([
          pt(c - boxHalf, q1),
          pt(c + boxHalf, q1),
          pt(c + boxHalf, q3),
          pt(c - boxHalf, q3),
        ]) +
        'z' +
        seg([pt(c - boxHalf, med), pt(c + boxHalf, med)])
      return { whiskers, box }
    }

    const full = build(capHalf, boxHalfPx)
    const collapsed = build(0, 0)

    /** @param {string} pathTo @param {string} collapsedFrom */
    const fromFor = (pathTo, collapsedFrom) => {
      let pathFrom = null
      if (w.globals.previousPaths.length > 0) {
        // Keyed survivor → morph; shape-changed → snap; entering → null.
        // (No morphTypeChange here: the body path claims the morph target.)
        pathFrom = this.getPreviousPath(realIndex, j, pathTo)
      }
      return pathFrom == null ? collapsedFrom : pathFrom
    }

    return [
      {
        pathTo: full.whiskers,
        pathFrom: fromFor(full.whiskers, collapsed.whiskers),
        filled: false,
      },
      {
        pathTo: full.box,
        pathFrom: fromFor(full.box, collapsed.box),
        filled: true,
      },
    ]
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
   * Placement: `points.position` 'center' scatters around the slot centerline
   * (clamped to the density width; one-sided bodies scatter one-sided from the
   * baseline). Off-center positions put the dots in their own lane (the
   * raincloud "rain"), where the density clamp no longer applies.
   *
   * @param {{realIndex:number, j:number, center:number, halfExtent:number, alongFn:(v:number)=>number, density:{nodes:{v:number,w:number}[], maxWeight:number}, maxWeight:number, cloudBase:number, cloudMaxPx:number, rainCenter:number, rainHalfPx:number}} opts
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
    cloudBase,
    cloudMaxPx,
    rainCenter,
    rainHalfPx,
  }) {
    const offsetLane = this.rainSign !== 0
    const scatterCenter = offsetLane
      ? rainCenter
      : this.cloudSign !== 0
        ? cloudBase
        : center
    const scatterHalf = offsetLane
      ? rainHalfPx
      : this.cloudSign !== 0
        ? cloudMaxPx
        : halfExtent
    return buildJitterGroups({
      w: this.w,
      points: this.w.violinData.seriesViolinPoints[realIndex]?.[j],
      seedA: realIndex,
      seedB: j,
      center: scatterCenter,
      halfExtent: scatterHalf,
      alongFn,
      isHorizontal: this.isHorizontal,
      options: this.pointsOptions,
      // Centered dots clamp to the density half-width at each value so they
      // stay inside the shape; a dedicated rain lane has no shape to honor.
      clampAt: offsetLane
        ? null
        : (v) => this.halfWidthAtValue(v, density, scatterHalf, maxWeight),
      // A one-sided body folds centered dots onto its side of the baseline.
      sideSign: offsetLane ? 0 : this.cloudSign,
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

/**
 * Map a side token to a cross-axis screen sign. The cross axis is x on a
 * vertical chart and y on a horizontal one, so 'right'/'bottom' are the
 * positive screen direction and 'left'/'top' the negative one; 'both',
 * 'center' and anything unrecognized mean "no side" (symmetric / centered).
 * @param {string | undefined} token
 * @returns {-1 | 0 | 1}
 */
export function crossSign(token) {
  if (token === 'right' || token === 'bottom') return 1
  if (token === 'left' || token === 'top') return -1
  return 0
}

/**
 * Parse a lane width — a '40%' string or a 0..1 fraction — into a fraction of
 * the full slot width, clamped to [0, 0.5] so two lanes can never consume the
 * slot on their own.
 * @param {string | number | undefined} val
 * @param {number} fallback
 * @returns {number}
 */
export function laneFrac(val, fallback) {
  let frac = fallback
  if (typeof val === 'string' && val.trim().endsWith('%')) {
    const n = parseFloat(val)
    if (isFinite(n)) frac = n / 100
  } else if (typeof val === 'number' && isFinite(val)) {
    frac = val
  }
  return Math.min(0.5, Math.max(0, frac))
}

/**
 * Partition one category slot (center ± halfExtent on the cross axis) into
 * the raincloud lanes. All outputs are offsets from the slot center (px), so
 * the function stays pure and orientation-agnostic.
 *
 * Symmetric body (cloudSign 0): the cloud keeps the whole slot; the box lane
 * is centered on the slot (a classic violin+box overlay); an off-center rain
 * lane hugs its side's edge.
 *
 * Half body (cloudSign ±1): lanes fill the slot edge-to-edge from the cloud
 * side inward — cloud takes `1 - boxFrac - rainFrac` of the slot down to its
 * flat baseline, the box lane sits against the baseline, the rain lane
 * against the box. The rain lane is only carved when the points are actually
 * off-center (rainSign ≠ 0); a hidden box passes boxFrac 0. With neither, the
 * baseline falls on the slot centerline: a plain half-violin.
 *
 * @param {{halfExtent: number, cloudSign: number, rainSign: number, boxFrac: number, rainFrac: number}} o
 * @returns {{cloudBaseOff: number, cloudMaxPx: number, boxCenterOff: number, boxHalfPx: number, rainCenterOff: number, rainHalfPx: number}}
 */
export function resolveLanes({
  halfExtent,
  cloudSign,
  rainSign,
  boxFrac,
  rainFrac,
}) {
  const boxHalfPx = boxFrac * halfExtent
  const rainHalfPx = rainSign === 0 ? halfExtent : rainFrac * halfExtent
  const rainCenterOff = rainSign === 0 ? 0 : rainSign * (halfExtent - rainHalfPx)

  if (cloudSign === 0) {
    return {
      cloudBaseOff: 0,
      cloudMaxPx: halfExtent,
      boxCenterOff: 0,
      boxHalfPx,
      rainCenterOff,
      rainHalfPx,
    }
  }

  const usedRainFrac = rainSign === 0 ? 0 : rainFrac
  const cloudFrac = Math.max(0, 1 - usedRainFrac - boxFrac)
  const cloudMaxPx = 2 * cloudFrac * halfExtent
  const cloudBaseOff = cloudSign * (halfExtent - cloudMaxPx)
  return {
    cloudBaseOff,
    cloudMaxPx,
    boxCenterOff: cloudBaseOff - cloudSign * boxHalfPx,
    boxHalfPx,
    rainCenterOff,
    rainHalfPx,
  }
}

export default Violin
