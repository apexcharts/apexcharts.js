// @ts-check
/**
 * ApexCharts Sunburst / nested pie-donut (hierarchical radial) chart.
 *
 * Rings go from the centre hole outward, one per hierarchy level; each child
 * arc is nested inside its parent's angular wedge.
 *
 * P1: static rings + parent tinting + per-node tooltip.
 * P2: bloom intro animation, click-to-zoom (focus a branch, animate, breadcrumb
 *     back), curved <textPath> labels, strict-partition warning.
 *
 * Data: a native `children` hierarchy, OR an existing `drilldown` config
 * (`series` + `drilldown.series`) read as plain data by the adapter below (NO
 * dependency on the drilldown runtime feature).
 *
 * Self-contained by design (colour tint + tooltip + breadcrumb, and the shared
 * standalone arc-path builder in common/arc which has no Pie dependency) so a
 * `apexcharts/sunburst` bundle does not drag in the Pie or Drilldown modules.
 * See plans/19-sunburst.md.
 *
 * @module SunburstChart
 */
import Graphics from '../modules/Graphics'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import { Environment } from '../utils/Environment.js'
import {
  roundedDonutSegmentPath,
  sharpDonutSegmentPath,
} from './common/arc/ArcPath'

const D2R = Math.PI / 180
const R2D = 180 / Math.PI
const SVGNS = 'http://www.w3.org/2000/svg'
const XHTML = 'http://www.w3.org/1999/xhtml'

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
const lerp = (a, b, t) => a + (b - a) * t

