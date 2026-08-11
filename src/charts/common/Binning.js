// @ts-check
/**
 * Histogram binning.
 *
 * Pure math: raw observations in, bin edges and counts out. No DOM, no chart
 * state, no config object, so it is testable on its own and safe under SSR.
 *
 * A histogram is the one aggregate mark that knows exactly which rows it
 * stands for, because the binning here is what aggregated them. `rowsForBin`
 * recovers those rows on demand from the same (values, edges) pair the render
 * used, so nothing has to be retained per bar.
 *
 * @module charts/common/Binning
 */

/**
 * Upper bound on bins. A degenerate binWidth (a stray 1e-9, a range spanning
 * timestamps) would otherwise ask for millions of bars and hang the render.
 */
const MAX_BINS = 1000

/**
 * @typedef {Object} Binning
 * @property {number[]} edges - bin boundaries, length = binCount + 1
 * @property {number} binWidth - uniform width (edges are evenly spaced)
 * @property {string} rule - the rule that chose the width ('fd', 'sturges', ...)
 * @property {boolean} capped - true when MAX_BINS clamped the requested count
 */

/**
 * Quantile of an ascending-sorted array (linear interpolation between ranks,
 * the same definition numpy and R type 7 use).
 * @param {number[]} sorted
 * @param {number} q - 0..1
 * @returns {number}
 */
export function quantileSorted(sorted, q) {
  const n = sorted.length
  if (n === 0) return NaN
  if (n === 1) return sorted[0]
  const pos = (n - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/**
 * Population standard deviation.
 * @param {number[]} values
 * @returns {number}
 */
function stdDev(values) {
  const n = values.length
  if (n < 2) return 0
  let sum = 0
  for (let i = 0; i < n; i++) sum += values[i]
  const mean = sum / n
  let acc = 0
  for (let i = 0; i < n; i++) {
    const d = values[i] - mean
    acc += d * d
  }
  return Math.sqrt(acc / n)
}

/**
 * Bin width suggested by a named rule.
 *
 * - `sturges` : span / (log2(n) + 1). Assumes roughly normal data; under-bins
 *   large samples but never produces a silly count.
 * - `rice`    : span / (2 * n^(1/3)). A simple, slightly more generous count.
 * - `sqrt`    : span / sqrt(n). The spreadsheet rule; included because people
 *   expect it.
 * - `scott`   : 3.49 * sd * n^(-1/3). Optimal for normal data.
 * - `fd`      : 2 * IQR * n^(-1/3) (Freedman-Diaconis). Robust to outliers,
 *   which is why it is the usual default, but it collapses to 0 when more than
 *   half the values are identical.
 * - `auto`    : the narrower of `fd` and `sturges`, falling back to `sturges`
 *   when the IQR is 0. Same compromise numpy makes: FD's robustness with a
 *   guard against its degenerate case.
 *
 * @param {number[]} sorted - ascending, finite
 * @param {number} span - hi - lo (> 0)
 * @param {string} rule
 * @returns {{ width: number, rule: string }}
 */
export function widthForRule(sorted, span, rule) {
  const n = sorted.length
  const byCount = (/** @type {number} */ count) =>
    span / Math.max(1, Math.ceil(count))

  switch (rule) {
    case 'sqrt':
      return { width: byCount(Math.sqrt(n)), rule: 'sqrt' }
    case 'rice':
      return { width: byCount(2 * Math.cbrt(n)), rule: 'rice' }
    case 'scott': {
      const sd = stdDev(sorted)
      if (sd > 0) return { width: 3.49 * sd * Math.pow(n, -1 / 3), rule: 'scott' }
      return { width: byCount(Math.log2(n) + 1), rule: 'sturges' }
    }
    case 'fd': {
      const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25)
      if (iqr > 0) return { width: 2 * iqr * Math.pow(n, -1 / 3), rule: 'fd' }
      return { width: byCount(Math.log2(n) + 1), rule: 'sturges' }
    }
    case 'auto': {
      const sturges = byCount(Math.log2(n) + 1)
      const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25)
      if (iqr <= 0) return { width: sturges, rule: 'sturges' }
      const fd = 2 * iqr * Math.pow(n, -1 / 3)
      return fd < sturges ? { width: fd, rule: 'fd' } : { width: sturges, rule: 'sturges' }
    }
    case 'sturges':
    default:
      return { width: byCount(Math.log2(n) + 1), rule: 'sturges' }
  }
}

/**
 * Choose bin edges for a set of observations.
 *
 * Precedence: explicit `binWidth` > explicit bin count > named rule. `range`
 * frames the axis independently of the data, so several histograms can share
 * one scale.
 *
 * @param {number[]} values - finite observations (any order)
 * @param {Object} [opts]
 * @param {string|number} [opts.bins] - a rule name, or a fixed bin count
 * @param {number} [opts.binWidth] - explicit width, wins over `bins`
 * @param {number[]} [opts.range] - [lo, hi] override for the binned extent
 * @returns {Binning|null} null when there is nothing to bin
 */
