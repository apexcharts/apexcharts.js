// @ts-check
/**
 * Streamgraph stacking.
 *
 * A streamgraph is a stacked area whose baseline is not the zero line but a
 * curve chosen to keep the bands as flat as possible, so the reader follows the
 * shape of the mix rather than the height of a total. That baseline is the only
 * thing a streamgraph adds to a stacked area, and it is pure arithmetic: pick an
 * order for the bands, pick a baseline, then accumulate.
 *
 * So there is no renderer here. `rangeArea` already draws a band between two
 * arbitrary per-x edges, correctly and with shared geometry, and a streamgraph
 * band IS such a band. The transform turns N ordinary series into N `[lo, hi]`
 * series and the range-area pathway draws them.
 *
 * The one invariant everything else rests on: band k's `hi` at column j is the
 * SAME number as the band above it has for `lo` at column j — not a rounded
 * copy, the same accumulator value. The curve interpolators are deterministic
 * and depend only on adjacent points, so identical inputs produce identical
 * geometry, and the bands meet with no hairline gap between them.
 *
 * @module modules/streamgraph/StreamData
 */
import Utils from '../../utils/Utils'
import { collapsedIndices, stashSeries } from '../helpers/RawStash'
import { withX, xKey } from '../helpers/XKey'

/** Baselines. `wiggle` is the classic streamgraph (Byron & Wattenberg, 2008). */
const OFFSETS = ['wiggle', 'silhouette', 'zero', 'expand']
/** Band orders, bottom to top. */
const ORDERS = ['inside-out', 'inverse', 'none']

/**
 * One input datum, read into the parts the stack needs.
 *
 * x is taken from the datum, then from `xaxis.categories`, then from the index,
 * so a streamgraph can be written in any shape ApexCharts accepts.
 *
 * @param {any} d
 * @param {number} j
 * @param {any[]|undefined} categories
 * @returns {{ x: any, y: any, rest: Record<string, any> }}
 */
function readDatum(d, j, categories) {
  const fallbackX =
    categories && categories[j] !== undefined ? categories[j] : j + 1

  if (d == null) return { x: fallbackX, y: null, rest: {} }
  if (Array.isArray(d)) {
    return { x: d[0] !== undefined ? d[0] : fallbackX, y: d[1], rest: {} }
  }
  if (typeof d === 'object') {
    return { x: d.x !== undefined ? d.x : fallbackX, y: d.y, rest: d }
  }
  return { x: fallbackX, y: d, rest: {} }
}

/**
 * Is this already the `y: [lo, hi]` form?
 *
 * parseData writes the transform's output back to `config.series`, so this is
 * the backstop for a lost raw stash: re-stacking already-stacked bands would
 * silently draw nonsense rather than fail.
 *
 * @param {any[]} data
 * @returns {boolean}
 */
function isPairShaped(data) {
  for (let j = 0; j < data.length; j++) {
    const d = data[j]
    const y = Array.isArray(d) ? d[1] : d && typeof d === 'object' ? d.y : d
    if (Array.isArray(y) && y.length === 2) return true
  }
  return false
}

/**
 * The column order, and each series' values keyed by column.
 *
 * Columns are joined on x, never on position. Two series written in different
 * orders, or one missing a period the others have, are both ordinary; an
 * ordinal join would stack a value onto the wrong column rather than failing,
 * and on a stacked chart that error propagates into every band above it. Same
 * rule the stacked line/area baselines follow (see `Line._stackKey`, #4886).
 *
 * A column a series never mentions contributes 0 to the stack, never
 * `undefined`: one NaN in the accumulator poisons every band above it for the
 * rest of the row.
 *
 * A series that is not a band (a typed combo series) joins nothing: its grid
 * stays empty, so it adds no column and nothing to any column.
 *
 * @param {any[]} raw
 * @param {any[]|undefined} categories
 * @param {boolean} datetime - key date strings by their epoch (see `xKey`)
 * @param {boolean[]} band - band[k] is false for a series left out of the stack
 * @returns {{ xs: any[], keys: any[], rows: Array<Record<string, any>>, grids: Array<Map<number, number>> }}
 */
