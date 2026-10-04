// @ts-check
import TreemapSquared from '../libs/Treemap-squared'
import Graphics from '../modules/Graphics'
import Animations from '../modules/Animations'
import Fill from '../modules/Fill'
import Helpers from './common/treemap/Helpers'
import Filters from '../modules/Filters'
import Series from '../modules/Series'

import Utils from '../utils/Utils'
import { Environment } from '../utils/Environment.js'
import { getTreemapRoots } from './common/treemap/Nested'
import { morphKey } from './common/Hierarchy'
import { rafTween } from '../modules/animations/LengthTransition'
import { resolveEasing } from '../modules/animations/Easing'
import { buildContinuousScale, colorValueOf, readableOn } from './common/treemap/ColorScale'
import {
  BREADCRUMB_HEIGHT,
  avoidChromeOverlap,
  breadcrumbConfig,
  clearBreadcrumb,
  renderBreadcrumb,
} from './common/Breadcrumb'

/**
 * @param {number[]} r
 * @returns {number}
 */
const areaOf = (r) => (r[2] - r[0]) * (r[3] - r[1])

/** @typedef {{x: number, y: number, width: number, height: number}} Box */

/**
 * A colour a tween can ease between. A gradient or pattern fill is a url()
 * into the old render's defs, which are gone.
 * @param {any} c
 * @returns {boolean}
 */
