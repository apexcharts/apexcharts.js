// @ts-check
/**
 * Histogram binning, and the statistics the aggregate marks are drawn from.
 *
 * Pure math: raw observations in, bin edges and counts out. No DOM, no chart
 * state, no config object, so it is testable on its own and safe under SSR.
 *
 * A histogram is the one aggregate mark that knows exactly which rows it
 * stands for, because the binning is what aggregated them. `rowsForBin`
 * recovers those rows on demand from the same (values, edges) pair the render
 * used, so nothing has to be retained per bar.
 *
 * ## The binning itself lives in apex-commons
 *
 * `quantileSorted`, `computeBinning`, `binIndexOf` and `binCounts` are
 * re-exported from `apex-commons` rather than implemented here. They were
 * implemented here once, and the same four were implemented again in that
 * package when apex-analyst needed to describe a distribution: two copies of a
 * rule set that decides how many bars a reader sees.
 *
 * Two copies of a number is a bug waiting for one of them to be improved. A
 * histogram this library draws and a distribution that plugin reports are
 * routinely computed over the same column of the same data, and a reader
 * looking at both has every reason to expect the same bins. Nothing forced
 * them apart yet, and nothing would have announced it if something had.
 *
 * This is a re-export rather than a move because the import site is not worth
 * churning: `features/stats.js` and `trellis/TrellisFrames.js` ask this module
 * for binning, which is where a reader of those files would look for it.
 *
 * The 200-odd lines that went are not reproduced anywhere in this repository
 * any more, deliberately. Before they were deleted the two implementations
 * were run against each other over 212,197 comparisons (every rule, every
 * option shape, all-identical samples, a collapsed IQR, timestamps, a capped
 * span, and values sitting exactly on an edge and a float either side of it)
 * and agreed on all of them.
 *
 * @module charts/common/Stats
 */
import Utils from '../../utils/Utils'
// Imported as well as re-exported: the functions below this line use them, and
// a re-export does not put a name in this module's own scope.
import { binIndexOf, quantileSorted } from 'apex-commons'

export { quantileSorted, computeBinning, binIndexOf, binCounts } from 'apex-commons'

/**
 * Population standard deviation, for the kernel bandwidth below.
 *
 * This one stays. apex-commons has the same twelve lines, but keeps them
 * module-private, and reaching them would mean making it public API in that
 * package to save a textbook formula here. The duplication that mattered was
 * the RULE SET: which rule picks the bin width, and where the edges fall,
 * because two products can disagree about that and show a reader a different
 * number of bars for the same column. A standard deviation has one definition
 * and nothing to disagree about.
 *
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
 * Every bar's rows at once, as one bucket per bin in bin order.
 *
 * The same answer `rowsForBin` gives, in a single pass. Asking that function
 * for each bin in turn re-walks the whole sample every time, which is O(n·bins)
 * and turns a 50k-observation, 100-bin explode into five million comparisons on
 * the click. Bins with no observations keep their (empty) slot: the caller maps
 * bucket k onto bar k positionally, so a compacted array would silently shift
 * every bar after the first gap.
 *
 * @param {number[]} values
 * @param {number[]} edges
 * @returns {number[][]} length = edges.length - 1
 */
export function rowsByBin(values, edges) {
  const n = Math.max(0, edges.length - 1)
  /** @type {number[][]} */
  const buckets = new Array(n)
  for (let k = 0; k < n; k++) buckets[k] = []
  for (let i = 0; i < values.length; i++) {
    const k = binIndexOf(values[i], edges)
    if (k >= 0) buckets[k].push(values[i])
  }
  return buckets
}

/**
 * Five-number summary of a sample, in the order boxPlot draws it.
 *
 * Quartiles use linear interpolation between ranks (R type 7 / numpy default),
 * so a sample of 4 and a sample of 4000 are summarised the same way.
 *
 * Whiskers:
 *  - `minmax`  : the extremes. Nothing is hidden, which matters because the
 *    chart has no separate outlier mark unless observations are also drawn.
 *  - `tukey`   : the furthest observations inside q1 - 1.5*IQR and
 *    q3 + 1.5*IQR, the convention most statistics packages use. Anything
 *    beyond the fence is outside the whisker, so pair it with
 *    `plotOptions.boxPlot.points.show` or those points become invisible.
 *
 * @param {number[]} values - finite observations (any order)
 * @param {Object} [opts]
 * @param {string} [opts.whiskers] - 'minmax' (default) | 'tukey'
 * @returns {{ summary: number[], outliers: number[], iqr: number } | null}
 */
