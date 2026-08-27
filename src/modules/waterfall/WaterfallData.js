// @ts-check
/**
 * Waterfall accumulation.
 *
 * A waterfall is written as a list of DELTAS (revenue +569k, costs -342k) with
 * the occasional running-total bar, and drawn as a column that floats between
 * the level it started at and the level it left behind. Those are two different
 * shapes, and every library that skips the conversion makes the caller do the
 * arithmetic: supply `open` and `value` and `stepValue` for every row, keep them
 * consistent by hand, and recompute the lot when one number changes. The running
 * accumulation IS the chart, so it belongs here.
 *
 * The output is the `y: [start, end]` pair a vertical range column already
 * draws, which is why a waterfall needs no renderer of its own (see
 * `Config.normalizeAliasedChartType`).
 *
 * Three bar kinds, matching what the shape means:
 *
 *   - a step bar carries `y` and moves the running total by it,
 *   - `isSubtotal` spans from the last cut to the running total (the sum of the
 *     steps since the previous subtotal / total) and starts a new cut,
 *   - `isTotal` spans from zero to the running total and starts a new cut.
 *
 * Every bar's label and tooltip read `end - start`, its own signed height. That
 * is the delta for a step bar and the sum for a subtotal / total bar, which is
 * the one rule that makes all three read correctly without a special case.
 *
 * @module modules/waterfall/WaterfallData
 */
import Utils from '../../utils/Utils'

/**
 * One input datum, read into the parts the accumulator needs.
 *
 * The x is taken from the datum, then from `xaxis.categories`, then from the
 * index, so a waterfall can be written in any of the shapes ApexCharts accepts
 * (`{x, y}` objects, `[x, y]` tuples, or bare numbers alongside categories) and
 * still comes out as the labelled rows a waterfall is read by.
 *
 * @param {any} d
 * @param {number} j
 * @param {any[]|undefined} categories
 * @returns {{ x: any, y: any, isSubtotal: boolean, isTotal: boolean, rest: Record<string, any> }}
 */
function readDatum(d, j, categories) {
  const fallbackX =
    categories && categories[j] !== undefined ? categories[j] : j + 1

  if (d == null) {
    return {
      x: fallbackX,
      y: null,
      isSubtotal: false,
      isTotal: false,
      rest: {},
    }
  }
  if (Array.isArray(d)) {
    return {
      x: d[0] !== undefined ? d[0] : fallbackX,
      y: d[1],
      isSubtotal: false,
      isTotal: false,
      rest: {},
    }
  }
  if (typeof d === 'object') {
    return {
      x: d.x !== undefined ? d.x : fallbackX,
      y: d.y,
      isSubtotal: d.isSubtotal === true,
      isTotal: d.isTotal === true,
      rest: d,
    }
  }
  return { x: fallbackX, y: d, isSubtotal: false, isTotal: false, rest: {} }
}

/**
 * Has this series already been handed the pairs?
 *
 * A delta is a scalar, so a 2-element `y` can only be a range, which makes this
 * unambiguous. It is both an escape hatch (supply the pairs yourself and the
 * accumulator stays out of the way) and a backstop: `parseData` writes the
 * transform's output back to `config.series`, so if the raw stash were ever
 * lost, re-accumulating already-cumulative pairs would silently draw nonsense.
 *
 * @param {any[]} data
 * @returns {boolean}
 */
function isPrecomputed(data) {
  for (let j = 0; j < data.length; j++) {
    const d = data[j]
    const y = Array.isArray(d) ? d[1] : d && typeof d === 'object' ? d.y : d
    if (Array.isArray(y) && y.length === 2) return true
  }
  return false
}

/**
 * The fill for one bar, or undefined to leave it to the palette.
 *
 * A datum's own `fillColor` always wins: the semantic colours are a default for
 * "up is good, down is bad", not a claim on the bar.
 *
 * @param {Record<string, any>} datum
 * @param {string} kind
 * @param {Record<string, any>} colors - plotOptions.waterfall.colors
 * @returns {string|undefined}
 */
function fillFor(datum, kind, colors) {
  if (datum && datum.fillColor) return datum.fillColor
  const c = colors[kind]
  return typeof c === 'string' && c ? c : undefined
}

/**
 * Accumulate one series' deltas into floating pairs.
 *
 * @param {any[]} data
 * @param {any[]|undefined} categories
 * @param {Record<string, any>} colors
 * @returns {{ data: any[], values: any[], cumulative: number[], kinds: any[] }}
 */