export function computeBinning(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null

  const sorted = values.slice().sort((a, b) => a - b)
  let lo = sorted[0]
  let hi = sorted[sorted.length - 1]

  const range = opts.range
  if (Array.isArray(range) && range.length === 2) {
    const rLo = Number(range[0])
    const rHi = Number(range[1])
    if (isFinite(rLo) && isFinite(rHi) && rHi > rLo) {
      lo = rLo
      hi = rHi
    }
  }

  // Every observation identical (or a single point): one bin centred on it,
  // wide enough to draw. Without this the span is 0 and every rule divides by
  // zero.
  if (!(hi > lo)) {
    const pad = Math.abs(lo) > 0 ? Math.abs(lo) * 0.05 : 0.5
    return {
      edges: [lo - pad, lo + pad],
      binWidth: pad * 2,
      rule: 'single',
      capped: false,
    }
  }

  const span = hi - lo
  let width
  let rule

  if (typeof opts.binWidth === 'number' && opts.binWidth > 0) {
    width = opts.binWidth
    rule = 'binWidth'
  } else if (typeof opts.bins === 'number' && opts.bins >= 1) {
    width = span / Math.floor(opts.bins)
    rule = 'count'
  } else {
    const chosen = widthForRule(
      sorted,
      span,
      typeof opts.bins === 'string' ? opts.bins : 'auto',
    )
    width = chosen.width
    rule = chosen.rule
  }

  if (!isFinite(width) || width <= 0) width = span

  let count = Math.ceil(span / width)
  if (!isFinite(count) || count < 1) count = 1
  let capped = false
  if (count > MAX_BINS) {
    count = MAX_BINS
    width = span / count
    capped = true
  }

  // Rebuild the width from the final count so the edges tile [lo, hi] exactly:
  // a rule-derived width usually leaves a partial last bin, and a bar half the
  // width of its neighbours reads as a data feature rather than a rounding
  // artifact.
  width = span / count

  const edges = new Array(count + 1)
  for (let k = 0; k <= count; k++) edges[k] = lo + k * width
  // Guard the last edge against float drift so the maximum observation always
  // lands inside the final bin.
  edges[count] = Math.max(edges[count], hi)

  return { edges, binWidth: width, rule, capped }
}

/**
 * Index of the bin containing `v`, or -1 when it falls outside the edges.
 * Bins are half-open [lo, hi) except the last, which includes its upper edge.
 *
 * @param {number} v
 * @param {number[]} edges
 * @returns {number}
 */
export function binIndexOf(v, edges) {
  const last = edges.length - 1
  if (!(v >= edges[0]) || v > edges[last]) return -1
  if (v === edges[last]) return last - 1

  // Uniform edges: arithmetic beats a search, which matters at 100k+ points.
  const width = (edges[last] - edges[0]) / last
  if (width > 0) {
    let k = Math.floor((v - edges[0]) / width)
    if (k < 0) k = 0
    if (k > last - 1) k = last - 1
    // Correct for float drift at a boundary rather than trusting the divide.
    if (v < edges[k]) k--
    else if (v >= edges[k + 1]) k++
    if (k < 0 || k > last - 1) return -1
    return k
  }

  let lo = 0
  let hi = last - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (v < edges[mid]) hi = mid - 1
    else if (v >= edges[mid + 1]) lo = mid + 1
    else return mid
  }
  return -1
}

/**
 * Count observations per bin.
 * @param {number[]} values
 * @param {number[]} edges
 * @returns {number[]}
 */
export function binCounts(values, edges) {
  const counts = new Array(Math.max(0, edges.length - 1)).fill(0)
  for (let i = 0; i < values.length; i++) {
    const k = binIndexOf(values[i], edges)
    if (k >= 0) counts[k]++
  }
  return counts
}

/**
 * The observations a given bar aggregates.
 *
 * This is the row source an object/aggregate transition needs: a histogram bar
 * can name its rows exactly, without any of them being retained at render
 * time. Recomputed on demand from the same inputs the binning used.
 *
 * @param {number[]} values
 * @param {number[]} edges
 * @param {number} k - bin index
 * @returns {number[]}
 */
export function rowsForBin(values, edges, k) {
  /** @type {number[]} */
  const out = []
  if (k < 0 || k >= edges.length - 1) return out
  for (let i = 0; i < values.length; i++) {
    if (binIndexOf(values[i], edges) === k) out.push(values[i])
  }
  return out
}

/**
 * Apply cumulative accumulation and the y normalization to raw counts.
 *
 * @param {number[]} counts
 * @param {Object} [opts]
 * @param {string} [opts.normalize] - 'count' | 'relative' | 'density'
 * @param {boolean} [opts.cumulative]
 * @param {number} [opts.binWidth]
 * @returns {number[]}
 */
export function normalizeCounts(counts, opts = {}) {
  let out = counts.slice()

  if (opts.cumulative) {
    let acc = 0
    out = out.map((c) => (acc += c))
  }

  const total = counts.reduce((a, b) => a + b, 0)
  if (total <= 0) return out

  if (opts.normalize === 'relative') {
    return out.map((c) => (c / total) * 100)
  }
  if (opts.normalize === 'density') {
    const w = opts.binWidth
    if (typeof w === 'number' && w > 0) return out.map((c) => c / (total * w))
  }
  return out
}