export function fiveNumberSummary(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null
  const sorted = values.slice().sort((a, b) => a - b)

  const q1 = quantileSorted(sorted, 0.25)
  const median = quantileSorted(sorted, 0.5)
  const q3 = quantileSorted(sorted, 0.75)
  const iqr = q3 - q1

  let lo = sorted[0]
  let hi = sorted[sorted.length - 1]
  /** @type {number[]} */
  let outliers = []

  if (opts.whiskers === 'tukey' && iqr > 0) {
    const loFence = q1 - 1.5 * iqr
    const hiFence = q3 + 1.5 * iqr
    let i = 0
    while (i < sorted.length && sorted[i] < loFence) i++
    let j = sorted.length - 1
    while (j >= 0 && sorted[j] > hiFence) j--
    if (i <= j) {
      lo = sorted[i]
      hi = sorted[j]
      outliers = sorted.slice(0, i).concat(sorted.slice(j + 1))
    }
  }

  return { summary: [lo, q1, median, q3, hi], outliers, iqr }
}

/**
 * Kernel density estimate of a sample, as the `[value, weight]` pairs a violin
 * draws.
 *
 * Gaussian kernel; bandwidth from Silverman's rule of thumb, which uses the
 * smaller of the standard deviation and a scaled IQR so one distant outlier
 * cannot smear the whole curve flat. The estimate is evaluated on an evenly
 * spaced grid padded by two bandwidths, so the curve reaches zero instead of
 * being cut off mid-slope.
 *
 * @param {number[]} values - finite observations (any order)
 * @param {Object} [opts]
 * @param {number} [opts.bandwidth] - explicit bandwidth, overrides the rule
 * @param {number} [opts.resolution] - grid points (default 64)
 * @returns {{ density: Array<[number, number]>, bandwidth: number } | null}
 */
export function kernelDensity(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null
  const sorted = values.slice().sort((a, b) => a - b)
  const n = sorted.length

  let h = opts.bandwidth
  if (!(typeof h === 'number' && h > 0)) {
    const sd = stdDev(sorted)
    const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25)
    const spread = iqr > 0 ? Math.min(sd, iqr / 1.349) : sd
    h = 0.9 * spread * Math.pow(n, -1 / 5)
  }
  if (!isFinite(h) || h <= 0) {
    // Every observation identical: no spread to estimate. A hairline spike at
    // the value is the honest picture.
    const v = sorted[0]
    const eps = Math.abs(v) > 0 ? Math.abs(v) * 1e-3 : 1e-3
    return {
      density: [
        [v - eps, 0],
        [v, 1],
        [v + eps, 0],
      ],
      bandwidth: eps,
    }
  }

  const steps = Math.max(8, Math.floor(opts.resolution || 64))
  const lo = sorted[0] - 2 * h
  const hi = sorted[n - 1] + 2 * h
  const step = (hi - lo) / (steps - 1)
  const norm = 1 / (n * h * Math.sqrt(2 * Math.PI))

  /** @type {Array<[number, number]>} */
  const density = []
  for (let g = 0; g < steps; g++) {
    const x = lo + g * step
    let sum = 0
    for (let i = 0; i < n; i++) {
      const z = (x - sorted[i]) / h
      sum += Math.exp(-0.5 * z * z)
    }
    density.push([x, sum * norm])
  }
  return { density, bandwidth: h }
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

/**
 * The observations attached to one boxPlot / violin / raincloud datum, or null
 * when the datum does not carry a sample.
 *
 * `points` is the field these types already use for jitter dots, so a sample
 * lives in exactly one place whether the library summarises it or the user
 * pre-summarised it. Density-based types additionally accept a flat number
 * array as `y`, which is unambiguous there because a density profile is an
 * array of PAIRS.
 *
 * Shared by the stats feature and the raincloud feature; lives here (pure,
 * side-effect free) so neither add-on has to import the other's registrations.
 *
 * @param {any} d - one datum
 * @param {boolean} allowFlatY
 * @returns {number[]|null}
 */
export function observationsOf(d, allowFlatY) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null

  /** @type {any} */
  let raw = null
  if (Array.isArray(d.points)) raw = d.points
  else if (Array.isArray(d.y?.points)) raw = d.y.points
  else if (allowFlatY && Array.isArray(d.y) && typeof d.y[0] === 'number') {
    raw = d.y
  }
  if (!raw) return null

  /** @type {number[]} */
  const out = []
  for (let i = 0; i < raw.length; i++) {
    const v = Utils.parseNumber(raw[i])
    if (v !== null && isFinite(v)) out.push(v)
  }
  return out.length ? out : null
}