function joinOnX(raw, categories, datetime, band) {
  /** @type {any[]} */
  const xs = []
  /** @type {any[]} */
  const keys = []
  /** @type {Array<Record<string, any>>} */
  const rows = []
  const seen = new Map()
  /** @type {Array<Map<number, number>>} */
  const grids = []

  for (let k = 0; k < raw.length; k++) {
    const data = band[k] && Array.isArray(raw[k]?.data) ? raw[k].data : []
    /** @type {Map<number, number>} */
    const grid = new Map()
    for (let j = 0; j < data.length; j++) {
      const { x, y, rest } = readDatum(data[j], j, categories)
      const key = xKey(x, datetime)
      if (!seen.has(key)) {
        seen.set(key, xs.length)
        xs.push(x)
        keys.push(key)
        // The column inherits the per-datum extras (a fillColor, a `meta`
        // payload) of whichever series mentioned it first, so a datum written
        // once is not lost by the join.
        rows.push({ ...rest })
      }
      grid.set(/** @type {number} */ (seen.get(key)), Utils.parseNumber(y))
    }
    grids.push(grid)
  }

  return { xs, keys, rows, grids }
}

/**
 * Sort the columns by x, when x is something that has an order.
 *
 * A streamgraph reads left to right as one continuous flow, and the wiggle
 * baseline is defined on ADJACENT columns, so an out-of-order column does not
 * merely look wrong, it feeds the baseline a difference between two periods
 * that are not neighbours. Category strings keep first-seen order, which is the
 * order the categories were declared in. Date strings on a datetime axis are
 * keyed by their epoch (see `joinOnX`), so they sort by time.
 *
 * @param {any[]} keys the column keys `joinOnX` built
 * @returns {number[]|null} a permutation of column indices, or null to keep as-is
 */
function sortColumns(keys) {
  /** @type {number[]} */
  const perm = []
  for (let j = 0; j < keys.length; j++) {
    if (typeof keys[j] !== 'number' || !isFinite(keys[j])) return null
    perm.push(j)
  }
  perm.sort((a, b) => keys[a] - keys[b])
  // Already sorted: skip the reshuffle entirely.
  for (let j = 0; j < perm.length; j++) {
    if (perm[j] !== j) return perm
  }
  return null
}

/**
 * The order the bands stack in, bottom first.
 *
 * `inside-out` is what makes a streamgraph readable: the series that peak
 * earliest sit in the middle and later peaks fan outward, each new band going
 * to whichever side is currently the thinner of the two. The middle of the
 * stack is the part that moves least under a wiggle baseline, so the bands
 * that peak early — the ones the eye follows first — get the calm part of the
 * chart and the outer edges absorb the movement.
 *
 * @param {string} mode
 * @param {number[]} visible series indices that are actually stacked
 * @param {number[][]} values values[k][j]
 * @returns {number[]}
 */
function orderBands(mode, visible, values) {
  if (mode === 'none') return visible.slice()
  if (mode === 'inverse') return visible.slice().reverse()

  /** @type {Record<number, number>} */
  const sums = {}
  /** @type {Record<number, number>} */
  const peaks = {}
  for (let i = 0; i < visible.length; i++) {
    const k = visible[i]
    const v = values[k]
    let sum = 0
    let best = -Infinity
    let bestJ = 0
    for (let j = 0; j < v.length; j++) {
      sum += v[j]
      if (v[j] > best) {
        best = v[j]
        bestJ = j
      }
    }
    sums[k] = sum
    peaks[k] = bestJ
  }

  // Earliest peak first, ties broken by series index so the order is stable
  // across renders (an unstable order would reshuffle the bands on every
  // resize).
  const byPeak = visible.slice().sort((a, b) => peaks[a] - peaks[b] || a - b)

  let top = 0
  let bottom = 0
  /** @type {number[]} */
  const tops = []
  /** @type {number[]} */
  const bottoms = []
  for (let i = 0; i < byPeak.length; i++) {
    const k = byPeak[i]
    if (top < bottom) {
      top += sums[k]
      tops.push(k)
    } else {
      bottom += sums[k]
      bottoms.push(k)
    }
  }
  return bottoms.reverse().concat(tops)
}

/**
 * The baseline the bottom band sits on, one value per column.
 *
 * `wiggle` minimizes the total weighted slope of the bands: at each column the
 * whole stack is shifted by the negative of the average of every band's own
 * movement, weighted by how thick that band is. A thick band therefore stays
 * roughly level and the thin ones absorb the movement, which is the whole point
 * of the form. `silhouette` centres the stack instead, and `zero` is an
 * ordinary stacked area.
 *
 * @param {string} mode
 * @param {number[]} order
 * @param {number[][]} stack the values actually being stacked
 * @param {number} m column count
 * @returns {number[]}
 */