function accumulate(data, categories, colors) {
  /** @type {any[]} */
  const rows = []
  /** @type {any[]} */
  const values = []
  /** @type {number[]} */
  const cumulative = []
  /** @type {any[]} */
  const kinds = []

  // The running total, and the level the current subtotal group opened at.
  let running = 0
  let cut = 0

  for (let j = 0; j < data.length; j++) {
    const { x, y, isSubtotal, isTotal, rest } = readDatum(
      data[j],
      j,
      categories,
    )

    let start
    let end
    /** @type {string} */
    let kind

    if (isTotal || isSubtotal) {
      // A total bar measures the whole chart; a subtotal measures the group.
      // Neither moves the running total: they restate it.
      start = isTotal ? 0 : cut
      end = running
      kind = isTotal ? 'total' : 'subtotal'
      cut = running
    } else {
      const delta = Utils.parseNumber(y)
      if (delta === null || !isFinite(delta)) {
        // A hole leaves the level where it was, so the bars either side of it
        // still line up. Dropping the row instead would shift every category.
        rows.push({ ...rest, x, y: null })
        values.push(null)
        cumulative.push(running)
        kinds.push(null)
        continue
      }
      start = running
      end = running + delta
      running = end
      kind = delta < 0 ? 'negative' : 'positive'
    }

    const fill = fillFor(rest, kind, colors)
    rows.push({
      ...rest,
      x,
      y: [start, end],
      ...(fill ? { fillColor: fill } : {}),
    })
    values.push(end - start)
    cumulative.push(running)
    kinds.push(kind)
  }

  return { data: rows, values, cumulative, kinds }
}

/**
 * The `waterfall` series transform, registered by `features/waterfall`.
 *
 * Runs at the top of `Data.parseData`, before anything reads the data. Reads
 * the raw deltas from a stash rather than from `ser`, because parseData writes
 * what this returns back to `config.series`: accumulating `ser` directly would
 * re-accumulate the pairs on the next render (a resize, a legend toggle) and the
 * bars would climb away on every one. Same contract the histogram binning and
 * the zoom-aware downsampler use.
 *
 * Multiple series each accumulate independently, which draws them as grouped
 * waterfalls side by side (two scenarios over the same categories).
 *
 * @param {any[]} ser
 * @param {any} w
 * @returns {any[]}
 */
export function waterfallTransform(ser, w) {
  const cnf = w.config
  const gl = w.globals
  if (!Array.isArray(ser)) return ser

  if (!gl.waterfallRawSeries) {
    gl.waterfallRawSeries = ser.map((/** @type {any} */ s) => ({
      ...s,
      data: Array.isArray(s?.data) ? s.data.slice() : s?.data,
    }))
  }
  const raw = gl.waterfallRawSeries

  const colors = cnf.plotOptions?.waterfall?.colors || {}
  const categories = cnf.xaxis?.categories
  const collapsed = gl.collapsedSeriesIndices || []

  /** @type {any[]} */
  const values = []
  /** @type {any[]} */
  const cumulative = []
  /** @type {any[]} */
  const kinds = []

  const out = raw.map((/** @type {any} */ s, /** @type {number} */ i) => {
    const data = Array.isArray(s?.data) ? s.data : []

    // A collapsed series draws nothing. Emitted here rather than left to the
    // caller, because this transform rebuilds the rows from the stash and would
    // otherwise resurrect the series the collapse just emptied.
    if (collapsed.indexOf(i) !== -1) {
      values[i] = []
      cumulative[i] = []
      kinds[i] = []
      return { ...s, data: [] }
    }

    if (isPrecomputed(data)) {
      // Pairs were supplied. Record what a label should read anyway, so the
      // value semantics do not depend on who did the arithmetic.
      values[i] = data.map((/** @type {any} */ d) => {
        const y = Array.isArray(d) ? d[1] : d && typeof d === 'object' ? d.y : d
        if (!Array.isArray(y)) return null
        const lo = Utils.parseNumber(y[0])
        const hi = Utils.parseNumber(y[1])
        return lo === null || hi === null ? null : hi - lo
      })
      cumulative[i] = data.map((/** @type {any} */ d) => {
        const y = Array.isArray(d) ? d[1] : d && typeof d === 'object' ? d.y : d
        const hi = Array.isArray(y) ? Utils.parseNumber(y[1]) : null
        return hi === null ? 0 : hi
      })
      kinds[i] = data.map(() => null)
      return s
    }

    const acc = accumulate(data, categories, colors)
    values[i] = acc.values
    cumulative[i] = acc.cumulative
    kinds[i] = acc.kinds
    return { ...s, data: acc.data }
  })

  w.waterfallData = {
    values,
    cumulative,
    kinds,
    // A non-null sink is what tells RangeBar to record the px box it drew each
    // column in, which the connector layer joins up. Fresh every parse.
    geometry: [],
  }

  return out
}
