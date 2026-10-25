// @ts-check
/**
 * Real-time streaming scroll support.
 *
 * A streaming line/area chart is fed either by appendData() (growing array
 * under a fixed `xaxis.range`) or by updateSeries() with a rolling window
 * (fixed-length array, shifted by one each tick). Both are "windowed
 * continuations" of the previous render: most points survive, the x-domain
 * slides forward at constant width.
 *
 * The default data-change animation morphs the previous rendered path into the
 * new one command-by-command. For a shifted same-length window that pairs
 * command i with a DIFFERENT datum before/after: both at the same pixel-x -
 * so only y interpolates and the line "warps in place" instead of scrolling.
 *
 * The fix implemented here: when an update is detected as a windowed
 * continuation, the morph's pathFrom is not the captured previous path but the
 * NEW path re-projected into the PREVIOUS frame's pixel space. Both axis
 * mappings are affine in pixel space (linear, datetime, log: the same value
 * transform applies on both sides), so the re-projection is a per-axis affine
 * map derived exactly from two anchor points that were rendered in both
 * frames. The per-command morph then becomes the pure axis slide: every
 * surviving point translates, dropped points exit left, appended points enter
 * from the right (clipped by the grid mask). Combined with a linear easing
 * (see Animations.morphSVG) the window scrolls at constant velocity.
 *
 * Also hosts the `chart.streaming` memory bound: appendData() trims each
 * series to `maxPoints`, or to the `xaxis.range` window (plus a small
 * off-screen runway so exiting segments slide out instead of popping).
 *
 * @module modules/animations/StreamScroll
 */
import { mapPathAffine } from '../../svg/PathAffine'

/**
 * @typedef {Object} StreamScrollTransform
 * @property {number} ax - x-pixel scale (≈1 for a pure slide)
 * @property {number} bx - x-pixel offset (the slide distance)
 * @property {number} ay - y-pixel scale
 * @property {number} by - y-pixel offset
 */

/**
 * Snapshot the parsed data rows and rendered pixel positions of the current
 * (about-to-be-replaced) frame. Called from Series.getPreviousPaths(), i.e.
 * before parseData() rebuilds the rows for the incoming update. Row arrays are
 * captured by reference: every parse/render builds fresh arrays, the old ones
 * are never mutated in place (same lifetime contract as `previousPaths`).
 *
 * @param {import('../../types/internal').ChartStateW} w
 */
export function captureStreamFrame(w) {
  const gl = w.globals
  // Cleared once per update, set by detectStreamScroll below. Post-render
  // consumers read it to know a scroll is driving this frame, see the axis
  // transition in fastUpdate, which stands aside for one.
  gl.streamScrolled = false
  if (
    !gl.axisCharts ||
    !w.seriesData ||
    !Array.isArray(w.seriesData.series) ||
    w.seriesData.series.length === 0
  ) {
    gl.prevStreamFrame = null
    return
  }
  // Marker radii of the outgoing render, keyed [realIndex][j]. Bubble z
  // updates change radius, not just position, so the marker ride scales
  // size too. Circle markers carry r; path-shaped markers (bubbles) bake
  // the radius into the path data but expose it as default-marker-size.
  // The DOM read is skipped in SSR (no updates happen there anyway).
  /** @type {number[][]} */
  const rPixels = []
  if (w.dom?.baseEl?.querySelectorAll) {
    w.dom.baseEl
      .querySelectorAll('.apexcharts-marker')
      .forEach((/** @type {Element} */ node) => {
        const ri = parseInt(node.getAttribute('index') ?? '', 10)
        const j = parseInt(
          node.getAttribute('j') ?? node.getAttribute('rel') ?? '',
          10,
        )
        const r = parseFloat(
          node.getAttribute('r') ??
            node.getAttribute('default-marker-size') ??
            '',
        )
        if (isFinite(ri) && isFinite(j) && isFinite(r)) {
          ;(rPixels[ri] = rPixels[ri] || [])[j] = r
        }
      })
  }

  // Captured for every axis chart (not just numeric x): the same frame also
  // feeds the variable-length transition layer (LengthTransition /
  // PathReconcile), which joins old and new datums by category label on
  // category axes (where seriesX is empty). detectStreamScroll() still
  // requires numeric x rows itself.
  gl.prevStreamFrame = {
    seriesX: (w.seriesData.seriesX || []).slice(),
    seriesY: w.seriesData.series.slice(),
    xPixels: (gl.seriesXvalues || []).slice(),
    yPixels: (gl.seriesYvalues || []).slice(),
    rPixels,
    labels: (gl.labels || []).slice(),
    isXNumeric: !!w.axisFlags?.isXNumeric,
  }
}