function baselineFor(mode, order, stack, m) {
  const base = new Array(m).fill(0)
  if (m === 0 || order.length === 0) return base

  if (mode === 'zero' || mode === 'expand') return base

  if (mode === 'silhouette') {
    for (let j = 0; j < m; j++) {
      let total = 0
      for (let i = 0; i < order.length; i++) total += stack[order[i]][j]
      base[j] = -total / 2
    }
    return base
  }

  // wiggle
  let y = 0
  for (let j = 1; j < m; j++) {
    let s1 = 0
    let s2 = 0
    // The movement of every band below this one, carried up the stack, so a
    // column costs one pass over the bands rather than one per band.
    let below = 0
    for (let i = 0; i < order.length; i++) {
      const vi = stack[order[i]]
      const now = vi[j]
      const diff = now - vi[j - 1]
      // This band's own movement counts half (the band is displaced by its own
      // growth from both edges), everything already below it counts whole.
      s1 += now
      s2 += (diff / 2 + below) * now
      below += diff
    }
    if (s1) y -= s2 / s1
    base[j] = y
  }
  return base
}

/**
 * The `streamgraph` series transform, registered by `features/streamgraph`.
 *
 * Runs at the top of `Data.parseData` and rebuilds from a stash rather than
 * from `ser`: parseData writes what this returns back to `config.series`, so
 * stacking `ser` directly would re-stack already-stacked bands on the next
 * render (a resize, a legend toggle), and every render would pile one more
 * level on. Same contract the histogram binning, the waterfall accumulation
 * and the dumbbell merge use.
 *
 * @param {any[]} ser
 * @param {any} w
 * @returns {any[]}
 */
