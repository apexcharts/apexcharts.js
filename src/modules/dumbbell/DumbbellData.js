// @ts-check
/**
 * Dumbbell endpoints.
 *
 * A dumbbell compares two (or more) measures over the same categories: desired
 * against admired, 2019 against 2024, women's pay against men's. That is two
 * ordinary series, and it is how the numbers arrive. What a range bar draws is
 * one interval per row, so the two have to meet somewhere, and every library
 * that skips the conversion makes the caller do it: zip the measures into
 * `[lo, hi]` pairs by hand, keep the order straight, and then re-name the
 * legend after the pair has thrown the series names away.
 *
 * So the conversion lives here. N scalar series in, one range series out, with
 * the endpoint identities kept alongside on `w.dumbbellData` for everything
 * that needs to know which dot is which: the marker colours, the end labels,
 * the connector's gradient and the tooltip.
 *
 * Two shapes are accepted:
 *
 *   - N series of scalars, joined on `x` (the documented form),
 *   - one series of `y: [lo, hi]` pairs, passed straight through (what
 *     `plotOptions.bar.isDumbbell` has always taken).
 *
 * The pair form is left alone deliberately: it names no endpoints, so there is
 * nothing to merge and nothing to identify, and the legacy `dumbbellColors`
 * pathway keeps drawing it exactly as before.
 *
 * @module modules/dumbbell/DumbbellData
 */
import Utils from '../../utils/Utils'

/**
 * One input datum, read into the parts the merge needs.
 *
 * x is taken from the datum, then from `xaxis.categories`, then from the index,
 * so a dumbbell can be written in any shape ApexCharts accepts and still comes
 * out as the labelled rows a dumbbell is read by.
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
 * An endpoint is a scalar, so a 2-element `y` can only be a pair, which makes
 * this unambiguous. It is both the compatibility path for every existing
 * `isDumbbell` chart and a backstop: parseData writes the transform's output
 * back to `config.series`, so re-merging already-merged rows would silently
 * draw nonsense if the raw stash were ever lost.
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
 * The row order, and each series' values keyed by row.
 *
 * Rows are joined on x, never on position: two measures are routinely written
 * in different orders, or one of them is missing a category entirely, and an
 * ordinal join silently pairs a value with the wrong row rather than failing.
 * Series 0 sets the order; any x only later series carry is appended.
 *
 * @param {any[]} raw
 * @param {any[]|undefined} categories
 * @returns {{ xs: any[], rows: Array<Record<string, any>>, byX: Array<Map<any, number>> }}
 */
function joinOnX(raw, categories) {
  /** @type {any[]} */
  const xs = []
  /** @type {Array<Record<string, any>>} */
  const rows = []
  const seen = new Map()
  /** @type {Array<Map<any, number>>} */
  const byX = []

  for (let i = 0; i < raw.length; i++) {
    const data = Array.isArray(raw[i]?.data) ? raw[i].data : []
    /** @type {Map<any, number>} */
    const map = new Map()
    for (let j = 0; j < data.length; j++) {
      const { x, y, rest } = readDatum(data[j], j, categories)
      const key = x instanceof Date ? x.getTime() : x
      if (!seen.has(key)) {
        seen.set(key, xs.length)
        xs.push(x)
        // The row inherits the per-datum extras (goals, a custom fillColor, a
        // `meta` payload) of whichever series mentioned the category first, so
        // a datum written once is not lost by the merge.
        rows.push({ ...rest })
      }
      const rowIndex = /** @type {number} */ (seen.get(key))
      map.set(rowIndex, Utils.parseNumber(y))
    }
    byX.push(map)
  }

  return { xs, rows, byX }
}

/**
 * The `dumbbell` series transform, registered by `features/dumbbell`.
 *
 * Runs at the top of `Data.parseData`, before anything reads the data, and
 * rebuilds from a stash rather than from `ser`: parseData writes what this
 * returns back to `config.series`, so merging `ser` directly would re-merge
 * already-merged rows on the next render (a resize, a legend toggle). Same
 * contract the histogram binning and the waterfall accumulation use.
 *
 * The output keeps ONE series per endpoint so the legend, the palette and the
 * collapse machinery keep working on the real names: the first visible
 * endpoint carries the merged rows, and the rest carry nothing. That also
 * leaves `seriesLen` at 1 (it counts series that have data), so the connector
 * sits on the row's centre line instead of being squeezed into a 1/N band.
 *
 * @param {any[]} ser
 * @param {any} w
 * @returns {any[]}
 */
