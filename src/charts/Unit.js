// @ts-check
import Graphics from '../modules/Graphics'
import Utils from '../utils/Utils'
import { Environment } from '../utils/Environment'
import { BrowserAPIs } from '../ssr/BrowserAPIs'
import { prefersReducedMotion } from '../modules/Animations'

/**
 * ApexCharts Unit Class - dot-cluster / pictogram ("unit") chart.
 *
 * Renders ONE mark per unit of value (not one shape per aggregate magnitude).
 * Each category's dots pack into an organic disc via a phyllotaxis (sunflower)
 * spiral, so the boundary is a smooth circle and the local packing is hex-ish -
 * no force simulation / collision step is used (the layout is fully analytic).
 *
 * Two layouts:
 *   - 'grouped' (default): each category is its own cluster, laid out in a row.
 *   - 'packed': a single blob; dots are coloured by category and, when
 *     `sortByGroup` is on, ordered smallest-group-first so the minority nests
 *     in the centre (the phyllotaxis assigns the smallest radii to the lowest
 *     indices).
 *
 * Data is the pie/donut flat model: `series: number[]` + `labels`, or the
 * object form `[{ data: [{x,y}] }]`. Each value is a COUNT; the number of dots
 * is `round(value / unitValue)`, capped by `maxUnits`.
 *
 * This is a PREMIUM chart type: without a valid license the chart still renders
 * but carries the trial watermark (see modules/license/LicenseEnforcer).
 *
 * @module Unit
 **/

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/** @param {number} t */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Back-out ease factory: overshoots the target then springs back, so a dot
 * visibly "settles" into its slot instead of just decelerating to a stop.
 * `s` is the overshoot strength (1.70158 = the classic back ease ~10%).
 * @param {number} s @returns {(t: number) => number}
 */
function easeOutBack(s) {
  return (t) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
}