/**
 * Decide whether the current data-change render is a windowed continuation of
 * the captured previous frame for series `realIndex`, and if so return the
 * previous←current pixel-space affine transform.
 *
 * Detection requires, per series:
 *  - the first new x value exists in the old x row at some shift k ≥ 0;
 *  - every overlapping (x, y) pair matches exactly (a shifted window or a
 *    plain append: never a coincidental replace);
 *  - the window actually moved: points were dropped (k > 0) or appended;
 *  - the x scale is preserved (|ax−1| small: a slide, not a squeeze; plain
 *    unbounded appends stretch the domain and keep the default morph) and the
 *    slide is non-zero (fixed min/max frames keep the default morph);
 *  - a third mid-window point confirms the affine fit (guards stacked series
 *    whose baseline changed non-uniformly, and any other non-affine case).
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {number} realIndex
 * @param {(number|null)[]} newXPixels - pixel x of each new datum (xArrj)
 * @param {(number|null)[]} newYPixels - pixel y of each new datum (yArrj)
 * @returns {StreamScrollTransform | null}
 */
export function detectStreamScroll(w, realIndex, newXPixels, newYPixels) {
  const gl = w.globals
  const frame = gl.prevStreamFrame
  if (!frame || !gl.dataChanged || !w.axisFlags?.isXNumeric) return null

  const oldX = frame.seriesX[realIndex]
  const oldY = frame.seriesY[realIndex]
  const newX = w.seriesData.seriesX[realIndex]
  const newY = w.seriesData.series[realIndex]
  if (!oldX || !oldY || !newX || !newY) return null
  if (oldX.length < 3 || newX.length < 3) return null

  // Locate the shift: where does the new window start inside the old one?
  let k = -1
  for (let i = 0; i < oldX.length; i++) {
    if (oldX[i] === newX[0]) {
      k = i
      break
    }
  }
  if (k === -1) return null

  const overlap = Math.min(oldX.length - k, newX.length)
  if (overlap < 2) return null

  // Continuation must move the window: dropped points and/or an appended tail.
  const appended = newX.length - overlap
  if (k === 0 && appended === 0) return null

  // Every surviving point must be identical in x and y.
  for (let i = 0; i < overlap; i++) {
    if (oldX[k + i] !== newX[i]) return null
    const oy = oldY[k + i]
    const ny = newY[i]
    if (oy !== ny && !(oy == null && ny == null)) return null
  }

  const oldXP = frame.xPixels[realIndex]
  const oldYP = frame.yPixels[realIndex]
  if (!oldXP || !oldYP) return null

  // Anchor points: overlap indices rendered (non-null) in both frames.
  let a = -1
  let b = -1
  for (let i = 0; i < overlap; i++) {
    if (
      oldXP[k + i] == null ||
      oldYP[k + i] == null ||
      newXPixels[i] == null ||
      newYPixels[i] == null
    ) {
      continue
    }
    if (a === -1) a = i
    b = i
  }
  if (a === -1 || b <= a) return null

  const nxA = /** @type {number} */ (newXPixels[a])
  const nxB = /** @type {number} */ (newXPixels[b])
  const oxA = /** @type {number} */ (oldXP[k + a])
  const oxB = /** @type {number} */ (oldXP[k + b])
  if (Math.abs(nxB - nxA) < 1e-6) return null

  const ax = (oxB - oxA) / (nxB - nxA)
  const bx = oxA - ax * nxA
  // A scroll preserves the x scale. Plain appends without a range stretch the
  // domain (ax > 1) and keep today's morph; a truly static frame (bx ≈ 0)
  // has nothing to slide.
  if (!isFinite(ax) || !isFinite(bx)) return null
  if (Math.abs(ax - 1) > 0.02) return null
  if (Math.abs(bx) < 0.5) return null

  // y anchors: the pair with the largest pixel separation for a stable fit.
  let yLo = a
  let yHi = a
  for (let i = a; i <= b; i++) {
    const ny = newYPixels[i]
    if (ny == null || oldYP[k + i] == null) continue
    if (ny < /** @type {number} */ (newYPixels[yLo])) yLo = i
    if (ny > /** @type {number} */ (newYPixels[yHi])) yHi = i
  }
  let ay = 1
  let by = 0
  const nyLo = /** @type {number} */ (newYPixels[yLo])
  const nyHi = /** @type {number} */ (newYPixels[yHi])
  if (Math.abs(nyHi - nyLo) > 1e-6) {
    ay =
      (/** @type {number} */ (oldYP[k + yHi]) -
        /** @type {number} */ (oldYP[k + yLo])) /
      (nyHi - nyLo)
    by = /** @type {number} */ (oldYP[k + yLo]) - ay * nyLo
  } else {
    by = /** @type {number} */ (oldYP[k + yLo]) - nyLo
  }
  if (!isFinite(ay) || !isFinite(by) || ay < 0.2 || ay > 5) return null

  // Verify the fit on a third, mid-window point: if the old↔new pixel relation
  // is not affine for this series, morphing through it would misplace points.
  const m = Math.floor((a + b) / 2)
  if (m !== a && m !== b && newXPixels[m] != null && oldXP[k + m] != null) {
    const predX = ax * /** @type {number} */ (newXPixels[m]) + bx
    if (Math.abs(predX - /** @type {number} */ (oldXP[k + m])) > 1.5) {
      return null
    }
    if (newYPixels[m] != null && oldYP[k + m] != null) {
      const predY = ay * /** @type {number} */ (newYPixels[m]) + by
      if (Math.abs(predY - /** @type {number} */ (oldYP[k + m])) > 1.5) {
        return null
      }
    }
  }

  // Record that a scroll is driving this render (cleared by
  // captureStreamFrame at the top of the update).
  gl.streamScrolled = true

  return { ax, bx, ay, by }
}

