// @ts-check
/**
 * Plot-layout transitions.
 *
 * An update can change how much room the axes need: hiding a series shrinks
 * the y-axis labels ($120k becomes $80k), a longer category rotates the x
 * labels. The plot area then moves and resizes. Marks morph in plot-local
 * coordinates, so when the plot jumped to its new place on the first frame,
 * every mark jumped with it while its own tween was only beginning.
 *
 * The outgoing plot rect is captured with the axis chrome (its in-flight value
 * while an earlier layout tween is still running, so a quick second update
 * continues from what is on screen). After the new render mounts, the plot
 * eases from that rect to the new one on the same clock and easing as the
 * series morph, and everything drawn from the layout follows the in-flight
 * rect: the graphical group, the y-axis groups, the clip rects, the grid's
 * lines, bands and borders, the axis lines, ticks and titles. Marks, tick
 * labels and gridlines that their own transitions drive are left to them.
 *
 * @module modules/animations/LayoutTransition
 */

import { BrowserAPIs } from '../../ssr/BrowserAPIs'

/** @typedef {{x: number, y: number, w: number, h: number}} PlotRect */

/**
 * A lone `translate(x[, y])` (or no transform at all, which is the origin).
 * Anything else returns null: that element is not ours to drive.
 *
 * @param {Element} el
 * @returns {[number, number] | null}
 */
function readTranslate(el) {
  const t = (el.getAttribute('transform') || '').trim()
  if (!t) return [0, 0]
  const m = /^translate\(\s*([-+.\deE]+)(?:[\s,]+([-+.\deE]+))?\s*\)$/.exec(t)
  if (!m) return null
  const x = parseFloat(m[1])
  const y = m[2] === undefined ? 0 : parseFloat(m[2])
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null
}

/**
 * The plot rect as currently drawn: the in-flight rect while a layout tween
 * runs, else the rendered layout.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @returns {PlotRect}
 */
function currentPlotRect(w) {
  const live = w.globals.layoutTween
  if (live && live.graphical === w.dom.elGraphical?.node) return { ...live.rect }
  const l = w.layout
  return {
    x: l.translateX ?? 0,
    y: l.translateY ?? 0,
    w: l.gridWidth,
    h: l.gridHeight,
  }
}

/**
 * A captured picture of the screen (the axis chrome, a circle) stays the
 * truth until the next frame is painted, and only until then.
 *
 * Two updates in one tick (an updateOptions and an updateSeries from the
 * same handler) each capture before rendering, but the first one's render
 * never reaches the screen: the second capture would read it, the first
 * update's tween would ease between two identical layouts, and the second
 * would find nothing, so everything jumped. While the first capture is still
 * pending the second one keeps it. And once a frame has been painted, a
 * capture nobody consumed (its update was skipped as identical) no longer
 * describes the screen, so it is not replayed by some later render.
 *
 * @template {object} T
 * @param {T} frame
 * @returns {T & {pending: boolean}}
 */
export function pendingUntilPaint(frame) {
  const held = /** @type {T & {pending: boolean}} */ ({ ...frame, pending: true })
  BrowserAPIs.requestAnimationFrame(() => {
    held.pending = false
  })
  return held
}

// Hit-testing, zoom, selection and keyboard focus all map pointer positions
// through the FINAL layout. Hovering mid-flight is harmless (a tooltip a few px
// off for a moment), but a gesture that acts on a position lands the tween
// first.
const GESTURES = ['pointerdown', 'touchstart', 'wheel', 'keydown']

/**
 * Land a plot tween (`finish`) on the first gesture inside the chart that acts
 * on a position. Not one on the legend or toolbar: a quick second legend click
 * must start from where the plot is, not from a snap. Shared with
 * CircleTransition, so one gesture lands both tweens of an update.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {() => void} finish
 * @returns {() => void} removes the listeners
 */