export function streamgraphTransform(ser, w) {
  const cnf = w.config
  const gl = w.globals
  if (!Array.isArray(ser)) return ser

  if (!gl.streamgraphRawSeries) {
    gl.streamgraphRawSeries = stashSeries(ser, gl)
  }
  const raw = gl.streamgraphRawSeries

  // A series with no type, or typed 'streamgraph' or its base 'rangeArea', is
  // a band. A combo series of any other type (a reference line drawn over the
  // stream) is not: it stays out of the join, the baseline and the stack, and
  // keeps its own values.
  const band = raw.map(
    (/** @type {any} */ s) =>
      !s?.type || s.type === 'streamgraph' || s.type === 'rangeArea',
  )

  if (
    raw.some(
      (/** @type {any} */ s, /** @type {number} */ k) =>
        band[k] && isPairShaped(Array.isArray(s?.data) ? s.data : []),
    )
  ) {
    // Bands were supplied ready-stacked. There is nothing to compute, and the
    // range-area pathway draws them exactly as given.
    w.streamgraphData = null
    return ser
  }

  const opts = cnf.plotOptions?.streamgraph || {}
  const offset = OFFSETS.indexOf(opts.offset) !== -1 ? opts.offset : 'wiggle'
  const order = ORDERS.indexOf(opts.order) !== -1 ? opts.order : 'inside-out'

  const categories = cnf.xaxis?.categories
  const collapsed = collapsedIndices(gl)
  const datetime = cnf.xaxis?.type === 'datetime'
  const { xs, keys, rows, grids } = joinOnX(raw, categories, datetime, band)

  const perm = sortColumns(keys)
  const columns = perm ? perm.map((j) => xs[j]) : xs
  const columnRows = perm ? perm.map((j) => rows[j]) : rows
  const m = columns.length
  /** @type {number[]} */
  const lines = []
  /** @type {Map<any, number>|undefined} x key to its column, built on demand */
  let colOf

  // values[k][j], the numbers the reader actually gave, kept for the tooltip
  // and the labels. A streamgraph is a part-to-whole form and a negative part
  // has no thickness to draw, so negatives are floored at zero rather than
  // quietly inverting the band above them.
  let sawNegative = false
  /** @type {Array<Array<number|null>>} */
  const values = []
  for (let k = 0; k < raw.length; k++) {
    /** @type {Array<number|null>} */
    const row = new Array(m)
    if (!band[k]) {
      // A combo line is read out at the column its x names, as written (not a
      // part of the whole, so never floored), and null where it has no point.
      row.fill(null)
      if (collapsed.indexOf(k) === -1) lines.push(k)
      if (!colOf) {
        colOf = new Map()
        for (let j = 0; j < m; j++) colOf.set(keys[perm ? perm[j] : j], j)
      }
      const data = Array.isArray(raw[k]?.data) ? raw[k].data : []
      for (let j = 0; j < data.length; j++) {
        const { x, y } = readDatum(data[j], j, categories)
        const c = colOf.get(xKey(x, datetime))
        if (c !== undefined) row[c] = Utils.parseNumber(y)
      }
      values.push(row)
      continue
    }
    for (let j = 0; j < m; j++) {
      const src = grids[k].get(perm ? perm[j] : j)
      let v = src === undefined || src === null ? 0 : Number(src)
      if (!isFinite(v)) v = 0
      if (v < 0) {
        sawNegative = true
        v = 0
      }
      row[j] = v
    }
    values.push(row)
  }

  if (sawNegative && !gl.streamgraphWarnedNegative) {
    gl.streamgraphWarnedNegative = true
    console.warn(
      'ApexCharts: a streamgraph stacks parts of a whole, so negative values ' +
        'have no band to draw and were treated as 0. Use a stacked area ' +
        '(chart.type: "area", chart.stacked: true) for data that goes below zero.',
    )
  }

  // A band the legend has collapsed leaves the stack entirely and the rest
  // close up over it, which is what makes a legend click on a streamgraph
  // re-solve the baseline instead of leaving a hole.
  /** @type {number[]} */
  const visible = []
  for (let k = 0; k < raw.length; k++) {
    if (band[k] && collapsed.indexOf(k) === -1) visible.push(k)
  }

  // `expand` normalizes each column to a share of its own total, so the stack
  // reads as composition over time at a constant thickness. It changes what is
  // stacked, never what is reported, so it works on a copy.
  // Only bands are stacked, and a band's row holds numbers only.
  let stack = /** @type {number[][]} */ (values)
  if (offset === 'expand') {
    stack = stack.map((row) => row.slice())
    for (let j = 0; j < m; j++) {
      let total = 0
      for (let i = 0; i < visible.length; i++) total += stack[visible[i]][j]
      if (total) {
        for (let i = 0; i < visible.length; i++) stack[visible[i]][j] /= total
      }
    }
  }

  const bandOrder = orderBands(order, visible, stack)
  const base = baselineFor(offset, bandOrder, stack, m)

  /** @type {Array<number[]|null>} */
  const lows = raw.map(() => null)
  /** @type {Array<number[]|null>} */
  const highs = raw.map(() => null)
  for (let i = 0; i < bandOrder.length; i++) {
    lows[bandOrder[i]] = new Array(m)
    highs[bandOrder[i]] = new Array(m)
  }

  for (let j = 0; j < m; j++) {
    let acc = base[j]
    for (let i = 0; i < bandOrder.length; i++) {
      const k = bandOrder[i]
      const bandLo = /** @type {number[]} */ (lows[k])
      const bandHi = /** @type {number[]} */ (highs[k])
      // The SAME accumulator value becomes this band's top and the next band's
      // bottom. Recomputing either from the values would round differently and
      // open a hairline gap between them at some columns and not others.
      bandLo[j] = acc
      acc += stack[k][j]
      bandHi[j] = acc
    }
  }

  w.streamgraphData = {
    names: raw.map(
      (/** @type {any} */ s, /** @type {number} */ k) =>
        s?.name ?? `Series ${k + 1}`,
    ),
    xs: columns,
    values,
    lows,
    highs,
    order: bandOrder,
    lines,
    offset,
    hidden: raw
      .map((/** @type {any} */ _, /** @type {number} */ k) => k)
      .filter((/** @type {number} */ k) => collapsed.indexOf(k) !== -1),
  }

  return raw.map((/** @type {any} */ s, /** @type {number} */ k) => {
    if (!band[k]) {
      // Collapsed here for the same reason a band is: this rebuilds from the
      // stash, which would bring back the series the legend just emptied.
      if (collapsed.indexOf(k) !== -1) return { ...s, data: [] }
      return Array.isArray(s?.data)
        ? { ...s, data: withX(s.data, categories) }
        : s
    }
    const lo = lows[k]
    const hi = highs[k]
    if (!lo || !hi) return { ...s, data: [] }
    /** @type {any[]} */
    const data = new Array(m)
    for (let j = 0; j < m; j++) {
      data[j] = { ...columnRows[j], x: columns[j], y: [lo[j], hi[j]] }
    }
    return { ...s, data }
  })
}