/**
 * Apply the previous<-current affine transform to a rendered path string,
 * producing the morph's pathFrom (see mapPathAffine). Arcs keep their radii:
 * the scroll transform is close to identity in scale and only moves their
 * end point.
 *
 * @param {string} d
 * @param {StreamScrollTransform} t
 * @returns {string}
 */
export function projectPathToPrevFrame(d, t) {
  return mapPathAffine(d, t.ax, t.bx, t.ay, t.by)
}

/**
 * `chart.streaming` memory bound, applied by appendData() after pushing the
 * new points. Trims each series in place to:
 *   - the most recent `maxPoints` points when set, else
 *   - the `xaxis.range` window plus a two-point off-screen runway (so the
 *     exiting segment slides off the left edge instead of popping), when the
 *     x values are numeric/timestamps.
 *
 * @param {any[]} newSeries - config-shaped series array (mutated)
 * @param {import('../../types/internal').ChartStateW} w
 */
export function trimStreamingSeries(newSeries, w) {
  const cfg = w.config.chart.streaming
  if (!cfg || !cfg.enabled) return
  const maxPoints = cfg.maxPoints
  const range = w.config.xaxis.range

  // A datetime x may come as a Date or a date string, which the parser turns
  // into a timestamp; reading only numbers left those streams unbounded.
  const dt = w.config.xaxis.type === 'datetime'
  /** @param {any} p @returns {number | null} */
  const xOf = (p) => {
    const x = Array.isArray(p) ? p[0] : p && p.x
    const v = dt && x != null ? new Date(x).getTime() : x
    return typeof v === 'number' && v === v ? v : null
  }

  newSeries.forEach((s) => {
    const data = s?.data
    if (!Array.isArray(data) || data.length < 2) return

    if (typeof maxPoints === 'number' && maxPoints > 0) {
      if (data.length > maxPoints) s.data = data.slice(data.length - maxPoints)
      return
    }

    if (!range) return
    const lastX = xOf(data[data.length - 1])
    const firstX = xOf(data[0])
    if (lastX == null || firstX == null || lastX <= firstX) return
    const avgSpacing = (lastX - firstX) / (data.length - 1)
    const cutoff = lastX - range - 2 * avgSpacing
    let idx = 0
    while (idx < data.length && (xOf(data[idx]) ?? cutoff) < cutoff) idx++
    if (idx > 0) s.data = data.slice(idx)
  })
}
