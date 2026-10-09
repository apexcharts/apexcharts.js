// @ts-check
/**
 * Highlight filter on treemaps. A tile keeps its box, faded; its part is the
 * bottom share of the tile, solid, as tall as the part's share of the tile's
 * value. No element is added: the part is drawn inside the tile's own fill, a
 * vertical gradient with a hard stop (solid below the share, faded above),
 * in the tile's own box units. So everything that moves or hit-tests a tile
 * (its tweens, a zoom's camera and ghosts, the pointer, a cross-type morph)
 * carries the part with no work here, and the tile is hovered wherever the
 * pointer is on it, solid or faded.
 *
 * Treemap reaches this through one dispatch per render, after the layout,
 * which returns the painter each tile hands its fill to. Nested parents are
 * frames: they never fade, and know their leaves' parts through
 * `node.highlight` (header and tooltip formatters already receive the node).
 *
 * @module modules/highlightFilter/TreemapPart
 */

import Graphics from '../Graphics'
import { finite, mix, info, isPoint, stripSeries } from './util'

const TILE = 't:'
const CLASS = 'apexcharts-highlight-tile'
const OVER = 'apexcharts-highlight-overflow'
// A fill with no colour to cut a share from: a gradient, pattern or image.
const URL = /^url\(/i

/** @typedef {{s: number, f: number, c: string}} TileLook */

/**
 * Parse side, before the parts are read: whether this is a nested treemap
 * (its parts sit on its leaves), warning once about parts that cannot be
 * placed there.
 * @param {any} hf @param {string} type
 */
export function treeParse(hf, type) {
  const gl = hf.w.globals
  if (type !== 'treemap' || !gl.treemapRoots) return false
  const raw = /** @type {any[]} */ (gl.treemapRawSeries || [])
  if (raw.some((s) => Array.isArray(s?.highlightData))) {
    hf._warn(
      'nested',
      'on a nested treemap put the part on each leaf as { x, y, highlight }; highlightData is ignored.',
    )
  }
  /** @param {any} d @returns {boolean} */
  const onParent = (d) =>
    isPoint(d) &&
    Array.isArray(d.children) &&
    d.children.length > 0 &&
    ('highlight' in d || d.children.some(onParent))
  if (raw.some((s) => (s?.data || []).some(onParent))) {
    hf._warn(
      'parent',
      "a parent's highlight is ignored: parents add up their leaves' parts.",
    )
  }
  return true
}

/**
 * set() on a nested treemap: the series as handed in with each leaf's part
 * on the leaf itself, by its index among its series' leaves (depth first,
 * as the chart numbers them). `parts` is one row per series, or a function
 * of the leaf.
 * @param {any} hf @param {any[]} base the raw nested series
 * @param {any} parts
 */
export function treeSeries(hf, base, parts) {
  const w = hf.w
  return base.map((s, i) => {
    const out = stripSeries(s)
    const row = Array.isArray(parts?.[i]) ? parts[i] : null
    if (typeof parts !== 'function' && !row) return out
    let k = 0
    /** @param {any} d @returns {any} */
    const leaf = (d) => {
      if (isPoint(d) && Array.isArray(d.children) && d.children.length) {
        return { ...d, children: d.children.map(leaf) }
      }
      const j = k++
      const pt = isPoint(d) ? { ...d } : { x: '', y: d }
      pt.highlight =
        typeof parts === 'function'
          ? parts({
              seriesIndex: i,
              dataPointIndex: j,
              seriesName: s.name,
              x: pt.x ?? pt.name,
              value:
                typeof (pt.y ?? pt.value) === 'number'
                  ? (pt.y ?? pt.value)
                  : null,
              datum: d,
              w,
            })
          : row?.[j]
      return pt
    }
    if (Array.isArray(out.data)) out.data = out.data.map(leaf)
    return out
  })
}

/**
 * Treemap.draw, once, after the layout and the zoom camera, before any
 * parent or tile is drawn. Returns this render's tile painter, or undefined
 * when nothing is highlighted now or was a frame ago.
 * @param {any} hf the HighlightFilter
 * @param {any} tm the Treemap renderer
 */
export function treemapPass(hf, tm) {
  const w = hf.w
  const gl = w.globals
  const hd = w.highlightData
  if (!hd) return undefined
  hf._beginRender(tm, TILE)
  // An update on the fast path keeps <defs>: the last render's gradients go.
  hf._tmDefs.forEach((/** @type {any} */ n) => n.parentNode?.removeChild(n))
  hf._tmDefs = []
  const tiles = (hf._tiles = new Map())
  const active = hd.active
  const vals = w.seriesData.series
  // Every render, highlighted or not: a nested tree outlives a resize or a
  // zoom, so a roll-up from an earlier pick would stay on it.
  rollUp(tm, active ? hd.parts : null, vals)
  const prevMap = hf._prev()
  if (!active && !prevMap?.size) return undefined
  // The same tiles by series and index: a series hidden from the legend lays
  // out as one tile of nothing under a key of its own, which closes from the
  // tile that stood first in that series.
  /** @type {Map<string, any>} */
  const byIJ = new Map()
  prevMap?.forEach((/** @type {any} */ r) => byIJ.set(r.ij, r))

  // A zoom's ghosts are what the last render drew: no longer tiles.
  gl.prevTreemapView
    ?.querySelectorAll(`.${CLASS}`)
    .forEach((/** @type {any} */ n) => {
      n.classList.remove(CLASS, OVER)
      n.removeAttribute('data:hl-share')
    })

  const cfg = hf.cfg
  const fadeTo = active ? (cfg.fadeOpacity ?? 0.2) : 1
  const morph = hf.ctx.morphTypeChange?.isActive() === true
  const dyn = tm.dynamicAnim
  // The renderer's own rule for easing a tile (or a cross-type morph, whose
  // tiles unroll on the morph's clock); the renderer kind plays no part,
  // treemaps are always drawn in SVG.
  const anim = morph || !!(gl.dataChanged && dyn.enabled && gl.shouldAnimate)
  const speed = morph ? hf.ctx.morphTypeChange.getSpeed() : dyn.speed
  const fore = w.config.chart.foreColor
  let warned = false

  if (active) wrapParentTip(hf, tm)
  // A tile's label is drawn after its tile: it takes its tone from the share
  // drawn under it from the start, and follows it as it moves. It reads as
  // on the solid share once the share's edge has passed the top of its text
  // (a label turned to fit, the top of its run).
  /** @type {any} */
  let bound = null
  const cl = tm.helpers.calculateDataLabels
  tm.helpers.calculateDataLabels = (/** @type {any} */ o) => {
    const g = cl.call(tm.helpers, o)
    const rec = (bound = tiles.get(o.i + '|' + o.j))
    if (g && rec) {
      const ts = texts(g.node)
      rec.lb = ts.filter((t) =>
        /^(#fff|#ffffff|white)$/i.test(t.getAttribute('fill') || ''),
      )
      const t = ts[0]
      const [, y1, , y2] = rec.r
      if (t && y2 > y1) {
        const fs = parseFloat(t.getAttribute('font-size')) || 12
        rec.need = (y2 - parseFloat(t.getAttribute('y')) + 0.9 * fs) / (y2 - y1)
      }
      tone(rec, fore)
    }
    return g
  }
  const rf = tm.rotateToFitLabel
  tm.rotateToFitLabel = (/** @type {any[]} */ ...a) => {
    rf.apply(tm, a)
    const rec = bound
    bound = null
    if (rec?.lb && /rotate/.test(a[0].node.getAttribute('transform') || '')) {
      const run = new Graphics(w).getTextRects(a[2], String(a[1])).width
      rec.need = 0.5 + run / 2 / (a[6] - a[4])
      rec.tone = null
      tone(rec, fore)
    }
  }

  /**
   * @param {any} el the tile, not yet given its fill
   * @param {number} i @param {number} j
   * @param {string} pathFill its fill as the renderer worked it out
   * @param {any} leaf its layout node
   */
  return (el, i, j, pathFill, leaf) => {
    // A render that is no data change (a mount, a resize) draws each tile
    // where it rests, whatever an older render left; so does an update
    // sent without animation, which captured nothing.
    const key = TILE + leaf._key
    const ij = i + '|' + j
    const whole = vals[i]?.[j]
    const prev = anim
      ? prevMap?.get(key) || (whole ? undefined : byIJ.get(ij))
      : undefined
    if (!active && !prev) return undefined
    if (URL.test(pathFill)) {
      if (active && !warned) {
        warned = true
        hf._warn(
          'fill',
          'treemap tiles with a gradient, pattern or image fill are drawn without their parts.',
        )
      }
      return undefined
    }
    const p = active ? hd.parts[i]?.[j] : null
    // A tile of nothing has no share to draw.
    if (!whole && !prev) return undefined
    const share = finite(p) && whole ? p / whole : null

    /** @type {TileLook} */
    let to = active
      ? {
          s: share == null || share < 0 ? 0 : Math.min(share, 1),
          f: fadeTo,
          c: pathFill,
        }
      : // A clear grows the part back over its tile, the faded rest at 0
        // under it, and lands on the plain tile.
        { s: 1, f: 0, c: pathFill }
    /** @type {TileLook} */
    let from = to
    if (prev) {
      from = { s: prev.s, f: prev.f, c: prev.col }
      // A tile with nothing left (a series hidden from the legend) keeps
      // the look it has while it closes.
      if (!whole && active) to = { ...from }
    } else if (anim) {
      const was = /** @type {any} */ (gl.previousPaths[i])?.[j]
      // A tile on screen until now, plain: the pick starts as that tile
      // (the part covers it, the faded rest at 0), or rises from its base.
      if (morph || was?.rect?.width > 0) {
        from =
          cfg.enter === 'baseline'
            ? { s: 0, f: 1, c: to.c }
            : { s: 1, f: 0, c: to.c }
        if (!morph && was.fill && !URL.test(was.fill)) from.c = was.fill
      }
    }
    const moves = from.s !== to.s || from.f !== to.f || from.c !== to.c
    // A clear with nothing to move is the plain tile.
    if (!active && !moves) return undefined

    const g = w.dom.Paper.gradient('linear', (/** @type {any} */ add) => {
      for (let k = 0; k < 4; k++) add.stop(0, pathFill, 1)
    })
    // Bottom to top, in the tile's own box: it rides every resize of it.
    g.from(0, 1).to(0, 0)
    hf._tmDefs.push(g.node)
    const stops = Array.from(g.node.childNodes)
    const node = el.node
    if (active) {
      node.setAttribute(
        'class',
        `${node.getAttribute('class') || ''} ${CLASS}${share != null && share > 1 ? ' ' + OVER : ''}`.trim(),
      )
      node.setAttribute('data:hl-share', share == null ? '' : String(share))
    }

    /** What this tile draws, for the next update to start from. */
    /** @type {any} */
    const rec = {
      s: to.s,
      f: to.f,
      col: to.c,
      c: !active,
      ij,
      run: false,
      base: pathFill,
      r: leaf.rect,
      lb: null,
      need: 0.5,
      tone: null,
    }
    hf._targets.set(key, rec)
    tiles.set(ij, rec)
    const ease = colourEase(from.c, to.c)
    /** @param {TileLook} L */
    const write = (L) => {
      rec.ls = L.s
      rec.lf = L.f
      rec.lc = L.c
      stops.forEach((/** @type {any} */ n, /** @type {number} */ k) => {
        n.setAttribute('offset', String(k === 0 ? 0 : k === 3 ? 1 : L.s))
        n.setAttribute('stop-color', L.c)
        n.setAttribute('stop-opacity', String(k < 2 ? 1 : L.f))
      })
      tone(rec, fore)
    }
    const land = () => {
      rec.run = false
      write(to)
      if (!active && node.isConnected) {
        // The plain tile: its own fill, and the gradient gone.
        node.setAttribute('fill', pathFill)
        g.node.parentNode?.removeChild(g.node)
      }
    }
    if (anim && moves) {
      rec.run = true
      write(from)
      // An export lands the fade only: the share is geometry and moves on
      // with its tile. A clear has nothing else to show, so it lands.
      /** @type {number | null} */
      let f = null
      let done = false
      const job = {
        finish() {
          hf._live.delete(job)
          if (active) write({ s: rec.ls, f: (f = to.f), c: rec.lc })
          else {
            done = true
            land()
          }
        },
      }
      hf._hold(job)
      // On a runner of its own, started in the same flush as the tile's and
      // on the same curve, so the share and the box move as one.
      g.animate(speed, 0)
        .during(
          (/** @type {number} */ t) =>
            done ||
            write({
              s: mix(from.s, to.s, t),
              f: f ?? mix(from.f, to.f, t),
              c: ease(t),
            }),
        )
        .after(() => {
          hf._live.delete(job)
          done || land()
        })
    } else write(to)
    return g.url()
  }
}

/**
 * Each node's part: a leaf's own, and a parent's the sum of its leaves'
 * (each as far as it agrees in sign with its leaf) against the parent's
 * area, the layout's own sum of the leaves' sizes. Written on every node of
 * the tree before anything is drawn, or cleared when nothing is highlighted.
 * @param {any} tm @param {any[] | null} parts @param {any[]} vals
 */
function rollUp(tm, parts, vals) {
  /** @param {any} n @returns {any} */
  const walk = (n) => {
    const kids = n.children
    if (!kids || !kids.length) {
      const p = parts?.[n._si]?.[n._di]
      n.highlight = parts
        ? info(finite(p) ? p : null, vals[n._si]?.[n._di])
        : undefined
      return n.highlight
    }
    /** @type {number | null} */
    let v = null
    kids.forEach((/** @type {any} */ c) => {
      const h = walk(c)
      if (h && h.value != null && !(h.value * (h.total || 0) < 0)) {
        v = (v || 0) + Math.abs(h.value)
      }
    })
    if (!parts) return (n.highlight = undefined)
    const total = tm._subtreeArea(n)
    const share = v != null && total ? v / total : null
    n.highlight = {
      value: v,
      total,
      share,
      overflow: share != null && share > 1,
    }
    return n.highlight
  }
  ;(tm.roots || []).forEach(walk)
}

/**
 * A parent's default tooltip row states its leaves' parts against its total,
 * as a tile's row does. A custom formatter is handed `node.highlight`.
 * @param {any} hf @param {any} tm
 */
function wrapParentTip(hf, tm) {
  const show = tm._showParentTooltip
  tm._showParentTooltip = (/** @type {any} */ e, /** @type {any} */ node) => {
    show.call(tm, e, node)
    const h = node.highlight
    const tt = hf.cfg.tooltip || {}
    if (
      h?.value == null ||
      tt.show === false ||
      typeof hf.w.config.plotOptions.treemap.parents?.tooltip?.formatter ===
        'function'
    ) {
      return
    }
    const v = tm._tip()?.querySelector('.apexcharts-tooltip-text-y-value')
    if (!v) return
    let rest = `/ ${tm._formatValue(h.total)}`
    if (tt.share && h.total) rest += ` · ${Math.round(h.share * 100)}%`
    v.innerHTML =
      `${tm._formatValue(h.value)} ` +
      `<span class="apexcharts-highlight-total" style="font-weight: 400; opacity: 0.6">${rest}</span>`
  }
}

/**
 * A white label reads on the solid share but not on the faded tint: until
 * the share drawn under it reaches the top of its text, it takes the chart's
 * text colour.
 * @param {any} rec @param {string} fore
 */
function tone(rec, fore) {
  const on = (rec.ls ?? rec.s) >= rec.need - 1e-9
  if (!rec.lb || rec.tone === on) return
  rec.tone = on
  rec.lb.forEach((/** @type {any} */ t) => {
    if (t._apxFill == null) t._apxFill = t.getAttribute('fill')
    t.setAttribute('fill', on ? t._apxFill : fore)
  })
}

/**
 * Every text element under a node (walked by hand: the server renderer's
 * elements answer no selectors).
 * @param {any} n
 * @returns {any[]}
 */
function texts(n) {
  /** @type {any[]} */
  const out = []
  ;(function walk(/** @type {any} */ x) {
    if (String(x.tagName || x.nodeName).toLowerCase() === 'text') out.push(x)
    Array.from(x.childNodes || []).forEach(walk)
  })(n)
  return out
}

/**
 * A colour from `a` to `b` at progress t. Colours it cannot read switch on
 * landing.
 * @param {string} a @param {string} b
 * @returns {(t: number) => string}
 */
function colourEase(a, b) {
  const x = rgba(a)
  const y = rgba(b)
  if (a === b || !x || !y) return (t) => (t >= 1 ? b : a)
  return (t) =>
    t >= 1
      ? b
      : `rgba(${[0, 1, 2].map((k) => Math.round(mix(x[k], y[k], t))).join(',')},${+mix(x[3], y[3], t).toFixed(3)})`
}

/**
 * `#rgb`, `#rrggbb` (with or without alpha) and `rgb()`/`rgba()` as
 * [r, g, b, a], or null.
 * @param {string} c
 * @returns {number[] | null}
 */
function rgba(c) {
  const s = String(c).trim()
  let m = /^#([\da-f]+)$/i.exec(s)
  if (m) {
    let h = m[1]
    if (h.length < 5) h = h.replace(/./g, '$&$&')
    if (h.length !== 6 && h.length !== 8) return null
    return [0, 2, 4, 6].map((k) =>
      k < h.length ? parseInt(h.slice(k, k + 2), 16) / (k === 6 ? 255 : 1) : 1,
    )
  }
  m = /^rgba?\(([^)]*)\)$/i.exec(s)
  if (!m) return null
  const v = m[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(parseFloat)
  return v.length >= 3 && v.every(isFinite)
    ? [v[0], v[1], v[2], v[3] ?? 1]
    : null
}