/**
 * In-out ease: dots accelerate gently out of rest and decelerate into their
 * slot, so a regroup reads as weighted motion rather than an instant launch.
 * @param {number} t
 */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default class Unit {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w
    /** @type {number} shared dot radius, set by the layout pass */
    this._lastDotR = 1
    /** @type {{cells:{x:number,y:number}[]}|null} small-multiple grid track cells */
    this._gridTrack = null
    /** @type {number} denominator mapping a value -> filled cells (grid split) */
    this._gridDenom = 1
    /** @type {any} scatter (beeswarm) axis geometry, set by _layoutScatter */
    this._scatterAxis = null
  }

  /**
   * @param {any[]} series - flat count array (non-axis / pie-shaped data)
   * @returns {any} the chart's root group element
   */
  draw(series) {
    const w = this.w
    const graphics = new Graphics(w, this.ctx)

    const ret = graphics.group({ class: 'apexcharts-unit' })
    if (w.globals.noData || !Array.isArray(series) || series.length === 0) {
      return ret
    }

    const opts = w.config.plotOptions.unit
    const layout =
      opts.layout === 'packed'
        ? 'packed'
        : opts.layout === 'columns'
          ? 'columns'
          : opts.layout === 'grid'
            ? 'grid'
            : opts.layout === 'scatter'
              ? 'scatter'
              : opts.layout === 'arc'
                ? 'arc'
                : 'grouped'
    // Keying decides which previous dot a new dot tweens from on an update:
    //  - 'group' (default): key "i:j" - a dot stays within its category slot.
    //    EXCEPTION: a 'packed' blob and a 'grid' waffle have no stable
    //    per-category slots (a category's slots are offset by the - changing -
    //    preceding categories' counts, so keying "i:j" would re-spin/re-shuffle
    //    every dot when a count moves). There we key by the physical slot
    //    instead, so a cell keeps its place: the colour boundary breathes in/out
    //    and only the rim adds/removes dots.
    //  - 'flow': key by GLOBAL draw order - the anonymous crowd migrates across
    //    a regroup (category count/identity changing) instead of fading in/out.
    //  - 'identity': key by each datum's id/name - a SPECIFIC unit migrates
    //    across any regroup or relayout, keeping its colour and size. Needs the
    //    per-unit object form with unique ids/names.
    const transition = opts.transition
    const flow = transition === 'flow'
    const identity = transition === 'identity'
    const unitValue = opts.unitValue > 0 ? opts.unitValue : 1

    // value -> dot count. A non-zero value always yields at least one dot so a
    // tiny category (e.g. 3 of 545) never vanishes entirely.
    let counts = series.map((v) => {
      const n = Math.abs(Utils.parseNumber(v)) / unitValue
      return n > 0 ? Math.max(1, Math.round(n)) : 0
    })

    counts = this._applyMaxUnits(counts, opts.maxUnits)

    const total = counts.reduce((a, b) => a + b, 0)
    /** @type {{ i: number, cx: number, cy: number, outerR: number, dots: {x:number,y:number,slot?:number,r?:number}[] }[]} */
    const clusters =
      layout === 'packed'
        ? this._layoutPacked(counts, opts)
        : layout === 'columns'
          ? this._layoutColumns(counts, opts)
          : layout === 'grid'
            ? this._layoutGrid(counts, opts)
            : layout === 'scatter'
              ? this._layoutScatter(opts)
              : layout === 'arc'
                ? this._layoutArc(counts, opts)
                : this._layoutGrouped(counts, opts)

    // Small-multiple waffles paint a faint track backdrop (the "of N" cells)
    // behind every tile's filled dots, and carry a per-tile label.
    const gridSplit = layout === 'grid' && !!(opts.grid && opts.grid.split)
    if (gridSplit) this._drawGridTrack(ret, graphics, opts)
    // Scatter (beeswarm) paints its value X axis + category lanes behind the dots.
    if (layout === 'scatter') this._drawScatterAxes(ret, graphics)

    const dotR = this._lastDotR
    const animate = this._shouldAnimate()

    // Cross-type morph (bar/wedge -> unit): when the optional `morph` feature
    // captured an outgoing bar/radial chart, each cluster's dots burst outward
    // from the shape they replace instead of gathering from the plot centre.
    const morph = this.ctx && this.ctx.morphTypeChange
    const morphActive =
      animate &&
      !!morph &&
      typeof morph.isActive === 'function' &&
      morph.isActive() &&
      typeof morph.getInitialCenterFor === 'function'

    // Positions from the PREVIOUS render, keyed "i:j". On an update this lets a
    // dot glide from its old slot to its new one (the keyed transition) instead
    // of re-gathering from the centre. Dots with no previous slot are "enter"s
    // and fly out from the centre + fade in. Ignored during a cross-type morph
    // (the previous chart was not a unit chart).
    const prev = animate && !morphActive && this.ctx ? this.ctx._unitPrevDots : null
    /** @type {Map<string, {x:number,y:number,fill:string,r?:number}>} */
    const nextPrev = new Map()
    /** @type {{ node: SVGElement, x: number, y: number, cx0: number, cy0: number, r0?: number, r1?: number, delay: number, isEnter: boolean, fill0?: string, fill1?: string, _c0?: number[]|null, _c1?: number[]|null }[]} */
    const animDots = []

    // Per-unit data (one datum per dot) when the caller passed the object form
    // series: [{ name, data: [...] }]. Lets a dot carry its own colour + info.
    const unitData = w.seriesData.unitData || []

    // Opt-in bubble sizing: scale each dot's radius by its datum value. The
    // lattice is already spaced for the largest bubble (see _fixedRadius), so
    // dots never overlap. Needs per-unit values; otherwise stays uniform.
    const sizeStats = this._bubbleStats(unitData, opts, dotR)

    // Running index across ALL dots of ALL clusters, used as the key in 'flow'
    // mode so a dot is identified by its global order, not its category slot.
    let gIndex = 0
    clusters.forEach((cluster) => {
      const color = w.globals.colors[cluster.i] || w.globals.colors[0] || '#008FFB'
      const elSeries = graphics.group({
        class: 'apexcharts-series',
        seriesName: Utils.escapeString(
          w.seriesData.seriesNames[cluster.i] || `series-${cluster.i + 1}`,
        ),
        rel: cluster.i + 1,
        'data:realIndex': cluster.i,
      })

      // Burst origin for this cluster when morphing from a bar/wedge (the
      // captured shape's centre). All of the cluster's dots start stacked here
      // and fan out to their slots.
      const burst = morphActive ? morph.getInitialCenterFor(cluster.i) : null
      const catData = unitData[cluster.i]

      cluster.dots.forEach((d, j) => {
        // A per-unit fillColor (object-form data) overrides the category colour.
        const datum = catData ? catData[j] : undefined
        const dotFill =
          datum && typeof datum === 'object' && datum.fillColor
            ? datum.fillColor
            : color
        // Bubble sizing scales this dot's radius by its value; otherwise every
        // dot shares the reference radius. The scatter layout may precompute a
        // per-dot radius (bubble scatter / beeswarm) and stash it on the dot.
        const rj =
          d.r != null
            ? d.r
            : sizeStats
              ? this._radiusForValue(this._unitValueOf(datum), sizeStats)
              : dotR
        const el = this._drawDot(graphics, opts, rj, dotFill, cluster.i, j)
        elSeries.add(el)
        // Identity keying: a specific unit (by id/name) persists across any
        // regroup or relayout. Flow: anonymous crowd by global draw order.
        // Group (default): the category slot.
        let key
        if (identity) {
          // Needs an explicit id/name; a bare primitive is not a stable identity
          // (duplicates would collide), so those fall back to global order.
          const id =
            datum && typeof datum === 'object'
              ? datum.id != null
                ? datum.id
                : datum.name
              : undefined
          key = id != null ? `id:${id}` : `g:${gIndex}`
        } else if (flow) {
          key = String(gIndex)
        } else if (d.slot != null) {
          // Packed blob: key by physical spiral slot so a shell keeps its place
          // (a dot near the colour boundary just recolours instead of the whole
          // outer ring re-spinning across the disc when the inner count shifts).
          key = `slot:${d.slot}`
        } else {
          key = `${cluster.i}:${j}`
        }
        gIndex++
        nextPrev.set(key, { x: d.x, y: d.y, fill: dotFill, r: rj })
        if (animate) {
          const from = prev && prev.get(key)
          // Priority: previous slot (keyed update) -> burst origin (morph) ->
          // cluster centre (fresh mount). The first two keep dots opaque; a
          // fresh mount fades them in.
          const anchor = from || burst
          // A fresh mount fades in. Where an entering dot comes FROM is
          // `gather.enter`: 'burst' (default) flies out from the cluster
          // centre; 'fade' materialises in place; 'rise' fades in while
          // drifting gently up into its slot. A small-multiple cell always
          // fades IN PLACE (a waffle fills cell-by-cell, it does not fly
          // from a centre).
          const enter = (opts.gather && opts.gather.enter) || 'burst'
          const inPlace = gridSplit || enter === 'fade' || enter === 'rise'
          const cx0 = anchor ? anchor.x : inPlace ? d.x : cluster.cx
          const cy0 = anchor
            ? anchor.y
            : enter === 'rise' && !gridSplit
              ? d.y + 14
              : inPlace
                ? d.y
                : cluster.cy
          el.node.style.opacity = anchor ? '1' : '0'
          this._placeDot(el.node, opts, cx0, cy0)
          animDots.push({
            node: el.node,
            x: d.x,
            y: d.y,
            cx0,
            cy0,
            // Radius tween: an identity-kept dot grows/shrinks from its previous
            // size to its new one (e.g. bubble sizing turning on) instead of
            // snapping. Enters/uniform updates keep r0 === r1 (no-op).
            r0: from && from.r != null ? from.r : rj,
            r1: rj,
            // Colour tween: a dot that flows into a differently coloured group
            // recolours as it travels rather than snapping at the first frame.
            fill0: from ? from.fill : dotFill,
            fill1: dotFill,
            delay: 0, // assigned below (staggered by global order)
            isEnter: !anchor,
          })
        } else {
          this._placeDot(el.node, opts, d.x, d.y)
        }
      })

      // Per-cluster label: a curved arc over a 'grouped' blob, a straight label
      // by a 'columns' bar, or a straight per-tile label on a small-multiple
      // waffle (a single 'grid' has no per-category labels - the legend carries
      // them; packed interleaves categories, so a per-category label would be
      // meaningless). Skip a hidden/empty category (0 dots) so a legend-toggled
      // series leaves no ghost label. For a tile the percentage is value/denom
      // (its own fill), not value/grand-total.
      if (
        (layout === 'grouped' || layout === 'columns' || gridSplit) &&
        opts.clusterLabels &&
        opts.clusterLabels.show &&
        counts[cluster.i] > 0
      ) {
        const labelTotal = gridSplit ? this._gridDenom : total
        this._drawClusterLabel(elSeries, cluster, counts[cluster.i], labelTotal, opts, color)
      }

      ret.add(elSeries)
    })

    // Exit ghosts: dots present last render but gone now (a cluster shrank, or
    // a whole category disappeared on a dataset switch) fade + collapse toward
    // the plot centre so the removal reads as motion rather than a pop-out.
    if (prev) {
      const exits = this._collectExits(prev, nextPrev, opts)
      if (exits.length) {
        const exitGroup = graphics.group({ class: 'apexcharts-unit-exits' })
        ret.add(exitGroup)
        this._runExits(exitGroup, exits, opts)
      }
    }

    // Remember this render's slots so the NEXT update can tween old -> new.
    // Stored even when not animating (e.g. resize) so the following update
    // starts from the correct on-screen positions.
    if (this.ctx) this.ctx._unitPrevDots = nextPrev

    if (animate && animDots.length) {
      this._runGather(animDots)
    }

    return ret
  }

  /**
   * Cap total dots to `maxUnits`, scaling every category down proportionally
   * (a non-zero category keeps at least one dot). Warns once when it clips.
   * @param {number[]} counts
   * @param {number} maxUnits
   * @returns {number[]}
   */
  _applyMaxUnits(counts, maxUnits) {
    const total = counts.reduce((a, b) => a + b, 0)
    if (!maxUnits || maxUnits <= 0 || total <= maxUnits) return counts
    const scale = maxUnits / total
    console.warn(
      `[ApexCharts] unit chart: ${total} dots exceeds maxUnits (${maxUnits}); ` +
        `counts were scaled down proportionally. Raise plotOptions.unit.maxUnits ` +
        `or use plotOptions.unit.unitValue to represent more units per dot.`,
    )
    return counts.map((c) => (c > 0 ? Math.max(1, Math.round(c * scale)) : 0))
  }

  /**
   * Lay out each category as its own cluster in a horizontal row. All clusters
   * share one dot radius (so dot size is comparable across clusters); the blob
   * radius encodes the count.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutGrouped(counts, opts) {
    const w = this.w
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const labelSpace = opts.clusterLabels && opts.clusterLabels.show ? 30 : 6

    // Only VISIBLE (non-empty) categories claim a cell, so a legend-hidden
    // category leaves NO gap: the remaining clusters re-flow to fill the row
    // (an empty category still returns a cluster, but with no dots and a neutral
    // centre). Its slot in the row drives the equal-cell centre.
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0)
    const Kv = Math.max(1, visible.length)
    const slotOf = new Array(counts.length).fill(-1)
    visible.forEach((i, s) => (slotOf[i] = s))

    const cellW = gw / Kv
    const availH = gh - labelSpace
    const maxCount = Math.max(1, ...counts)
    const pad = Math.min(cellW, availH) * 0.08
    const availR = Math.max(4, Math.min(cellW, availH) / 2 - pad)

    const step = this._resolveStep(opts, availR, maxCount)
    this._lastDotR = this._dotRadiusFromStep(step, opts)
    const dotR = this._lastDotR

    const cy = labelSpace + availH / 2
    const outerRs = counts.map((n) => step * Math.sqrt(Math.max(1, n)) + dotR)

    // Cluster centres. Default is one equal-width cell per VISIBLE category.
    // With a FIXED dot size (image / explicit size / bubble maxRadius) a large
    // cluster can outgrow its cell and bleed into its neighbours, since it cannot
    // shrink to fit. When any adjacent pair would overlap, re-pack the row: give
    // each cluster a slot sized to its own blob, lay them left-to-right with a
    // gap, and centre the group. Auto-sized clusters always fit their cell, so
    // the equal-cell path is kept untouched for them (and for well-separated
    // fixed clusters) - this only re-flows a layout that would otherwise collide.
    const cellCentre = (/** @type {number} */ i) =>
      slotOf[i] >= 0 ? cellW * (slotOf[i] + 0.5) : gw / 2
    let centers = counts.map((_, i) => cellCentre(i))
    const visOuter = visible.map((i) => outerRs[i])
    let overlap = false
    for (let s = 1; s < Kv; s++) {
      if (
        centers[visible[s]] - centers[visible[s - 1]] <
        visOuter[s] + visOuter[s - 1]
      ) {
        overlap = true
        break
      }
    }
    if (overlap) {
      const gap = Math.max(2 * dotR, 8)
      const totalW = visOuter.reduce((a, r) => a + 2 * r, 0) + gap * (Kv - 1)
      /** @type {number[]} */
      let visCenters
      if (totalW <= gw) {
        // Fits: lay clusters side by side (blob width + gap) and centre the row.
        let x = (gw - totalW) / 2
        visCenters = visOuter.map((r) => {
          const c = x + r
          x += 2 * r + gap
          return c
        })
      } else if (Kv === 1) {
        visCenters = [gw / 2]
      } else {
        // Over capacity: the fixed-size blobs need more width than the plot has
        // and cannot shrink. Anchor the first blob flush-left and the last
        // flush-right, spacing the rest evenly, so everything stays on-canvas
        // (middle blobs may touch). Sizing them down removes the crowding.
        const lo = visOuter[0]
        const hi = gw - visOuter[Kv - 1]
        visCenters = visOuter.map((_, s) => lo + ((hi - lo) * s) / (Kv - 1))
      }
      centers = counts.map((_, i) =>
        slotOf[i] >= 0 ? visCenters[slotOf[i]] : gw / 2,
      )
    }

    return counts.map((n, i) => ({
      i,
      cx: centers[i],
      cy,
      outerR: outerRs[i],
      dots: this._spiral(centers[i], cy, n, step, 0),
    }))
  }

  /**
   * Lay out all categories into ONE packed blob. Dots are assigned spiral
   * indices in category order (smallest-first when sortByGroup), so the
   * minority group nests in the centre.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutPacked(counts, opts) {
    const w = this.w
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const labelSpace = 6
    const total = Math.max(1, counts.reduce((a, b) => a + b, 0))

    const availR = Math.max(
      4,
      Math.min(gw, gh - labelSpace) / 2 - Math.min(gw, gh) * 0.06,
    )
    const step = this._resolveStep(opts, availR, total)
    this._lastDotR = this._dotRadiusFromStep(step, opts)

    const cx = gw / 2
    const cy = labelSpace + (gh - labelSpace) / 2

    const order = counts.map((_, i) => i)
    if (opts.sortByGroup !== false) {
      order.sort((a, b) => counts[a] - counts[b])
    }

    const clusters = counts.map((_, i) => ({
      i,
      cx,
      cy,
      outerR: step * Math.sqrt(total) + this._lastDotR,
      /** @type {{x:number,y:number,slot?:number}[]} */ dots: [],
    }))

    let gi = 0
    order.forEach((catI) => {
      for (let j = 0; j < counts[catI]; j++) {
        const r = step * Math.sqrt(gi + 0.5)
        const theta = gi * GOLDEN_ANGLE
        // Tag each dot with its physical spiral slot. In a packed blob there are
        // no stable per-category slots (the outer group's indices are offset by
        // the inner group's count), so the keyed transition must key by this
        // physical slot, not by "category:slot". See the keying note in draw().
        clusters[catI].dots.push({
          x: cx + r * Math.cos(theta),
          y: cy + r * Math.sin(theta),
          slot: gi,
        })
        gi++
      }
    })

    return clusters
  }

  /**
   * Lay out all marks as a PARLIAMENT / hemicycle: seats in concentric arced
   * rows across an annulus, filled in category (party) order so each category
   * forms a contiguous angular wedge (the classic seating chart). `arc` controls
   * the sweep (`startAngle`/`endAngle`, radialBar convention: 0 = top, clockwise;
   * default a top semicircle), the donut hole (`innerRadiusRatio`) and the row
   * count (`rows`, or 'auto'). Like `packed` this is ONE shared shape coloured by
   * category, so seats key by physical slot: a seat-count change recolours the
   * party boundary in place and only the rim adds / removes seats.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutArc(counts, opts) {
    const w = this.w
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const total = Math.max(1, counts.reduce((a, b) => a + b, 0))

    const acfg = opts.arc || {}
    const startDeg = typeof acfg.startAngle === 'number' ? acfg.startAngle : -90
    const endDeg = typeof acfg.endAngle === 'number' ? acfg.endAngle : 90
    const a0 = (startDeg * Math.PI) / 180
    const a1 = (endDeg * Math.PI) / 180
    const span = a1 - a0 || Math.PI
    const innerRatio = Math.max(
      0,
      Math.min(0.95, typeof acfg.innerRadiusRatio === 'number' ? acfg.innerRadiusRatio : 0.4),
    )

    // radialBar angle convention -> screen coords (y down): 0deg = top, clockwise.
    const ux = (/** @type {number} */ a) => Math.sin(a)
    const uy = (/** @type {number} */ a) => -Math.cos(a)

    // Fit the outer arc's bounding box (at radius 1) into the plot, then centre it.
    const b = this._arcBounds(a0, a1)
    const pad = Math.min(gw, gh) * 0.04
    const boxW = Math.max(1e-6, b.maxX - b.minX)
    const boxH = Math.max(1e-6, b.maxY - b.minY)
    const r1 = Math.max(4, Math.min((gw - 2 * pad) / boxW, (gh - 2 * pad) / boxH))
    const r0 = r1 * innerRatio
    const cx = gw / 2 - ((b.minX + b.maxX) / 2) * r1
    const cy = gh / 2 - ((b.minY + b.maxY) / 2) * r1

    const alloc = this._arcAllocate(total, r0, r1, span, opts)
    this._lastDotR = alloc.dotR

    // Every seat position, then sorted by angle so category-ordered assignment
    // paints contiguous wedges (the first category sits at the start angle).
    /** @type {{a:number,x:number,y:number}[]} */
    const seats = []
    for (let r = 0; r < alloc.R; r++) {
      const rho = alloc.radii[r]
      const n = alloc.seatsPerRow[r]
      for (let k = 0; k < n; k++) {
        // (k+0.5)/n leaves even end margins and staggers successive rows.
        const a = n === 1 ? (a0 + a1) / 2 : a0 + (span * (k + 0.5)) / n
        seats.push({ a, x: cx + rho * ux(a), y: cy + rho * uy(a) })
      }
    }
    seats.sort((s1, s2) => s1.a - s2.a)

    const clusters = counts.map((_, i) => ({
      i,
      cx,
      cy,
      outerR: r1,
      /** @type {{x:number,y:number,slot?:number}[]} */ dots: [],
    }))

    // Assign each category a contiguous run of seats equal to its count, so a
    // party reads as an angular wedge; zero-count categories claim no seats.
    // Slot = physical seat index (angle order) for the keyed transition.
    let ci = 0
    let used = 0
    seats.forEach((s, slot) => {
      while (ci < counts.length && used >= counts[ci]) {
        ci++
        used = 0
      }
      if (ci >= counts.length) return
      clusters[ci].dots.push({ x: s.x, y: s.y, slot })
      used++
    })

    return clusters
  }

  /**
   * Bounding box of the outer arc (radius 1) over [a0, a1], including the centre
   * and every cardinal angle (multiple of 90deg) inside the range, so a
   * semicircle / full circle / arbitrary sweep is all bounded correctly.
   * @param {number} a0 @param {number} a1
   * @returns {{minX:number,maxX:number,minY:number,maxY:number}}
   */
  _arcBounds(a0, a1) {
    const ux = (/** @type {number} */ a) => Math.sin(a)
    const uy = (/** @type {number} */ a) => -Math.cos(a)
    const lo = Math.min(a0, a1)
    const hi = Math.max(a0, a1)
    const xs = [0, ux(a0), ux(a1)]
    const ys = [0, uy(a0), uy(a1)]
    const q = Math.PI / 2
    for (let k = Math.ceil(lo / q); k * q <= hi; k++) {
      xs.push(ux(k * q))
      ys.push(uy(k * q))
    }
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    }
  }

  /**
   * Allocate `total` seats across concentric rows of the annulus [r0, r1] sweeping
   * `span` radians: seats per row are proportional to the row radius (a longer arc
   * holds more), summed EXACTLY to total by largest remainder. Row count is
   * `arc.rows` if given, else derived from a fixed dot size, else auto-searched to
   * maximise the dot radius (the largest dots that still pack without overlap,
   * mirroring `size:'auto'` elsewhere).
   * @param {number} total @param {number} r0 @param {number} r1 @param {number} span @param {any} opts
   * @returns {{R:number, radii:number[], seatsPerRow:number[], dotR:number}}
   */
  _arcAllocate(total, r0, r1, span, opts) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1.05
    const absSpan = Math.abs(span) || Math.PI
    const fixed = this._fixedRadius(opts)

    /** @param {number} R */
    const evalR = (R) => {
      R = Math.max(1, Math.round(R))
      const radii = []
      for (let r = 0; r < R; r++) {
        radii.push(R === 1 ? (r0 + r1) / 2 : r0 + (r1 - r0) * (r / (R - 1)))
      }
      const weightSum = radii.reduce((a, x) => a + x, 0) || 1
      const raw = radii.map((rho) => (total * rho) / weightSum)
      const seatsPerRow = raw.map((x) => Math.floor(x))
      let left = total - seatsPerRow.reduce((a, x) => a + x, 0)
      raw
        .map((x, idx) => ({ idx, frac: x - Math.floor(x) }))
        .sort((p, qq) => qq.frac - p.frac)
        .forEach((o) => {
          if (left > 0) {
            seatsPerRow[o.idx]++
            left--
          }
        })
      while (left > 0) {
        seatsPerRow[R - 1]++
        left--
      }
      const radialPitch = R === 1 ? r1 - r0 || r1 : (r1 - r0) / (R - 1)
      let minArcPitch = Infinity
      for (let r = 0; r < R; r++) {
        const n = seatsPerRow[r]
        if (n <= 0) continue
        const arcPitch = (radii[r] * absSpan) / n
        if (arcPitch < minArcPitch) minArcPitch = arcPitch
      }
      const pitch = Math.min(radialPitch, minArcPitch)
      return { R, radii, seatsPerRow, dotR: Math.max(1, pitch / (2 * spacing)) }
    }

    const arcRows = opts.arc && opts.arc.rows
    /** @type {{R:number, radii:number[], seatsPerRow:number[], dotR:number}} */
    let res
    if (typeof arcRows === 'number' && arcRows >= 1) {
      res = evalR(arcRows)
    } else if (fixed) {
      const pitch = 2 * fixed * spacing
      res = evalR((r1 - r0) / pitch + 1)
    } else {
      const maxR = Math.max(1, Math.min(40, Math.ceil(Math.sqrt(total)) + 6))
      res = evalR(1)
      for (let R = 2; R <= maxR; R++) {
        const cand = evalR(R)
        if (cand.dotR > res.dotR) res = cand
      }
    }
    if (fixed) res.dotR = fixed
    return res
  }

  /**
   * Lay out each category as a vertical BAR built from stacked dots (a unit /
   * waffle column). Every bar shares one dot size and one width (the same
   * number of dot columns); the bar's HEIGHT encodes its count. Dots fill each
   * bar bottom-up, row by row. This is the "dot bar" state the circle layouts
   * morph into: with `transition:'flow'` the dots glide straight from their
   * circle slots into these bar slots (see the storyboard sample).
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutColumns(counts, opts) {
    const w = this.w
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    // Reserve room for the cluster label on whichever side it sits (top by
    // default, bottom when clusterLabels.position === 'bottom'); the opposite
    // side keeps a small default margin.
    const labelsOn = !!(opts.clusterLabels && opts.clusterLabels.show)
    const labelsBelow = labelsOn && opts.clusterLabels.position === 'bottom'
    const topPad = labelsOn && !labelsBelow ? 30 : 6

    // Only VISIBLE (non-empty) categories claim a column slot, so a legend-hidden
    // bar leaves NO gap: the remaining bars re-flow to fill the row.
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0)
    const Kv = Math.max(1, visible.length)
    const slotOf = new Array(counts.length).fill(-1)
    visible.forEach((i, s) => (slotOf[i] = s))

    const cellW = gw / Kv
    const barW = cellW * 0.62 // gap between neighbouring bars
    // Keep the baseline off the legend / plot edge, plus a label band below the
    // bars when the labels sit there.
    const bottomPad = Math.max(8, gh * 0.04) + (labelsBelow ? 30 : 0)
    const availH = Math.max(4, gh - topPad - bottomPad)
    const maxCount = Math.max(1, ...counts)
    const spacing = opts.spacing > 0 ? opts.spacing : 1

    // Resolve the dot pitch (centre-to-centre) and the column count. For a
    // fixed dot size the pitch is given, so choose the FEWEST columns that keep
    // the tallest bar within the plot height: this fills the height and reads as
    // a tall bar (a width-first choice would make squat, wide slabs). Clamped to
    // the per-bar width budget, above which the bar has to grow more columns.
    // For 'auto' size, pick the column count that lets the dots be as LARGE as
    // possible while the tallest bar still fits the available height.
    // The columns layout can size its dots independently of the pinned circle-
    // beat `size` (a storyboard often pins a constant size so dots do not resize
    // while migrating). `plotOptions.unit.columns.size`: 'auto' fills the plot
    // height, a number pins a columns-only size, 'inherit'/undefined uses the
    // global size. Image icons keep their intrinsic size (no override).
    const colSize = opts.columns ? opts.columns.size : undefined
    let fixed
    if (opts.shape !== 'image' && colSize === 'auto') {
      fixed = null
    } else if (
      opts.shape !== 'image' &&
      typeof colSize === 'number' &&
      colSize > 0
    ) {
      fixed = colSize
    } else {
      fixed = this._fixedRadius(opts)
    }
    let cols = 1
    let pitch = 0
    if (fixed) {
      pitch = 2 * fixed * spacing
      this._lastDotR = fixed
      const rowsCap = Math.max(1, Math.floor(availH / pitch))
      const maxColsByWidth = Math.max(1, Math.floor(barW / pitch))
      cols = Math.max(1, Math.min(maxColsByWidth, Math.ceil(maxCount / rowsCap)))
    } else {
      let best = 0
      const maxCols = Math.max(1, Math.min(40, Math.round(barW / 4)))
      for (let c = 1; c <= maxCols; c++) {
        const rows = Math.ceil(maxCount / c)
        const d = Math.min(barW / c, availH / rows)
        if (d > best) {
          best = d
          cols = c
        }
      }
      pitch = best
      this._lastDotR = Math.max(1, pitch / (2 * spacing))
    }

    const r = this._lastDotR
    // Vertically CENTRE the tallest bar within the band [topPad, gh-bottomPad]
    // so a fixed dot size (bars shorter than the plot) does not dump all the
    // slack above the row and crowd the legend. Every bar shares this baseline
    // (bottom-aligned to it) so their heights stay directly comparable. For
    // 'auto' sizing the tallest bar already fills the band, so this is a no-op.
    const maxRows = Math.ceil(maxCount / cols)
    const tallestBarH = Math.min(availH, maxRows * pitch)
    const bottom = topPad + (availH + tallestBarH) / 2

    return counts.map((n, i) => {
      const cx = slotOf[i] >= 0 ? cellW * (slotOf[i] + 0.5) : gw / 2
      const rows = Math.ceil(Math.max(1, n) / cols)
      const barH = rows * pitch
      // Centre the block of `cols` columns under the cell centre.
      const left = cx - (cols * pitch) / 2 + pitch / 2
      /** @type {{x:number,y:number}[]} */
      const dots = []
      for (let j = 0; j < n; j++) {
        const rowIdx = Math.floor(j / cols)
        const colIdx = j % cols
        dots.push({
          x: left + colIdx * pitch,
          y: bottom - r - rowIdx * pitch,
        })
      }
      return {
        i,
        cx,
        cy: bottom - barH / 2,
        outerR: barH / 2,
        // Flag read by _drawClusterLabel: a bar takes a straight label (above
        // or below per clusterLabels.position), never a curved arc.
        flat: true,
        dots,
      }
    })
  }

  /**
   * Lay out ALL categories into ONE regular lattice - a waffle / grid. Dots take
   * sequential slots in DECLARED category order and fill row-major, `columns`
   * wide, so each category owns a contiguous band of cells: a part-to-whole
   * square "pie". `grid.total` (optional) re-allocates the cells to a fixed
   * budget (e.g. 100) by largest remainder, so the grid reads as exact
   * percentages regardless of the raw totals; without it there is one cell per
   * unit (respecting unitValue / maxUnits). `grid.fillFrom` picks the first row.
   * The category bands follow the legend order (no smallest-first sort), and
   * each physical slot is keyed so a proportion change recolours boundary cells
   * in place rather than reshuffling the whole grid.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutGrid(counts, opts) {
    // Small-multiple / trellis mode: one mini-waffle per category instead of a
    // single shared lattice. Handled separately (own track backdrop + per-tile
    // labels + physical per-tile keying).
    if (opts.grid && opts.grid.split) return this._layoutGridSplit(counts, opts)
    // Single grid: no track backdrop.
    this._gridTrack = null
    const w = this.w
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const gcfg = opts.grid || {}
    const cols = Math.max(1, Math.round(gcfg.columns > 0 ? gcfg.columns : 10))
    const fillFrom = gcfg.fillFrom === 'top' ? 'top' : 'bottom'

    // Fixed-budget (percentage) mode vs one-cell-per-unit.
    const cells =
      gcfg.total > 0
        ? this._largestRemainder(counts, Math.round(gcfg.total))
        : counts.slice()
    const totalCells = cells.reduce((a, b) => a + b, 0)
    const rows = Math.max(1, Math.ceil(Math.max(1, totalCells) / cols))

    // No per-category cluster labels on a single grid (the legend carries the
    // categories), so only a small top margin is reserved.
    const labelSpace = 6
    const spacing = opts.spacing > 0 ? opts.spacing : 1
    const availW = Math.max(4, gw)
    const availH = Math.max(4, gh - labelSpace)

    // A fixed dot size (image / explicit size / bubble max) sets the pitch;
    // otherwise fit the cols x rows lattice into the plot.
    const fixed = this._fixedRadius(opts)
    let pitch = 0
    if (fixed) {
      pitch = 2 * fixed * spacing
      this._lastDotR = fixed
    } else {
      pitch = Math.min(availW / cols, availH / rows)
      this._lastDotR = Math.max(1, pitch / (2 * spacing))
    }
    const blockW = cols * pitch
    const blockH = rows * pitch
    // Centre the lattice block in the plot.
    const originX = (gw - blockW) / 2 + pitch / 2
    const topY = labelSpace + (availH - blockH) / 2
    // Bottom-fill: row 0 sits at the BOTTOM of the block; top-fill: at the top.
    const rowY = (/** @type {number} */ rowIdx) =>
      fillFrom === 'bottom'
        ? topY + blockH - pitch / 2 - rowIdx * pitch
        : topY + pitch / 2 + rowIdx * pitch

    const clusters = counts.map((_, i) => ({
      i,
      cx: gw / 2,
      cy: labelSpace + availH / 2,
      outerR: Math.max(blockW, blockH) / 2,
      /** @type {{x:number,y:number,slot?:number}[]} */ dots: [],
    }))

    let k = 0
    for (let ci = 0; ci < cells.length; ci++) {
      for (let j = 0; j < cells[ci]; j++) {
        const col = k % cols
        const rowIdx = Math.floor(k / cols)
        clusters[ci].dots.push({
          x: originX + col * pitch,
          y: rowY(rowIdx),
          slot: k,
        })
        k++
      }
    }
    return clusters
  }

  /**
   * Small-multiple ("trellis") waffles: ONE mini-waffle per category, laid out
   * in a near-square grid of tiles. Each tile has `grid.total` cells (default
   * 100 -> a 10x10 tile) and fills a fraction of them equal to the category's
   * value over a denominator (`grid.max`, else the largest count so the leader
   * fills its tile and every other tile stays proportionally full - no empty
   * tiles for arbitrary data). The unfilled cells are drawn as a faint TRACK
   * backdrop (see _drawGridTrack) so each tile reads as a part-to-whole "of N".
   * Only VISIBLE (non-zero) categories claim a tile, so a legend hide drops the
   * tile and the rest re-flow. Each filled cell is keyed by a physical
   * `tile*cells + localCell` slot, so a value change grows/shrinks a tile's fill
   * in place instead of reshuffling.
   * @param {number[]} counts @param {any} opts
   */
  _layoutGridSplit(counts, opts) {
    const w = this.w
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const gcfg = opts.grid || {}
    const cols = Math.max(1, Math.round(gcfg.columns > 0 ? gcfg.columns : 10))
    const fillFrom = gcfg.fillFrom === 'top' ? 'top' : 'bottom'
    const cellsPerTile = Math.max(1, Math.round(gcfg.total > 0 ? gcfg.total : 100))
    const rowsPerTile = Math.max(1, Math.ceil(cellsPerTile / cols))

    // Visible (non-empty) categories each get a tile; a hidden/empty category
    // drops out and the remaining tiles re-flow (as grouped/columns do).
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0)
    const K = Math.max(1, visible.length)

    // Value -> filled-cell denominator. Default = the largest count (leader
    // fills its tile, the rest proportional); `grid.max` pins an explicit whole
    // (e.g. 100 so a value of 35 fills 35 of 100 cells - a percentage waffle).
    const denom = gcfg.max > 0 ? gcfg.max : Math.max(1, ...counts)

    // Arrange the tiles in a near-square grid unless grid.tileColumns pins it.
    const tileCols = Math.max(
      1,
      Math.round(gcfg.tileColumns > 0 ? gcfg.tileColumns : Math.ceil(Math.sqrt(K))),
    )
    const tileRows = Math.max(1, Math.ceil(K / tileCols))

    // Reserve a per-tile label band on the side the label sits (top by default).
    const labelsOn = !(opts.clusterLabels && opts.clusterLabels.show === false)
    const labelsBelow =
      labelsOn && opts.clusterLabels && opts.clusterLabels.position === 'bottom'
    const topBand = labelsOn && !labelsBelow ? 22 : 4
    const botBand = labelsOn && labelsBelow ? 22 : 4

    const tileW = gw / tileCols
    const tileH = gh / tileRows
    const availTileW = Math.max(4, tileW * 0.86) // gutter between neighbouring tiles
    const availTileH = Math.max(4, tileH - topBand - botBand)
    const spacing = opts.spacing > 0 ? opts.spacing : 1

    // Dot pitch: a fixed size sets it; otherwise fit cols x rowsPerTile per tile.
    const fixed = this._fixedRadius(opts)
    let pitch = 0
    if (fixed) {
      pitch = 2 * fixed * spacing
      this._lastDotR = fixed
    } else {
      pitch = Math.min(availTileW / cols, availTileH / rowsPerTile)
      this._lastDotR = Math.max(1, pitch / (2 * spacing))
    }
    const blockW = cols * pitch
    const blockH = rowsPerTile * pitch

    const rowY = (/** @type {number} */ topY, /** @type {number} */ rowIdx) =>
      fillFrom === 'bottom'
        ? topY + blockH - pitch / 2 - rowIdx * pitch
        : topY + pitch / 2 + rowIdx * pitch

    /** @type {{x:number,y:number}[]} */
    const track = []
    /** @type {{ i:number, cx:number, cy:number, outerR:number, flat:boolean, split:boolean, dots:{x:number,y:number,slot?:number}[] }[]} */
    const clusters = []

    visible.forEach((ci, t) => {
      const tc = t % tileCols
      const tr = Math.floor(t / tileCols)
      const tileX = tc * tileW
      const tileYtop = tr * tileH
      const originX = tileX + (tileW - blockW) / 2 + pitch / 2
      const topY = tileYtop + topBand + (availTileH - blockH) / 2

      const cellXY = (/** @type {number} */ k) => ({
        x: originX + (k % cols) * pitch,
        y: rowY(topY, Math.floor(k / cols)),
      })

      // Full lattice -> track backdrop.
      for (let k = 0; k < cellsPerTile; k++) track.push(cellXY(k))

      // Filled cells -> series dots (keyed by physical per-tile slot).
      const filled = Math.max(
        0,
        Math.min(cellsPerTile, Math.round((counts[ci] / denom) * cellsPerTile)),
      )
      /** @type {{x:number,y:number,slot?:number}[]} */
      const dots = []
      for (let k = 0; k < filled; k++) {
        const p = cellXY(k)
        dots.push({ x: p.x, y: p.y, slot: t * cellsPerTile + k })
      }

      clusters.push({
        i: ci,
        cx: tileX + tileW / 2,
        cy: topY + blockH / 2,
        outerR: blockH / 2,
        // Straight per-tile label (never a curved arc), placed by position.
        flat: true,
        split: true,
        dots,
      })
    })

    // Denominator drives the per-tile label percentage (value / denom).
    this._gridDenom = denom
    this._gridTrack = { cells: track }
    return clusters
  }

  /**
   * Draw the faint "track" backdrop for the small-multiple grid: every cell of
   * every tile's full lattice, so the filled (coloured) cells drawn on top read
   * as a fraction of the whole. Static (redrawn each render, never animated);
   * painted BEHIND the series groups. `grid.trackColor` overrides the default
   * theme-neutral grey.
   * @param {any} ret @param {Graphics} graphics @param {any} opts
   */
  _drawGridTrack(ret, graphics, opts) {
    const track = this._gridTrack
    if (!track || !track.cells || !track.cells.length) return
    const r = this._lastDotR
    const gcfg = opts.grid || {}
    const trackColor = gcfg.trackColor || 'rgba(128,128,128,0.14)'
    const g = graphics.group({ class: 'apexcharts-unit-track' })
    track.cells.forEach((c) => {
      let el
      if (opts.shape === 'square') {
        const side = r * 2
        el = graphics.drawRect(0, 0, side, side, opts.borderRadius || 0, trackColor, 1, 0, 'none')
        el.node.setAttribute('fill', trackColor)
        el.node.setAttribute('x', String(c.x - r))
        el.node.setAttribute('y', String(c.y - r))
      } else {
        el = graphics.drawCircle(r, { fill: trackColor, 'stroke-width': 0, stroke: 'none' })
        el.node.setAttribute('fill', trackColor)
        el.node.setAttribute('cx', String(c.x))
        el.node.setAttribute('cy', String(c.y))
      }
      el.node.classList.add('apexcharts-unit-track-cell')
      g.add(el)
    })
    ret.add(g)
  }

  /**
   * Scatter / beeswarm layout: position every unit on a real numeric X value
   * axis by its own value (`_unitValueOf`), laned by category on Y. Within a
   * lane an anti-overlap "swarm" pack (or a random jitter) spreads the dots off
   * the centre line so equal / close values do not stack on top of each other.
   * This is the unit chart's answer to "put these on axes": one dot per datum,
   * placed by data, with a drawn value axis + category lanes (see
   * _drawScatterAxes). Needs the per-unit object form (each datum a numeric
   * `value`/`y`); flat counts have no per-unit value, so their lanes stay empty.
   * @param {any} opts
   */
  _layoutScatter(opts) {
    const w = this.w
    const scfg = opts.scatter || {}
    // 2D value-value scatter: each datum's own x AND y on two numeric axes.
    if (scfg.y === 'value') return this._layoutScatter2D(opts)
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const unitData = w.seriesData.unitData || []
    const names = w.seriesData.seriesNames || []
    const valueOf = (/** @type {any} */ d) => this._unitValueOf(d)
    // Optional bubble sizing (by a separate `sizeField`): a bubble beeswarm.
    const sizeStats = this._scatterSizeStats(scfg, unitData)

    // Per-category numeric values; a category is VISIBLE only if it has at least
    // one usable value (so a legend-hidden / empty lane drops and the rest
    // re-flow, as the other layouts do).
    const catVals = unitData.map((cat) =>
      Array.isArray(cat) ? cat.map(valueOf) : [],
    )
    const isNum = (/** @type {any} */ v) => v != null && isFinite(v)
    const visible = catVals
      .map((_, i) => i)
      .filter((i) => catVals[i].some(isNum))
    const Kv = Math.max(1, visible.length)

    // Global x range across all units, nice-numbered (unless overridden).
    let vmin = Infinity
    let vmax = -Infinity
    catVals.forEach((vs) =>
      vs.forEach((v) => {
        if (v != null && isFinite(v)) {
          if (v < vmin) vmin = v
          if (v > vmax) vmax = v
        }
      }),
    )
    if (vmin === Infinity) {
      vmin = 0
      vmax = 1
    }
    const tickAmount = Math.max(2, Math.round(scfg.tickAmount > 0 ? scfg.tickAmount : 5))
    const nice = this._niceScale(
      scfg.xMin != null ? scfg.xMin : vmin,
      scfg.xMax != null ? scfg.xMax : vmax,
      tickAmount,
    )
    const xMin = scfg.xMin != null ? scfg.xMin : nice.min
    const xMax = scfg.xMax != null ? scfg.xMax : nice.max
    const xSpan = xMax - xMin || 1

    // Plot box: left gutter for lane labels, bottom gutter for the axis.
    const laneW =
      scfg.laneLabelWidth != null ? Math.max(0, scfg.laneLabelWidth) : Kv > 1 ? 92 : 8
    const bottomGutter = 30 + (scfg.xTitle ? 20 : 0)
    const plotL = laneW
    const plotR = gw - 8
    const plotT = 10
    const plotB = gh - bottomGutter
    const plotW = Math.max(4, plotR - plotL)
    const plotH = Math.max(4, plotB - plotT)

    const plotX = (/** @type {number} */ v) =>
      plotL + ((v - xMin) / xSpan) * plotW
    const laneH = plotH / Kv
    const laneCy = (/** @type {number} */ slot) => plotT + laneH * (slot + 0.5)

    // Dot radius: fixed if set, else a SMALL auto radius (a swarm reads best
    // with small dots) bounded by lane height + peak lane density, capped ~6px.
    let r = 0
    const fixed = this._fixedRadius(opts)
    if (fixed) {
      r = fixed
    } else {
      const maxLane = Math.max(
        1,
        ...visible.map((i) => catVals[i].filter(isNum).length),
      )
      r = Math.max(
        2,
        Math.min(6, laneH * 0.12, plotW / (2.5 * Math.sqrt(maxLane))),
      )
    }
    this._lastDotR = r
    const spacing = opts.spacing > 0 ? opts.spacing : 1
    const step = Math.max(0.5, r * spacing) // vertical pack step (~half a dot)
    const jitter = scfg.spread === 'jitter'

    /** @type {{ i:number, cx:number, cy:number, outerR:number, dots:{x:number,y:number,r?:number}[] }[]} */
    const clusters = []
    /** @type {{ i:number, cy:number, name:string }[]} */
    const lanes = []

    // Bubble beeswarm: the largest possible dot radius bounds the pack's
    // x-window break (a pair collides within r_i + r_j <= 2*maxR).
    const maxR = sizeStats ? sizeStats.rMax : r

    visible.forEach((ci, slot) => {
      const cy = laneCy(slot)
      lanes.push({ i: ci, cy, name: names[ci] || `series-${ci + 1}` })
      const cat = unitData[ci] || []
      // Points keep their original datum index j so draw() can still resolve
      // unitData[i][j] for per-unit colour + tooltip. A non-numeric datum is
      // pinned to the axis start (defensive; scatter expects numeric values).
      // With bubble sizing each point carries its own radius `r` (used by the
      // pack + read back by draw()); otherwise the shared radius applies.
      const pts = cat.map((d, j) => {
        const v = valueOf(d)
        /** @type {{j:number,px:number,y:number,r?:number}} */
        const p = { j, px: plotX(isNum(v) ? v : xMin), y: cy }
        if (sizeStats) p.r = this._scatterRadius(d, sizeStats, r)
        return p
      })
      if (jitter) {
        // Deterministic pseudo-jitter by index (no Math.random - keeps SSR +
        // re-render stable): spread within the lane band.
        const halfLane = Math.max(maxR, laneH / 2 - maxR)
        pts.forEach((p, k) => {
          const t = ((k * 9301 + 49297) % 233280) / 233280 // LCG in [0,1)
          p.y = cy + (t * 2 - 1) * halfLane
        })
      } else {
        this._beeswarm(pts, cy, r, step, maxR)
      }
      // draw() indexes cluster.dots[j] against unitData[i][j], so keep j order.
      clusters.push({
        i: ci,
        cx: (plotL + plotR) / 2,
        cy,
        outerR: laneH / 2,
        dots: pts.map((p) => ({ x: p.px, y: p.y, r: p.r })),
      })
    })

    // Tick values for the axis chrome.
    /** @type {number[]} */
    const ticks = []
    const spacingT = nice.spacing || xSpan / Math.max(1, tickAmount - 1)
    if (scfg.xMin != null || scfg.xMax != null) {
      for (let k = 0; k < tickAmount; k++) {
        ticks.push(xMin + (xSpan * k) / (tickAmount - 1))
      }
    } else {
      for (let v = xMin; v <= xMax + spacingT * 0.5; v += spacingT) {
        ticks.push(Math.abs(v) < spacingT * 1e-9 ? 0 : v)
      }
    }

    this._scatterAxis = {
      mode: '1d',
      plotL,
      plotR,
      plotT,
      plotB,
      xMin,
      xMax,
      plotX,
      ticks,
      lanes,
      xTitle: scfg.xTitle,
      formatter: typeof scfg.xFormatter === 'function' ? scfg.xFormatter : null,
      gridlines: scfg.gridlines !== false,
    }
    return clusters
  }

  /**
   * 2D value-value scatter: each datum is a point at (`x`, `y`) on two numeric
   * axes (a scatter / bubble plot in the unit family - premium, keyed
   * transitions, per-unit colour/tooltip). Category = colour (one series group
   * per category). With `scatter.sizeRange` set, each dot is a BUBBLE scaled (by
   * area) from its `sizeField` (default 'z'). Needs the object form with numeric
   * `x` + `y`.
   * @param {any} opts
   */
  _layoutScatter2D(opts) {
    const w = this.w
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const scfg = opts.scatter || {}
    const unitData = w.seriesData.unitData || []
    const isNum = (/** @type {any} */ v) => typeof v === 'number' && isFinite(v)
    const xOf = (/** @type {any} */ d) =>
      d && typeof d === 'object' ? d.x : null
    const yOf = (/** @type {any} */ d) =>
      d && typeof d === 'object' ? (d.y != null ? d.y : d.value) : null

    // A category is visible if it has at least one point with numeric x AND y.
    const visible = unitData
      .map((_, i) => i)
      .filter((i) =>
        (unitData[i] || []).some((d) => isNum(xOf(d)) && isNum(yOf(d))),
      )

    // Global x + y ranges (nice-numbered unless pinned).
    let xmn = Infinity
    let xmx = -Infinity
    let ymn = Infinity
    let ymx = -Infinity
    unitData.forEach((cat) =>
      (cat || []).forEach((d) => {
        const x = xOf(d)
        const y = yOf(d)
        if (isNum(x) && isNum(y)) {
          if (x < xmn) xmn = x
          if (x > xmx) xmx = x
          if (y < ymn) ymn = y
          if (y > ymx) ymx = y
        }
      }),
    )
    if (xmn === Infinity) {
      xmn = 0
      xmx = 1
      ymn = 0
      ymx = 1
    }
    const xTicksN = Math.max(2, Math.round(scfg.tickAmount > 0 ? scfg.tickAmount : 5))
    const yTicksN = Math.max(2, Math.round(scfg.yTickAmount > 0 ? scfg.yTickAmount : 5))
    const nx = this._niceScale(
      scfg.xMin != null ? scfg.xMin : xmn,
      scfg.xMax != null ? scfg.xMax : xmx,
      xTicksN,
    )
    const ny = this._niceScale(
      scfg.yMin != null ? scfg.yMin : ymn,
      scfg.yMax != null ? scfg.yMax : ymx,
      yTicksN,
    )
    const xMin = scfg.xMin != null ? scfg.xMin : nx.min
    const xMax = scfg.xMax != null ? scfg.xMax : nx.max
    const yMin = scfg.yMin != null ? scfg.yMin : ny.min
    const yMax = scfg.yMax != null ? scfg.yMax : ny.max
    const xSpan = xMax - xMin || 1
    const ySpan = yMax - yMin || 1

    // Plot box: left gutter for the Y axis (ticks + rotated title), bottom for X.
    const leftGutter = 46 + (scfg.yTitle ? 18 : 0)
    const bottomGutter = 30 + (scfg.xTitle ? 20 : 0)
    const plotL = leftGutter
    const plotR = gw - 12
    const plotT = 10
    const plotB = gh - bottomGutter
    const plotW = Math.max(4, plotR - plotL)
    const plotH = Math.max(4, plotB - plotT)

    const plotX = (/** @type {number} */ v) => plotL + ((v - xMin) / xSpan) * plotW
    // Y grows upward: larger value -> smaller pixel.
    const plotY = (/** @type {number} */ v) => plotB - ((v - yMin) / ySpan) * plotH

    const sizeStats = this._scatterSizeStats(scfg, unitData)
    const baseR = this._fixedRadius(opts) || 5
    this._lastDotR = baseR

    /** @type {{ i:number, cx:number, cy:number, outerR:number, dots:{x:number,y:number,r?:number}[] }[]} */
    const clusters = []
    visible.forEach((ci) => {
      const cat = unitData[ci] || []
      const dots = cat.map((d) => {
        const x = xOf(d)
        const y = yOf(d)
        return {
          x: plotX(isNum(x) ? x : xMin),
          y: plotY(isNum(y) ? y : yMin),
          r: sizeStats ? this._scatterRadius(d, sizeStats, baseR) : undefined,
        }
      })
      clusters.push({
        i: ci,
        cx: (plotL + plotR) / 2,
        cy: (plotT + plotB) / 2,
        outerR: plotH / 2,
        dots,
      })
    })

    const mkTicks = (
      /** @type {number} */ lo,
      /** @type {number} */ hi,
      /** @type {number} */ span,
      /** @type {number} */ spacing,
      /** @type {boolean} */ pinned,
      /** @type {number} */ n,
    ) => {
      /** @type {number[]} */
      const out = []
      if (pinned) {
        for (let k = 0; k < n; k++) out.push(lo + (span * k) / (n - 1))
      } else {
        const sp = spacing || span / Math.max(1, n - 1)
        for (let v = lo; v <= hi + sp * 0.5; v += sp) {
          out.push(Math.abs(v) < sp * 1e-9 ? 0 : v)
        }
      }
      return out
    }

    this._scatterAxis = {
      mode: '2d',
      plotL,
      plotR,
      plotT,
      plotB,
      plotX,
      plotY,
      xTicks: mkTicks(
        xMin,
        xMax,
        xSpan,
        nx.spacing,
        scfg.xMin != null || scfg.xMax != null,
        xTicksN,
      ),
      yTicks: mkTicks(
        yMin,
        yMax,
        ySpan,
        ny.spacing,
        scfg.yMin != null || scfg.yMax != null,
        yTicksN,
      ),
      xTitle: scfg.xTitle,
      yTitle: scfg.yTitle,
      xFormatter: typeof scfg.xFormatter === 'function' ? scfg.xFormatter : null,
      yFormatter: typeof scfg.yFormatter === 'function' ? scfg.yFormatter : null,
      gridlines: scfg.gridlines !== false,
    }
    return clusters
  }

  /**
   * Bubble size stats for the scatter layout, or null when `scatter.sizeRange`
   * is not a `[minR, maxR]` pair. Reads the global range of each datum's
   * `sizeField` (default 'z') so a value maps to a radius (area scale) in
   * _scatterRadius.
   * @param {any} scfg @param {any[][]} unitData
   * @returns {{zmin:number,zmax:number,rMin:number,rMax:number,field:string}|null}
   */
  _scatterSizeStats(scfg, unitData) {
    const range = scfg && scfg.sizeRange
    if (!Array.isArray(range) || range.length < 2) return null
    const rMin = Math.max(0.5, +range[0])
    const rMax = Math.max(rMin, +range[1])
    const field = scfg.sizeField || 'z'
    let zmin = Infinity
    let zmax = -Infinity
    unitData.forEach((cat) =>
      (cat || []).forEach((d) => {
        const z = d && typeof d === 'object' ? d[field] : null
        if (typeof z === 'number' && isFinite(z)) {
          if (z < zmin) zmin = z
          if (z > zmax) zmax = z
        }
      }),
    )
    if (zmin === Infinity) return null
    return { zmin, zmax, rMin, rMax, field }
  }

  /**
   * Radius for one datum under the bubble size stats: area proportional to the
   * `sizeField` value (so radius grows with sqrt), between rMin and rMax. A
   * missing value collapses to rMin.
   * @param {any} d
   * @param {{zmin:number,zmax:number,rMin:number,rMax:number,field:string}} st
   * @param {number} fallback @returns {number}
   */
  _scatterRadius(d, st, fallback) {
    if (!st) return fallback
    const z = d && typeof d === 'object' ? d[st.field] : null
    if (typeof z !== 'number' || !isFinite(z)) return st.rMin
    const t = st.zmax > st.zmin ? (z - st.zmin) / (st.zmax - st.zmin) : 1
    const tc = Math.max(0, Math.min(1, t))
    const aMin = st.rMin * st.rMin
    const aMax = st.rMax * st.rMax
    return Math.sqrt(aMin + tc * (aMax - aMin))
  }

  /**
   * One-dimensional anti-overlap "beeswarm" pack: given points with a fixed x
   * (`px`) and a lane centre `cy`, assign each a y so no two dots overlap (centre
   * distance >= r_i + r_j). Greedy in ascending-x order, trying offsets 0, +step,
   * -step, +2step ... and taking the SMALLEST that clears every already-placed
   * neighbour still within reach in x. No-overlap always wins: a very dense lane
   * grows a taller swarm rather than stacking dots (offsets are not hard-clamped
   * to the lane). Each point may carry its own radius `r` (bubble beeswarm),
   * else `rFallback` applies; `maxR` bounds the x-window break. Mutates each
   * point's `.y`. Deterministic (no physics, no randomness).
   * @param {{px:number,y:number,r?:number}[]} pts @param {number} cy
   * @param {number} rFallback @param {number} step @param {number} [maxR]
   */
  _beeswarm(pts, cy, rFallback, step, maxR) {
    const order = pts.slice().sort((a, b) => a.px - b.px)
    /** @type {{px:number,y:number,r:number}[]} */
    const placed = []
    const rCap = maxR != null ? maxR : rFallback
    order.forEach((p) => {
      const pr = p.r != null ? p.r : rFallback
      let chosen = 0
      for (let k = 0; k < 2000; k++) {
        const off = k === 0 ? 0 : Math.ceil(k / 2) * step * (k % 2 ? 1 : -1)
        const y = cy + off
        let ok = true
        for (let m = placed.length - 1; m >= 0; m--) {
          const q = placed[m]
          const dx = p.px - q.px
          if (dx > pr + rCap) break // x-ascending; nothing else can be in reach
          const need = pr + q.r
          const dy = y - q.y
          if (dx * dx + dy * dy < need * need) {
            ok = false
            break
          }
        }
        if (ok) {
          chosen = off
          break
        }
      }
      p.y = cy + chosen
      placed.push({ px: p.px, y: p.y, r: pr })
    })
  }

  /**
   * A "nice" numeric scale [min, max] + tick spacing covering [dataMin, dataMax]
   * with about `ticks` ticks, using rounded 1/2/5 x 10^n steps. Homegrown (no
   * dependency) - lean-core.
   * @param {number} dataMin @param {number} dataMax @param {number} ticks
   * @returns {{min:number,max:number,spacing:number}}
   */
  _niceScale(dataMin, dataMax, ticks) {
    const lo = dataMin
    let hi = dataMax
    if (!(hi > lo)) hi = lo + 1
    const range = this._niceNum(hi - lo, false)
    const spacing = this._niceNum(range / Math.max(1, ticks - 1), true)
    return {
      min: Math.floor(lo / spacing) * spacing,
      max: Math.ceil(hi / spacing) * spacing,
      spacing,
    }
  }

  /**
   * Round a range to a "nice" 1/2/5 x 10^n number (Heckbert's loose/round label
   * algorithm).
   * @param {number} range @param {boolean} round @returns {number}
   */
  _niceNum(range, round) {
    const rng = range > 0 ? range : 1
    const exp = Math.floor(Math.log(rng) / Math.LN10)
    const frac = rng / Math.pow(10, exp)
    let nf
    if (round) {
      nf = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10
    } else {
      nf = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
    }
    return nf * Math.pow(10, exp)
  }

  /**
   * Draw the scatter chrome behind the dots, from the geometry the layout
   * stashed on `this._scatterAxis`. 1D (beeswarm): vertical X gridlines +
   * baseline + tick labels (+ x title) + a per-lane category label in the
   * category colour. 2D: both X + Y gridlines, both axes' tick labels, and
   * rotated/placed axis titles (no lane labels - category is colour). Browser-
   * only (SSR renders the dots without the chrome, as with cluster labels).
   * @param {any} ret @param {Graphics} graphics
   */
  _drawScatterAxes(ret, graphics) {
    const w = this.w
    if (!Environment.isBrowser()) return
    const ax = this._scatterAxis
    if (!ax) return
    const NS = 'http://www.w3.org/2000/svg'
    const g = graphics.group({ class: 'apexcharts-unit-axis' })

    const gridColor =
      (w.config.grid && w.config.grid.borderColor) || 'rgba(128,128,128,0.18)'
    const axisColor = 'rgba(128,128,128,0.5)'
    const labelColor =
      (w.config.xaxis &&
        w.config.xaxis.labels &&
        w.config.xaxis.labels.style &&
        w.config.xaxis.labels.style.colors) ||
      'rgba(120,130,140,0.9)'

    const line = (/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2, /** @type {string} */ stroke) => {
      const l = BrowserAPIs.createElementNS(NS, 'line')
      l.setAttribute('x1', String(x1))
      l.setAttribute('y1', String(y1))
      l.setAttribute('x2', String(x2))
      l.setAttribute('y2', String(y2))
      l.setAttribute('stroke', stroke)
      l.setAttribute('shape-rendering', 'crispEdges')
      g.node.appendChild(l)
    }
    const text = (
      /** @type {string} */ str,
      /** @type {number} */ x,
      /** @type {number} */ y,
      /** @type {string} */ anchor,
      /** @type {string} */ fill,
      /** @type {number} */ size,
      /** @type {number} */ weight,
      /** @type {string} */ cls,
    ) => {
      const t = BrowserAPIs.createElementNS(NS, 'text')
      t.setAttribute('class', cls)
      t.setAttribute('x', String(x))
      t.setAttribute('y', String(y))
      t.setAttribute('text-anchor', anchor)
      t.setAttribute('dominant-baseline', 'middle')
      t.setAttribute('font-size', `${size}px`)
      t.setAttribute('font-family', w.config.chart.fontFamily || 'inherit')
      t.setAttribute('font-weight', String(weight))
      t.setAttribute('fill', fill)
      t.textContent = str
      g.node.appendChild(t)
    }

    if (ax.mode === '2d') {
      // Y gridlines + tick labels (value grows upward).
      ax.yTicks.forEach((/** @type {number} */ v) => {
        const y = ax.plotY(v)
        if (ax.gridlines) line(ax.plotL, y, ax.plotR, y, gridColor)
        const label = ax.yFormatter ? String(ax.yFormatter(v)) : this._formatTick(v)
        text(label, ax.plotL - 8, y, 'end', labelColor, 11, 400, 'apexcharts-unit-tick')
      })
      // X gridlines + tick labels.
      ax.xTicks.forEach((/** @type {number} */ v) => {
        const x = ax.plotX(v)
        if (ax.gridlines) line(x, ax.plotT, x, ax.plotB, gridColor)
        const label = ax.xFormatter ? String(ax.xFormatter(v)) : this._formatTick(v)
        text(label, x, ax.plotB + 14, 'middle', labelColor, 11, 400, 'apexcharts-unit-tick')
      })
      // Axis baselines (X along the bottom, Y up the left).
      line(ax.plotL, ax.plotB, ax.plotR, ax.plotB, axisColor)
      line(ax.plotL, ax.plotT, ax.plotL, ax.plotB, axisColor)
      // X title under the ticks; Y title rotated up the left edge.
      if (ax.xTitle) {
        text(
          String(ax.xTitle),
          (ax.plotL + ax.plotR) / 2,
          ax.plotB + 32,
          'middle',
          labelColor,
          12,
          600,
          'apexcharts-unit-axis-title',
        )
      }
      if (ax.yTitle) {
        const yt = BrowserAPIs.createElementNS(NS, 'text')
        yt.setAttribute('class', 'apexcharts-unit-axis-title')
        const tx = 14
        const ty = (ax.plotT + ax.plotB) / 2
        yt.setAttribute('x', String(tx))
        yt.setAttribute('y', String(ty))
        yt.setAttribute('text-anchor', 'middle')
        yt.setAttribute('font-size', '12px')
        yt.setAttribute('font-family', w.config.chart.fontFamily || 'inherit')
        yt.setAttribute('font-weight', '600')
        yt.setAttribute('fill', labelColor)
        yt.setAttribute('transform', `rotate(-90 ${tx} ${ty})`)
        yt.textContent = String(ax.yTitle)
        g.node.appendChild(yt)
      }
      ret.add(g)
      return
    }

    // 1D beeswarm: vertical gridlines + tick labels.
    ax.ticks.forEach((/** @type {number} */ v) => {
      const x = ax.plotX(v)
      if (ax.gridlines) line(x, ax.plotT, x, ax.plotB, gridColor)
      const label = ax.formatter ? String(ax.formatter(v)) : this._formatTick(v)
      text(label, x, ax.plotB + 14, 'middle', labelColor, 11, 400, 'apexcharts-unit-tick')
    })
    // X axis baseline.
    line(ax.plotL, ax.plotB, ax.plotR, ax.plotB, axisColor)
    // X axis title.
    if (ax.xTitle) {
      text(
        String(ax.xTitle),
        (ax.plotL + ax.plotR) / 2,
        ax.plotB + 32,
        'middle',
        labelColor,
        12,
        600,
        'apexcharts-unit-axis-title',
      )
    }
    // Lane (category) labels in the left gutter, in the category colour.
    if (ax.plotL > 12) {
      ax.lanes.forEach((/** @type {{i:number,cy:number,name:string}} */ lane) => {
        const color =
          w.globals.colors[lane.i] || w.globals.colors[0] || '#008FFB'
        text(lane.name, ax.plotL - 8, lane.cy, 'end', color, 12, 600, 'apexcharts-unit-lane-label')
      })
    }

    ret.add(g)
  }

  /**
   * Compact tick-value formatting: integers as-is, otherwise trimmed to a short
   * decimal; large magnitudes get a k/M suffix.
   * @param {number} v @returns {string}
   */
  _formatTick(v) {
    if (!isFinite(v)) return ''
    const a = Math.abs(v)
    if (a >= 1e6) return `${+(v / 1e6).toFixed(1)}M`
    if (a >= 1e4) return `${+(v / 1e3).toFixed(1)}k`
    if (Number.isInteger(v)) return String(v)
    return String(+v.toFixed(2))
  }

  /**
   * Distribute `total` whole cells across `counts` in proportion to each value,
   * using the largest-remainder method so the parts sum to exactly `total`
   * (used by the grid/waffle percentage mode).
   * @param {number[]} counts @param {number} total @returns {number[]}
   */
  _largestRemainder(counts, total) {
    const sum = counts.reduce((a, b) => a + b, 0)
    if (sum <= 0 || total <= 0) return counts.map(() => 0)
    const exact = counts.map((c) => (c / sum) * total)
    const floors = exact.map((v) => Math.floor(v))
    const used = floors.reduce((a, b) => a + b, 0)
    const remaining = Math.max(0, total - used)
    // Hand the leftover cells to the categories with the largest fractional part.
    const byFrac = exact
      .map((v, i) => ({ i, frac: v - Math.floor(v) }))
      .sort((a, b) => b.frac - a.frac)
    const out = floors.slice()
    for (let n = 0; n < remaining && n < byFrac.length; n++) {
      out[byFrac[n].i]++
    }
    return out
  }

  /**
   * Phyllotaxis (sunflower) placement for `n` points around (cx, cy).
   * @param {number} cx @param {number} cy @param {number} n
   * @param {number} step @param {number} startIndex
   * @returns {{x:number,y:number}[]}
   */
  _spiral(cx, cy, n, step, startIndex) {
    const pts = []
    for (let k = 0; k < n; k++) {
      const idx = startIndex + k
      const r = step * Math.sqrt(idx + 0.5)
      const theta = idx * GOLDEN_ANGLE
      pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) })
    }
    return pts
  }

  /**
   * A fixed dot radius, if the shape/size implies one: an explicit numeric
   * `size`, or an `image` shape (sized by its own width/height). Returns null
   * when dots should auto-size to fit the plot.
   * @param {any} opts @returns {number | null}
   */
  _fixedRadius(opts) {
    if (opts.shape === 'image' && opts.image) {
      return Math.max(opts.image.width || 20, opts.image.height || 20) / 2
    }
    // Bubble sizing (opt-in, circle only): the lattice is spaced for the
    // LARGEST bubble so per-value radii (see _radiusForValue) never overlap a
    // neighbour. A numeric maxRadius fixes that spacing; 'auto' falls through to
    // auto-sizing and the fitted radius becomes the effective max.
    if (this._bubbleActive(opts) && typeof opts.sizeByValue.maxRadius === 'number') {
      return opts.sizeByValue.maxRadius > 0 ? opts.sizeByValue.maxRadius : null
    }
    if (typeof opts.size === 'number' && opts.size > 0) return opts.size
    return null
  }

  /**
   * Whether opt-in bubble sizing applies: enabled, and the shape is a circle
   * (squares/images keep a uniform size).
   * @param {any} opts @returns {boolean}
   */
  _bubbleActive(opts) {
    const sbv = opts.sizeByValue
    return !!(
      sbv &&
      sbv.enabled &&
      opts.shape !== 'image' &&
      opts.shape !== 'square'
    )
  }

  /**
   * This datum's numeric value for sizing / tooltip: the number itself, or an
   * object's `value` / `y`. Null when there is no usable number.
   * @param {any} d @returns {number | null}
   */
  _unitValueOf(d) {
    if (typeof d === 'number') return d
    if (d && typeof d === 'object') {
      const v = d.value != null ? d.value : d.y
      return typeof v === 'number' ? v : null
    }
    return null
  }

  /**
   * Radius for one bubble given the value stats. Default 'area' scaling makes
   * a bubble's AREA proportional to its value (radius grows with sqrt); 'linear'
   * scales the radius directly. Missing values collapse to the min radius.
   * @param {number|null} v
   * @param {{min:number,max:number,minR:number,maxR:number,scale:string}} stats
   * @returns {number}
   */
  _radiusForValue(v, stats) {
    if (v == null || !isFinite(v)) return stats.minR
    const t = stats.max > stats.min ? (v - stats.min) / (stats.max - stats.min) : 1
    const tc = Math.max(0, Math.min(1, t))
    if (stats.scale === 'linear') {
      return stats.minR + tc * (stats.maxR - stats.minR)
    }
    const aMin = stats.minR * stats.minR
    const aMax = stats.maxR * stats.maxR
    return Math.sqrt(aMin + tc * (aMax - aMin))
  }

  /**
   * Value stats + radius bounds for bubble sizing, or null when it does not
   * apply (disabled, non-circle shape, or no per-unit values). `maxR` is the
   * reference radius the layout already spaced the lattice for; `minR` defaults
   * to ~35% of it.
   * @param {any[][]} unitData @param {any} opts @param {number} refR
   * @returns {{min:number,max:number,minR:number,maxR:number,scale:string}|null}
   */
  _bubbleStats(unitData, opts, refR) {
    if (!this._bubbleActive(opts)) return null
    let vmin = Infinity
    let vmax = -Infinity
    unitData.forEach((cat) => {
      if (!cat) return
      cat.forEach((d) => {
        const v = this._unitValueOf(d)
        if (v != null && isFinite(v)) {
          if (v < vmin) vmin = v
          if (v > vmax) vmax = v
        }
      })
    })
    if (vmin === Infinity || vmax < vmin) return null
    const sbv = opts.sizeByValue
    const maxR = refR
    const minR = Math.max(
      1,
      Math.min(
        maxR,
        typeof sbv.minRadius === 'number' ? sbv.minRadius : maxR * 0.35,
      ),
    )
    return {
      min: vmin,
      max: vmax,
      minR,
      maxR,
      scale: sbv.scale === 'linear' ? 'linear' : 'area',
    }
  }

  /**
   * Radial step between successive spiral shells. A fixed radius derives the
   * step directly; 'auto' derives it so a cluster of `count` dots fits `availR`.
   * @param {any} opts @param {number} availR @param {number} count
   * @returns {number}
   */
  _resolveStep(opts, availR, count) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1
    const fixed = this._fixedRadius(opts)
    if (fixed) return 2 * fixed * spacing
    // fit: step * (sqrt(count) + 0.5) <= availR  (the +0.5 leaves room for the
    // outermost dot's own radius).
    return availR / (Math.sqrt(Math.max(1, count)) + 0.5)
  }

  /**
   * @param {number} step @param {any} opts
   * @returns {number}
   */
  _dotRadiusFromStep(step, opts) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1
    const fixed = this._fixedRadius(opts)
    if (fixed) return fixed
    return Math.max(1, step / (2 * spacing))
  }

  /**
   * Corner-anchored shapes (square, image) position by their top-left x/y;
   * circles position by their centre cx/cy.
   * @param {any} opts @returns {boolean}
   */
  _isCorner(opts) {
    return opts.shape === 'square' || opts.shape === 'image'
  }

  /**
   * Half-width/height used to convert a centre point to a corner shape's x/y.
   * @param {any} opts @returns {{hx:number, hy:number}}
   */
  _halfExtent(opts) {
    if (opts.shape === 'image' && opts.image) {
      return { hx: (opts.image.width || 20) / 2, hy: (opts.image.height || 20) / 2 }
    }
    const r = this._lastDotR
    return { hx: r, hy: r }
  }

  /**
   * Draw one dot (circle, square, or image icon) with the category fill +
   * stroke, tagged so the shared non-axis tooltip and hover reuse work.
   * @param {Graphics} graphics @param {any} opts @param {number} dotR
   * @param {string} color @param {number} i @param {number} j
   * @returns {any}
   */
  _drawDot(graphics, opts, dotR, color, i, j) {
    const w = this.w
    const strokeW = w.config.stroke.show ? w.config.stroke.width : 0
    const strokeColor = Array.isArray(w.globals.stroke.colors)
      ? w.globals.stroke.colors[i] || 'none'
      : 'none'
    // Fill translucency via the standard `fill.opacity` (unit defaults to 1, so
    // dots stay solid unless a chart opts in - e.g. bubble scatters set < 1 so
    // overlapping bubbles read through each other). Applied as the SVG
    // `fill-opacity` attribute, independent of the element `style.opacity` the
    // gather / exit animations tween, so the two compose cleanly.
    const fillOpacity =
      typeof w.config.fill.opacity === 'number' ? w.config.fill.opacity : 1

    let el
    if (opts.shape === 'image' && opts.image && opts.image.src) {
      const iw = opts.image.width || 20
      const ih = opts.image.height || 20
      el = w.dom.Paper.image(opts.image.src)
      el.node.setAttribute('width', String(iw))
      el.node.setAttribute('height', String(ih))
      el.node.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      // Recolour a monochrome icon to the category / per-unit colour so the
      // pictogram matches the legend. An feFlood floods the target colour and
      // feComposite clips it to the icon's own alpha, leaving the silhouette in
      // the new colour. Off by default so multi-colour icons keep their colours.
      if (opts.image.tint) {
        el.node.setAttribute('filter', `url(#${this._tintFilter(color)})`)
      }
    } else if (opts.shape === 'square') {
      const side = dotR * 2
      el = graphics.drawRect(0, 0, side, side, opts.borderRadius || 0, color, 1, strokeW, strokeColor)
      el.node.setAttribute('fill', color)
      if (fillOpacity < 1) el.node.setAttribute('fill-opacity', String(fillOpacity))
    } else {
      el = graphics.drawCircle(dotR, {
        fill: color,
        'stroke-width': strokeW,
        stroke: strokeColor,
      })
      el.node.setAttribute('fill', color)
      if (fillOpacity < 1) el.node.setAttribute('fill-opacity', String(fillOpacity))
    }
    el.node.classList.add('apexcharts-unit-area')
    el.node.setAttribute('i', String(i))
    el.node.setAttribute('j', String(j))
    return el
  }

  /**
   * Ensure (once per colour) an SVG recolour filter exists in the chart's defs
   * and return its id. The filter floods `color` and clips it to the source
   * graphic's alpha (feComposite operator="in"), so an `<image>` referencing a
   * monochrome icon is repainted in `color` while keeping its silhouette. Reused
   * across every dot of the same colour.
   * @param {string} color @returns {string}
   */
  _tintFilter(color) {
    const w = this.w
    const NS = 'http://www.w3.org/2000/svg'
    const safe = String(color).replace(/[^a-zA-Z0-9]/g, '')
    const id = `apexcharts-unit-tint-${w.globals.chartID}-${safe}`
    const svg = w.dom.Paper.node
    if (svg.querySelector(`#${id}`)) return id

    let defs = svg.querySelector('defs')
    if (!defs) {
      defs = BrowserAPIs.createElementNS(NS, 'defs')
      svg.insertBefore(defs, svg.firstChild)
    }
    const filter = BrowserAPIs.createElementNS(NS, 'filter')
    filter.setAttribute('id', id)
    // Keep the flood within the icon box; percentages avoid clipping the icon.
    filter.setAttribute('x', '0%')
    filter.setAttribute('y', '0%')
    filter.setAttribute('width', '100%')
    filter.setAttribute('height', '100%')
    const flood = BrowserAPIs.createElementNS(NS, 'feFlood')
    flood.setAttribute('flood-color', color)
    flood.setAttribute('result', 'flood')
    const comp = BrowserAPIs.createElementNS(NS, 'feComposite')
    comp.setAttribute('in', 'flood')
    comp.setAttribute('in2', 'SourceAlpha')
    comp.setAttribute('operator', 'in')
    filter.appendChild(flood)
    filter.appendChild(comp)
    defs.appendChild(filter)
    return id
  }

  /**
   * Position a non-animated dot at (x, y). Circles use cx/cy at the centre;
   * corner shapes (square, image) use x/y at the top-left.
   * @param {SVGElement} node @param {any} opts @param {number} x @param {number} y
   */
  _placeDot(node, opts, x, y) {
    if (this._isCorner(opts)) {
      const { hx, hy } = this._halfExtent(opts)
      node.setAttribute('x', String(x - hx))
      node.setAttribute('y', String(y - hy))
    } else {
      node.setAttribute('cx', String(x))
      node.setAttribute('cy', String(y))
    }
  }

  /**
   * Parse a `#rgb` / `#rrggbb` / `rgb()` / `rgba()` colour to `[r, g, b]`, or
   * null if it cannot be parsed (the colour tween is then skipped).
   * @param {string} str @returns {number[] | null}
   */
  _rgb(str) {
    if (typeof str !== 'string') return null
    let s = str.trim()
    if (s[0] === '#') {
      if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]
      const n = parseInt(s.slice(1, 7), 16)
      if (isNaN(n)) return null
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (m) {
      const p = m[1].split(',').map((x) => parseFloat(x))
      if (p.length >= 3 && p.every((v) => !isNaN(v))) return [p[0], p[1], p[2]]
    }
    return null
  }

  /**
   * Whether to run the gather / transition animation. Runs on the initial mount
   * and on data-driven updates (keyed old->new tween or cross-type burst).
   * Skipped: in SSR, when animations are off, when the caller passed
   * `animate:false` (shouldAnimate === false), on a PURE window resize (resized
   * with no data change - re-gathering on every resize would be jarring), and
   * when the user prefers reduced motion.
   *
   * Note: `w.globals.resized` is set true on every update (not just window
   * resize), so it must be paired with `!dataChanged` to isolate a real resize.
   * @returns {boolean}
   */
  _shouldAnimate() {
    const w = this.w
    const anim = w.config.chart.animations
    if (!Environment.isBrowser()) return false
    if (!anim || anim.enabled === false) return false
    if (w.globals.shouldAnimate === false) return false
    if (w.globals.resized && !w.globals.dataChanged) return false
    if (anim.respectReducedMotion && prefersReducedMotion()) return false
    return true
  }

  /**
   * One rAF loop that tweens every dot from its start (cx0/cy0 - either the
   * cluster centre on first mount / for entering dots, or its previous slot on
   * an update) to its target slot, staggered by index. Entering dots fade in;
   * moving dots stay opaque. Dots whose group colour changed (a 'flow' regroup)
   * cross-fade their fill from the old colour to the new one over the same ease;
   * dots whose radius changed (bubble sizing) grow/shrink over it too (circles).
   * @param {{ node: SVGElement, x: number, y: number, cx0: number, cy0: number, r0?: number, r1?: number, delay: number, isEnter: boolean, fill0?: string, fill1?: string, _c0?: number[]|null, _c1?: number[]|null }[]} dots
   */
  _runGather(dots) {
    const w = this.w
    const opts = w.config.plotOptions.unit
    const speed = Math.max(1, w.config.chart.animations.speed || 800)
    const corner = this._isCorner(opts)
    const { hx, hy } = this._halfExtent(opts)

    // Stagger across the whole population, capped so large sets still settle
    // quickly. Dots animate outward roughly centre-first.
    const maxDelay = Math.min(speed * 0.6, 450)
    const n = dots.length
    for (let k = 0; k < n; k++) {
      dots[k].delay = n > 1 ? (k / (n - 1)) * maxDelay : 0
    }

    const cxAttr = corner ? 'x' : 'cx'
    const cyAttr = corner ? 'y' : 'cy'
    const offX = corner ? hx : 0
    const offY = corner ? hy : 0

    // Seed initial corner for corner shapes (x/y are top-left).
    if (corner) {
      for (let k = 0; k < n; k++) {
        dots[k].node.setAttribute(cxAttr, String(dots[k].cx0 - offX))
        dots[k].node.setAttribute(cyAttr, String(dots[k].cy0 - offY))
      }
    }

    // Seed the starting radius for size-changing circles so they grow from the
    // previous size instead of flashing at the new one for a frame.
    if (!corner) {
      for (let k = 0; k < n; k++) {
        const d = dots[k]
        if (d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
          d.node.setAttribute('r', String(d.r0))
        }
      }
    }

    // Pre-parse the endpoints for dots that recolour mid-flight (flow regroup);
    // dots that keep their colour skip the tween entirely.
    for (let k = 0; k < n; k++) {
      const d = dots[k]
      if (d.fill0 && d.fill1 && d.fill0 !== d.fill1) {
        d._c0 = this._rgb(d.fill0)
        d._c1 = this._rgb(d.fill1)
      }
    }

    // Position easing. Default decelerates to a stop; `gather.easing:
    // 'inOutCubic'` accelerates out of rest first (weighted travel), and
    // 'outBack' overshoots each dot past its slot and springs back (a per-dot
    // settle), with `gather.overshoot` tuning the spring strength. Colour,
    // radius and opacity always stay on the out-cubic: a back ease exceeds 1
    // mid-flight, which would push RGB channels out of range and wobble radii.
    const gcfg = opts.gather || {}
    const easePos =
      gcfg.easing === 'outBack'
        ? easeOutBack(typeof gcfg.overshoot === 'number' ? gcfg.overshoot : 1.70158)
        : gcfg.easing === 'inOutCubic'
          ? easeInOutCubic
          : easeOutCubic

    // Cancel a gather loop still running from a previous render before starting
    // a new one, so we don't keep animating the old (detached) dots on a rapid
    // update.
    if (this.w.globals.unitGatherRAF != null) {
      BrowserAPIs.cancelAnimationFrame(this.w.globals.unitGatherRAF)
      this.w.globals.unitGatherRAF = null
    }
    const start = performance.now()
    /** @param {number} now */
    const stepFn = (now) => {
      // Bail if the chart was destroyed mid-gather (route change / re-render):
      // the dots are detached and setAttribute on them is wasted work. Matches
      // Animations.animatePop.
      if (this.w.globals.isDestroyed) {
        this.w.globals.unitGatherRAF = null
        return
      }
      let done = true
      for (let k = 0; k < n; k++) {
        const d = dots[k]
        const t = Math.max(0, Math.min(1, (now - start - d.delay) / speed))
        const e = easePos(t)
        const ec = easeOutCubic(t)
        const cx = d.cx0 + (d.x - d.cx0) * e
        const cy = d.cy0 + (d.y - d.cy0) * e
        d.node.setAttribute(cxAttr, String(cx - offX))
        d.node.setAttribute(cyAttr, String(cy - offY))
        // Entering dots fade in over the first stretch; moving dots stay solid.
        if (d.isEnter) d.node.style.opacity = String(Math.min(1, t * 2.5))
        // Cross-fade the fill for dots that changed group colour.
        if (d._c0 && d._c1) {
          const cr = Math.round(d._c0[0] + (d._c1[0] - d._c0[0]) * ec)
          const cg = Math.round(d._c0[1] + (d._c1[1] - d._c0[1]) * ec)
          const cb = Math.round(d._c0[2] + (d._c1[2] - d._c0[2]) * ec)
          d.node.setAttribute('fill', `rgb(${cr},${cg},${cb})`)
        }
        // Grow/shrink circles whose radius changed (bubble sizing).
        if (!corner && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
          d.node.setAttribute('r', String(d.r0 + (d.r1 - d.r0) * ec))
        }
        if (t < 1) done = false
      }
      if (done) {
        for (let k = 0; k < n; k++) {
          const d = dots[k]
          d.node.style.opacity = ''
          // Settle on the exact target colour + radius (undo rounding drift).
          if (d._c1 && d.fill1) d.node.setAttribute('fill', d.fill1)
          if (!corner && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
            d.node.setAttribute('r', String(d.r1))
          }
        }
        this.w.globals.unitGatherRAF = null
      } else {
        this.w.globals.unitGatherRAF = BrowserAPIs.requestAnimationFrame(stepFn)
      }
    }
    this.w.globals.unitGatherRAF = BrowserAPIs.requestAnimationFrame(stepFn)
  }

  /**
   * Keys present in the previous render but not the current one, resolved back
   * to their old slot {x, y, fill}. These are the dots that must animate out.
   * @param {Map<string, {x:number,y:number,fill:string}>} prev
   * @param {Map<string, {x:number,y:number,fill:string}>} nextPrev
   * @param {any} opts
   * @returns {{x:number,y:number,fill:string}[]}
   */
  _collectExits(prev, nextPrev, opts) {
    // Cap the ghost count so a huge dataset switch (e.g. hundreds removed) does
    // not spawn an unbounded number of one-shot animated nodes.
    const cap = Math.max(0, opts.maxUnits || 5000)
    /** @type {{x:number,y:number,fill:string}[]} */
    const exits = []
    for (const [key, slot] of prev) {
      if (!nextPrev.has(key)) {
        exits.push(slot)
        if (exits.length >= cap) break
      }
    }
    return exits
  }

  /**
   * Animate the exit ghosts out, then remove them. Layouts whose positions carry
   * data (a waffle / grid lattice, or a scatter / beeswarm on real axes) fade
   * their ghosts OUT IN PLACE - drifting them toward the plot centre would drag
   * cells across tiles or bubbles across the plane, which reads as wrong. The
   * blob / bar layouts keep the gentle inward collapse so a removal reads as
   * motion rather than a pop.
   * @param {any} group @param {{x:number,y:number,fill:string}[]} exits @param {any} opts
   */
  _runExits(group, exits, opts) {
    const w = this.w
    const graphics = new Graphics(w, this.ctx)
    const dotR = this._lastDotR
    const cx = w.layout.gridWidth / 2
    const cy = w.layout.gridHeight / 2
    // Layouts whose positions carry data - a grid/waffle lattice or a scatter /
    // beeswarm on real axes - fade their ghosts IN PLACE (no drift): a removed
    // cell / point simply fades on its own spot. Only the blob / bar layouts
    // keep the gentle inward collapse.
    const drift =
      opts.layout === 'grid' ||
      opts.layout === 'scatter' ||
      opts.layout === 'arc'
        ? 0
        : 0.35

    /** @type {{ node: SVGElement, x0:number, y0:number }[]} */
    const ghosts = []
    exits.forEach((slot) => {
      const el = this._drawDot(graphics, opts, dotR, slot.fill, 0, 0)
      el.node.classList.add('apexcharts-unit-exit')
      this._placeDot(el.node, opts, slot.x, slot.y)
      group.add(el)
      ghosts.push({ node: el.node, x0: slot.x, y0: slot.y })
    })

    if (!this._shouldAnimate()) {
      // No animation: just drop them (they belong to the old data).
      ghosts.forEach((g) => g.node.remove())
      return
    }

    const speed = Math.max(1, w.config.chart.animations.speed || 800)
    const corner = this._isCorner(opts)
    const { hx, hy } = this._halfExtent(opts)
    const offX = corner ? hx : 0
    const offY = corner ? hy : 0
    const cxAttr = corner ? 'x' : 'cx'
    const cyAttr = corner ? 'y' : 'cy'
    // Cancel an exit loop still running from a previous render before starting a
    // new one, so stale ghosts don't keep fading on a rapid update.
    if (this.w.globals.unitExitRAF != null) {
      BrowserAPIs.cancelAnimationFrame(this.w.globals.unitExitRAF)
      this.w.globals.unitExitRAF = null
    }
    const start = performance.now()

    /** @param {number} now */
    const stepFn = (now) => {
      // Bail if the chart was destroyed mid-exit (the ghost group is detached).
      if (this.w.globals.isDestroyed) {
        this.w.globals.unitExitRAF = null
        return
      }
      const t = Math.max(0, Math.min(1, (now - start) / speed))
      const e = easeOutCubic(t)
      for (let k = 0; k < ghosts.length; k++) {
        const g = ghosts[k]
        // Drift a little toward the centre while fading (no drift for a grid:
        // the ghost stays on its own cell and simply fades away).
        if (drift) {
          const x = g.x0 + (cx - g.x0) * e * drift
          const y = g.y0 + (cy - g.y0) * e * drift
          g.node.setAttribute(cxAttr, String(x - offX))
          g.node.setAttribute(cyAttr, String(y - offY))
        }
        g.node.style.opacity = String(1 - e)
      }
      if (t < 1) {
        this.w.globals.unitExitRAF = BrowserAPIs.requestAnimationFrame(stepFn)
      } else {
        this.w.globals.unitExitRAF = null
        group.node && group.node.remove()
      }
    }
    this.w.globals.unitExitRAF = BrowserAPIs.requestAnimationFrame(stepFn)
  }

  /**
   * A cluster label placed above (default) or below the cluster/bar. A TOP label
   * over a wide grouped/packed blob rides a curved arc (invisible arc path +
   * <textPath>, centred at 50% offset); a bottom label, a 'columns' bar, or a
   * cluster too small for the arc gets a straight centred label instead.
   * `clusterLabels.position` = 'top' | 'bottom'; `offsetY` pushes it further from
   * the blob in either direction.
   * @param {any} elSeries @param {{ i:number, cx:number, cy:number, outerR:number, flat?:boolean }} cluster
   * @param {number} value @param {number} total @param {any} opts @param {string} color
   */
  _drawClusterLabel(elSeries, cluster, value, total, opts, color) {
    const w = this.w
    if (!Environment.isBrowser()) return
    const NS = 'http://www.w3.org/2000/svg'

    const name = w.seriesData.seriesNames[cluster.i] || `series-${cluster.i + 1}`
    const percent = total > 0 ? (value / total) * 100 : 0
    const cfg = opts.clusterLabels
    const fontSize = parseFloat(cfg.fontSize) || 13

    let text
    if (typeof cfg.formatter === 'function') {
      text = cfg.formatter(name, {
        seriesIndex: cluster.i,
        value,
        percent,
        w,
      })
    } else {
      text = `${name} (${percent.toFixed(1)}%)`
    }

    const str = typeof text === 'string' ? text : String(text)

    const textEl = BrowserAPIs.createElementNS(NS, 'text')
    textEl.setAttribute('class', 'apexcharts-unit-label')
    textEl.setAttribute('text-anchor', 'middle')
    textEl.setAttribute('font-size', `${fontSize}px`)
    textEl.setAttribute('font-family', cfg.fontFamily || w.config.chart.fontFamily || 'inherit')
    textEl.setAttribute('font-weight', String(cfg.fontWeight || 600))
    textEl.setAttribute('fill', cfg.color || color)

    const bottom = cfg.position === 'bottom'

    // Arc radius sits just outside the blob (top placement only).
    const R = cluster.outerR + fontSize * 0.6 + 3 + (cfg.offsetY || 0)
    // Rough text width (no measuring API in SSR). Only curve the label when it
    // fits the upper-semicircle arc length (pi * R); otherwise a small cluster
    // would wrap its label around a few dots. Fall back to a straight label.
    const estWidth = str.length * fontSize * 0.55
    // Curve only a TOP label over a grouped/packed blob wide enough to carry it.
    // A bottom label, a 'columns' bar (cluster.flat), or a tiny cluster takes a
    // straight label instead.
    const curved =
      !bottom &&
      !cluster.flat &&
      cfg.curved !== false &&
      estWidth <= Math.PI * R * 0.95

    if (curved) {
      const yMid = cluster.cy
      const x1 = cluster.cx - R
      const x2 = cluster.cx + R
      // Upper semicircle (left -> right over the TOP). In SVG y grows downward,
      // so sweep-flag 1 bows the arc upward; the label rides the crown.
      const d = `M ${x1} ${yMid} A ${R} ${R} 0 0 1 ${x2} ${yMid}`
      const arcId = `apexcharts-unit-label-${w.globals.chartID}-${cluster.i}`

      const pathEl = BrowserAPIs.createElementNS(NS, 'path')
      pathEl.setAttribute('id', arcId)
      pathEl.setAttribute('d', d)
      pathEl.setAttribute('fill', 'none')
      pathEl.setAttribute('stroke', 'none')

      const tp = BrowserAPIs.createElementNS(NS, 'textPath')
      tp.setAttribute('href', `#${arcId}`)
      tp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${arcId}`)
      tp.setAttribute('startOffset', '50%')
      tp.textContent = str

      textEl.appendChild(tp)
      elSeries.node.appendChild(pathEl)
    } else {
      // Straight label centred above (default) or below the blob/bar. offsetY
      // pushes it further away from the blob in either direction.
      textEl.setAttribute('x', String(cluster.cx))
      const y = bottom
        ? cluster.cy + cluster.outerR + fontSize + 6 + (cfg.offsetY || 0)
        : cluster.cy - cluster.outerR - 6 - (cfg.offsetY || 0)
      textEl.setAttribute('y', String(y))
      textEl.textContent = str
    }

    elSeries.node.appendChild(textEl)
  }
}
