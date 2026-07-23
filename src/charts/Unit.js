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
          : 'grouped'
    // Keying decides which previous dot a new dot tweens from on an update:
    //  - 'group' (default): key "i:j" - a dot stays within its category slot.
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
    /** @type {{ i: number, cx: number, cy: number, outerR: number, dots: {x:number,y:number}[] }[]} */
    const clusters =
      layout === 'packed'
        ? this._layoutPacked(counts, opts)
        : layout === 'columns'
          ? this._layoutColumns(counts, opts)
          : this._layoutGrouped(counts, opts)

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
        // dot shares the reference radius.
        const rj = sizeStats
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
          const cx0 = anchor ? anchor.x : cluster.cx
          const cy0 = anchor ? anchor.y : cluster.cy
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

      // Per-cluster label: a curved arc over a 'grouped' blob, or a straight
      // label above a 'columns' bar (packed interleaves categories, so a
      // per-category label would be meaningless there). Skip a hidden/empty
      // category (0 dots) so a legend-toggled series leaves no ghost label.
      if (
        (layout === 'grouped' || layout === 'columns') &&
        opts.clusterLabels &&
        opts.clusterLabels.show &&
        counts[cluster.i] > 0
      ) {
        this._drawClusterLabel(elSeries, cluster, counts[cluster.i], total, opts, color)
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
      /** @type {{x:number,y:number}[]} */ dots: [],
    }))

    let gi = 0
    order.forEach((catI) => {
      for (let j = 0; j < counts[catI]; j++) {
        const r = step * Math.sqrt(gi + 0.5)
        const theta = gi * GOLDEN_ANGLE
        clusters[catI].dots.push({
          x: cx + r * Math.cos(theta),
          y: cy + r * Math.sin(theta),
        })
        gi++
      }
    })

    return clusters
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
    const labelSpace = opts.clusterLabels && opts.clusterLabels.show ? 30 : 6

    // Only VISIBLE (non-empty) categories claim a column slot, so a legend-hidden
    // bar leaves NO gap: the remaining bars re-flow to fill the row.
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0)
    const Kv = Math.max(1, visible.length)
    const slotOf = new Array(counts.length).fill(-1)
    visible.forEach((i, s) => (slotOf[i] = s))

    const cellW = gw / Kv
    const barW = cellW * 0.62 // gap between neighbouring bars
    // Reserve a little space above the legend / plot edge so the baseline never
    // sits flush against it.
    const bottomPad = Math.max(8, gh * 0.04)
    const availH = Math.max(4, gh - labelSpace - bottomPad)
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
    // Vertically CENTRE the tallest bar within the band [labelSpace, gh-bottomPad]
    // so a fixed dot size (bars shorter than the plot) does not dump all the
    // slack above the row and crowd the legend. Every bar shares this baseline
    // (bottom-aligned to it) so their heights stay directly comparable. For
    // 'auto' sizing the tallest bar already fills the band, so this is a no-op.
    const maxRows = Math.ceil(maxCount / cols)
    const tallestBarH = Math.min(availH, maxRows * pitch)
    const bottom = labelSpace + (availH + tallestBarH) / 2

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
        // Flag read by _drawClusterLabel: a bar takes a straight label above
        // its top edge, never a curved arc.
        flat: true,
        dots,
      }
    })
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
    } else {
      el = graphics.drawCircle(dotR, {
        fill: color,
        'stroke-width': strokeW,
        stroke: strokeColor,
      })
      el.node.setAttribute('fill', color)
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

    const start = performance.now()
    /** @param {number} now */
    const stepFn = (now) => {
      let done = true
      for (let k = 0; k < n; k++) {
        const d = dots[k]
        const t = Math.max(0, Math.min(1, (now - start - d.delay) / speed))
        const e = easeOutCubic(t)
        const cx = d.cx0 + (d.x - d.cx0) * e
        const cy = d.cy0 + (d.y - d.cy0) * e
        d.node.setAttribute(cxAttr, String(cx - offX))
        d.node.setAttribute(cyAttr, String(cy - offY))
        // Entering dots fade in over the first stretch; moving dots stay solid.
        if (d.isEnter) d.node.style.opacity = String(Math.min(1, t * 2.5))
        // Cross-fade the fill for dots that changed group colour.
        if (d._c0 && d._c1) {
          const cr = Math.round(d._c0[0] + (d._c1[0] - d._c0[0]) * e)
          const cg = Math.round(d._c0[1] + (d._c1[1] - d._c0[1]) * e)
          const cb = Math.round(d._c0[2] + (d._c1[2] - d._c0[2]) * e)
          d.node.setAttribute('fill', `rgb(${cr},${cg},${cb})`)
        }
        // Grow/shrink circles whose radius changed (bubble sizing).
        if (!corner && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
          d.node.setAttribute('r', String(d.r0 + (d.r1 - d.r0) * e))
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
      } else {
        BrowserAPIs.requestAnimationFrame(stepFn)
      }
    }
    BrowserAPIs.requestAnimationFrame(stepFn)
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
   * Fade + collapse the exit ghosts toward the plot centre, then remove them.
   * @param {any} group @param {{x:number,y:number,fill:string}[]} exits @param {any} opts
   */
  _runExits(group, exits, opts) {
    const w = this.w
    const graphics = new Graphics(w, this.ctx)
    const dotR = this._lastDotR
    const cx = w.layout.gridWidth / 2
    const cy = w.layout.gridHeight / 2

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
    const start = performance.now()

    /** @param {number} now */
    const stepFn = (now) => {
      const t = Math.max(0, Math.min(1, (now - start) / speed))
      const e = easeOutCubic(t)
      for (let k = 0; k < ghosts.length; k++) {
        const g = ghosts[k]
        // Drift a little toward the centre while fading.
        const x = g.x0 + (cx - g.x0) * e * 0.35
        const y = g.y0 + (cy - g.y0) * e * 0.35
        g.node.setAttribute(cxAttr, String(x - offX))
        g.node.setAttribute(cyAttr, String(y - offY))
        g.node.style.opacity = String(1 - e)
      }
      if (t < 1) {
        BrowserAPIs.requestAnimationFrame(stepFn)
      } else {
        group.node && group.node.remove()
      }
    }
    BrowserAPIs.requestAnimationFrame(stepFn)
  }

  /**
   * A curved label arced over the top of a cluster, via an invisible arc path +
   * <textPath>. Text is centred over the top (text-anchor middle, 50% offset).
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

    // Arc radius sits just outside the blob.
    const R = cluster.outerR + fontSize * 0.6 + 3 + (cfg.offsetY || 0)
    // Rough text width (no measuring API in SSR). Only curve the label when it
    // fits the upper-semicircle arc length (pi * R); otherwise a small cluster
    // would wrap its label around a few dots. Fall back to a straight label
    // centred above the blob.
    const estWidth = str.length * fontSize * 0.55
    // A 'columns' bar (cluster.flat) always takes a straight label above its
    // top edge; a tall thin bar has no sensible arc to ride.
    const curved =
      !cluster.flat && cfg.curved !== false && estWidth <= Math.PI * R * 0.95

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
      // Straight label centred above the blob.
      textEl.setAttribute('x', String(cluster.cx))
      textEl.setAttribute('y', String(cluster.cy - cluster.outerR - 6 - (cfg.offsetY || 0)))
      textEl.textContent = str
    }

    elSeries.node.appendChild(textEl)
  }
}