export function landOnGesture(w, finish) {
  const wrap = w.dom.elWrap
  const land = (/** @type {Event} */ e) => {
    const t = /** @type {Element | null} */ (e.target)
    if (t?.closest?.('.apexcharts-legend, .apexcharts-toolbar, .apexcharts-menu')) {
      return
    }
    finish()
  }
  GESTURES.forEach((t) => wrap?.addEventListener(t, land, true))
  return () => GESTURES.forEach((t) => wrap?.removeEventListener(t, land, true))
}

/**
 * Numeric attributes of an element, or undefined unless all are numbers.
 *
 * @param {Element | null | undefined} el
 * @param {string[]} attrs
 * @returns {number[] | undefined}
 */
function nums(el, attrs) {
  if (!el) return undefined
  const v = attrs.map((a) => parseFloat(el.getAttribute(a) || ''))
  return v.every(Number.isFinite) ? v : undefined
}

/**
 * The group a grid line belongs to, which sets how far it reaches.
 *
 * @param {Element} line
 * @returns {string}
 */
function lineGroup(line) {
  const parent = /** @type {Element | null} */ (line.parentNode)
  return (parent?.getAttribute('class') || '').split(' ')[0]
}

/**
 * Snapshot the outgoing plot rect, the y-axis group offsets (which follow the
 * labels' width, not the plot rect), and the extents that also carry a
 * padding of their own (gridline ends, bands, clip rects and the x axis line
 * reach past the plot by half a bar on a numeric axis, which changes with the
 * bar count). Called from captureAxisChrome (captureCircle for the circle
 * charts without axes), i.e. before the DOM is torn down for the incoming
 * update.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @returns {{rect: PlotRect, shifts: Record<string, [number, number]>, ends: Record<string, number[]>}}
 */
export function captureLayout(w) {
  /** @type {Record<string, [number, number]>} */
  const shifts = {}
  w.dom.baseEl.querySelectorAll('.apexcharts-yaxis[rel]').forEach((g) => {
    const t = readTranslate(g)
    if (t) shifts[`g${g.getAttribute('rel')}`] = t
  })

  /** @type {Record<string, number[]>} */
  const ends = {}
  const g = w.dom.elGraphical?.node
  if (g) {
    // Per group: gridlines and borders reach past the plot by the bar pad,
    // the grid area's own edge line does not.
    g.querySelectorAll(
      '.apexcharts-grid line:not(.apexcharts-tick-ghost), .apexcharts-grid-borders line',
    ).forEach((/** @type {Element} */ ln) => {
      const p = nums(ln, ['x1', 'y1', 'x2', 'y2'])
      if (!p) return
      const k = lineGroup(ln)
      if (!ends[`h:${k}`] && p[1] === p[3]) ends[`h:${k}`] = [p[0], p[2]]
      if (!ends[`v:${k}`] && p[0] === p[2]) ends[`v:${k}`] = [p[1], p[3]]
    })
    const row = nums(g.querySelector('.apexcharts-grid-row'), ['x', 'width'])
    if (row) ends.row = row
    const col = nums(g.querySelector('.apexcharts-grid-column'), ['y', 'height'])
    if (col) ends.col = col
    const xl = nums(g.querySelector('.apexcharts-xaxis > line'), ['x1', 'x2'])
    if (xl) ends.xline = xl
  }
  const CLIP = ['x', 'y', 'width', 'height']
  ;[w.dom.elGridRect, w.dom.elGridRectBar, w.dom.elGridRectMarker].forEach((r, k) => {
    const v = nums(r?.node, CLIP)
    if (v) ends[`clip${k}`] = v
  })

  return { rect: currentPlotRect(w), shifts, ends }
}

/**
 * Ease the plot from the captured rect to the one just rendered. A no-op when
 * nothing moved. Called by applyAxisTransition, after the tick transitions,
 * with the set of nodes those already drive, and by applyCircleTransition for
 * the circle charts that have no axes (pie, donut, polarArea, radialBar).
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{rect: PlotRect, shifts: Record<string, [number, number]>, ends?: Record<string, number[]>} | null | undefined} from
 * @param {{driven: Set<Element>, duration: number, ease: (t: number) => number}} opts
 */