export default class SunburstChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w

    const cnf = w.config
    this.cfg = cnf.plotOptions.sunburst
    this.strokeWidth = cnf.stroke.show ? cnf.stroke.width : 0
    this.strokeColor = Array.isArray(cnf.stroke.colors)
      ? cnf.stroke.colors[0]
      : cnf.stroke.colors || '#fff'

    this.startAngle = this.cfg.startAngle
    this.endAngle = this.cfg.endAngle

    this.maxDepth = 0
    this.centerX = 0
    this.centerY = 0
    this.maxRadius = 0
    this.total = 1
    this._focusMaxDepth = 0
    /** @type {any} focused node (null = root/whole tree) */
    this._focus = null
    // Bumped on every layout pass. A rapid re-click (zoom before the previous
    // zoom settles) starts a new pass; older animation frames check this and
    // stop writing, so two rAF loops never fight over the same arc's geometry.
    this._zoomGen = 0
    /** @type {any[]} */
    this._roots = []
    /** @type {any[]} flat list of every node */
    this._nodesAll = []
    /** @type {(vd: number) => number} */
    this._innerR = () => 0
    /** @type {(vd: number) => number} */
    this._outerR = () => 0
    /** @type {any} */
    this._tooltipEl = null
    this._lblSeq = 0
    /** @type {any} */
    this._graphics = null
    /** @type {any} */
    this._ringsG = null
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

    const g = graphics.group({ class: 'apexcharts-sunburst' })
    if (w.globals.noData || !series || !series.length) return g

    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    this.centerX = gw / 2 + (this.cfg.offsetX || 0)
    this.centerY = gh / 2 + (this.cfg.offsetY || 0)
    this.maxRadius =
      Math.min(gw, gh) / 2.05 -
      this.strokeWidth -
      (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0)
    if (this.maxRadius < 5) return g

    // Build + colour the hierarchy once (angles/radii are recomputed per zoom).
    this._roots = this._buildHierarchy()
    if (!this._roots.length) return g
    this._roots.forEach((r) => this._fillValues(r))
    this._validateStrict()
    this._nodesAll = []
    const colors = w.globals.colors || []
    this._roots.forEach((r, i) => {
      this._colorPass(r, r.color || colors[i % colors.length] || '#008FFB')
    })
    this.total = this._roots.reduce((s, r) => s + Math.max(0, r.value), 0) || 1

    this._ringsG = graphics.group({ class: 'apexcharts-sunburst-rings' })
    this._labelsG = graphics.group({ class: 'apexcharts-sunburst-labels' })
    g.add(this._ringsG)
    g.add(this._labelsG)

    this._focus = null
    this._relayout(this._focus)

    // Same gating as Pie: angular clock-sweep intro on first render, a morph
    // from the previous on-screen geometry on data updates (never an instant
    // re-render while animations are on), nothing on resize.
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

  // ------------------------------------------------------------------ data

  /**
   * Resolve the config into root nodes `{ name, value, color?, children? }`.
   * Each datum may carry `children` (native) or `drilldown: '<id>'` (adapter).
   * @returns {any[]}
   */
  _buildHierarchy() {
    const cfgSeries = /** @type {any} */ (this.w.config.series)
    const first = cfgSeries && cfgSeries[0]
    const data = first && Array.isArray(first.data) ? first.data : cfgSeries
    if (!Array.isArray(data)) return []
    return data.map((/** @type {any} */ d, /** @type {number} */ i) =>
      this._toNode(d, i, null, ''),
    )
  }

  /**
   * @param {any} d
   * @param {number} i
   * @param {string[]|null} paletteFromParent  per-level colours from a drilldown entry
   * @param {string} parentKey  hierarchical identity of the parent
   * @param {Set<any>|null} [seenIds]  drilldown ids already expanded on this path
   * @returns {any}
   */
  _toNode(d, i, paletteFromParent, parentKey, seenIds = null) {
    const isObj = d && typeof d === 'object'
    const name = isObj ? (d.x ?? d.name ?? '') : ''
    const value = isObj ? Number(d.y ?? d.value) : Number(d)
    /** @type {any} */
    const node = {
      name: String(name),
      value: isNaN(value) ? null : value,
      color: isObj && d.color ? d.color : undefined,
      // Identity across data updates: the path of names (indexed so same-named
      // siblings stay distinct). Update animations morph matched keys in place.
      _key: `${parentKey}/${i}:${name}`,
    }
    if (paletteFromParent && !node.color) {
      node.color = paletteFromParent[i % paletteFromParent.length]
    }

    if (isObj && Array.isArray(d.children) && d.children.length) {
      node.children = d.children.map(
        (/** @type {any} */ c, /** @type {number} */ j) =>
          this._toNode(c, j, null, node._key, seenIds),
      )
    } else if (isObj && d.drilldown != null) {
      // Drilldown ids resolve indirectly, so a self- or mutually-referential id
      // (a malformed config) would recurse forever and overflow the stack. Track
      // the ids expanded on this path and stop when one repeats.
      const visited = seenIds || new Set()
      if (!visited.has(d.drilldown)) {
        const dd = this._drilldownById(d.drilldown)
        if (dd && Array.isArray(dd.data) && dd.data.length) {
          const nextSeen = new Set(visited)
          nextSeen.add(d.drilldown)
          const palette = Array.isArray(dd.colors) ? dd.colors : null
          node.children = dd.data.map(
            (/** @type {any} */ c, /** @type {number} */ j) =>
              this._toNode(c, j, palette, node._key, nextSeen),
          )
        }
      }
    }
    return node
  }

  /**
   * @param {string|number} id
   * @returns {any}
   */
  _drilldownById(id) {
    const dd = this.w.config.drilldown
    const list = dd && Array.isArray(dd.series) ? dd.series : []
    return list.find((/** @type {any} */ s) => s && s.id === id)
  }

  /**
   * Fill a parent's value from its children when missing.
   * @param {any} node
   */
  _fillValues(node) {
    if (node.children && node.children.length) {
      node.children.forEach((/** @type {any} */ c) => this._fillValues(c))
      if (node.value == null || isNaN(node.value)) {
        node.value = node.children.reduce(
          (/** @type {number} */ s, /** @type {any} */ c) =>
            s + Math.max(0, c.value || 0),
          0,
        )
      }
    }
    if (node.value == null || isNaN(node.value)) node.value = 0
  }

  /**
   * With `partition: 'strict'`, warn (once) when a parent's value does not
   * match the sum of its children. The angles are still normalized to fill the
   * wedge (strict rendering is a P3 refinement); this just surfaces the data
   * mismatch.
   */
  _validateStrict() {
    if (this.cfg.partition !== 'strict') return
    let warned = false
    /** @param {any} node */
    const walk = (node) => {
      if (node.children && node.children.length) {
        const sum = node.children.reduce(
          (/** @type {number} */ s, /** @type {any} */ c) =>
            s + Math.max(0, c.value || 0),
          0,
        )
        if (!warned && node.value != null && Math.abs(sum - node.value) > 0.5) {
          console.warn(
            `ApexCharts sunburst: partition 'strict' but "${node.name}" (${node.value}) != sum of its children (${sum}). Angles are normalized to fill the wedge.`,
          )
          warned = true
        }
        node.children.forEach(walk)
      }
    }
    this._roots.forEach(walk)
  }

  /**
   * Assign a colour to every node (explicit `color` wins, else the parent's
   * colour tinted lighter). Done once so zoom preserves colours.
   * @param {any} node
   * @param {string} color
   */
  _colorPass(node, color) {
    node._color = node.color || color
    this._nodesAll.push(node)
    if (node.children) {
      node.children.forEach((/** @type {any} */ c) =>
        this._colorPass(c, c.color || this._lighten(node._color, this.cfg.tint)),
      )
    }
  }

  // ---------------------------------------------------------------- layout

  /**
   * Recompute visibility + angles + radii for a focus node (null = whole tree).
   * @param {any} focus
   */
  _relayout(focus) {
    this._nodesAll.forEach((n) => {
      n._show = false
    })
    this._focusMaxDepth = 0

    if (!focus) {
      const total =
        this._roots.reduce((s, r) => s + Math.max(0, r.value), 0) || 1
      let a = this.startAngle
      this._roots.forEach((r) => {
        const span = (this.endAngle - this.startAngle) * Math.max(0, r.value) / total
        this._placeVis(r, 0, a, a + span, null)
        a += span
      })
    } else {
      this._placeVis(focus, 0, this.startAngle, this.endAngle, focus._parent)
    }

    // Radial bands for the current focus depth.
    const hole = this._parseSize(this.cfg.innerSize, this.maxRadius)
    const ringCount = this._focusMaxDepth + 1
    const band = (this.maxRadius - hole) / ringCount
    const radialGap = ringCount > 1 ? 1 : 0
    this._innerR = (/** @type {number} */ vd) =>
      hole + vd * band + (vd > 0 ? radialGap / 2 : 0)
    this._outerR = (/** @type {number} */ vd) =>
      hole + (vd + 1) * band - radialGap / 2

    // Final radii per node (honouring leaf-extend).
    this._nodesAll.forEach((n) => {
      if (!n._show) return
      n._iR = this._innerR(n._vDepth)
      n._oR =
        n._leaf &&
        this.cfg.leaf === 'extend' &&
        n._vDepth < this._focusMaxDepth
          ? this.maxRadius
          : this._outerR(n._vDepth)
    })
  }

  /**
   * @param {any} node
   * @param {number} vDepth
   * @param {number} a0
   * @param {number} a1
   * @param {any} parent
   */
  _placeVis(node, vDepth, a0, a1, parent) {
    node._show = true
    node._vDepth = vDepth
    node._a0 = a0
    node._a1 = a1
    node._parent = parent
    node._leaf = !(node.children && node.children.length)
    if (vDepth > this._focusMaxDepth) this._focusMaxDepth = vDepth
    if (!node._leaf) {
      const total =
        node.children.reduce(
          (/** @type {number} */ s, /** @type {any} */ c) =>
            s + Math.max(0, c.value),
          0,
        ) || 1
      let a = a0
      node.children.forEach((/** @type {any} */ c) => {
        const span = ((a1 - a0) * Math.max(0, c.value)) / total
        this._placeVis(c, vDepth + 1, a, a + span, node)
        a += span
      })
    }
  }

  // --------------------------------------------------------------- render

  /**
   * Create / update / remove arc elements to match the current layout, with an
   * animation appropriate to the transition:
   *   intro  — pie/donut-style angular clock sweep from startAngle to endAngle
   *            (all rings reveal together as the sweep line passes them)
   *   update — morph every arc from its previous on-screen geometry (matched
   *            by node key across the re-render); new arcs unfurl in place
   *   zoom   — tween angles + radii between focus layouts (same instance)
   * @param {'intro'|'zoom'|'update'|'none'} mode
   */
  _applyLayout(mode) {
    const w = this.w
    const anims = w.config.chart.animations
    const dur = !anims.enabled
      ? 0
      : mode === 'none'
        ? 0
        : mode === 'update'
          ? anims.dynamicAnimation.speed || 350
          : anims.speed || 500

    // Supersede any in-flight zoom: stale frames from the previous pass check
    // this and stop, so a fast re-click can't leave two animations fighting.
    const gen = ++this._zoomGen

    // Geometry of the PREVIOUS render (stashed on the persistent chart ctx —
    // this module is re-instantiated on every data update).
    const prev =
      mode === 'update' ? /** @type {any} */ (this.ctx)._sunburstPrevGeoms : null

    this._nodesAll.forEach((node) => {
      if (node._show) {
        const target = {
          a0: node._a0,
          a1: node._a1,
          iR: node._iR,
          oR: node._oR,
        }
        if (!node._el) node._el = this._createArcEl(node)

        if (mode === 'intro' && dur > 0) {
          this._sweepArc(node, target, dur, gen)
        } else {
          let from
          let isNew = false
          if (node._cur) {
            // `_cur` is the arc's LIVE geometry (updated each frame), so an
            // interrupted zoom continues smoothly from where it actually is.
            from = node._cur
          } else if (prev && prev.get(node._key)) {
            from = prev.get(node._key) // survived a data update: morph in place
          } else {
            const mid = (target.a0 + target.a1) / 2 // new arc: unfurl from its slot
            from = { a0: mid, a1: mid, iR: target.iR, oR: target.iR }
            isNew = true
          }
          // Only genuinely new arcs fade in; arcs morphing from a previous
          // geometry stay fully opaque while their shape tweens.
          this._animateArc(node, from, target, dur, false, isNew, gen)
        }
      } else if (node._el && node._cur) {
        const mid = (node._cur.a0 + node._cur.a1) / 2
        const target = { a0: mid, a1: mid, iR: node._cur.iR, oR: node._cur.iR }
        this._animateArc(node, node._cur, target, dur, true, false, gen)
      }
    })

    // Stash what is now on screen so the NEXT data update can morph from it.
    const geoms = new Map()
    this._nodesAll.forEach((n) => {
      if (n._show) {
        geoms.set(n._key, { a0: n._a0, a1: n._a1, iR: n._iR, oR: n._oR })
      }
    })
    ;/** @type {any} */ (this.ctx)._sunburstPrevGeoms = geoms

    this._renderLabels(dur)
  }

  /**
   * Pie/donut-style intro: a clock sweep from startAngle to endAngle. Each
   * arc's end angle is clamped to the sweep line, so arcs appear in angular
   * order and grow until complete — the whole hierarchy unwipes together.
   * @param {any} node
   * @param {{a0:number,a1:number,iR:number,oR:number}} target
   * @param {number} dur
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _sweepArc(node, target, dur, gen) {
    const el = node._el
    const br = this.cfg.borderRadius
    const s0 = this.startAngle
    const s1 = this.endAngle
    el.node.style.display = ''
    el.attr({ d: '', opacity: 1 })
    el.animate(dur)
      .during((/** @type {number} */ pos) => {
        if (this._zoomGen !== gen) return
        const sweep = s0 + (s1 - s0) * pos
        if (sweep <= target.a0 + 0.01) {
          el.attr({ d: '' })
          return
        }
        const a1 = Math.min(target.a1, sweep)
        el.attr({ d: this._arcPath(target.iR, target.oR, target.a0, a1, br) })
        node._cur = { a0: target.a0, a1, iR: target.iR, oR: target.oR }
      })
      .after(() => {
        if (this._zoomGen !== gen) return
        node._cur = target
      })
  }

  /**
   * @param {any} node
   * @returns {any} svg.js path element
   */
  _createArcEl(node) {
    const path = this._graphics.drawPath({
      d: '',
      fill: node._color,
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
      fillOpacity: 1,
      classes: 'apexcharts-sunburst-arc',
    })
    const el = path.node
    el.setAttribute('data:name', node.name)
    el.setAttribute('data:value', String(node.value))
    this._attachTooltip(el, node)
    if (Environment.isBrowser()) {
      el.addEventListener('click', () => this._zoomTo(node))
      el.style.cursor = 'pointer'
    }
    this._ringsG.add(path)
    return path
  }

  /**
   * @param {any} node
   * @param {{a0:number,a1:number,iR:number,oR:number}} from
   * @param {{a0:number,a1:number,iR:number,oR:number}} to
   * @param {number} dur
   * @param {boolean} hide    shrink + fade out, then hide
   * @param {boolean} fadeIn  fade 0 -> 1 (new arcs only; morphs stay opaque)
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _animateArc(node, from, to, dur, hide, fadeIn, gen) {
    const el = node._el
    const br = this.cfg.borderRadius
    el.attr({ fill: node._color })

    if (dur === 0) {
      el.attr({ d: this._arcPath(to.iR, to.oR, to.a0, to.a1, br), opacity: hide ? 0 : 1 })
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
        const a0 = lerp(from.a0, to.a0, pos)
        const a1 = lerp(from.a1, to.a1, pos)
        const iR = lerp(from.iR, to.iR, pos)
        const oR = lerp(from.oR, to.oR, pos)
        el.attr({
          d: this._arcPath(iR, oR, a0, a1, br),
          opacity: lerp(startOp, endOp, pos),
        })
        // Live geometry, so an interrupting zoom picks up exactly here. Even a
        // collapsing arc keeps it, so re-showing mid-collapse reverses smoothly.
        node._cur = { a0, a1, iR, oR }
      })
      .after(() => {
        if (this._zoomGen !== gen) return
        if (hide) {
          el.node.style.display = 'none'
          node._cur = null
        } else {
          node._cur = to
        }
      })
  }

  // ---------------------------------------------------------------- labels

  /**
   * Labels are overlays on animated paths, so they reveal gradually AFTER the
   * arcs settle (repo convention: overlays never pop in over a moving path).
   * @param {number} dur  arc animation duration (0 = instant labels)
   */
  _renderLabels(dur) {
    const labelsG = this._labelsG
    while (labelsG.node.firstChild) labelsG.node.removeChild(labelsG.node.firstChild)
    if (!this.cfg.dataLabels.show) return

    this._nodesAll.forEach((node) => {
      if (!node._show) return
      if (node._a1 - node._a0 < this.cfg.dataLabels.minAngleToShow) return
      this._renderCurvedLabel(node)
    })

    if (dur > 0) {
      labelsG.attr({ opacity: 0 })
      labelsG.animate(250, dur).attr({ opacity: 1 })
    } else {
      labelsG.attr({ opacity: 1 })
    }
  }

  /**
   * Curved label along the arc's mid-radius (flipped on the bottom half so it
   * stays upright). Raw SVG <textPath> — svg.js has no first-class textPath.
   * @param {any} node
   */
  _renderCurvedLabel(node) {
    if (!Environment.isBrowser()) return
    const style = this.cfg.dataLabels.style
    const w = this.w
    const r = (node._iR + node._oR) / 2
    const mid = (node._a0 + node._a1) / 2
    const flip = mid > 90 && mid < 270

    // Small angular padding so text does not touch the radial edges.
    const padDeg = Math.min((r > 0 ? (4 / r) * R2D : 0), (node._a1 - node._a0) / 2)
    const from = flip ? node._a1 - padDeg : node._a0 + padDeg
    const to = flip ? node._a0 + padDeg : node._a1 - padDeg
    const p1 = this._ptAt(r, from)
    const p2 = this._ptAt(r, to)
    const largeArc = Math.abs(to - from) > 180 ? 1 : 0
    const sweep = flip ? 0 : 1

    const id = `apx-sb-lbl-${w.globals.cuid}-${this._lblSeq++}`
    const guide = BrowserAPIs.createElementNS(SVGNS, 'path')
    guide.setAttribute('id', id)
    guide.setAttribute(
      'd',
      `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`,
    )
    guide.setAttribute('fill', 'none')
    guide.setAttribute('stroke', 'none')

    const colors = style.colors
    const fill = (Array.isArray(colors) ? colors[0] : colors) || '#fff'
    const text = BrowserAPIs.createElementNS(SVGNS, 'text')
    text.setAttribute('font-size', style.fontSize || '12px')
    if (style.fontFamily) text.setAttribute('font-family', style.fontFamily)
    text.setAttribute('font-weight', String(style.fontWeight || 400))
    text.setAttribute('fill', fill)
    text.setAttribute('dominant-baseline', 'central')
    text.style.pointerEvents = 'none'

    const tp = BrowserAPIs.createElementNS(SVGNS, 'textPath')
    tp.setAttribute('href', '#' + id)
    tp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id)
    tp.setAttribute('startOffset', '50%')
    tp.setAttribute('text-anchor', 'middle')
    tp.textContent = this._truncate(node.name, r, node._a1 - node._a0, style.fontSize)
    text.appendChild(tp)

    this._labelsG.node.appendChild(guide)
    this._labelsG.node.appendChild(text)
  }

  /**
   * Trim a label to the arc length available at its radius.
   * @param {string} name
   * @param {number} r
   * @param {number} spanDeg
   * @param {string} fontSize
   * @returns {string}
   */
  _truncate(name, r, spanDeg, fontSize) {
    const arcLen = r * spanDeg * D2R - 8
    const charW = (parseFloat(fontSize) || 12) * 0.58
    const maxChars = Math.floor(arcLen / charW)
    if (maxChars >= name.length) return name
    if (maxChars <= 1) return ''
    return name.slice(0, Math.max(1, maxChars - 1)) + '…'
  }

  // ----------------------------------------------------------------- zoom

  /**
   * Focus a node (zoom in), or zoom out one level when the current focus (the
   * innermost ring) is clicked.
   * @param {any} node
   */
  _zoomTo(node) {
    if (this.cfg.zoomOnClick === false) return
    const nextFocus = node === this._focus ? node._parent || null : node
    if (nextFocus === this._focus) return
    // A leaf with no children is not a meaningful focus target; zooming to it
    // would show a single full ring. Focus its parent branch instead.
    this._focus =
      nextFocus && !(nextFocus.children && nextFocus.children.length)
        ? nextFocus._parent || null
        : nextFocus
    this._relayout(this._focus)
    this._applyLayout('zoom')
    this._renderBreadcrumb()
  }

  /** Root -> focus chain of nodes. */
  _focusChain() {
    const chain = []
    let n = this._focus
    while (n) {
      chain.unshift(n)
      n = n._parent
    }
    return chain
  }

  /**
   * Minimal self-contained breadcrumb (reuses the shared `.apexcharts-breadcrumb`
   * CSS classes, but does NOT depend on the drilldown feature).
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return
    const w = this.w
    const elWrap = w.dom.elWrap
    if (!elWrap) return
    const existing = elWrap.querySelector('.apexcharts-breadcrumb')
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing)

    if (!this._focus) return // only shown once zoomed in

    const nav = BrowserAPIs.createElementNS(XHTML, 'nav')
    nav.setAttribute('class', 'apexcharts-breadcrumb')
    nav.setAttribute('aria-label', 'Sunburst breadcrumb')
    nav.style.position = 'absolute'
    nav.style.top = '0px'
    nav.style.left = '0px'

    const crumbs = [{ name: 'All', node: null }].concat(
      this._focusChain().map((n) => ({ name: n.name, node: n })),
    )

    crumbs.forEach((crumb, i) => {
      if (i > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML, 'span')
        sep.setAttribute('class', 'apexcharts-breadcrumb-separator')
        sep.textContent = ' / '
        nav.appendChild(sep)
      }
      const isCurrent = i === crumbs.length - 1
      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML, 'span')
        cur.setAttribute(
          'class',
          'apexcharts-breadcrumb-item apexcharts-breadcrumb-current',
        )
        cur.textContent = crumb.name
        nav.appendChild(cur)
      } else {
        const btn = BrowserAPIs.createElementNS(XHTML, 'button')
        btn.setAttribute('type', 'button')
        btn.setAttribute('class', 'apexcharts-breadcrumb-item')
        if (i === 0) {
          const arrow = BrowserAPIs.createElementNS(XHTML, 'span')
          arrow.setAttribute('class', 'apexcharts-breadcrumb-arrow')
          arrow.textContent = '←'
          btn.appendChild(arrow)
        }
        const text = BrowserAPIs.createElementNS(XHTML, 'span')
        text.setAttribute('class', 'apexcharts-breadcrumb-label')
        text.textContent = crumb.name
        btn.appendChild(text)
        btn.addEventListener('click', () => {
          this._focus = crumb.node
          this._relayout(this._focus)
          this._applyLayout('zoom')
          this._renderBreadcrumb()
        })
        nav.appendChild(btn)
      }
    })

    elWrap.appendChild(nav)
    this._avoidChromeOverlap(nav)
  }

  /**
   * The breadcrumb is an absolute overlay at top-left, so it can sit on top of
   * a left-aligned title (or subtitle). After mounting, push it below any chart
   * chrome it intersects. (Duplicated from drilldown's Breadcrumb on purpose —
   * sunburst must not import the drilldown feature.)
   * @param {any} nav
   */
  _avoidChromeOverlap(nav) {
    const w = this.w
    const chrome = /** @type {Element[]} */ (
      ['.apexcharts-title-text', '.apexcharts-subtitle-text']
        .map((s) => w.dom.baseEl.querySelector(s))
        .filter((el) => el !== null)
    )
    if (!chrome.length) return
    const wrapTop = w.dom.elWrap.getBoundingClientRect().top
    // Up to two passes: moving below the title can land on the subtitle.
    for (let pass = 0; pass < chrome.length + 1; pass++) {
      const nr = nav.getBoundingClientRect()
      const hit = chrome.find((el) => {
        const r = el.getBoundingClientRect()
        return (
          nr.left < r.right &&
          nr.right > r.left &&
          nr.top < r.bottom &&
          nr.bottom > r.top
        )
      })
      if (!hit) break
      nav.style.top = `${hit.getBoundingClientRect().bottom - wrapTop + 4}px`
    }
  }

  // ------------------------------------------------------------ geometry

  /**
   * @param {number} r
   * @param {number} deg  0 = top, clockwise
   * @returns {{x: number, y: number}}
   */
  _ptAt(r, deg) {
    return {
      x: this.centerX + r * Math.cos((deg - 90) * D2R),
      y: this.centerY + r * Math.sin((deg - 90) * D2R),
    }
  }

  /**
   * Rounded donut-segment path (inner radius always > 0). Applies `spacing`
   * (angular gap) and `borderRadius` (corner rounding), both clamped so a thin
   * arc never inverts.
   * @param {number} iR
   * @param {number} oR
   * @param {number} a0
   * @param {number} a1
   * @param {number} borderRadius
   * @returns {string}
   */
  _arcPath(iR, oR, a0, a1, borderRadius) {
    if (oR <= iR + 0.01) return ''
    let spanDeg = a1 - a0

    const spacing = this.cfg.spacing
    if (spacing > 0 && spanDeg > 0 && oR > 0) {
      const gapDeg = (spacing / oR) * R2D
      const inset = Math.min(gapDeg / 2, Math.max(0, spanDeg / 2 - 0.25))
      a0 += inset
      a1 -= inset
      spanDeg = a1 - a0
    }
    if (spanDeg <= 0) return ''

    const spanRad = spanDeg * D2R
    const cx = this.centerX
    const cy = this.centerY

    let r = borderRadius
    r = Math.min(r, (spanRad * iR) / 2, (spanRad * oR) / 2, (oR - iR) / 2)

    if (!(r > 0.5)) {
      return sharpDonutSegmentPath({ cx, cy, rIn: iR, rOut: oR, a0, a1, spanDeg })
    }

    return roundedDonutSegmentPath({ cx, cy, rIn: iR, rOut: oR, a0, a1, r, spanDeg })
  }

  // ------------------------------------------------------------- tooltip

  /** @returns {any} */
  _tip() {
    if (!this._tooltipEl) {
      this._tooltipEl = this.w.dom.baseEl.querySelector('.apexcharts-tooltip')
    }
    return this._tooltipEl
  }

  /**
   * @param {any} el
   * @param {any} node
   */
  _attachTooltip(el, node) {
    if (!this.w.config.tooltip.enabled || !Environment.isBrowser()) return
    el.addEventListener('mouseenter', (/** @type {MouseEvent} */ e) =>
      this._showTooltip(e, node),
    )
    el.addEventListener('mousemove', (/** @type {MouseEvent} */ e) =>
      this._positionTooltip(e),
    )
    el.addEventListener('mouseleave', () => this._hideTooltip())
  }

  /**
   * @param {MouseEvent} e
   * @param {any} node
   */
  _showTooltip(e, node) {
    const t = this._tip()
    if (!t) return
    const w = this.w
    const pctTotal = ((node.value / this.total) * 100).toFixed(1)
    const parentVal = node._parent ? node._parent.value : this.total
    const pctParent =
      parentVal > 0 ? ((node.value / parentVal) * 100).toFixed(1) : pctTotal

    // With tooltip.fillSeriesColor the container is transparent by design and
    // the series-group is expected to carry the slice colour as its inline
    // background (like pie). Without it, the themed container provides the bg.
    const groupBg = w.config.tooltip.fillSeriesColor
      ? `background-color:${node._color};`
      : ''

    t.innerHTML =
      `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex;${groupBg}">` +
      `<span class="apexcharts-tooltip-marker" style="background-color:${node._color}"></span>` +
      `<div class="apexcharts-tooltip-text">` +
      `<div class="apexcharts-tooltip-y-group">` +
      `<span class="apexcharts-tooltip-text-y-label">${node.name}: </span>` +
      `<span class="apexcharts-tooltip-text-y-value">${node.value} (${pctParent}% of parent, ${pctTotal}% of total)</span>` +
      `</div></div></div>`
    t.classList.add('apexcharts-active')
    t.style.opacity = '1'
    this._positionTooltip(e)
  }

  /**
   * Position beside the cursor, flipping to the opposite side when the box
   * would overflow the chart wrap, and clamping inside it either way.
   * @param {MouseEvent} e
   */
  _positionTooltip(e) {
    const t = this._tip()
    if (!t) return
    const rect = this.w.dom.elWrap.getBoundingClientRect()
    const tw = t.offsetWidth
    const th = t.offsetHeight
    const pad = 12

    let x = e.clientX - rect.left + pad
    if (x + tw > rect.width) x = e.clientX - rect.left - tw - pad
    x = Math.max(0, Math.min(x, rect.width - tw))

    let y = e.clientY - rect.top + pad
    if (y + th > rect.height) y = e.clientY - rect.top - th - pad
    y = Math.max(0, Math.min(y, rect.height - th))

    t.style.left = x + 'px'
    t.style.top = y + 'px'
  }

  _hideTooltip() {
    const t = this._tip()
    if (!t) return
    t.classList.remove('apexcharts-active')
    t.style.opacity = '0'
  }

  // --------------------------------------------------------------- utils

  /**
   * @param {string|number} size
   * @param {number} max
   * @returns {number}
   */
  _parseSize(size, max) {
    if (typeof size === 'number') return size
    const s = String(size).trim()
    if (s.endsWith('%')) return (parseFloat(s) / 100) * max
    const n = parseFloat(s)
    return isNaN(n) ? 0.15 * max : n
  }

  /**
   * Blend a hex colour toward white by `amount` (0..1). Non-hex returned as-is.
   * @param {string} color
   * @param {number} amount
   * @returns {string}
   */
  _lighten(color, amount) {
    if (typeof color !== 'string' || color[0] !== '#') return color
    let hex = color.slice(1)
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('')
    }
    if (hex.length !== 6) return color
    const num = parseInt(hex, 16)
    if (isNaN(num)) return color
    let rC = (num >> 16) & 255
    let gC = (num >> 8) & 255
    let bC = num & 255
    rC = Math.round(rC + (255 - rC) * amount)
    gC = Math.round(gC + (255 - gC) * amount)
    bC = Math.round(bC + (255 - bC) * amount)
    return '#' + ((1 << 24) + (rC << 16) + (gC << 8) + bC).toString(16).slice(1)
  }
}
