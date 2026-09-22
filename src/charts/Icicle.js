// @ts-check
/**
 * ApexCharts Icicle (cartesian partition) chart.
 *
 * One band per hierarchy level, each child cell nested inside its parent's
 * extent along the value axis. It is the sunburst's layout read in cartesian
 * coordinates: the same partition recursion, with the interval measured in
 * pixels instead of degrees and the depth laid out as a row or a column instead
 * of a ring. Both charts share `charts/common/partition/*` for exactly that
 * reason.
 *
 * `direction` decides which way the tree grows. `'down'` is the classic icicle,
 * root band on top. `'up'` puts the root at the bottom and is the flame-graph
 * orientation; with `sort: 'name'` a frame then holds the same position in
 * every profile of the same program, which is what makes two runs comparable.
 * `'right'` and `'left'` grow sideways.
 *
 * Data: a native `children` hierarchy, OR an existing `drilldown` config
 * (`series` + `drilldown.series`) read as plain data by the shared resolver (NO
 * dependency on the drilldown runtime feature).
 *
 * Opt-in (Tier 2): the default bundle does not register this type. Reach it
 * with `import ApexCharts from 'apexcharts/icicle'`, or load `dist/icicle.js`
 * after the core script. See plans/27-icicle.md.
 *
 * @module IcicleChart
 */
import Graphics from '../modules/Graphics'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import { Environment } from '../utils/Environment.js'
import { buildHierarchy, fillValues, morphKey } from './common/Hierarchy'
import {
  breadcrumbConfig,
  clearBreadcrumb,
  placeInReservedBand,
  renderBreadcrumb,
} from './common/Breadcrumb'
import {
  bandScale,
  farEdge,
  focusChain,
  parseSize,
  placeTree,
  resolveFocus,
  sortTree,
  validateStrict,
} from './common/partition/Partition'
import { colorPass, lighten } from './common/partition/Tint'
import { NodeTooltip } from './common/partition/NodeTooltip'

const SVGNS = 'http://www.w3.org/2000/svg'

/**
 * Characters of the name that must survive truncation for a label to be worth
 * drawing. Below this it is a stub, and a chart full of stubs reads as clutter.
 */
const MIN_LABEL_CHARS = 3

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
const lerp = (a, b, t) => a + (b - a) * t

