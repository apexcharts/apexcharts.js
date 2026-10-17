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
import Animations from '../modules/Animations'
import { buildHierarchy, fillValues, morphKey } from './common/Hierarchy'
import { avoidChromeOverlap } from './common/Breadcrumb'
import {
  bandScale,
  farEdge,
  focusByKey,
  focusChain,
  parseSize,
  placeTree,
  resolveFocus,
  setZoomCursor,
  validateStrict,
} from './common/partition/Partition'
import { colorPass } from './common/partition/Tint'
import { NodeTooltip } from './common/partition/NodeTooltip'

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
    this._tooltip = new NodeTooltip(w, this.ctx)
    this._lblSeq = 0
    // How many leaves have taken a captured mark this layout pass (cross-type
    // morph: leaf k unrolls from the outgoing chart's k-th mark).
    this._morphLeafIndex = 0
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

    // Build + colour the hierarchy once (angles/radii are recomputed per zoom),
    // through the helpers shared with the treemap and icicle: a node's explicit
    // `color` wins, else it takes its parent's tinted lighter.
    this._roots = buildHierarchy(w)
    if (!this._roots.length) return g
    this._roots.forEach(fillValues)
    this._validateStrict()
    this._nodesAll = []
    const colors = w.globals.colors || []
    this._roots.forEach((r, i) => {
      colorPass(
        r,
        r.color || colors[i % colors.length] || '#008FFB',
        this.cfg.tint,
        this._nodesAll,
      )
    })
    this.total = this._roots.reduce((s, r) => s + Math.max(0, r.value), 0) || 1
    this._tooltip.total = this.total

    this._ringsG = graphics.group({ class: 'apexcharts-sunburst-rings' })
    this._labelsG = graphics.group({ class: 'apexcharts-sunburst-labels' })
    g.add(this._ringsG)
    g.add(this._labelsG)

    // The focus outlives this instance by key (_relayout clears a stale one).
    this._focus = focusByKey(
      w.globals.sunburstFocusKey,
      this._nodesAll,
      this._roots,
    )
    this._relayout(this._focus)

    // Same gating as Pie: angular clock-sweep intro on first render, a morph
    // from the previous on-screen geometry on data updates (never an instant
    // re-render while animations are on), nothing on resize.
    const anims = w.config.chart.animations
    /** @type {'intro'|'zoom'|'update'|'none'} */
    let mode = 'none'
    if (anims.enabled) {
      if (w.globals.dataChanged) {
        if (w.globals.shouldAnimate !== false) mode = 'update'
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
   * With `partition: 'strict'`, warn (once) when a parent's value does not
   * match the sum of its children. The angles are still normalized to fill the
   * wedge (strict rendering is a P3 refinement); this just surfaces the data
   * mismatch.
   */
  _validateStrict() {
    if (this.cfg.partition !== 'strict') return
    validateStrict(this._roots, {
      type: 'sunburst',
      remedy: 'Angles are normalized to fill the wedge.',
    })
  }

  // ---------------------------------------------------------------- layout

  /**
   * Recompute visibility + angles + radii for a focus node (null = whole tree).
   * @param {any} focus
   */
  _relayout(focus) {
    this.w.globals.sunburstFocusKey = focus && focus._key
    // The angular partition. `_t0`/`_t1` come back in degrees because that is
    // the interval handed in; the icicle passes pixels to the same recursion.
    this._focusMaxDepth = placeTree({
      roots: this._roots,
      nodesAll: this._nodesAll,
      focus,
      t0: this.startAngle,
      t1: this.endAngle,
    })

    // Radial bands for the current focus depth.
    const hole = parseSize(this.cfg.innerSize, this.maxRadius, 0.15)
    const scale = bandScale({
      maxDepth: this._focusMaxDepth,
      near: hole,
      far: this.maxRadius,
      gap: 1,
    })
    this._innerR = scale.near
    this._outerR = scale.far

    // Final radii per node (honouring leaf-extend).
    this._nodesAll.forEach((n) => {
      if (!n._show) return
      n._iR = scale.near(n._vDepth)
      n._oR = farEdge(
        n,
        scale,
        this._focusMaxDepth,
        this.cfg.leaf,
        this.maxRadius,
      )
    })
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
    const dyn = anims.dynamicAnimation
    const dur =
      !anims.enabled || mode === 'none'
        ? 0
        : mode === 'intro'
          ? (anims.speed ?? 500)
          : dyn.enabled
            ? (dyn.speed ?? 350)
            : 0

    // Supersede any in-flight zoom: stale frames from the previous pass check
    // this and stop, so a fast re-click can't leave two animations fighting.
    const gen = ++this._zoomGen

    // Cross-type morph source (the optional `morph` feature). Leaves are handed
    // out in draw order, which is the order the outgoing chart's marks were
    // captured in, so tile k becomes leaf k.
    //
    // Not gated on `mode`: a type change arrives with new data, so it resolves
    // to 'update', and a snapshot only exists during one anyway. It brings its
    // own speed, the same one every other morphing renderer uses.
    const morph = /** @type {any} */ (this.ctx)?.morphTypeChange
    const morphActive =
      !!morph &&
      typeof morph.isActive === 'function' &&
      morph.isActive() &&
      typeof morph.getInitialPathAt === 'function'
    const morphDur = morphActive ? morph.getSpeed() : 0
    this._morphLeafIndex = 0

    // The PREVIOUS render's nodes (stashed on the persistent chart ctx, as
    // this module is re-instantiated on every data update), read live so an
    // update landing mid-tween starts where each arc actually is.
    const prev =
      mode === 'update' ? /** @type {any} */ (this.ctx)._sunburstPrevGeoms : null
    /** @param {any} n */
    const geo = (n) =>
      n._cur || { a0: n._t0, a1: n._t1, iR: n._iR, oR: n._oR }
    /** @param {any} c  the arc pinched to nothing at its mid angle */
    const pinch = (c) => {
      const m = (c.a0 + c.a1) / 2
      return { a0: m, a1: m, iR: c.iR, oR: c.iR }
    }

    this._nodesAll.forEach((node) => {
      if (node._show) {
        const target = {
          a0: node._t0,
          a1: node._t1,
          iR: node._iR,
          oR: node._oR,
        }
        if (!node._el) node._el = this._createArcEl(node)
        setZoomCursor(this, node)

        // Cross-type morph (treemap -> sunburst): a leaf starts as the tile
        // that stood for the same row and unrolls into its arc. Interior rings
        // have no counterpart in a flat partition, so they sweep in as the
        // leaves arrive.
        const morphFrom = morphActive ? this._morphSourceFor(node) : null

        if (morphFrom && morphDur > 0) {
          this._morphArcFrom(node, morphFrom, target, morphDur, gen)
        } else if ((mode === 'intro' || morphActive) && dur > 0) {
          this._sweepArc(node, target, morphActive ? morphDur : dur, gen)
        } else {
          const p = prev && prev.get(node._key)
          // `_cur` is the arc's LIVE geometry (updated each frame), so an
          // interrupted zoom continues smoothly from where it actually is; a
          // survivor of a data update morphs in place; a new arc unfurls from
          // its slot and is the only one that fades in.
          const from = node._cur || (p ? geo(p) : pinch(target))
          this._animateArc(node, from, target, dur, false, !node._cur && !p, gen)
        }
      } else if (node._el && node._cur) {
        this._animateArc(node, node._cur, pinch(node._cur), dur, true, false, gen)
      }
    })

    // An arc the update dropped (or no longer places) collapses out with the
    // morph, as a hidden one does, instead of vanishing at frame 0. The ghost
    // joins _nodesAll (never shown), so a zoom or the next update picks it up
    // mid-collapse like any other arc.
    if (prev && dur && !morphActive) {
      const keys = new Set(this._nodesAll.map((n) => n._show && n._key))
      prev.forEach((/** @type {any} */ p, /** @type {string} */ k) => {
        if (keys.has(k) || !(p._show || p._cur)) return
        const el = this._graphics.drawPath({
          fill: p._color,
          stroke: this.strokeColor,
          strokeWidth: this.strokeWidth,
          classes: 'apexcharts-sunburst-arc',
        })
        el.node.setAttribute('data:name', p.name)
        this._ringsG.add(el.attr({ opacity: p._el.attr('opacity') }))
        const c = geo(p)
        const g = { _el: el, _color: p._color, name: p.name, _key: k, _cur: c }
        this._nodesAll.push(g)
        this._animateArc(g, c, pinch(c), dur, true, false, gen)
      })
    }

    // Over when the last arc lands (a newer layout takes that over), or now
    // when nothing moves.
    const end = Math.max(dur, morphDur)
    if (end) {
      this._ringsG.animate(end).after(() => {
        if (this._zoomGen === gen && this._ringsG.node.isConnected)
          new Animations(w, /** @type {any} */ (this.ctx)).animationCompleted(
            this._ringsG.node,
          )
      })
    } else w.globals.animationEnded = true

    // Stash what is now on screen so the NEXT data update can morph from it.
    const geoms = new Map()
    this._nodesAll.forEach((n) => {
      if (n._show || n._cur) geoms.set(n._key, n)
    })
    ;/** @type {any} */ (this.ctx)._sunburstPrevGeoms = geoms

    this._renderLabels(dur)
  }

  /**
   * The captured mark this leaf should unroll from, or null when the node is
   * the outgoing chart had nothing to give it.
   *
   * When both charts carry branch keys the pairing is by identity, so EVERY
   * ring finds the tile that stood for the same branch and the inner rings
   * unroll instead of appearing from nothing.
   *
   * Without keys (a flat treemap, or an older config) only leaves pair, and
   * they consume the captured paths in draw order - the order the outgoing
   * renderer laid its own marks out in, so tile k pairs with leaf k.
   *
   * @param {any} node
   * @returns {string | null}
   */
  _morphSourceFor(node) {
    const ctx = /** @type {any} */ (this.ctx)
    const morph = ctx && ctx.morphTypeChange
    if (!morph) return null

    if (
      typeof morph.hasKeyedMarks === 'function' &&
      morph.hasKeyedMarks() &&
      typeof morph.getInitialPathForKey === 'function'
    ) {
      return morph.getInitialPathForKey(morphKey(node._key))
    }

    if (node.children && node.children.length) return null
    return morph.getInitialPathAt(this._morphLeafIndex++)
  }

  /**
   * Unroll an arc from an arbitrary captured shape.
   *
   * `_animateArc` interpolates arc PARAMETERS (angles and radii), which cannot
   * express a rectangle, so this one tweens the path data itself through
   * Animations.morphSVG - the same call every other morphing renderer makes,
   * which already selects the polygon-resample algorithm while a cross-type
   * morph is active.
   *
   * @param {any} node
   * @param {string} fromD
   * @param {{a0:number,a1:number,iR:number,oR:number}} target
   * @param {number} dur
   * @param {number} gen
   */
  _morphArcFrom(node, fromD, target, dur, gen) {
    const el = node._el
    const toD = this._arcPath(
      target.iR,
      target.oR,
      target.a0,
      target.a1,
      this.cfg.borderRadius,
    )
    el.node.style.display = ''
    el.attr({ d: fromD, opacity: 1 })
    // `_cur` is what an interrupting zoom tweens FROM. During a cross-type
    // morph the arc has no meaningful intermediate geometry (it is a rectangle
    // part-way to an arc), so the target is the honest answer: a zoom landing
    // mid-morph continues from the arc this one is becoming.
    node._cur = target
    if (this._zoomGen !== gen) return
    new Animations(this.w, /** @type {any} */ (this.ctx)).morphSVG(
      el,
      0,
      // Not a (series, point) index: an arc has no j, and passing a number here
      // would make morphSVG treat it as the last point of a series and fire the
      // chart's animation-completed hook.
      /** @type {any} */ (null),
      node._color,
      fromD,
      toD,
      dur,
      0,
    )
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
      fill: node._color,
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
      classes: 'apexcharts-sunburst-arc',
    })
    const el = path.node
    el.setAttribute('data:name', node.name)
    el.setAttribute('data:value', String(node.value))
    // The branch's identity, normalized so a treemap computes the same string
    // for the same branch. A cross-type morph pairs on it, at every level.
    el.setAttribute('data:key', morphKey(node._key))
    // Leaves are the level that corresponds to a flat partition (a treemap's
    // tiles), so the cross-type morph can pair the two up without handing a
    // tile its own ancestors.
    el.setAttribute(
      'data:leaf',
      String(!(node.children && node.children.length)),
    )
    this._tooltip.attach(el, node)
    if (Environment.isBrowser() && this.cfg.zoomOnClick !== false) {
      el.addEventListener('click', () => this._zoomTo(node))
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
      if (node._t1 - node._t0 < this.cfg.dataLabels.minAngleToShow) return
      this._renderCurvedLabel(node)
    })

    // Gen-checked: a superseded zoom's fade must not reveal labels over arcs
    // the newer zoom is still moving.
    const gen = this._zoomGen
    labelsG.attr({ opacity: dur > 0 ? 0 : 1 })
    if (dur > 0) {
      labelsG.animate(250, dur).during((/** @type {number} */ p) => {
        if (this._zoomGen === gen) labelsG.attr({ opacity: p })
      })
    }
  }

  /**
   * Curved label along the arc's mid-radius (flipped on the bottom half so it
   * stays upright). Raw SVG <textPath> — svg.js has no first-class textPath.
   * @param {any} node
   */
  _renderCurvedLabel(node) {
    const style = this.cfg.dataLabels.style
    const w = this.w
    const r = (node._iR + node._oR) / 2
    // Normalised, so a negative or past-360 startAngle flips the same half.
    const mid = ((((node._t0 + node._t1) / 2) % 360) + 360) % 360
    const flip = mid > 90 && mid < 270

    // Small angular padding so text does not touch the radial edges.
    const padDeg = Math.min((r > 0 ? (4 / r) * R2D : 0), (node._t1 - node._t0) / 2)
    const from = flip ? node._t1 - padDeg : node._t0 + padDeg
    const to = flip ? node._t0 + padDeg : node._t1 - padDeg
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
    tp.textContent = this._truncate(node.name, r, node._t1 - node._t0, style.fontSize)
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
    const next = resolveFocus(node, this._focus, this._roots)
    if (!next.changed) return
    this._focus = next.focus
    this._relayout(this._focus)
    this._applyLayout('zoom')
    this._renderBreadcrumb()
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
      focusChain(this._focus).map((n) => ({ name: n.name, node: n })),
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
    // The breadcrumb is an absolute overlay at top-left: push it below any
    // chart chrome it intersects (shared with the treemap, see
    // charts/common/Breadcrumb).
    avoidChromeOverlap(w, nav)
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

}