const isPlainColor = (c) => typeof c === 'string' && /^(#|rgb)/i.test(c)

/**
 * A box tween's two ends, with the fill eased too when it changed between
 * plain colours.
 * @param {Record<string, any>} from
 * @param {Record<string, any>} to
 * @param {string | null | undefined} fillWas
 * @param {string | null | undefined} fillNow
 * @returns {[Record<string, any>, Record<string, any>]}
 */
function withFills(from, to, fillWas, fillNow) {
  if (isPlainColor(fillWas) && isPlainColor(fillNow) && fillWas !== fillNow) {
    return [
      { ...from, fill: fillWas },
      { ...to, fill: fillNow },
    ]
  }
  return [from, to]
}

const headerLook = (/** @type {Element | null | undefined} */ el) =>
  Series.treemapHeaderLook(el)

/**
 * ApexCharts TreemapChart Class.
 * @module TreemapChart
 **/

export default class TreemapChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w

    this.strokeWidth = this.w.config.stroke.width
    this.helpers = new Helpers(w, ctx)
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation

    /** @type {any} */
    this.labels = []

    // Nested state, all resolved per draw.
    /** @type {any[]} */ this.roots = []
    /** @type {any[]} */ this.drawn = []
    /** @type {boolean} */ this.nested = false
    /** @type {boolean} */ this.showParents = false
    /** @type {any} */ this.scale = null
    /** @type {any[]|null} */ this._levelCache = null
    /** @type {number|null} */ this._total = null
    /** @type {number|null} */ this._avgLabelSize = null
    /** @type {any} */ this._tooltipEl = null
    /** Whether the parent tooltip currently owns the shared tooltip element. */
    this._tipOwned = false
    /** How many leaves have taken a captured shape by draw order this render. */
    /** @type {number} */ this._morphLeafIndex = 0
    /**
     * The map a click-to-zoom moves the picture by (see _zoomCamera), for the
     * render that zoom asked for.
     * @type {{fwd: (b: Box) => Box, back: (b: Box) => Box} | null}
     */
    this.camera = null
  }

  /**
   * @param {any[]} series
   */
  draw(series) {
    const w = this.w
    const graphics = new Graphics(this.w, this.ctx)
    const fill = new Fill(this.w)

    const ret = graphics.group({
      class: 'apexcharts-treemap',
    })

    if (w.globals.noData) return ret

    /** @type {any[]} */
    const ser = []
    /**
     * @param {number[]} s
     */
    series.forEach((s) => {
      /**
       * @param {number} v
       */
      const d = s.map((/** @type {any} */ v) => {
        return Math.abs(v)
      })
      ser.push(d)
    })

    this.negRange = this.helpers.checkColorRange()

    w.config.series.forEach((/** @type {any} */ s, /** @type {any} */ i) => {
      // Every series gets its row, an empty one included. A series declared
      // `hidden: true` arrives here with no data, and allocating the row only
      // inside the loop below left a hole in `labels` that _averageLabelSize
      // then recursed into, so the draw threw and the chart rendered blank.
      if (!Array.isArray(this.labels[i])) this.labels[i] = []
      /**
       * @param {number} l
       */
      s.data.forEach((/** @type {any} */ l) => {
        this.labels[i].push(l.x)
      })
    })

    // One layout path for both shapes. A flat series array IS a two-level tree
    // (series, then rows), so it is resolved into one here and laid out by the
    // same recursion the nested case uses; with no padding and no headers that
    // reduces to exactly the two-level squarify it always was.
    const tree = getTreemapRoots(w)
    this.nested = tree.nested
    this.roots = tree.roots
    this.scale = buildContinuousScale(w)

    // A single series is a wrapper, not a level the reader can see, so it is
    // unwrapped: level 0 becomes the outermost group the author actually
    // authored. With several series the series IS the outermost group.
    const drawn =
      tree.roots.length === 1 ? tree.roots[0].children || [] : tree.roots
    this.drawn = drawn

    // Parent containers are opt-out, but only appear at all when the data was
    // authored with `children`. A flat treemap must keep drawing exactly what
    // it always drew, with `seriesTitle` as its only group chrome.
    const parentsCfg = w.config.plotOptions.treemap.parents
    this.showParents =
      parentsCfg.show === true ||
      (parentsCfg.show !== false && this.nested)

    // Click-to-zoom: everything outside the focused branch is left out of the
    // layout entirely, so the focused group gets the whole canvas.
    const focus = this._resolveFocus(drawn)
    const layoutRoots = focus ? [focus] : drawn

    TreemapSquared.generateNested(
      layoutRoots,
      w.layout.gridWidth,
      w.layout.gridHeight,
      {
        padding: (node, depth, rw, rh) =>
          this.showParents ? this._levelPadding(depth, rw, rh) : 0,
        header: (node, depth, rw, rh) =>
          this.showParents ? this._levelHeader(node, depth, rw, rh) : 0,
      },
    )
    this.camera = this._zoomCamera()

    // Cross-type morph (sunburst -> treemap) via the optional `morph` feature.
    // Tiles consume the captured marks in draw order, the same order the
    // outgoing renderer laid its own out in, so arc k becomes tile k.
    const morphSrc = this.ctx?.morphTypeChange
    const morphActive =
      !!morphSrc &&
      typeof morphSrc.isActive === 'function' &&
      morphSrc.isActive() &&
      typeof morphSrc.getInitialPathAt === 'function'
    this._morphLeafIndex = 0

    // Leaves grouped by series, in the depth-first order the parse flattened
    // them, so `j` still indexes w.seriesData.series[i].
    const leavesBySeries = this._leavesBySeries(layoutRoots, w.config.series.length)
    const parentsBySeries = this.showParents
      ? this._parentsBySeries(layoutRoots, w.config.series.length)
      : []

    leavesBySeries.forEach((node, i) => {
      const elSeries = graphics.group({
        class: `apexcharts-series apexcharts-treemap-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i,
      })
      // Marks a hidden series the way every other type does, which is what
      // showSeries() looks for: without it, showing a series hidden through
      // the API found nothing hidden and did nothing.
      Series.addCollapsedClassToSeries(this.w, elSeries, i)

      // Set up event delegation once per series group instead of per-cell listeners
      graphics.setupEventDelegation(elSeries, '.apexcharts-treemap-rect')

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        const filters = new Filters(this.w)
        filters.dropShadow(ret, shadow, i)
      }

      const elDataLabelWrap = graphics.group({
        class: 'apexcharts-data-labels',
      })

      const bounds = {
        xMin: Infinity,
        yMin: Infinity,
        xMax: -Infinity,
        yMax: -Infinity,
      }
      // The same corner over the tiles' previous layout, when a data change
      // tweens them from it: the series title starts there and rides along.
      const fromBounds = { xMin: Infinity, yMin: Infinity }

      // Parents first, so a container and its header sit under the tiles they
      // contain (a treemap has no z-index; paint order is the only ordering).
      if (this.showParents) {
        ;(parentsBySeries[i] || []).forEach((/** @type {any} */ p) => {
          this._drawParent(elSeries, p, i)
        })
      }

      // Cascade: assign each tile a rank ordered by area (descending), so the
      // largest tiles get rank 0 (no delay) and smaller tiles cascade in.
      // Gated by `animateGradually`.
      const animCfg = w.config.chart.animations
      const gradCfg = animCfg.animateGradually
      const cascadeEnabled = gradCfg && gradCfg.enabled !== false
      /** @type {number[]} */
      const cascadeDelays = new Array(node.length).fill(0)
      if (cascadeEnabled) {
        const tileCount = node.length || 1
        const baseDelay = Math.min(
          gradCfg.delay || 0,
          (animCfg.speed * 0.5) / tileCount,
        )
        const ranked = node
          .map(
            /** @param {any} leaf @param {number} k */
            (leaf, k) => ({ j: k, area: leaf.rect ? areaOf(leaf.rect) : 0 }),
          )
          .sort(
            /** @param {{j: number, area: number}} a @param {{j: number, area: number}} b */
            (a, b) => b.area - a.area,
          )
        ranked.forEach(
          /** @param {{j: number, area: number}} item @param {number} rank */
          (item, rank) => {
            cascadeDelays[item.j] = rank * baseDelay
          },
        )
      }

      /**
       * @param {any} leaf
       * @param {number} k
       */
      node.forEach((/** @type {any} */ leaf, /** @type {any} */ k) => {
        const r = leaf.rect
        // A branch whose values are all zero gets no rect. Nothing to draw, but
        // the row still exists in the series matrix, so only the drawing is
        // skipped, never the indexing.
        if (!r) return
        // The data index is the leaf's own position in the flattened series,
        // NOT its position in this array: zooming into a branch draws a subset,
        // and everything keyed by (i, j) must still address the right row.
        const j = leaf._di

        const x1 = r[0]
        const y1 = r[1]
        const x2 = r[2]
        const y2 = r[3]

        // Only a tile with area places the series title. A hidden series lays
        // out as one zero-size tile, which used to anchor a stray title plate
        // on top of its neighbour's.
        if (x2 > x1 && y2 > y1) {
          bounds.xMin = Math.min(bounds.xMin, x1)
          bounds.yMin = Math.min(bounds.yMin, y1)
          bounds.xMax = Math.max(bounds.xMax, x2)
          bounds.yMax = Math.max(bounds.yMax, y2)
        }

        const colorProps = this._leafColor(i, j)
        const color = colorProps.color

        const pathFill = fill.fillPath({
          color,
          seriesNumber: i,
          dataPointIndex: j,
        })

        // Cross-type morph (sunburst -> treemap): a tile unrolls from the arc
        // that stood for the same row. An arc cannot be expressed as a <rect>,
        // so a morphing tile is drawn as a <path> instead and tweened through
        // the shared polygon interpolator. It keeps the same class, so event
        // delegation, tooltips and styling are unaffected.
        const morphFrom = morphActive ? this._morphSourceForLeaf(leaf) : null

        const elRect = morphFrom
          ? graphics.drawPath({
              d: this._tilePath(x1, y1, x2, y2),
              fill: '#fff',
              stroke: w.config.plotOptions.treemap.useFillColorAsStroke
                ? color
                : w.globals.stroke.colors[i],
              strokeWidth: this.strokeWidth,
              fillOpacity: 1,
            })
          : graphics.drawRect(
              x1,
              y1,
              x2 - x1,
              y2 - y1,
              w.config.plotOptions.treemap.borderRadius,
              '#fff',
              1,
              this.strokeWidth,
              w.config.plotOptions.treemap.useFillColorAsStroke
                ? color
                : w.globals.stroke.colors[i],
            )

        elRect.attr({
          cx: x1,
          cy: y1,
          index: i,
          i,
          j,
          width: x2 - x1,
          height: y2 - y1,
          fill: pathFill,
        })

        elRect.node.classList.add('apexcharts-treemap-rect')
        // See Sunburst: the branch identity a cross-type morph pairs on.
        elRect.node.setAttribute('data:key', morphKey(leaf._key))

        let fromRect = {
          x: x1 + (x2 - x1) / 2,
          y: y1 + (y2 - y1) / 2,
          width: 0,
          height: 0,
        }
        const toRect = {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
        }

        if (morphFrom) {
          // The tile is a path here, so the usual rect-attribute grow does not
          // apply: tween the path data from the captured arc instead.
          this._morphTile(
            elRect,
            morphFrom,
            this._tilePath(x1, y1, x2, y2),
            this.ctx.morphTypeChange.getSpeed(),
            i,
            j,
          )
        } else if (
          w.config.chart.animations.enabled &&
          !w.globals.dataChanged
        ) {
          if (w.globals.resized) {
            // A re-render that does not animate (a resize, a redraw with
            // animate false) draws the tiles at rest, and only marks the
            // animation over, as the other types do: completing it here
            // would call animationEnd in the middle of the draw. Growing them
            // in over 1ms instead put that 1ms behind each tile's cascade
            // delay, so they popped in one after another.
            w.globals.animationEnded = true
          } else {
            this.animateTreemap(
              elRect,
              fromRect,
              toRect,
              w.config.chart.animations.speed,
              // Ranked by draw order, not by data index: the cascade is
              // about what is on screen.
              cascadeDelays[k] || 0,
            )
          }
        }
        // A data change's tile tween, which the tile's label rides, and the
        // centre the label rides from (null for a tile the update adds).
        /** @type {any} */
        let tileTween = null
        /** @type {{x: number, y: number} | null} */
        let labelFrom = null
        // What the tile's label showed before ('' for none, null when not
        // known): a label that is new, or that a zoom draws differently,
        // fades in as it rides.
        /** @type {string | null} */
        let prevLook = null
        if (w.globals.dataChanged) {
          let speed = 1
          if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
            speed = this.dynamicAnim.speed

            const prev = /** @type {any} */ (w.globals.previousPaths[i])?.[j]
            /** @type {Record<string, any>} */
            const to = { ...toRect }
            if (!prev?.rect && this.camera) {
              // Off the old view: it rides in from outside the plot.
              fromRect = this.camera.back(toRect)
              labelFrom = {
                x: fromRect.x + fromRect.width / 2,
                y: fromRect.y + fromRect.height / 2,
              }
            }
            if (prev?.rect) {
              fromRect = { ...prev.rect }
              if (fromRect.width > 0 && fromRect.height > 0) {
                fromBounds.xMin = Math.min(fromBounds.xMin, fromRect.x)
                fromBounds.yMin = Math.min(fromBounds.yMin, fromRect.y)
                labelFrom = {
                  x: fromRect.x + fromRect.width / 2,
                  y: fromRect.y + fromRect.height / 2,
                }
                prevLook = typeof prev.label === 'string' ? prev.label : null
                if (prev.labelFading && this.camera) prevLook = ''
              }
              // Its colour eases with it. Only between plain colours: a
              // gradient or pattern fill is a url() into the old render's
              // defs, which are gone.
              const plain = (/** @type {any} */ c) =>
                typeof c === 'string' && /^(#|rgb)/i.test(c)
              if (plain(prev.fill) && plain(pathFill) && prev.fill !== pathFill) {
                /** @type {Record<string, any>} */ (fromRect).fill = prev.fill
                to.fill = pathFill
              }
            }

            tileTween = this.animateTreemap(elRect, fromRect, to, speed)
          }
        }

        let fontSize = this.getFontSize(r)
        if (w.config.plotOptions.treemap.dataLabels.format === 'truncate') {
          fontSize = parseInt(String(w.config.dataLabels.style.fontSize), 10)
        }

        // Everything below measures text, and measuring means building a real
        // <text> node and reading its bbox, which forces layout. On a treemap
        // that is the dominant cost by a wide margin, and most of it is spent
        // on tiles that could never show a label anyway. Decide that from the
        // geometry first, which is free.
        let dataLabels = null
        if (
          w.config.dataLabels.enabled &&
          this._labelCanShow(fontSize, x2 - x1, y2 - y1)
        ) {
          let formattedText = w.config.dataLabels.formatter(this.labels[i][j], {
            value: w.seriesData.series[i][j],
            seriesIndex: i,
            dataPointIndex: j,
            w,
          })
          if (w.config.plotOptions.treemap.dataLabels.format === 'truncate') {
            formattedText = this.truncateLabels(
              String(formattedText),
              fontSize,
              x1,
              y1,
              x2,
              y2,
            )
          }
          if (w.seriesData.series[i][j]) {
            dataLabels = this.helpers.calculateDataLabels({
              text: formattedText,
              x: (x1 + x2) / 2,
              y: (y1 + y2) / 2 + this.strokeWidth / 2 + fontSize / 3,
              i,
              j,
              colorProps,
              fontSize,
              series,
            })
          }
          if (w.config.dataLabels.enabled && dataLabels) {
            this.rotateToFitLabel(
              dataLabels,
              fontSize,
              formattedText,
              x1,
              y1,
              x2,
              y2,
            )
          }
        }
        elSeries.add(elRect)
        if (dataLabels !== null) {
          // Paired with its tile, so the next render knows this tile had one.
          dataLabels.node.setAttribute('data:key', morphKey(leaf._key))
          elSeries.add(dataLabels)
          // The label rides its tile from the old centre, on the tile's own
          // tween; a tile the update adds fades its label in as it grows.
          // It used to sit at its final spot from the first frame, over
          // whatever tile was still there.
          if (tileTween) {
            const fade =
              !labelFrom ||
              prevLook === '' ||
              (!!this.camera &&
                prevLook !== null &&
                prevLook !== Series.treemapLabelLook(dataLabels.node))
            this._rideTile(dataLabels.node, labelFrom, x1, y1, x2, y2, tileTween, fade)
          }
        }
      })

      // `seriesTitle` is the level-0 group label a flat treemap has always
      // drawn. Once parent containers are on, level 0 has a real header strip
      // and the free-floating plate would just sit on top of it.
      const seriesTitle = w.config.plotOptions.treemap.seriesTitle
      if (
        !this.showParents &&
        w.config.series.length > 1 &&
        seriesTitle &&
        seriesTitle.show
      ) {
        const sName =
          /** @type {Record<string,any>} */ (w.config.series[i]).name || ''

        if (sName && bounds.xMin < Infinity && bounds.yMin < Infinity) {
          const {
            offsetX,
            offsetY,
            borderColor,
            borderWidth,
            borderRadius,
            style,
          } = seriesTitle

          const textColor = style.color || w.config.chart.foreColor
          const padding = {
            left: style.padding.left,
            right: style.padding.right,
            top: style.padding.top,
            bottom: style.padding.bottom,
          }

          const textSize = graphics.getTextRects(
            sName,
            style.fontSize,
            style.fontFamily,
          )
          const labelRectWidth = textSize.width + padding.left + padding.right
          const labelRectHeight = textSize.height + padding.top + padding.bottom

          // Position
          const labelX = bounds.xMin + (offsetX || 0)
          const labelY = bounds.yMin + (offsetY || 0)

          // Draw background rect
          const elLabelRect = graphics.drawRect(
            labelX,
            labelY,
            labelRectWidth,
            labelRectHeight,
            borderRadius,
            style.background,
            1,
            borderWidth,
            borderColor,
          )

          const textX = labelX + padding.left
          const textY = labelY + padding.top + (textSize?.height ?? 0) * 0.75
          const elLabelText = graphics.drawText({
            x: textX,
            y: textY,
            text: sName,
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            foreColor: textColor,
            cssClass: style.cssClass || '',
          })

          // A data change eases the tiles from their previous layout. Drawn
          // straight at its new corner, the title would sit over a neighbour's
          // tiles until they caught up, so it eases from its old corner too.
          const dx = fromBounds.xMin - bounds.xMin
          const dy = fromBounds.yMin - bounds.yMin
          if (Number.isFinite(dx) && Number.isFinite(dy) && (dx || dy)) {
            const speed = this.dynamicAnim.speed
            this.animateTreemap(
              elLabelRect,
              { x: labelX + dx, y: labelY + dy },
              { x: labelX, y: labelY },
              speed,
            )
            this.animateTreemap(
              elLabelText,
              { x: textX + dx, y: textY + dy },
              { x: textX, y: textY },
              speed,
            )
          }

          elSeries.add(elLabelRect)
          elSeries.add(elLabelText)
        }
      }

      elSeries.add(elDataLabelWrap)
      ret.add(elSeries)
    })

    if (this.camera) this._playZoomExit(ret)

    this._renderBreadcrumb()

    return ret
  }

  // ----------------------------------------------------------------- levels

  /**
   * Per-level config: `plotOptions.treemap.parents` is the base, and
   * `plotOptions.treemap.levels[depth]` overrides it. Depth 0 is the outermost
   * group actually drawn (the series, unless a single series was unwrapped).
   * @param {number} depth
   * @returns {any}
   */
  _levelCfg(depth) {
    if (!this._levelCache) this._levelCache = []
    if (this._levelCache[depth]) return this._levelCache[depth]

    const tm = this.w.config.plotOptions.treemap
    const base = tm.parents || {}
    const lvl = (tm.levels || [])[depth] || {}
    const merged = {
      ...base,
      ...lvl,
      header: {
        ...(base.header || {}),
        ...(lvl.header || {}),
        style: {
          ...((base.header || {}).style || {}),
          ...((lvl.header || {}).style || {}),
        },
      },
      hover: { ...(base.hover || {}), ...(lvl.hover || {}) },
    }
    this._levelCache[depth] = merged
    return merged
  }

  /**
   * The inset between a parent's edge and its children, at this depth.
   * @param {number} depth
   * @param {number} _rw
   * @param {number} _rh
   * @returns {number}
   */
  _levelPadding(depth, _rw, _rh) {
    const cfg = this._levelCfg(depth)
    return Number(cfg.padding) || 0
  }

  /**
   * The header strip height at this depth, or 0 when the tile is too small to
   * carry one. The geometry library clamps against its own box; this is the
   * legibility rule, which needs the font size and so lives here.
   * @param {any} node
   * @param {number} depth
   * @param {number} rw
   * @param {number} rh
   * @returns {number}
   */
  _levelHeader(node, depth, rw, rh) {
    const cfg = this._levelCfg(depth)
    const header = cfg.header || {}
    if (header.show === false) return 0
    const h = Number(header.height)
    if (!Number.isFinite(h) || h <= 0) return 0
    // A strip narrower than this can never show a readable name, and reserving
    // it would only shrink the children for nothing.
    const minWidth = Number(header.minWidth) || 40
    if (rw < minWidth) return 0
    if (rh < h * 2) return 0
    return h
  }

  // ------------------------------------------------------------------ nodes

  /**
   * Leaves of the drawn tree, bucketed by the series they came from and kept in
   * depth-first order.
   * @param {any[]} roots
   * @param {number} seriesCount
   * @returns {any[][]}
   */
  _leavesBySeries(roots, seriesCount) {
    /** @type {any[][]} */
    const out = new Array(Math.max(1, seriesCount))
    for (let i = 0; i < out.length; i++) out[i] = []
    /** @param {any} node */
    const walk = (node) => {
      if (node.children && node.children.length) {
        node.children.forEach(walk)
      } else {
        const si = node._si || 0
        if (out[si]) out[si].push(node)
      }
    }
    roots.forEach(walk)
    return out
  }

  /**
   * Non-leaf nodes of the drawn tree, bucketed by series, shallowest first so a
   * container is painted before anything nested inside it.
   * @param {any[]} roots
   * @param {number} seriesCount
   * @returns {any[][]}
   */
  _parentsBySeries(roots, seriesCount) {
    /** @type {any[][]} */
    const out = new Array(Math.max(1, seriesCount))
    for (let i = 0; i < out.length; i++) out[i] = []
    /** @param {any} node */
    const walk = (node) => {
      if (!node.children || !node.children.length) return
      const si = node._si || 0
      if (out[si]) out[si].push(node)
      node.children.forEach(walk)
    }
    roots.forEach(walk)
    // Painter's order across the whole set, not just within one branch.
    out.forEach((list) =>
      list.sort(
        (/** @type {any} */ a, /** @type {any} */ b) =>
          (a.depth || 0) - (b.depth || 0),
      ),
    )
    return out
  }

  // ---------------------------------------------------------------- colours

  /**
   * A leaf's fill.
   *
   * Continuous colour (a datum carrying a second metric) takes over when it is
   * configured, because shading a tile by its own area value is precisely what
   * that mode replaces. Everything else - `colorScale.ranges`, `enableShades`,
   * `distributed`, negative handling - is the path it always was.
   *
   * The shape of the return value matches `Helpers.getShadeColor` so the
   * caller cannot tell the two apart.
   *
   * @param {number} i
   * @param {number} j
   * @returns {any}
   */
  _leafColor(i, j) {
    const w = this.w
    if (this.scale) {
      const cv = colorValueOf(w, i, j)
      if (cv != null) {
        const color = this.scale.at(cv)
        return {
          color,
          // The discrete path has never supplied a label colour, so only the
          // continuous path sets one: a diverging ramp runs right through the
          // middle of the luminance range and a fixed light-or-dark label
          // would be unreadable at one end or the other.
          foreColor: readableOn(color),
          colorProps: { color, foreColor: readableOn(color), percent: 0 },
        }
      }
    }
    return this.helpers.getShadeColor(
      w.config.chart.type,
      i,
      j,
      this.negRange,
    )
  }

  // ---------------------------------------------------------------- parents

  /**
   * Resolved container/header colours for a level. Parent marks are chrome, not
   * data, so they default to a neutral tint of the background rather than to a
   * series colour: with continuous colour on the leaves, a coloured container
   * would read as another data value.
   * @param {number} depth
   * @returns {any}
   */
  _parentChrome(depth) {
    const w = this.w
    const cfg = this._levelCfg(depth)
    const dark = w.config.theme.mode === 'dark'
    const header = cfg.header || {}
    const hstyle = header.style || {}

    // Deeper levels sit on top of shallower ones, so each is a little stronger
    // than its parent or the nesting would be invisible.
    const step = Math.min(depth, 3)
    const base = dark ? 255 : 0
    const rgb = `${base},${base},${base}`

    return {
      fill: cfg.fill || `rgba(${rgb},${(dark ? 0.04 : 0.03) + step * 0.02})`,
      fillOpacity: cfg.fillOpacity == null ? 1 : cfg.fillOpacity,
      borderColor: cfg.borderColor || `rgba(${rgb},${dark ? 0.18 : 0.14})`,
      borderWidth: cfg.borderWidth == null ? 1 : cfg.borderWidth,
      borderRadius:
        cfg.borderRadius == null
          ? w.config.plotOptions.treemap.borderRadius
          : cfg.borderRadius,
      headerBg: hstyle.background || `rgba(${rgb},${dark ? 0.1 : 0.07})`,
      headerColor:
        hstyle.color || (dark ? '#e8e8e8' : w.config.chart.foreColor),
      headerFontSize: hstyle.fontSize || '12px',
      headerFontFamily: hstyle.fontFamily || w.config.chart.fontFamily,
      headerFontWeight: hstyle.fontWeight == null ? 600 : hstyle.fontWeight,
      hoverColor:
        (cfg.hover && cfg.hover.color) ||
        (dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)'),
      hoverWidth: (cfg.hover && cfg.hover.width) || 2,
      hoverShow: !(cfg.hover && cfg.hover.show === false),
    }
  }

  /**
   * Draw one parent as a real mark: a container rect, and the header strip the
   * layout already reserved room for.
   *
   * The container is `pointer-events: none` over its interior so the tiles
   * inside it keep receiving hover; only the padding gutter and the header
   * strip belong to the parent.
   *
   * @param {any} elSeries
   * @param {any} node
   * @param {number} i seriesIndex
   */
  _drawParent(elSeries, node, i) {
    const r = node.rect
    if (!r) return
    const w = this.w
    const graphics = new Graphics(this.w, this.ctx)
    const depth = node.depth || 0
    const cfg = this._levelCfg(depth)
    const chrome = this._parentChrome(depth)

    const x1 = r[0]
    const y1 = r[1]
    const width = r[2] - r[0]
    const height = r[3] - r[1]
    if (width <= 0 || height <= 0) return

    const elGroup = graphics.group({
      class: 'apexcharts-treemap-parent',
      'data:depth': depth,
      'data:name': Utils.escapeString(node.name),
    })

    // Cross-type morph: with branch keys on both sides, a container unrolls
    // from the ring that stood for the same branch. A <rect> cannot hold an
    // arc, so a morphing container is drawn as a <path> - same class, so
    // styling and hit-testing are unaffected.
    const key = morphKey(node._key)
    const morphFrom = this._morphKeyed()
      ? this.ctx.morphTypeChange.getInitialPathForKey(key)
      : null

    const elRect = morphFrom
      ? graphics.drawPath({
          d: this._tilePath(x1, y1, x1 + width, y1 + height),
          fill: chrome.fill,
          stroke: chrome.borderColor,
          strokeWidth: chrome.borderWidth,
          fillOpacity: chrome.fillOpacity,
        })
      : graphics.drawRect(
          x1,
          y1,
          width,
          height,
          chrome.borderRadius,
          chrome.fill,
          chrome.fillOpacity,
          chrome.borderWidth,
          chrome.borderColor,
        )
    elRect.node.classList.add('apexcharts-treemap-parent-rect')
    elRect.node.setAttribute('data:key', key)
    elRect.node.setAttribute('data:depth', String(depth))

    if (morphFrom) {
      this._morphTile(
        elRect,
        morphFrom,
        this._tilePath(x1, y1, x1 + width, y1 + height),
        this.ctx.morphTypeChange.getSpeed(),
        i,
        depth,
      )
    }
    // A data change eases the container from the box it had, on the clock
    // the tiles inside it use; a branch the update adds fades in. Drawn at
    // their new boxes, the containers and headers jumped on the first frame
    // while their tiles were still moving.
    /** @type {any} */
    let prevBox = null
    /** @type {any} */
    let parentTween = null
    // Not in the old view at all: a zoom brings it in from outside the plot.
    let entering = false
    const dynamic = w.config.chart.animations.dynamicAnimation
    if (
      !morphFrom &&
      w.globals.dataChanged &&
      dynamic.enabled &&
      w.globals.shouldAnimate
    ) {
      const speed = dynamic.speed
      prevBox = w.globals.prevTreemapParents?.get(`${i}|${key}`) ?? null
      if (!prevBox && this.camera) {
        prevBox = this.camera.back({ x: x1, y: y1, width, height })
        entering = true
        // A container around the branch being left was not drawn in its
        // view, yet from there it starts across the whole plot: it fades
        // in as it closes in. One beside it starts outside and slides in.
        const l = w.layout
        if (
          prevBox.x < l.gridWidth &&
          prevBox.y < l.gridHeight &&
          prevBox.x + prevBox.width > 0 &&
          prevBox.y + prevBox.height > 0
        ) {
          elGroup.attr({ opacity: 0 }).animate(speed).attr({ opacity: 1 })
        }
      }
      if (prevBox) {
        parentTween = new Animations(w).animateRect(
          elRect,
          ...withFills(
            {
              x: prevBox.x,
              y: prevBox.y,
              width: prevBox.width,
              height: prevBox.height,
            },
            { x: x1, y: y1, width, height },
            prevBox.fill,
            elRect.node.getAttribute('fill'),
          ),
          speed,
          () => {},
        )
      } else {
        elGroup.attr({ opacity: 0 }).animate(speed).attr({ opacity: 1 })
      }
    }

    // The interior belongs to the children painted on top; the gutter around
    // them is the only part of this rect the pointer should ever reach, and
    // that falls out of the children covering the rest.
    elGroup.add(elRect)

    const headerHeight = node.headerHeight || 0
    // The header's rendered text, before clipping. Also the accessible name of
    // the group, so what is announced matches what is drawn.
    let headerText = ''
    if (headerHeight > 0) {
      const header = cfg.header || {}
      const elHeaderRect = graphics.drawRect(
        x1,
        y1,
        width,
        headerHeight,
        0,
        chrome.headerBg,
        1,
        0,
        'transparent',
      )
      elHeaderRect.node.classList.add('apexcharts-treemap-parent-header')
      elGroup.add(elHeaderRect)
      if (prevBox) {
        // From the strip it had: a zoom changes the container's depth, and
        // with it the strip's height and colour. A strip the container did
        // not have grows in.
        const was = prevBox.header
        const now = { x: x1, y: y1, width, height: headerHeight }
        new Animations(w).animateRect(
          elHeaderRect,
          ...withFills(
            was
              ? { x: was.x, y: was.y, width: was.width, height: was.height }
              : entering && this.camera
                ? this.camera.back(now)
                : { x: prevBox.x, y: prevBox.y, width: prevBox.width, height: 0 },
            now,
            was?.fill,
            elHeaderRect.node.getAttribute('fill'),
          ),
          w.config.chart.animations.dynamicAnimation.speed,
          () => {},
        )
      }

      let text = String(node.name ?? '')
      if (typeof header.formatter === 'function') {
        text = String(
          header.formatter(node.name, {
            value: node.value,
            depth,
            seriesIndex: i,
            node,
            w,
          }),
        )
      } else if (header.showValue) {
        text = `${text}  ${this._formatValue(node.value)}`
      }
      headerText = text

      const offsetX = Number(header.offsetX) || 0
      const align = header.align || 'left'
      const pad = 6
      const maxWidth = Math.max(0, width - pad * 2 - Math.abs(offsetX))
      const fontSize = parseFloat(String(chrome.headerFontSize)) || 12
      const clipped = graphics.getTextBasedOnMaxWidth({
        text,
        maxWidth,
        fontSize,
      })

      if (clipped) {
        let tx = x1 + pad + offsetX
        let anchor = 'start'
        if (align === 'center') {
          tx = x1 + width / 2 + offsetX
          anchor = 'middle'
        } else if (align === 'right') {
          tx = x1 + width - pad + offsetX
          anchor = 'end'
        }

        const elText = graphics.drawText({
          x: tx,
          y:
            y1 +
            headerHeight / 2 +
            fontSize / 3 +
            (Number(header.offsetY) || 0),
          text: clipped,
          textAnchor: anchor,
          fontSize: chrome.headerFontSize,
          fontFamily: chrome.headerFontFamily,
          fontWeight: chrome.headerFontWeight,
          foreColor: chrome.headerColor,
          cssClass: `apexcharts-treemap-parent-label ${
            (header.style && header.style.cssClass) || ''
          }`,
        })
        elText.node.setAttribute('pointer-events', 'none')
        elGroup.add(elText)
        if (parentTween && prevBox) {
          // The header text rides its strip: the same anchor (left edge,
          // centre or right edge) on the old box and on the new one.
          const at = (/** @type {{x: number, width: number}} */ b) =>
            align === 'center'
              ? b.x + b.width / 2
              : align === 'right'
                ? b.x + b.width
                : b.x
          const was = {
            x: at(prevBox) - at({ x: x1, width }) + (x1 + width / 2),
            y: prevBox.y - y1 + (y1 + height / 2),
          }
          // A zoom that changes how the header reads (its depth sets the
          // font, the formatter may add the value) fades the new text in
          // over the old one riding out (_playZoomExit).
          const changed =
            !!this.camera &&
            !entering &&
            prevBox.header?.look !== headerLook(elText.node)
          this._rideTile(
            elText.node,
            was,
            x1,
            y1,
            x1 + width,
            y1 + height,
            parentTween,
            changed,
          )
        }
      }

      this._attachParentEvents(elHeaderRect.node, node, chrome, elRect)
      this._makeParentAccessible(
        elHeaderRect.node,
        node,
        chrome,
        elRect,
        headerText,
      )
    }

    this._attachParentEvents(elRect.node, node, chrome, elRect)

    // Name the container for assistive tech even when it is not actionable, so
    // the structure is readable rather than an unlabelled stack of rects.
    elGroup.node.setAttribute('role', 'group')
    elGroup.node.setAttribute('aria-label', this._parentLabel(node, headerText))

    elSeries.add(elGroup)
  }

  /**
   * The spoken description of a branch: what it is, how big, and how much of
   * the chart it accounts for.
   *
   * Starts from the header's own rendered text when there is one (before
   * clipping), so the accessible name contains the visible label rather than a
   * differently-formatted number - a formatter that renders "$3.25T" must not
   * be announced as "3246".
   *
   * @param {any} node
   * @param {string} [visibleText] the header text, formatter applied, unclipped
   * @returns {string}
   */
  _parentLabel(node, visibleText) {
    const total = this._drawnTotal()
    const pct = total > 0 ? ((node._area / total) * 100).toFixed(1) : '0'
    const n = this._countLeaves(node)
    const lead =
      visibleText && String(visibleText).trim()
        ? String(visibleText).replace(/\s+/g, ' ').trim()
        : `${node.name}, ${this._formatValue(node._area)}`
    return `${lead}, ${n} ${n === 1 ? 'item' : 'items'}, ${pct}% of total`
  }

  /**
   * Make a branch reachable and operable from the keyboard.
   *
   * Only the header strip takes focus, and only while click-to-zoom is live: a
   * treemap can hold hundreds of tiles, and making every mark a tab stop would
   * bury the chart's own controls behind a few hundred presses. Tabbing the
   * groups and pressing Enter is the same path the mouse takes, and the
   * breadcrumb is already real buttons, so the way back is reachable too.
   *
   * @param {any} el
   * @param {any} node
   * @param {any} chrome
   * @param {any} elRect
   * @param {string} [visibleText] the header's rendered text, unclipped
   */
  _makeParentAccessible(el, node, chrome, elRect, visibleText) {
    if (!el || !el.setAttribute) return
    if (!this._zoomEnabled()) return

    el.setAttribute('role', 'button')
    el.setAttribute('tabindex', '0')
    el.setAttribute(
      'aria-label',
      `${this._parentLabel(node, visibleText)}. Zoom in`,
    )
    // The strip is the affordance, and it labels the group it opens.
    el.setAttribute('aria-expanded', 'false')

    if (!Environment.isBrowser() || !el.addEventListener) return

    // A focus ring: reuse the hover outline so pointer and keyboard land on the
    // same visual, and the SVG needs an explicit one either way (a UA outline on
    // an SVG child is unreliable).
    el.addEventListener('focus', () => {
      elRect.node.setAttribute('stroke', chrome.hoverColor)
      elRect.node.setAttribute('stroke-width', String(chrome.hoverWidth + 1))
    })
    el.addEventListener('blur', () => {
      elRect.node.setAttribute('stroke', chrome.borderColor)
      elRect.node.setAttribute('stroke-width', String(chrome.borderWidth))
    })
    el.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return
      // Space would scroll the page out from under the chart.
      e.preventDefault()
      this._zoomTo(node, true)
    })
  }

  /**
   * Hover outline, aggregate tooltip and click-to-zoom for a parent mark.
   * @param {any} el the element receiving the pointer
   * @param {any} node
   * @param {any} chrome
   * @param {any} elRect the container rect to outline
   */
  _attachParentEvents(el, node, chrome, elRect) {
    if (!Environment.isBrowser() || !el || !el.addEventListener) return
    const w = this.w

    if (chrome.hoverShow) {
      el.addEventListener('mouseenter', () => {
        elRect.node.setAttribute('stroke', chrome.hoverColor)
        elRect.node.setAttribute('stroke-width', String(chrome.hoverWidth))
      })
      el.addEventListener('mouseleave', () => {
        elRect.node.setAttribute('stroke', chrome.borderColor)
        elRect.node.setAttribute('stroke-width', String(chrome.borderWidth))
      })
    }

    if (w.config.tooltip.enabled) {
      el.addEventListener('mouseenter', (/** @type {MouseEvent} */ e) =>
        this._showParentTooltip(e, node),
      )
      el.addEventListener('mousemove', (/** @type {MouseEvent} */ e) =>
        this._positionTooltip(e),
      )
      el.addEventListener('mouseleave', () => this._hideParentTooltip())
    }

    if (this._zoomEnabled()) {
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => this._zoomTo(node))
    }
  }

  // ------------------------------------------------------------------- zoom

  /**
   * Click-to-zoom is live only when nothing else already owns the click.
   *
   * The drilldown feature is the other way into a hierarchy on a treemap, and
   * the two are different models of the same gesture: drilldown replaces the
   * view one level at a time, zoom reframes a tree that stays whole. Running
   * both would fight over the same click and over the one breadcrumb slot in
   * the wrap, so drilldown wins where it is active and this stands down.
   * @returns {boolean}
   */
  _zoomEnabled() {
    const w = this.w
    const z = w.config.plotOptions.treemap.zoom
    if (!z || !z.enabled || !this.showParents) return false

    const dd = w.config.drilldown
    if (dd && dd.enabled && Array.isArray(dd.series) && dd.series.length) {
      if (!this._warnedZoomConflict) {
        this._warnedZoomConflict = true
        console.warn(
          'ApexCharts treemap: `plotOptions.treemap.zoom` and the drilldown ' +
            'feature both navigate the hierarchy, so zoom is ignored here. ' +
            'Drop `drilldown.series` to zoom a nested treemap instead.',
        )
      }
      return false
    }
    return true
  }

  /**
   * The focused branch for this render, looked up by the key stashed on the
   * last click. Keys are rebuilt identically from the same data, so the focus
   * survives a re-render; a key that no longer resolves (the data changed under
   * it) simply falls back to the whole tree.
   * @param {any[]} drawn
   * @returns {any}
   */
  _resolveFocus(drawn) {
    const key = this.w.globals.treemapFocusKey
    if (!key || !this._zoomEnabled()) return null
    /** @type {any} */
    let found = null
    /** @param {any} node */
    const walk = (node) => {
      if (found) return
      if (node._key === key) {
        found = node
        return
      }
      if (node.children) node.children.forEach(walk)
    }
    drawn.forEach(walk)
    // Only a branch can be focused; a leaf has nothing to zoom into.
    return found && found.children && found.children.length ? found : null
  }

  /**
   * @param {any} node
   * @param {boolean} [restoreFocus] move focus into the new view once it is
   *   drawn. A zoom re-renders the chart, which destroys the element the
   *   keyboard user was standing on; without this they would be returned to the
   *   top of the document.
   */
  _zoomTo(node, restoreFocus = false) {
    const w = this.w
    if (!node || !node.children || !node.children.length) return
    const next = w.globals.treemapFocusKey === node._key ? null : node._key
    const done = this._refocus(next)
    if (!restoreFocus || !done || typeof done.then !== 'function') return
    done.then(() => {
      if (!Environment.isBrowser()) return
      // The breadcrumb is where you are and how you get back, so it is the
      // right landing spot after the view changes under you.
      const crumb = /** @type {any} */ (
        w.dom.baseEl.querySelector(
          '.apexcharts-breadcrumb .apexcharts-breadcrumb-item',
        )
      )
      if (crumb && crumb.focus) {
        crumb.focus()
        return
      }
      // Zoomed all the way back out: no breadcrumb, so return to the strip of
      // the group that was just closed.
      const header = /** @type {any} */ (
        w.dom.baseEl.querySelector(
          '.apexcharts-treemap-parent-header[tabindex]',
        )
      )
      if (header && header.focus) header.focus()
    })
  }

  /**
   * Re-render focused on another branch (null: the whole tree).
   *
   * A zoom is an animated update of the same data, so it renders like one:
   * the outgoing picture is captured first and the draw eases from it (see
   * _zoomCamera). It used to re-render with whatever flags the last update
   * left, which replayed the mount animation (every tile growing from
   * nothing) or snapped, while the containers, headers and labels jumped.
   * @param {string | null} next
   * @returns {any} the update's promise
   */
  _refocus(next) {
    const w = this.w
    const gl = w.globals
    const anim = w.config.chart.animations
    const animate = !!(anim.enabled && anim.dynamicAnimation.enabled)
    gl.treemapZoom =
      animate && Environment.isBrowser()
        ? { from: gl.treemapFocusKey ?? null, to: next }
        : null
    gl.treemapFocusKey = next
    this._hideParentTooltip()
    gl.shouldAnimate = animate
    gl.resized = true
    gl.dataChanged = true
    if (gl.treemapZoom) this.ctx.series.getPreviousPaths()
    return this.ctx.update()
  }

  /**
   * A zoom reframes one tree, so it moves like a camera: one map takes the
   * old view onto the new, set by the branch on the deeper side of the move
   * (the one being entered, or the one being left), whose box fills the plot
   * on that side. A tile in both views eases from its own old box; one only
   * in the new view rides in along the map from outside the plot, and one
   * only in the old view rides it out (_playZoomExit). Null unless this
   * render is a zoom's.
   * @returns {{fwd: (b: Box) => Box, back: (b: Box) => Box} | null}
   */
  _zoomCamera() {
    const w = this.w
    const zoom = w.globals.treemapZoom
    w.globals.treemapZoom = null
    const old = w.globals.prevTreemapParents
    if (!zoom || !old || !w.globals.dataChanged || !w.globals.shouldAnimate) {
      return null
    }

    /** @type {Map<string, any>} */
    const byKey = new Map()
    /** @param {any} n */
    const index = (n) => {
      byKey.set(n._key, n)
      if (n.children) n.children.forEach(index)
    }
    this.drawn.forEach(index)
    const under = (/** @type {string} */ k, /** @type {string} */ above) => {
      for (let n = byKey.get(k); n; n = n._parent) if (n._key === above) return true
      return false
    }
    const { from, to } = zoom
    const anchor =
      to && (from == null || under(to, from))
        ? to
        : from && (to == null || under(from, to))
          ? from
          : null
    const node = anchor ? byKey.get(anchor) : null
    if (!anchor || !node || !node.rect) return null

    // Its old box, by series and branch: branch keys repeat from one series
    // to the next (and every series root's is empty), so the series it sits
    // in is part of the key, as the capture keyed it.
    let top = node
    while (top._parent) top = top._parent
    const ri = Math.max(0, this.roots.indexOf(top))
    /** @type {Box | null} */
    const was = old.get(`${ri}|${morphKey(anchor)}`) ?? null
    const r = node.rect
    const now = { x: r[0], y: r[1], width: r[2] - r[0], height: r[3] - r[1] }
    if (!was || !(was.width > 0 && was.height > 0 && now.width > 0 && now.height > 0)) {
      return null
    }
    const o = was
    const kx = now.width / o.width
    const ky = now.height / o.height
    return {
      fwd: (b) => ({
        x: now.x + (b.x - o.x) * kx,
        y: now.y + (b.y - o.y) * ky,
        width: b.width * kx,
        height: b.height * ky,
      }),
      back: (b) => ({
        x: o.x + (b.x - now.x) / kx,
        y: o.y + (b.y - now.y) / ky,
        width: b.width / kx,
        height: b.height / ky,
      }),
    }
  }

  /**
   * What a zoom leaves out of the new view rides off the plot on the camera
   * and goes once it is out of sight: the old render's tiles, containers and
   * labels that the new one does not redraw. A label whose tile stays but no
   * longer has room for it rides to the tile's new place, fading. The
   * treemap is clipped to the plot while this plays, since whatever rides in
   * or out passes outside it.
   * @param {any} ret
   */
  _playZoomExit(ret) {
    const w = this.w
    const camera = this.camera
    const view = w.globals.prevTreemapView
    w.globals.prevTreemapView = null
    if (!camera || !Environment.isBrowser()) return
    const root = /** @type {Element} */ (ret.node)
    const graphics = new Graphics(this.w, this.ctx)

    const KINDS = /** @type {const} */ ([
      ['apexcharts-treemap-rect', 'T'],
      ['apexcharts-treemap-parent-rect', 'P'],
      ['apexcharts-data-labels', 'L'],
    ])
    const id = (/** @type {Element} */ el) => {
      const kind = KINDS.find(([cls]) => el.classList.contains(cls))
      const ri = el.closest('.apexcharts-series')?.getAttribute('data:realIndex')
      return kind ? `${kind[1]}${ri}|${el.getAttribute('data:key')}` : ''
    }
    const num = (/** @type {Element} */ el, /** @type {string} */ a) =>
      parseFloat(el.getAttribute(a) ?? '')
    const boxOf = (/** @type {Element} */ el) => ({
      x: num(el, 'x'),
      y: num(el, 'y'),
      width: num(el, 'width'),
      height: num(el, 'height'),
    })
    const centre = (/** @type {Box} */ b) => ({
      x: b.x + b.width / 2,
      y: b.y + b.height / 2,
    })

    /** @type {Map<string, Element>} what the new view draws */
    const drawnNow = new Map()
    root.querySelectorAll('[data\\:key]').forEach((el) => {
      const k = id(el)
      if (k) drawnNow.set(k, el)
    })

    /** @type {Array<(e: number) => void>} */
    const writers = []
    const easeBox = (/** @type {Element} */ el, /** @type {Box} */ to) => {
      const from = boxOf(el)
      if (![from.x, from.y, from.width, from.height].every(Number.isFinite)) {
        return
      }
      writers.push((e) => {
        el.setAttribute('x', String(from.x + (to.x - from.x) * e))
        el.setAttribute('y', String(from.y + (to.y - from.y) * e))
        el.setAttribute('width', String(from.width + (to.width - from.width) * e))
        el.setAttribute('height', String(from.height + (to.height - from.height) * e))
      })
    }
    const ride = (
      /** @type {Element} */ el,
      /** @type {{x: number, y: number}} */ d,
      fade = false,
    ) => {
      const base = el.getAttribute('transform') || ''
      // From the strength it has: one still fading in fades out from there.
      const o0 = parseFloat(el.getAttribute('opacity') ?? '1')
      const from = Number.isFinite(o0) ? o0 : 1
      writers.push((e) => {
        el.setAttribute('transform', `translate(${d.x * e} ${d.y * e}) ${base}`.trim())
        if (fade) el.setAttribute('opacity', String(from * (1 - e)))
      })
    }
    // A label an earlier move was still fading in.
    const fadingIn = (/** @type {Element} */ g) =>
      parseFloat(g.getAttribute('opacity') ?? '1') < 0.999
    // A ghost is no longer the thing it was: nothing that selects tiles,
    // containers or labels may find it, and it is not announced.
    const retire = (/** @type {Element} */ el) => {
      ;[el, ...el.querySelectorAll('*')].forEach((n) => {
        n.removeAttribute('data:key')
        ;['role', 'tabindex', 'aria-label', 'aria-expanded'].forEach((a) =>
          n.removeAttribute(a),
        )
        n.classList.remove(
          'apexcharts-treemap-rect',
          'apexcharts-treemap-parent',
          'apexcharts-treemap-parent-rect',
          'apexcharts-treemap-parent-header',
          'apexcharts-treemap-parent-label',
          'apexcharts-data-labels',
        )
      })
    }

    const shapes = graphics.group({ class: 'apexcharts-treemap-ghosts' }).node
    const labels = graphics.group({ class: 'apexcharts-treemap-ghosts' }).node
    if (view) {
      // What an earlier zoom, still moving, was carrying off: it carries on
      // under this camera from where it is, below this zoom's own ghosts.
      const earlier = [...view.querySelectorAll(':scope > .apexcharts-treemap-ghosts')]
      earlier.forEach((layer, n) => {
        layer.querySelectorAll('rect').forEach((r) => easeBox(r, camera.fwd(boxOf(r))))
        layer.querySelectorAll('text').forEach((t) => {
          // Where it is now: its own spot, plus the ride it (or its label
          // group) had got to.
          const lead = (/** @type {Element | null} */ el) => {
            const m = /^translate\(\s*([-+.\deE]+)[\s,]+([-+.\deE]+)\s*\)/.exec(
              (el?.getAttribute('transform') || '').trim(),
            )
            return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0]
          }
          const [px, py] = lead(t.parentElement)
          const [tx, ty] = lead(t)
          const at = {
            x: num(t, 'x') + px + tx,
            y: num(t, 'y') + py + ty,
            width: 0,
            height: 0,
          }
          if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return
          const to = camera.fwd(at)
          ride(t, { x: to.x - at.x, y: to.y - at.y })
        })
        // The first layer held shapes, the last labels (see the end).
        ;[...layer.childNodes].forEach((c) =>
          (n === earlier.length - 1 && earlier.length > 1 ? labels : shapes).appendChild(c),
        )
        layer.remove()
      })

      /** @type {Map<string, Element>} */
      const oldTiles = new Map()
      view
        .querySelectorAll('.apexcharts-treemap-rect[data\\:key]')
        .forEach((el) => oldTiles.set(id(el), el))
      // Labels first, while the old tiles still sit in their series groups.
      // One that the new view draws the same way rides on its own; one it
      // draws differently (turned, resized, cut shorter), not at all, or that
      // was still fading in fades out on its way to the tile's new place,
      // under the new one fading in.
      view
        .querySelectorAll('.apexcharts-data-labels[data\\:key]')
        .forEach((g) => {
          const k = id(g)
          const fresh = drawnNow.get(k)
          if (
            fresh &&
            !fadingIn(g) &&
            Series.treemapLabelLook(fresh) === Series.treemapLabelLook(g)
          ) {
            return
          }
          const tile = oldTiles.get(`T${k.slice(1)}`)
          if (!tile) return
          const was = centre(boxOf(tile))
          const stays = drawnNow.get(`T${k.slice(1)}`)
          const to = stays ? centre(boxOf(stays)) : centre(camera.fwd(boxOf(tile)))
          ride(g, { x: to.x - was.x, y: to.y - was.y }, !!stays)
          retire(g)
          labels.appendChild(g)
        })
      // Containers before the tiles in them, the order they were painted in:
      // a container's tint over its own tiles would shade them.
      view.querySelectorAll('.apexcharts-treemap-parent').forEach((g) => {
        const rect = g.querySelector('.apexcharts-treemap-parent-rect[data\\:key]')
        if (!rect || rect.tagName.toLowerCase() !== 'rect') return
        const stays = drawnNow.get(id(rect))
        if (stays) {
          // A container in both views at another depth: its header may
          // read differently. The old text rides its strip out, fading,
          // under the new one fading in.
          const was = g.querySelector('.apexcharts-treemap-parent-label')
          const now = stays.parentElement?.querySelector(
            '.apexcharts-treemap-parent-label',
          )
          if (was && headerLook(was) !== headerLook(now)) {
            const ob = boxOf(rect)
            const nb = boxOf(stays)
            const anchor = was.getAttribute('text-anchor')
            const at = (/** @type {Box} */ b) =>
              anchor === 'middle'
                ? b.x + b.width / 2
                : anchor === 'end'
                  ? b.x + b.width
                  : b.x
            ride(was, { x: at(nb) - at(ob), y: nb.y - ob.y }, true)
            retire(was)
            labels.appendChild(was)
          }
          return
        }
        g.querySelectorAll('rect').forEach((r) => easeBox(r, camera.fwd(boxOf(r))))
        g.querySelectorAll('text').forEach((t) => {
          const at = { x: num(t, 'x'), y: num(t, 'y'), width: 0, height: 0 }
          if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return
          const to = camera.fwd(at)
          ride(t, { x: to.x - at.x, y: to.y - at.y })
        })
        // A container around the branch being entered is not drawn in its
        // view, yet the camera takes it across the whole plot: it fades out
        // as it opens up, where one beside it slides off.
        const end = camera.fwd(boxOf(rect))
        const l = w.layout
        if (
          end.x < l.gridWidth &&
          end.y < l.gridHeight &&
          end.x + end.width > 0 &&
          end.y + end.height > 0
        ) {
          writers.push((e) => g.setAttribute('opacity', String(1 - e)))
        }
        retire(g)
        shapes.appendChild(g)
      })
      oldTiles.forEach((el, k) => {
        if (drawnNow.has(k) || el.tagName.toLowerCase() !== 'rect') return
        easeBox(el, camera.fwd(boxOf(el)))
        retire(el)
        shapes.appendChild(el)
      })
      // The gradients, patterns and filters the ghosts paint with: the old
      // render's defs went with it, so the capture copied them.
      const defs = view.querySelector(':scope > defs.apexcharts-treemap-ghost-defs')
      if (defs) shapes.insertBefore(defs, shapes.firstChild)
    }

    ;[shapes, labels].forEach((g) => {
      g.setAttribute('pointer-events', 'none')
      g.setAttribute('aria-hidden', 'true')
    })
    root.insertBefore(shapes, root.firstChild)
    root.appendChild(labels)
    root.setAttribute('clip-path', `url(#gridRectMask${w.globals.cuid})`)
    // On the tiles' own curve: their tweens are runners, which use the
    // chart's animations.easing (a dynamicAnimation.easing would part them).
    rafTween(
      w,
      Math.max(1, this.dynamicAnim.speed || 1),
      resolveEasing(w.config.chart.animations.easing),
      (e) => writers.forEach((fn) => fn(e)),
      () => {
        shapes.remove()
        labels.remove()
        root.removeAttribute('clip-path')
      },
    )
  }

  /**
   * Outermost drawn group -> focus chain, for the breadcrumb.
   *
   * Stops at a drawn root rather than walking all the way to `_parent === null`:
   * when a single series was unwrapped, the series node is still every level-0
   * node's parent, and it is not a level the reader ever sees.
   */
  _focusChain() {
    /** @type {any[]} */
    const chain = []
    const drawnRoots = new Set(this.drawn || [])
    let n = this._resolveFocus(this.drawn || [])
    while (n) {
      chain.unshift(n)
      if (drawnRoots.has(n)) break
      n = n._parent
    }
    return chain
  }

  /** The breadcrumb config: a treemap-local override on the shared block. */
  _breadcrumbCfg() {
    const z = this.w.config.plotOptions.treemap.zoom
    return breadcrumbConfig(this.w, z && z.breadcrumb)
  }

  /**
   * Breadcrumb back out of a zoom. Markup, config and accessible semantics are
   * the shared ones, so a zoomed treemap and a drilled-in chart present the
   * same affordance.
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return
    const w = this.w
    if (!w.dom.elWrap) return
    clearBreadcrumb(w)
    if (!this._zoomEnabled()) return

    const chain = this._focusChain()
    if (!chain.length) return

    const nav = renderBreadcrumb(w, {
      ariaLabel: 'Treemap breadcrumb',
      config: this._breadcrumbCfg(),
      compact: true,
      crumbs: [{ label: 'All', data: null }].concat(
        chain.map((/** @type {any} */ n) => ({ label: n.name, data: n })),
      ),
      onNavigate: (_i, crumb) => {
        this._refocus(crumb.data ? crumb.data._key : null)
      },
    })
    if (!nav) return

    this._placeBreadcrumb(nav)
    avoidChromeOverlap(w, nav)
  }

  /**
   * Sit the breadcrumb in the band the layout reserved for it
   * (Dimensions.gridPadForBreadcrumb), just above the grid.
   *
   * The fallback below should never fire: the reserve is unconditional once
   * zoom is enabled. It stays for the cases the reserve cannot cover - a
   * responsive override that turns zoom on after layout, or a host stylesheet
   * that grows the font - where a readable chip over the tiles beats a
   * breadcrumb clipped by the plot.
   *
   * @param {any} nav
   */
  _placeBreadcrumb(nav) {
    const w = this.w
    const gridTop = w.layout.translateY || 0
    const dimHelpers = this.ctx?.dimensions?.dimHelpers
    const titleArea = dimHelpers
      ? dimHelpers.getTitleSubtitleCoords('title').height +
        dimHelpers.getTitleSubtitleCoords('subtitle').height
      : 0

    const navH = nav.getBoundingClientRect().height || BREADCRUMB_HEIGHT
    if (gridTop - titleArea >= navH + 1) {
      nav.style.top = `${gridTop - navH - 1}px`
      return
    }

    nav.style.top = `${titleArea}px`
    const dark = w.config.theme.mode === 'dark'
    nav.style.background = dark
      ? 'rgba(20,24,30,0.82)'
      : 'rgba(255,255,255,0.86)'
    nav.style.borderRadius = '4px'
  }

  // ---------------------------------------------------------------- tooltip

  /**
   * A parent is not a row in the series matrix, so the shared tooltip - which
   * addresses everything by (seriesIndex, dataPointIndex) - has nothing to look
   * up. It writes into the same tooltip element instead, so the aggregate looks
   * like every other tooltip in the chart.
   * @param {MouseEvent} e
   * @param {any} node
   */
  _showParentTooltip(e, node) {
    const w = this.w
    const t = this._tip()
    if (!t) return

    const total = this._drawnTotal()
    const parentVal = node._parent ? node._parent._area : total
    const pctTotal = total > 0 ? ((node._area / total) * 100).toFixed(1) : '0.0'
    const pctParent =
      parentVal > 0 ? ((node._area / parentVal) * 100).toFixed(1) : pctTotal

    const cfg = this.w.config.plotOptions.treemap.parents
    const custom = cfg && cfg.tooltip && cfg.tooltip.formatter
    const leafCount = this._countLeaves(node)

    let html
    if (typeof custom === 'function') {
      html = custom({
        name: node.name,
        value: node._area,
        depth: node.depth || 0,
        leafCount,
        percentOfParent: Number(pctParent),
        percentOfTotal: Number(pctTotal),
        node,
        w,
      })
    } else {
      const marker = this._parentChrome(node.depth || 0).headerBg
      const groupBg = w.config.tooltip.fillSeriesColor
        ? `background-color:${marker};`
        : ''
      html =
        `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex;${groupBg}">` +
        `<div class="apexcharts-tooltip-text">` +
        `<div class="apexcharts-tooltip-y-group">` +
        `<span class="apexcharts-tooltip-text-y-label">${Utils.escapeString(
          node.name,
        )}: </span>` +
        `<span class="apexcharts-tooltip-text-y-value">${this._formatValue(
          node._area,
        )}</span>` +
        `</div>` +
        `<div class="apexcharts-tooltip-y-group">` +
        `<span class="apexcharts-tooltip-text-y-label">${leafCount} items, </span>` +
        `<span class="apexcharts-tooltip-text-y-value">${pctParent}% of parent, ${pctTotal}% of total</span>` +
        `</div>` +
        `</div></div>`
    }

    t.innerHTML = html
    t.classList.add('apexcharts-active')
    t.style.opacity = '1'
    this._tipOwned = true
    this._positionTooltip(e)
  }

  /** @returns {any} */
  _tip() {
    if (!this._tooltipEl) {
      this._tooltipEl = this.w.dom.baseEl.querySelector('.apexcharts-tooltip')
    }
    return this._tooltipEl
  }

  /**
   * Position beside the cursor, flipping to the opposite side when the box
   * would overflow the chart wrap, and clamping inside it either way.
   * @param {MouseEvent} e
   */
  _positionTooltip(e) {
    const t = this._tip()
    if (!t || !this._tipOwned) return
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

  _hideParentTooltip() {
    const t = this._tip()
    // Only hide what this renderer put there. Moving from a parent's gutter
    // onto one of its tiles fires the leave here after the shared tooltip has
    // already taken the element over for the tile.
    if (!t || !this._tipOwned) return
    this._tipOwned = false
    t.classList.remove('apexcharts-active')
    t.style.opacity = '0'
  }

  /**
   * The whole tree's area, zoomed in or not: "% of total" has to mean the same
   * thing at every zoom level, otherwise the branch you just zoomed into
   * reports 100%.
   * @returns {number}
   */
  _drawnTotal() {
    if (this._total == null) {
      this._total = (this.drawn || []).reduce(
        (/** @type {number} */ s, /** @type {any} */ r) =>
          s + this._subtreeArea(r),
        0,
      )
    }
    return this._total || 0
  }

  /**
   * A node's area, computed the same way the layout does it. Zooming lays out
   * only the focused branch, so every other branch reaches here without the
   * `_area` the layout would otherwise have left on it.
   * @param {any} node
   * @returns {number}
   */
  _subtreeArea(node) {
    if (node._area != null) return node._area
    const kids = node.children
    if (kids && kids.length) {
      let s = 0
      for (let i = 0; i < kids.length; i++) s += this._subtreeArea(kids[i])
      return s
    }
    const v = Number(node.value)
    return isNaN(v) ? 0 : Math.abs(v)
  }

  /**
   * @param {any} node
   * @returns {number}
   */
  _countLeaves(node) {
    if (!node.children || !node.children.length) return 1
    return node.children.reduce(
      (/** @type {number} */ s, /** @type {any} */ c) =>
        s + this._countLeaves(c),
      0,
    )
  }

  /**
   * Format an aggregate the way the chart formats its own y values, so a
   * parent's total reads like the tiles it contains.
   * @param {number} v
   * @returns {string}
   */
  _formatValue(v) {
    const w = this.w
    const fmt = w.config.tooltip?.y?.formatter || w.config.yaxis?.[0]?.labels?.formatter
    if (typeof fmt === 'function') {
      try {
        return String(fmt(v, { seriesIndex: 0, dataPointIndex: 0, w }))
      } catch (_) {
        // A formatter written for leaf rows may expect fields a parent
        // aggregate has no equivalent of; fall through to the plain number.
      }
    }
    return String(v)
  }

  /**
   * Whether a tile could show a label at all, decided from geometry alone so
   * nothing has to be measured to find out.
   *
   * Two rules, both about legibility rather than about saving work:
   *   - a tile that cannot hold one character in EITHER orientation has no
   *     label to draw, rotated or not
   *   - below `dataLabels.minFontSize` the text is decoration, not information
   *
   * Together these keep a dense treemap from spending its whole render
   * measuring text nobody can read.
   *
   * @param {number} fontSize
   * @param {number} tileWidth
   * @param {number} tileHeight
   * @returns {boolean}
   */
  _labelCanShow(fontSize, tileWidth, tileHeight) {
    if (!Number.isFinite(fontSize) || fontSize <= 0) return false
    const cfg = this.w.config.plotOptions.treemap.dataLabels
    const min = cfg && cfg.minFontSize != null ? Number(cfg.minFontSize) : 0
    if (fontSize < min) return false
    // `rotateToFitLabel` may turn the text sideways, so the long side is what
    // has to hold the glyph height.
    return Math.max(tileWidth, tileHeight) >= fontSize
  }

  /**
   * Mean label length across the whole chart.
   *
   * It scales every tile's font size, and it is the same number for all of
   * them, so it is computed once per draw. It used to be recomputed inside
   * `getFontSize`, which runs per tile: two full walks of every label, per
   * label, which is quadratic and was the entire cost of a large treemap (a
   * 10k-tile chart spent ~9s here).
   *
   * @returns {number}
   */
  _averageLabelSize() {
    if (this._avgLabelSize != null) return this._avgLabelSize

    // total length of labels (i.e [["Italy"],["Spain", "Greece"]] -> 16)
    /**
     * @param {any[]} arr
     */
    function totalLabelLength(arr) {
      let i,
        total = 0
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += totalLabelLength(arr[i])
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += arr[i].length
        }
      }
      return total
    }

    // count of labels (i.e [["Italy"],["Spain", "Greece"]] -> 3)
    /**
     * @param {any[]} arr
     */
    function countLabels(arr) {
      let i,
        total = 0
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += countLabels(arr[i])
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += 1
        }
      }
      return total
    }

    this._avgLabelSize =
      totalLabelLength(this.labels) / countLabels(this.labels)
    return this._avgLabelSize
  }

  // This calculates a font-size based upon
  // average label length and the size of the box
  /**
   * @param {number[]} coordinates
   */
  getFontSize(coordinates) {
    const w = this.w

    const averagelabelsize = this._averageLabelSize()

    /**
     * @param {number} width
     * @param {number} height
     */
    function fontSize(width, height) {
      const area = width * height
      const arearoot = Math.pow(area, 0.5)
      return Math.min(
        arearoot / averagelabelsize,
        parseInt(w.config.dataLabels.style.fontSize, 10),
      )
    }

    return fontSize(
      coordinates[2] - coordinates[0],
      coordinates[3] - coordinates[1],
    )
  }

  /**
   * @param {any} elText
   * @param {string | number} fontSize
   * @param {string} text
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  rotateToFitLabel(elText, fontSize, text, x1, y1, x2, y2) {
    const graphics = new Graphics(this.w)
    const textRect = graphics.getTextRects(text, String(fontSize))

    // if the label fits better sideways then rotate it
    if (
      textRect.width + this.w.config.stroke.width + 5 > x2 - x1 &&
      textRect.width <= y2 - y1
    ) {
      const labelRotatingCenter = graphics.rotateAroundCenter(elText.node)

      elText.node.setAttribute(
        'transform',
        `rotate(-90 ${labelRotatingCenter.x} ${
          labelRotatingCenter.y
        }) translate(${textRect.height / 3})`,
      )
    }
  }

  // This is an alternative label formatting method that uses a
  // consistent font size, and trims the edge of long labels
  /**
   * @param {string} text
   * @param {number} fontSize
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  truncateLabels(text, fontSize, x1, y1, x2, y2) {
    const graphics = new Graphics(this.w)
    const textRect = graphics.getTextRects(text, String(fontSize))

    // Determine max width based on ideal orientation of text
    const labelMaxWidth =
      textRect.width + this.w.config.stroke.width + 5 > x2 - x1 &&
      y2 - y1 > x2 - x1
        ? y2 - y1
        : x2 - x1
    const truncatedText = graphics.getTextBasedOnMaxWidth({
      text: text,
      maxWidth: labelMaxWidth,
      fontSize: fontSize,
    })

    // Return empty label when text has been trimmed for very small rects
    if (text.length !== truncatedText.length && labelMaxWidth / fontSize < 5) {
      return ''
    } else {
      return truncatedText
    }
  }

  /**
   * True when the active cross-type morph can pair marks by branch identity
   * rather than by draw order.
   * @returns {boolean}
   */
  _morphKeyed() {
    const m = this.ctx?.morphTypeChange
    return !!(
      m &&
      typeof m.hasKeyedMarks === 'function' &&
      m.hasKeyedMarks() &&
      typeof m.getInitialPathForKey === 'function'
    )
  }

  /**
   * The captured shape a LEAF tile unrolls from, or null when the outgoing
   * chart had nothing to give it.
   *
   * Branch identity first, so a tile unrolls from the arc that stood for the
   * same row rather than the k-th one. That key can find nothing even when
   * both sides carry keys, and a FLAT treemap taking from a nested sunburst is
   * exactly that case: its tiles are keyed at depth one ('/0:Tops') while the
   * arcs are keyed at the depth they actually sit ('/0:Apparel/0:Tops'), so no
   * key ever matches. Draw order is the fallback, the same one the mirror
   * direction has always had (Sunburst._morphSourceFor), and without it
   * treemap -> sunburst read as a morph while the return trip grew from
   * nothing.
   *
   * Leaves only. A container taking a leaf's path by position would unroll
   * from a different branch entirely, so `_morphParent` stays key-or-nothing.
   *
   * @param {any} leaf
   * @returns {string | null}
   */
  _morphSourceForLeaf(leaf) {
    const morph = this.ctx?.morphTypeChange
    if (!morph || typeof morph.getInitialPathAt !== 'function') return null
    if (this._morphKeyed()) {
      const keyed = morph.getInitialPathForKey(morphKey(leaf._key))
      if (keyed) return keyed
    }
    return morph.getInitialPathAt(this._morphLeafIndex++)
  }

  /**
   * A tile as closed path data, for the cross-type morph (a <rect> cannot hold
   * an arc, so a morphing tile is drawn as a <path>).
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @returns {string}
   */
  _tilePath(x1, y1, x2, y2) {
    return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`
  }

  /**
   * Tween a tile's path data from a captured shape (a sunburst arc) into its
   * rectangle.
   *
   * Routed through Animations.morphSVG, the same call every other morphing
   * renderer makes: it already selects the polygon-resample algorithm while a
   * cross-type morph is active, which is what tweens between shapes as
   * different as an arc and a rectangle. Reaching for the interpolator directly
   * would also add a name to a module the split bundles share, which breaks
   * them.
   *
   * @param {any} el
   * @param {string} fromD
   * @param {string} toD
   * @param {number} speed
   * @param {number} i
   * @param {number} j
   */
  _morphTile(el, fromD, toD, speed, i, j) {
    const animations = new Animations(this.w, this.ctx)
    animations.morphSVG(el, i, j, 'none', fromD, toD, speed, 0)
  }

  /**
   * Carry a label (or any mark drawn at its final spot) along a tile tween:
   * offset from where it was to where it is, eased off on the tween's own
   * clock. With no `from`, it fades in instead.
   * @param {Element} node
   * @param {{x: number, y: number} | null} from the old centre
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {any} tween the tile's runner
   * @param {boolean} [fade] fade in on the way (a label the tile did not
   *   have before)
   */
  _rideTile(node, from, x1, y1, x2, y2, tween, fade = !from) {
    const base = node.getAttribute('transform') || ''
    const dx = from ? from.x - (x1 + x2) / 2 : 0
    const dy = from ? from.y - (y1 + y2) / 2 : 0
    const place = (/** @type {number} */ pos) => {
      if (pos >= 1) {
        if (base) node.setAttribute('transform', base)
        else node.removeAttribute('transform')
        node.removeAttribute('opacity')
        return
      }
      const t = 1 - pos
      node.setAttribute('transform', `translate(${dx * t} ${dy * t}) ${base}`.trim())
      if (fade) node.setAttribute('opacity', String(pos))
    }
    place(0)
    tween.during(place)
  }

  /**
   * @param {any} el
   * @param {Record<string, any>} fromRect
   * @param {Record<string, any>} toRect
   * @param {number} speed
   * @param {number} [delay] - per-tile cascade delay in ms
   * @returns {any} the tween, which a label can ride (_rideTile)
   */
  animateTreemap(el, fromRect, toRect, speed, delay = 0) {
    const animations = new Animations(this.w)
    return animations.animateRect(
      el,
      fromRect,
      toRect,
      speed,
      () => {
        animations.animationCompleted(el)
      },
      delay,
    )
  }
}