export default class IcicleChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w

    const cnf = w.config
    this.cfg = cnf.plotOptions.icicle
    this.strokeWidth = cnf.stroke.show ? cnf.stroke.width : 0
    this.strokeColor = Array.isArray(cnf.stroke.colors)
      ? cnf.stroke.colors[0]
      : cnf.stroke.colors || '#fff'

    // Plot box. `_vertical` means the depth axis is y, i.e. bands are rows.
    this.width = 0
    this.height = 0
    this._vertical = true
    this._flip = false

    this.total = 1
    this._focusMaxDepth = 0
    /** @type {any} focused node (null = the whole tree) */
    this._focus = null
    // Bumped on every layout pass. A rapid re-click (zoom before the previous
    // one settles) starts a new pass; older animation frames check this and
    // stop writing, so two rAF loops never fight over the same cell.
    this._zoomGen = 0
    /** @type {any[]} */
    this._roots = []
    /** @type {any[]} flat list of every node */
    this._nodesAll = []
    this._tooltip = new NodeTooltip(w)
    /** @type {any} */
    this._graphics = null
    /** @type {any} */
    this._cellsG = null
    /** @type {any} */
    this._labelsG = null
  }

  /**
   * @param {any[]} series  flattened top-level values (geometry comes from the
   *   config hierarchy; kept for the standard draw(series) signature + noData)
   * @returns {any} SVG group
   */
  draw(series) {
    const w = this.w
    const graphics = new Graphics(this.w)
    this._graphics = graphics

    const g = graphics.group({ class: 'apexcharts-icicle' })
    if (w.globals.noData || !series || !series.length) return g

    this.width = w.layout.gridWidth
    this.height = w.layout.gridHeight
    if (this.width < 5 || this.height < 5) return g

    const dir = this.cfg.direction
    this._vertical = dir !== 'right' && dir !== 'left'
    this._flip = dir === 'up' || dir === 'left'

    // Build + colour the hierarchy once (extents are recomputed per zoom).
    this._roots = buildHierarchy(this.w)
    if (!this._roots.length) return g
    this._roots.forEach((r) => fillValues(r))
    sortTree(this._roots, this.cfg.sort)
    if (this.cfg.partition === 'strict') {
      validateStrict(this._roots, {
        type: 'icicle',
        remedy: 'Extents are normalized to fill the parent.',
      })
    }

    this._nodesAll = []
    this._colorNodes()
    this.total = this._roots.reduce((s, r) => s + Math.max(0, r.value), 0) || 1
    this._tooltip.total = this.total

    this._cellsG = graphics.group({ class: 'apexcharts-icicle-cells' })
    this._labelsG = graphics.group({ class: 'apexcharts-icicle-labels' })
    g.add(this._cellsG)
    g.add(this._labelsG)

    this._focus = null
    this._relayout(this._focus)

    // Same gating as the sunburst and the pie family: a wipe intro on first
    // render, a morph from the previous on-screen geometry on data updates
    // (never an instant re-render while animations are on), nothing on resize.
    const anims = w.config.chart.animations
    /** @type {'intro'|'zoom'|'update'|'none'} */
    let mode = 'none'
    if (anims.enabled) {
      if (w.globals.dataChanged) {
        if (anims.dynamicAnimation.enabled) mode = 'update'
      } else if (!w.globals.resized) {
        mode = 'intro'
      }
    }
    this._applyLayout(mode)
    this._renderBreadcrumb()

    return g
  }

  // --------------------------------------------------------------- colours

  /**
   * Give every node a colour, and collect the nodes flat in draw order.
   *
   * The palette lands on the shallowest level that actually BRANCHES, not on
   * the roots. A single-root tree is the normal shape for an icicle and the
   * only shape for a flame graph, and colouring by root would paint the whole
   * chart one hue; what a reader needs is one hue per branch under that root.
   * Levels above it are the trunk, so they take a pale tone that reads as a
   * container instead of competing with the branches.
   */
  _colorNodes() {
    const colors = this.w.globals.colors || []
    const fallback = colors[0] || '#008FFB'

    // Walk down the single-child chain to the first level that branches.
    let level = this._roots
    /** @type {any[]} */
    const trunk = []
    while (
      level.length === 1 &&
      level[0].children &&
      level[0].children.length > 1
    ) {
      trunk.push(level[0])
      level = level[0].children
    }

    const trunkColor = lighten(fallback, 0.62)
    trunk.forEach((n) => {
      n._color = n.color || trunkColor
      this._nodesAll.push(n)
    })

    level.forEach((n, i) => {
      colorPass(
        n,
        n.color || colors[i % colors.length] || fallback,
        this.cfg.tint,
        this._nodesAll,
      )
    })
  }

  // ---------------------------------------------------------------- layout

  /** The extent of the value axis in px. */
  _valueExtent() {
    return this._vertical ? this.width : this.height
  }

  /** The extent of the depth axis in px. */
  _depthExtent() {
    return this._vertical ? this.height : this.width
  }

  /**
   * Recompute visibility + extents for a focus node (null = the whole tree).
   * @param {any} focus
   */
  _relayout(focus) {
    const extent = this._valueExtent()
    const maxDepth = this.cfg.maxDepth
    // `maxDepth` counts LEVELS; the walk wants a depth index.
    const capLevels =
      typeof maxDepth === 'number' && maxDepth > 0 ? maxDepth : 0

    if (focus && this.cfg.zoomType !== 'both') {
      // Value-axis zoom. Lay the WHOLE tree out, so every node keeps its real
      // depth, then rescale the value axis until the focused branch fills it.
      // No level moves: the reader keeps their bearings and the ancestors stay
      // on screen above the branch as context.
      //
      // A cap still has to follow the focus down, or zooming into a branch
      // marked as having more below it would stretch the branch and reveal
      // nothing, which is the one promise that mark makes.
      const focusDepth = focusChain(focus).length - 1
      this._focusMaxDepth = placeTree({
        roots: this._roots,
        nodesAll: this._nodesAll,
        focus: null,
        t0: 0,
        t1: extent,
        cap: capLevels ? capLevels - 1 + focusDepth : undefined,
      })
      this._stretchTo(focus, extent)
    } else {
      this._focusMaxDepth = placeTree({
        roots: this._roots,
        nodesAll: this._nodesAll,
        focus,
        t0: 0,
        t1: extent,
        cap: capLevels ? capLevels - 1 : undefined,
      })
    }

    // Depth bands. `levelSize` is read against the whole depth axis, so a fixed
    // band keeps its thickness as the reader zooms instead of growing to fill.
    const depth = this._depthExtent()
    const levels = this._focusMaxDepth + 1
    const fixed =
      this.cfg.levelSize === 'equal'
        ? 0
        : parseSize(this.cfg.levelSize, depth, 0)
    const used = fixed > 0 ? Math.min(depth, fixed * levels) : depth
    const scale = bandScale({
      maxDepth: this._focusMaxDepth,
      near: 0,
      far: used,
      gap: 1,
    })

    this._nodesAll.forEach((n) => {
      if (!n._show) return
      n._d0 = scale.near(n._vDepth)
      n._d1 = farEdge(n, scale, this._focusMaxDepth, this.cfg.leaf, used)
    })
  }

  /**
   * Rescale the value axis so the focused branch fills it.
   *
   * This is the whole of a value-axis zoom: one affine map applied to extents
   * that are already laid out, with the depth axis untouched. The branch's
   * ancestors stretch past both edges and are clamped to the plot, which is
   * what makes them read as full-width context bands above the focus.
   *
   * Everything outside the branch lands outside the plot, so it is dropped
   * here rather than drawn off-screen: after the map the focus occupies the
   * entire extent, so a sibling cannot partly survive.
   *
   * @param {any} focus
   * @param {number} extent
   */
  _stretchTo(focus, extent) {
    const span = focus._t1 - focus._t0
    if (!(span > 0)) return
    const scale = extent / span
    const from = focus._t0
    const eps = 0.01

    this._nodesAll.forEach((n) => {
      if (!n._show) return
      const t0 = (n._t0 - from) * scale
      const t1 = (n._t1 - from) * scale
      if (t1 <= eps || t0 >= extent - eps) {
        n._show = false
        return
      }
      n._t0 = Math.max(0, t0)
      n._t1 = Math.min(extent, t1)
    })
  }

  /**
   * A node's box in plot coordinates.
   *
   * `_t0`/`_t1` run along the value axis and `_d0`/`_d1` along the depth axis;
   * this is the only place that decides which is x and which is y, so the four
   * directions cost one mapping rather than four layouts.
   *
   * @param {{ _t0: number, _t1: number, _d0: number, _d1: number }} n
   * @returns {{ x: number, y: number, w: number, h: number }}
   */
  _box(n) {
    const t = n._t0
    const len = Math.max(0, n._t1 - n._t0)
    const d = n._d0
    const thick = Math.max(0, n._d1 - n._d0)

    if (this._vertical) {
      return {
        x: t,
        y: this._flip ? this.height - d - thick : d,
        w: len,
        h: thick,
      }
    }
    return {
      x: this._flip ? this.width - d - thick : d,
      y: t,
      w: thick,
      h: len,
    }
  }

  // --------------------------------------------------------------- render

  /**
   * Create / update / remove cells to match the current layout, with an
   * animation appropriate to the transition:
   *   intro  — a wipe along the value axis, staggered by depth so the root band
   *            leads and its children follow it out
   *   update — tween every cell from its previous on-screen box (matched by
   *            node key across the re-render); new cells grow in place
   *   zoom   — tween boxes between focus layouts (same instance)
   * @param {'intro'|'zoom'|'update'|'none'} mode
   */
  _applyLayout(mode) {
    const w = this.w
    const anims = w.config.chart.animations
    // A zoom is a response to a click, so it runs on the interaction clock
    // (`dynamicAnimation.speed`) like an update, NOT on `animations.speed`,
    // which paces the first render. Reading the intro's clock made a click take
    // 800ms by default, which feels like lag rather than motion.
    const dur = !anims.enabled
      ? 0
      : mode === 'none'
        ? 0
        : mode === 'update' || mode === 'zoom'
          ? anims.dynamicAnimation.speed || 350
          : anims.speed || 500

    // Supersede any in-flight zoom: stale frames from the previous pass check
    // this and stop.
    const gen = ++this._zoomGen

    // Geometry of the PREVIOUS render (stashed on the persistent chart ctx —
    // this module is re-instantiated on every data update).
    const prev =
      mode === 'update' ? /** @type {any} */ (this.ctx)._iciclePrevGeoms : null

    this._nodesAll.forEach((node) => {
      if (node._show) {
        const to = this._box(node)
        if (!node._el) node._el = this._createCellEl(node)
        // Per-layout, not per-element: a zoom changes which branches are cut.
        node._el.node.setAttribute('data:clipped', String(!!node._clipped))

        if (mode === 'intro' && dur > 0) {
          this._wipeCell(node, to, dur, gen)
          return
        }

        let from
        let isNew = false
        if (node._cur) {
          // `_cur` is the cell's LIVE box (updated each frame), so an
          // interrupted zoom continues from where it actually is.
          from = node._cur
        } else if (prev && prev.get(node._key)) {
          from = prev.get(node._key) // survived a data update: tween in place
        } else {
          // A new cell grows out of the middle of the slot it is taking.
          from = {
            x: to.x + to.w / 2,
            y: to.y + to.h / 2,
            w: 0,
            h: 0,
          }
          isNew = true
        }
        this._animateCell(node, from, to, dur, false, isNew, gen)
      } else if (node._el && node._cur) {
        const c = node._cur
        const collapsed = {
          x: c.x + c.w / 2,
          y: c.y + c.h / 2,
          w: 0,
          h: 0,
        }
        this._animateCell(node, c, collapsed, dur, true, false, gen)
      }
    })

    // Stash what is now on screen so the NEXT data update can tween from it.
    const geoms = new Map()
    this._nodesAll.forEach((n) => {
      if (n._show) geoms.set(n._key, this._box(n))
    })
    ;/** @type {any} */ (this.ctx)._iciclePrevGeoms = geoms

    this._renderLabels(dur)
  }

  /**
   * @param {any} node
   * @returns {any} svg.js rect element
   */
  _createCellEl(node) {
    const box = this._box(node)
    const rect = this._graphics.drawRect(
      box.x,
      box.y,
      0,
      0,
      this.cfg.borderRadius,
      node._color,
      1,
      this.strokeWidth,
      this.strokeColor,
    )
    rect.node.setAttribute('class', 'apexcharts-icicle-cell')
    const el = rect.node
    el.setAttribute('data:name', node.name)
    el.setAttribute('data:value', String(node.value))
    // The branch's identity, normalized so a treemap or a sunburst computes the
    // same string for the same branch. A cross-type morph pairs on it.
    el.setAttribute('data:key', morphKey(node._key))
    el.setAttribute(
      'data:leaf',
      String(!(node.children && node.children.length)),
    )
    this._tooltip.attach(el, node)
    if (Environment.isBrowser() && this.cfg.zoomOnClick !== false) {
      el.addEventListener('click', () => this._zoomTo(node))
      el.style.cursor = 'pointer'
    }
    this._cellsG.add(rect)
    return rect
  }

  /**
   * Intro: a wipe along the value axis. Each cell grows from its own leading
   * edge, and a deeper band starts later, so the tree reads as unfolding out of
   * the root rather than every level appearing at once.
   *
   * @param {any} node
   * @param {{x:number,y:number,w:number,h:number}} to
   * @param {number} dur
   * @param {number} gen
   */
  _wipeCell(node, to, dur, gen) {
    const el = node._el
    const levels = this._focusMaxDepth + 1
    // Keep the whole sequence inside `dur`: the last band starts at 60% of it.
    const delay = levels > 1 ? (node._vDepth / levels) * dur * 0.6 : 0
    const grow = dur - delay

    const from = this._vertical
      ? { x: to.x, y: to.y, w: 0, h: to.h }
      : { x: to.x, y: to.y, w: to.w, h: 0 }

    this._setBox(el, from)
    el.attr({ opacity: 1 })
    el.node.style.display = ''
    node._cur = from

    el.animate(grow, delay)
      .during((/** @type {number} */ pos) => {
        if (this._zoomGen !== gen) return
        const box = {
          x: to.x,
          y: to.y,
          w: this._vertical ? to.w * pos : to.w,
          h: this._vertical ? to.h : to.h * pos,
        }
        this._setBox(el, box)
        node._cur = box
      })
      .after(() => {
        if (this._zoomGen !== gen) return
        this._setBox(el, to)
        node._cur = to
      })
  }

  /**
   * @param {any} node
   * @param {{x:number,y:number,w:number,h:number}} from
   * @param {{x:number,y:number,w:number,h:number}} to
   * @param {number} dur
   * @param {boolean} hide    collapse, then hide
   * @param {boolean} fadeIn  fade 0 -> 1 (new cells only; tweens stay opaque)
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _animateCell(node, from, to, dur, hide, fadeIn, gen) {
    const el = node._el
    el.attr({ fill: node._color })

    if (dur === 0) {
      this._setBox(el, to)
      el.attr({ opacity: hide ? 0 : 1 })
      el.node.style.display = hide ? 'none' : ''
      node._cur = hide ? null : to
      return
    }

    el.node.style.display = ''
    const startOp = hide ? Number(el.attr('opacity')) || 1 : fadeIn ? 0 : 1
    const endOp = hide ? 0 : 1
    el.attr({ opacity: startOp })

    el.animate(dur)
      .during((/** @type {number} */ pos) => {
        if (this._zoomGen !== gen) return
        const box = {
          x: lerp(from.x, to.x, pos),
          y: lerp(from.y, to.y, pos),
          w: lerp(from.w, to.w, pos),
          h: lerp(from.h, to.h, pos),
        }
        this._setBox(el, box)
        el.attr({ opacity: lerp(startOp, endOp, pos) })
        // Live geometry, so an interrupting zoom picks up exactly here.
        node._cur = box
      })
      .after(() => {
        if (this._zoomGen !== gen) return
        if (hide) {
          el.node.style.display = 'none'
          node._cur = null
        } else {
          this._setBox(el, to)
          node._cur = to
        }
      })
  }

  /**
   * Write a box onto a cell, with `spacing` taken out of it.
   *
   * The gap is applied here rather than in the layout so the extents stay the
   * true partition: a tween interpolates real geometry and the gap never
   * accumulates across frames. It is clamped so a thin cell cannot invert.
   *
   * @param {any} el
   * @param {{x:number,y:number,w:number,h:number}} box
   */
  _setBox(el, box) {
    const gap = this.cfg.spacing || 0
    const insetX = Math.min(gap, Math.max(0, box.w - 0.5)) / 2
    const insetY = Math.min(gap, Math.max(0, box.h - 0.5)) / 2
    el.attr({
      x: box.x + insetX,
      y: box.y + insetY,
      width: Math.max(0, box.w - insetX * 2),
      height: Math.max(0, box.h - insetY * 2),
    })
  }

  // ---------------------------------------------------------------- labels

  /**
   * Labels are overlays on animated cells, so they reveal AFTER the cells
   * settle (repo convention: overlays never pop in over a moving shape).
   * @param {number} dur  cell animation duration (0 = instant labels)
   */
  _renderLabels(dur) {
    const labelsG = this._labelsG
    while (labelsG.node.firstChild) {
      labelsG.node.removeChild(labelsG.node.firstChild)
    }
    if (!this.cfg.dataLabels.show) return

    this._nodesAll.forEach((node) => {
      if (!node._show) return
      this._renderLabel(node)
      if (node._clipped) this._renderMoreMark(node)
    })

    if (dur > 0) {
      labelsG.attr({ opacity: 0 })
      labelsG.animate(250, dur).attr({ opacity: 1 })
    } else {
      labelsG.attr({ opacity: 1 })
    }
  }

  /**
   * One cell's label, horizontal wherever there is room for it.
   *
   * A cell taller than it is wide (what a sideways icicle produces) turns its
   * label a quarter turn, because a flat label there is clipped by the band
   * thickness while the value axis has room to spare.
   *
   * @param {any} node
   */
  _renderLabel(node) {
    if (!Environment.isBrowser()) return
    const dl = this.cfg.dataLabels
    const style = dl.style
    const box = this._box(node)
    // 'auto' follows the cell: a quarter turn only where a flat label would be
    // clipped by the band while the value axis has room to spare. 'always'
    // turns every label, which is the uniform look some icicles have, but note
    // that it makes the BAND THICKNESS the reading room, so it suits short
    // names and costs labels on wide shallow bands.
    const rotated =
      dl.rotate === 'always'
        ? true
        : dl.rotate === 'never'
          ? false
          : box.h > box.w

    const along = rotated ? box.h : box.w
    const across = rotated ? box.w : box.h
    const fontPx = parseFloat(style.fontSize) || 12
    if (along < dl.minSizeToShow) return
    if (across < fontPx + 2) return

    // With `showValue`, the value is the first thing to go: "Research: 60"
    // clipped to "Research: …" tells the reader less than "Research" does.
    const room = along - 8
    let label = node.name
    if (dl.showValue) {
      const full = `${node.name}: ${node.value}`
      if (this._fits(full, room, fontPx)) label = full
    }
    const text = this._truncate(label, room, fontPx)
    if (!text) return

    const colors = style.colors
    const fill = (Array.isArray(colors) ? colors[0] : colors) || '#fff'
    const el = BrowserAPIs.createElementNS(SVGNS, 'text')
    el.setAttribute('font-size', style.fontSize || '12px')
    if (style.fontFamily) el.setAttribute('font-family', style.fontFamily)
    el.setAttribute('font-weight', String(style.fontWeight || 400))
    el.setAttribute('fill', fill)
    el.setAttribute('dominant-baseline', 'central')
    el.style.pointerEvents = 'none'
    el.textContent = text

    // Anchor along the reading direction; always centred across it.
    const pad = 4
    const anchor =
      dl.align === 'center' ? 'middle' : dl.align === 'right' ? 'end' : 'start'
    const atStart = box.x + pad
    const atEnd = box.x + box.w - pad
    const mid = box.x + box.w / 2

    if (rotated) {
      // Read bottom-to-top, the usual direction for a turned axis label.
      const cx = box.x + box.w / 2
      const yStart = box.y + box.h - pad
      const yEnd = box.y + pad
      const yMid = box.y + box.h / 2
      const y = anchor === 'middle' ? yMid : anchor === 'end' ? yEnd : yStart
      el.setAttribute('text-anchor', anchor)
      el.setAttribute('x', String(cx))
      el.setAttribute('y', String(y))
      el.setAttribute('transform', `rotate(-90 ${cx} ${y})`)
    } else {
      const x = anchor === 'middle' ? mid : anchor === 'end' ? atEnd : atStart
      el.setAttribute('text-anchor', anchor)
      el.setAttribute('x', String(x))
      el.setAttribute('y', String(box.y + box.h / 2))
    }

    this._labelsG.node.appendChild(el)
  }

  /**
   * A row of dots on the far edge of a branch whose children `maxDepth` cut.
   *
   * Without it a clipped branch is indistinguishable from a leaf, and the chart
   * would quietly claim the tree ends there. The dots sit on the edge the
   * children would have been drawn against, so they read as "it continues this
   * way", and clicking the cell zooms in and shows them.
   *
   * @param {any} node
   */
  _renderMoreMark(node) {
    if (!Environment.isBrowser()) return
    const box = this._box(node)
    const along = this._vertical ? box.w : box.h
    if (along < 18) return

    // The far edge: the side the next band would have been on.
    const mid = this._vertical ? box.x + box.w / 2 : box.y + box.h / 2
    const edge = this._vertical
      ? this._flip
        ? box.y + 2.5
        : box.y + box.h - 2.5
      : this._flip
        ? box.x + 2.5
        : box.x + box.w - 2.5

    const g = BrowserAPIs.createElementNS(SVGNS, 'g')
    g.setAttribute('class', 'apexcharts-icicle-more')
    g.style.pointerEvents = 'none'
    for (let i = -1; i <= 1; i++) {
      const dot = BrowserAPIs.createElementNS(SVGNS, 'circle')
      dot.setAttribute('cx', String(this._vertical ? mid + i * 5 : edge))
      dot.setAttribute('cy', String(this._vertical ? edge : mid + i * 5))
      dot.setAttribute('r', '1.1')
      dot.setAttribute('fill', '#fff')
      dot.setAttribute('fill-opacity', '0.85')
      g.appendChild(dot)
    }
    this._labelsG.node.appendChild(g)
  }

  /**
   * Whether a string fits the room available, at this font size.
   * @param {string} text
   * @param {number} room  px
   * @param {number} fontPx
   * @returns {boolean}
   */
  _fits(text, room, fontPx) {
    return text.length * fontPx * 0.58 <= room
  }

  /**
   * Trim a label to the room available along its reading direction.
   *
   * Below a few surviving characters it returns nothing at all. A stub like
   * `Opera…` or, worse, `R…` is noise: it neither names the cell nor leaves it
   * clean, and a wall of them is what makes a deep icicle look cluttered. The
   * cell still answers on hover.
   *
   * @param {string} name
   * @param {number} room  px
   * @param {number} fontPx
   * @returns {string}
   */
  _truncate(name, room, fontPx) {
    const charW = fontPx * 0.58
    const maxChars = Math.floor(room / charW)
    if (maxChars >= name.length) return name
    if (maxChars < MIN_LABEL_CHARS + 1) return ''
    return name.slice(0, maxChars - 1) + '…'
  }

  // ----------------------------------------------------------------- zoom

  /**
   * Focus a node (zoom in), or zoom out one level when the current focus is
   * clicked.
   * @param {any} node
   */
  _zoomTo(node) {
    if (this.cfg.zoomOnClick === false) return
    const next = resolveFocus(node, this._focus)
    if (!next.changed) return
    this._focus = next.focus
    this._relayout(this._focus)
    this._applyLayout('zoom')
    this._renderBreadcrumb()
  }

  /**
   * The breadcrumb sits in the band the layout reserved for it, rather than
   * floating: an icicle fills its plot edge to edge, so an overlay would have
   * nowhere to go without covering a cell. Same reasoning as the treemap's,
   * and it shares the same renderer.
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return
    if (!this._focus) {
      clearBreadcrumb(this.w)
      return
    }

    const cfg = breadcrumbConfig(this.w)
    const crumbs = [{ label: 'All', data: null }].concat(
      focusChain(this._focus).map((n) => ({ label: n.name, data: n })),
    )

    const nav = renderBreadcrumb(this.w, {
      crumbs,
      ariaLabel: 'Icicle breadcrumb',
      config: cfg,
      compact: true,
      onNavigate: (/** @type {number} */ i, /** @type {any} */ crumb) => {
        this._focus = crumb.data
        this._relayout(this._focus)
        this._applyLayout('zoom')
        this._renderBreadcrumb()
      },
    })
    if (nav) placeInReservedBand(this.w, this.ctx, nav, cfg)
  }
}
