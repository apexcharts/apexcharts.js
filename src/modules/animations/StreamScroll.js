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
  if (
    !gl.axisCharts ||
    !w.axisFlags?.isXNumeric ||
    !w.seriesData ||
    !Array.isArray(w.seriesData.seriesX) ||
    w.seriesData.seriesX.length === 0
  ) {
    gl.prevStreamFrame = null
    return
  }
  gl.prevStreamFrame = {
    seriesX: w.seriesData.seriesX.slice(),
    seriesY: w.seriesData.series.slice(),
    xPixels: (gl.seriesXvalues || []).slice(),
    yPixels: (gl.seriesYvalues || []).slice(),
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

  return { ax, bx, ay, by }
}

const NUM_RE = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi

/**
 * Apply the previous←current affine transform to a rendered path string,
 * producing the morph's pathFrom. Affine maps are exact for every command the
 * series builders emit (bezier curves are affine-invariant): M/L/T points,
 * C/S/Q control points, H (x only), V (y only). Arcs keep their radii: the
 * scroll transform is ≈identity in scale: and only move their endpoint.
 *
 * @param {string} d
 * @param {StreamScrollTransform} t
 * @returns {string}
 */
export function projectPathToPrevFrame(d, t) {
  const { ax, bx, ay, by } = t
  const out = []
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g
  let match
  while ((match = re.exec(d)) !== null) {
    const cmd = match[1].toUpperCase()
    const nums = (match[2].match(NUM_RE) || []).map(parseFloat)

    if (cmd === 'Z') {
      out.push('z')
      continue
    }
    if (cmd === 'H') {
      for (const x of nums) out.push(`H ${ax * x + bx}`)
      continue
    }
    if (cmd === 'V') {
      for (const y of nums) out.push(`V ${ay * y + by}`)
      continue
    }
    if (cmd === 'A') {
      for (let i = 0; i + 6 < nums.length; i += 7) {
        out.push(
          `A ${nums[i]} ${nums[i + 1]} ${nums[i + 2]} ${nums[i + 3]} ${nums[i + 4]} ${ax * nums[i + 5] + bx} ${ay * nums[i + 6] + by}`,
        )
      }
      continue
    }
    // M, L, T, C, S, Q: pure (x, y) coordinate lists.
    const coords = []
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push(`${ax * nums[i] + bx} ${ay * nums[i + 1] + by}`)
    }
    if (coords.length) out.push(`${cmd} ${coords.join(' ')}`)
  }
  return out.join(' ')
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

  /** @param {any} p @returns {number | null} */
  const xOf = (p) => {
    if (p == null) return null
    if (Array.isArray(p)) return typeof p[0] === 'number' ? p[0] : null
    if (typeof p === 'object') return typeof p.x === 'number' ? p.x : null
    return null
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