export function dumbbellTransform(ser, w) {
  const cnf = w.config
  const gl = w.globals
  if (!Array.isArray(ser)) return ser

  if (!gl.dumbbellRawSeries) {
    gl.dumbbellRawSeries = ser.map((/** @type {any} */ s) => ({
      ...s,
      data: Array.isArray(s?.data) ? s.data.slice() : s?.data,
    }))
  }
  const raw = gl.dumbbellRawSeries

  const alreadyPaired = raw.some((/** @type {any} */ s) =>
    isPairShaped(Array.isArray(s?.data) ? s.data : [])
  )

  if (alreadyPaired) {
    // Pairs were supplied. There are no endpoint identities to record, so the
    // legacy `dumbbellColors` pathway draws it, exactly as it did before the
    // type existed.
    w.dumbbellData = {
      form: 'pairs',
      names: [],
      values: [],
      order: [],
      carrier: 0,
      hidden: [],
    }
    return ser
  }

  const categories = cnf.xaxis?.categories
  const collapsed = gl.collapsedSeriesIndices || []
  const { xs, rows, byX } = joinOnX(raw, categories)

  /** @type {Array<Array<number|null>>} */
  const values = []
  /** @type {Array<[number, number]|null>} */
  const order = []

  // The endpoints that are actually drawn. A collapsed one leaves the row and
  // the rest close up, which is what turns a two-endpoint dumbbell into a
  // one-endpoint lollipop on a legend click.
  const visible = []
  for (let k = 0; k < raw.length; k++) {
    if (collapsed.indexOf(k) === -1) visible.push(k)
  }

  /** @type {any[]} */
  const data = []

  for (let j = 0; j < xs.length; j++) {
    /** @type {Array<number|null>} */
    const rowValues = []
    for (let k = 0; k < raw.length; k++) {
      const v = byX[k].has(j) ? byX[k].get(j) : null
      rowValues.push(
        v === null || v === undefined || !isFinite(v) ? null : v
      )
    }
    values.push(rowValues)

    let lo = null
    let hi = null
    let kLo = -1
    let kHi = -1
    for (let vi = 0; vi < visible.length; vi++) {
      const k = visible[vi]
      const v = rowValues[k]
      if (v === null) continue
      if (lo === null || v < lo) {
        lo = v
        kLo = k
      }
      if (hi === null || v > hi) {
        hi = v
        kHi = k
      }
    }

    if (lo === null || hi === null) {
      // Nothing to draw on this row, but the row still has to exist or every
      // category below it would shift up by one.
      order.push(null)
      data.push({ ...rows[j], x: xs[j], y: null })
      continue
    }

    order.push([kLo, kHi])
    // Emitted low-to-high rather than in endpoint order, so the connector's
    // path always runs the same way and its gradient can be resolved from
    // `order` at draw time. Which dot is which is carried by `values`, so a
    // row where the measures cross keeps its colours.
    data.push({ ...rows[j], x: xs[j], y: [lo, hi] })
  }

  w.dumbbellData = {
    form: 'series',
    names: raw.map(
      (/** @type {any} */ s, /** @type {number} */ k) =>
        s?.name ?? `Series ${k + 1}`
    ),
    values,
    order,
    carrier: visible.length ? visible[0] : 0,
    hidden: raw
      .map((/** @type {any} */ _, /** @type {number} */ k) => k)
      .filter((/** @type {number} */ k) => collapsed.indexOf(k) !== -1),
  }

  const carrier = w.dumbbellData.carrier

  return raw.map((/** @type {any} */ s, /** @type {number} */ k) => ({
    ...s,
    // Every endpoint stays a series so the legend keeps its name, its colour
    // and its click. Only one of them carries the merged rows: drawing the
    // same rows N times would stack N identical connectors.
    data: k === carrier && visible.length ? data : [],
  }))
}