export function transitionLayout(w, from, { driven, duration, ease }) {
  const gl = w.globals
  // A tween still running from an earlier update is finished outright first:
  // on the fast path it drives the very nodes read below, and their final
  // values have to be read as final, not mid-flight.
  if (gl.layoutTween) gl.layoutTween.finish()

  const graphical = w.dom.elGraphical?.node
  if (!from || !from.rect || !graphical) return
  const l = w.layout
  /** @type {PlotRect} */
  const to = {
    x: l.translateX ?? 0,
    y: l.translateY ?? 0,
    w: l.gridWidth,
    h: l.gridHeight,
  }
  const r0 = from.rect
  const sane = (/** @type {PlotRect} */ r) =>
    [r.x, r.y, r.w, r.h].every(Number.isFinite) && r.w > 0 && r.h > 0
  if (!sane(to) || !sane(r0)) return

  const root = w.dom.baseEl

  /** @type {Array<(R: PlotRect, e: number) => void>} */
  const writers = []
  /** @type {Array<() => void>} */
  const finals = []
  let travel = Math.max(
    Math.abs(r0.x - to.x),
    Math.abs(r0.y - to.y),
    Math.abs(r0.w - to.w),
    Math.abs(r0.h - to.h),
  )

  /**
   * Drive numeric attributes from their rendered (final) values.
   * @param {Element} el
   * @param {string[]} attrs
   * @param {(v: number, R: PlotRect, e: number, k: number) => number} map
   */
  const drive = (el, attrs, map) => {
    const raw = attrs.map((a) => el.getAttribute(a))
    const fin = raw.map((v) => parseFloat(v ?? ''))
    if (!fin.every(Number.isFinite)) return
    writers.push((R, e) =>
      attrs.forEach((a, k) => el.setAttribute(a, String(map(fin[k], R, e, k)))),
    )
    finals.push(() =>
      attrs.forEach((a, k) => el.setAttribute(a, /** @type {string} */ (raw[k]))),
    )
  }

  /**
   * Drive attributes from their captured values to their rendered ones, or by
   * `fallback` when nothing was captured.
   * @param {Element} el
   * @param {string[]} attrs
   * @param {number[] | undefined} was
   * @param {(v: number, R: PlotRect) => number} fallback
   */
  const easeFrom = (el, attrs, was, fallback) => {
    if (!was) return drive(el, attrs, fallback)
    attrs.forEach((a, k) => {
      const v = parseFloat(el.getAttribute(a) || '')
      if (Number.isFinite(v)) travel = Math.max(travel, Math.abs(v - was[k]))
    })
    drive(el, attrs, (v, _, e, k) => was[k] + (v - was[k]) * e)
  }
  const ends = from.ends || {}

  /**
   * Put a translate in front of the element's own transform, eased to none.
   * @param {Element} el
   * @param {(R: PlotRect) => [number, number]} offset
   */
  const nudge = (el, offset) => {
    const base = el.getAttribute('transform')
    writers.push((R) => {
      const [dx, dy] = offset(R)
      el.setAttribute('transform', `translate(${dx}, ${dy}) ${base || ''}`.trim())
    })
    finals.push(() => {
      if (base) el.setAttribute('transform', base)
      else el.removeAttribute('transform')
    })
  }

  /**
   * Tween a group's own translate between its captured and rendered value.
   * @param {Element} el
   * @param {[number, number] | undefined} was
   */
  const slide = (el, was) => {
    const now = readTranslate(el)
    if (!was || !now) return
    const d = Math.max(Math.abs(was[0] - now[0]), Math.abs(was[1] - now[1]))
    if (d < 0.5) return
    travel = Math.max(travel, d)
    const base = el.getAttribute('transform')
    writers.push((_, e) => {
      const x = was[0] + (now[0] - was[0]) * e
      const y = was[1] + (now[1] - was[1]) * e
      el.setAttribute('transform', `translate(${x}, ${y})`)
    })
    finals.push(() => {
      if (base) el.setAttribute('transform', base)
      else el.removeAttribute('transform')
    })
  }

  // Plot-local maps from the rendered rect to the in-flight one. Lines and
  // bands spanning the plot scale with it; whatever hangs off its bottom edge
  // (the x axis, its ticks) moves with that edge.
  const sx = (/** @type {number} */ v, /** @type {PlotRect} */ R) => (v * R.w) / to.w
  const sy = (/** @type {number} */ v, /** @type {PlotRect} */ R) => (v * R.h) / to.h
  const dW = (/** @type {PlotRect} */ R) => R.w - to.w
  const dH = (/** @type {PlotRect} */ R) => R.h - to.h

  // The graphical area itself.
  writers.push((R) => graphical.setAttribute('transform', `translate(${R.x}, ${R.y})`))
  const graphicalBase = graphical.getAttribute('transform')
  finals.push(() => {
    if (graphicalBase) graphical.setAttribute('transform', graphicalBase)
  })

  // Clip rects: the plot plus a margin. Without a capture, the margin is
  // taken as fixed and the rect grows by the difference.
  ;[w.dom.elGridRect, w.dom.elGridRectBar, w.dom.elGridRectMarker].forEach((r, k) => {
    const el = r?.node
    if (!el) return
    const was = ends[`clip${k}`]
    if (was) easeFrom(el, ['x', 'y', 'width', 'height'], was, (v) => v)
    else {
      drive(el, ['width'], (v, R) => v + dW(R))
      drive(el, ['height'], (v, R) => v + dH(R))
    }
  })

  // Grid lines, bands and borders. A line's ends ease between the captured
  // and the rendered ones (they reach past the plot by a padding of their
  // own); its position scales with the plot, unless a tick transition owns it
  // (y of a horizontal line, x of a vertical one).
  graphical
    .querySelectorAll(
      '.apexcharts-grid line:not(.apexcharts-tick-ghost), .apexcharts-grid-borders line',
    )
    .forEach((/** @type {Element} */ line) => {
      const horizontal = line.getAttribute('y1') === line.getAttribute('y2')
      const vertical = line.getAttribute('x1') === line.getAttribute('x2')
      const owned = driven.has(line)
      const k = lineGroup(line)
      if (horizontal) easeFrom(line, ['x1', 'x2'], ends[`h:${k}`], sx)
      else if (!owned) drive(line, ['x1', 'x2'], sx)
      if (vertical) easeFrom(line, ['y1', 'y2'], ends[`v:${k}`], sy)
      else if (!owned) drive(line, ['y1', 'y2'], sy)
    })
  graphical.querySelectorAll('.apexcharts-grid rect').forEach((/** @type {Element} */ rect) => {
    const row = rect.classList.contains('apexcharts-grid-row')
    const col = rect.classList.contains('apexcharts-grid-column')
    if (row) easeFrom(rect, ['x', 'width'], ends.row, sx)
    else drive(rect, ['x', 'width'], sx)
    if (col) easeFrom(rect, ['y', 'height'], ends.col, sy)
    else drive(rect, ['y', 'height'], sy)
  })

  // The x axis hangs off the plot's bottom edge (or sits on its top).
  const bottom = w.config.xaxis.position !== 'top'
  graphical.querySelectorAll('.apexcharts-xaxis-tick').forEach((/** @type {Element} */ tick) => {
    drive(tick, ['x1', 'x2'], sx)
    if (bottom) drive(tick, ['y1', 'y2'], (v, R) => v + dH(R))
  })
  graphical.querySelectorAll('.apexcharts-xaxis').forEach((/** @type {Element} */ g) => {
    // A radar's category labels sit around its circle, not on the plot's
    // edge: they ride the circle's own transform (CircleTransition).
    if (g.closest('.apexcharts-radar-series')) return
    if (bottom) nudge(g, (R) => [0, dH(R)])
    g.querySelectorAll(':scope > line').forEach((/** @type {Element} */ line) =>
      easeFrom(line, ['x1', 'x2'], ends.xline, sx),
    )
    g.querySelectorAll(':scope > .apexcharts-xaxis-title').forEach((/** @type {Element} */ t) =>
      nudge(t, (R) => [dW(R) / 2, 0]),
    )
  })

  // A horizontal bar chart's category axis on the right sits at the plot's
  // right edge: its labels and title are offset by the plot width.
  if (gl.isBarHorizontal && w.config.yaxis[0]?.opposite) {
    graphical
      .querySelectorAll(
        '.apexcharts-xaxis-inversed-texts-g, .apexcharts-xaxis-title-inversed',
      )
      .forEach((/** @type {Element} */ g) => nudge(g, (R) => [dW(R), 0]))
  }

  // Y axes: each group slides between its old and new offset, so its labels
  // keep their distance to the plot edge. (Not the labels group inside it:
  // that one is offset by the labels' own width, which changes with their
  // text, and the text is already the new one.) Lines and the title follow
  // the plot's vertical extent. Normal y axes live on the root (y in chart
  // space); a horizontal bar chart's live inside the plot (y plot-local).
  root.querySelectorAll('.apexcharts-yaxis[rel]').forEach((g) => {
    slide(g, from.shifts[`g${g.getAttribute('rel')}`])
    const local = !!g.closest('.apexcharts-graphical')
    /** @type {(v: number, R: PlotRect) => number} */
    const mapY = local ? sy : (v, R) => R.y + ((v - to.y) * R.h) / to.h
    g.querySelectorAll(':scope > line').forEach((line) =>
      drive(line, ['y1', 'y2'], mapY),
    )
    g.querySelectorAll(':scope > .apexcharts-yaxis-title').forEach((t) =>
      nudge(t, (R) => [0, (local ? 0 : R.y - to.y) + dH(R) / 2]),
    )
  })

  if (travel < 0.5) return

  const lerp = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ e) =>
    a + (b - a) * e
  // A gesture that acts on a position lands the tween first (landOnGesture).
  let unlisten = () => {}

  const token = {
    graphical,
    rect: { ...r0 },
    done: false,
    finish() {
      if (token.done) return
      token.done = true
      unlisten()
      finals.forEach((f) => f())
      if (gl.layoutTween === token) gl.layoutTween = null
    },
  }
  /** @param {number} e */
  const paint = (e) => {
    const R = {
      x: lerp(r0.x, to.x, e),
      y: lerp(r0.y, to.y, e),
      w: lerp(r0.w, to.w, e),
      h: lerp(r0.h, to.h, e),
    }
    token.rect = R
    writers.forEach((fn) => fn(R, e))
  }

  gl.layoutTween = token
  unlisten = landOnGesture(w, () => token.finish())
  paint(0)
  const startAt = performance.now()
  /** @param {number} now */
  const step = (now) => {
    if (token.done) return
    if (gl.isDestroyed || w.dom.elGraphical?.node !== graphical) {
      // Replaced by a newer render: nothing left on screen to finish. (A
      // chart only detached for a while, a hidden tab or a re-parented
      // widget, keeps the same graphical group and runs on.)
      token.done = true
      unlisten()
      if (gl.layoutTween === token) gl.layoutTween = null
      return
    }
    const raw = Math.max(0, Math.min(1, (now - startAt) / duration))
    if (raw < 1) {
      paint(ease(raw))
      BrowserAPIs.requestAnimationFrame(step)
    } else {
      token.finish()
    }
  }
  BrowserAPIs.requestAnimationFrame(step)
}
