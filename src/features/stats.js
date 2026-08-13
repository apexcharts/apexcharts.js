// @ts-check
/**
 * ApexCharts — statistics feature.
 *
 * Opt-in support for chart types whose series carries **raw observations**
 * rather than the values it draws. The library computes the statistic:
 *
 *   - `histogram` : bins a sample into counts
 *   - `boxPlot`   : derives the five-number summary (quartiles + whiskers)
 *   - `violin`    : estimates the density (Gaussian KDE)
 *
 * All three were the same gap. boxPlot demanded `[min, q1, median, q3, max]`
 * and violin demanded a density profile, so both asked the caller to do the
 * statistics that give the chart its meaning. Supplying the sample is now
 * enough, and the observations live in the one field both types already use for
 * jitter dots (`points`).
 *
 * Usage:
 *
 *   import ApexCharts from 'apexcharts/core'
 *   import 'apexcharts/bar'
 *   import 'apexcharts/features/stats'
 *
 * or simply `import ApexCharts from 'apexcharts/histogram'`, which pulls in
 * the bar renderer and this feature together.
 *
 * Only histogram REQUIRES the feature (there is nothing to draw without the
 * bins). For boxPlot and violin it is purely additive: precomputed input keeps
 * working untouched, with or without this import.
 *
 * The transforms register through SeriesTransformRegistry, so core keeps only
 * a registry lookup and a bundle that never asks for a raw-sample type never
 * pays for the statistics.
 *
 * @module features/stats
 */
import ApexCharts from '../apexcharts'
import Utils from '../utils/Utils'
import { registerSeriesTransform } from '../modules/SeriesTransformRegistry'
import { registerRowSource } from '../modules/RowSourceRegistry'
import {
  binCounts,
  computeBinning,
  fiveNumberSummary,
  kernelDensity,
  normalizeCounts,
  rowsByBin,
} from '../charts/common/Stats'

/**
 * Collect the finite observations out of one histogram series' data. Raw
 * values are the point of a histogram, so the accepted forms are the ways
 * people actually hold a sample: a flat number array, `{ y }` / `{ x }`
 * objects, or one-element arrays.
 *
 * @param {any} data
 * @returns {number[]}
 */
function histogramValues(data) {
  /** @type {number[]} */
  const out = []
  if (!Array.isArray(data)) return out
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    /** @type {any} */
    let raw = d
    if (Array.isArray(d)) raw = d.length === 1 ? d[0] : d[1]
    else if (d && typeof d === 'object') raw = d.y !== undefined ? d.y : d.x
    const v = Utils.parseNumber(raw)
    if (v !== null && isFinite(v)) out.push(v)
  }
  return out
}

/**
 * Histogram transform. `chart.type: 'histogram'` renders through the bar
 * pathway, so the raw observations the user supplied are binned here, before
 * any parsing, into one `{ x: binMidpoint, y: count }` row per bar.
 *
 * All series share one set of edges, derived from their combined extent, so
 * overlaid distributions stay comparable; binning each series to its own range
 * would put different bars at the same x.
 *
 * parseData writes what this returns back to `cnf.series`, so binning the
 * incoming series directly would re-bin the counts on the next render (a
 * resize, a legend toggle) and quietly destroy the distribution. The raw
 * observations are stashed once per data push and binning always reads the
 * stash, the same contract the zoom-aware downsampler uses for its raw data.
 *
 * @param {any[]} ser
 * @param {any} w
 * @returns {any[]}
 */
function histogramTransform(ser, w) {
  const cnf = w.config
  const gl = w.globals
  if (!Array.isArray(ser)) return ser

  if (!gl.histogramRawSeries) {
    gl.histogramRawSeries = ser.map((/** @type {any} */ s) => ({
      ...s,
      data: Array.isArray(s?.data) ? s.data.slice() : s?.data,
    }))
  }
  const raw = gl.histogramRawSeries

  const hcfg = cnf.plotOptions?.histogram || {}
  const perSeries = raw.map((/** @type {any} */ s) => histogramValues(s?.data))

  /** @type {number[]} */
  let all = []
  if (perSeries.length === 1) {
    all = perSeries[0]
  } else {
    for (const vals of perSeries) all = all.concat(vals)
  }

  const binning = computeBinning(all, {
    bins: hcfg.bins,
    binWidth: hcfg.binWidth,
    range: hcfg.range,
  })

  if (!binning) {
    w.histogramData = {
      edges: [],
      binWidth: 0,
      counts: [],
      rule: '',
      capped: false,
    }
    return raw
  }

  const { edges, binWidth } = binning
  /** @type {number[][]} */
  const counts = perSeries.map((/** @type {number[]} */ vals) =>
    binCounts(vals, edges),
  )

  w.histogramData = {
    edges,
    binWidth,
    counts,
    rule: binning.rule,
    capped: binning.capped,
  }

  // A hidden series draws nothing, but it still counts towards the edges: the
  // bins are the frame the distributions are compared in, and re-deriving them
  // on a legend click would slide every remaining bar sideways. Emitted here
  // rather than left to the caller, because this transform rebuilds the rows
  // from the stash and would otherwise undo the collapse that put them there.
  const collapsed = gl.collapsedSeriesIndices || []

  return raw.map((/** @type {any} */ s, /** @type {number} */ i) => {
    if (collapsed.indexOf(i) !== -1) return { ...s, data: [] }
    const ys = normalizeCounts(counts[i], {
      normalize: hcfg.normalize,
      cumulative: hcfg.cumulative,
      binWidth,
    })
    /** @type {any[]} */
    const data = []
    for (let k = 0; k < ys.length; k++) {
      data.push({ x: (edges[k] + edges[k + 1]) / 2, y: ys[k] })
    }
    return { ...s, data }
  })
}

/**
 * The datum objects whose summary / density this feature computed.
 *
 * parseData writes the transform's output back to `config.series`, so the next
 * pass sees a datum that already carries a summary and would leave it alone.
 * That froze the statistic at whatever the first render produced: changing
 * `plotOptions.boxPlot.whiskers` or `plotOptions.violin.kde` through
 * updateOptions re-parsed the data but could never re-derive it.
 *
 * A WeakSet of the objects we created distinguishes "the user precomputed this"
 * from "we computed this last render", without writing a marker into the user's
 * data or retaining anything (the entries die with the datum). Both transforms
 * keep the observations on the datum, so re-deriving needs no stashed copy.
 */
const derivedData = new WeakSet()

/**
 * The observations attached to one boxPlot / violin datum, or null when the
 * datum does not carry a sample.
 *
 * `points` is the field both types already use for jitter dots, so a sample
 * lives in exactly one place whether the library summarises it or the user
 * pre-summarised it. Violin additionally accepts a flat number array as `y`,
 * which is unambiguous there because a density profile is an array of PAIRS.
 *
 * @param {any} d - one datum
 * @param {boolean} allowFlatY
 * @returns {number[]|null}
 */
function observationsOf(d, allowFlatY) {
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

/**
 * boxPlot transform: derive the five-number summary from raw observations.
 *
 * A boxPlot has always required the summary itself (`y: [min, q1, median, q3,
 * max]`), which means computing quartiles before you can draw a box. Supply
 * `points` instead and the summary is computed here.
 *
 * A datum that already carries a 5-number `y` is left exactly as it was, so a
 * 5-number y is never reinterpreted and existing charts cannot change shape.
 * That also makes the transform idempotent: parseData writes the result back to
 * config.series, and a second pass sees a summary and does nothing.
 *
 * @param {any[]} ser
 * @param {any} w
 * @returns {any[]}
 */
function boxPlotTransform(ser, w) {
  if (!Array.isArray(ser)) return ser
  const whiskers = w.config.plotOptions?.boxPlot?.whiskers || 'minmax'

  return ser.map((/** @type {any} */ s) => {
    if (!Array.isArray(s?.data)) return s
    let touched = false
    const data = s.data.map((/** @type {any} */ d) => {
      // An existing summary wins: this is the documented input shape. Unless we
      // are the ones who derived it, in which case the options that shaped it
      // may have changed.
      if (Array.isArray(d?.y) && d.y.length === 5 && !derivedData.has(d)) {
        return d
      }
      const values = observationsOf(d, false)
      if (!values) return d
      const summary = fiveNumberSummary(values, { whiskers })
      if (!summary) return d
      touched = true
      const next = { ...d, y: summary.summary, points: values }
      derivedData.add(next)
      return next
    })
    return touched ? { ...s, data } : s
  })
}

/**
 * violin transform: estimate the density from raw observations.
 *
 * A violin has always required a precomputed density profile
 * (`y: { density: [[value, weight], ...] }`), which means running a kernel
 * density estimate before you can draw a violin. Supply the observations
 * (`points`, or a flat number array as `y`) and the estimate happens here.
 *
 * An existing density is never recomputed, so the transform is idempotent for
 * the same reason the boxPlot one is.
 *
 * @param {any[]} ser
 * @param {any} w
 * @returns {any[]}
 */
function violinTransform(ser, w) {
  if (!Array.isArray(ser)) return ser
  const kde = w.config.plotOptions?.violin?.kde || {}

  return ser.map((/** @type {any} */ s) => {
    if (!Array.isArray(s?.data)) return s
    let touched = false
    const data = s.data.map((/** @type {any} */ d) => {
      if (
        Array.isArray(d?.y?.density) &&
        d.y.density.length &&
        !derivedData.has(d)
      ) {
        return d
      }
      const values = observationsOf(d, true)
      if (!values) return d
      const est = kernelDensity(values, {
        bandwidth: kde.bandwidth,
        resolution: kde.resolution,
      })
      if (!est) return d
      touched = true
      const next = { ...d, y: { density: est.density, points: values } }
      derivedData.add(next)
      return next
    })
    return touched ? { ...s, data } : s
  })
}

/* -------------------------------------------------------------------------- *
 * Row sources: the rows behind each mark.
 *
 * These three types are the only ones in the library that can answer, because
 * they are the only ones handed the raw observations to begin with. An ordinary
 * bar aggregates rows nobody ever gave us. See RowSourceRegistry for the
 * ordering contract, which the morph mapping depends on.
 * -------------------------------------------------------------------------- */

/**
 * Default ceiling on the dots one explode may produce. The unit engine draws
 * one element per dot, so this is the same reason (and the same number)
 * `Jitter.js` caps its packed points at.
 */
const DEFAULT_MAX_ROWS = 3000

/**
 * Thin every cluster by ONE shared stride so the relative sizes survive.
 *
 * A per-cluster budget would pull every cluster towards the same count, which
 * flattens exactly the shape the explode exists to show: the tall bins are tall
 * because they hold more rows. One global stride keeps the proportions and only
 * lowers the resolution.
 *
 * @param {any[][]} clusters - rows per cluster
 * @param {number} maxRows
 * @returns {{ clusters: any[][], stride: number, total: number, kept: number }}
 */
function thinClusters(clusters, maxRows) {
  let total = 0
  let widest = 0
  for (const c of clusters) {
    total += c.length
    if (c.length > widest) widest = c.length
  }
  if (total <= maxRows) return { clusters, stride: 1, total, kept: total }

  /** @param {number} s */
  const keptAt = (s) => {
    let n = 0
    for (const c of clusters) n += Math.ceil(c.length / s)
    return n
  }

  // `ceil(total / maxRows)` is the floor, not the answer: rounding UP inside
  // every cluster (so a cluster never vanishes entirely) means the total can
  // overshoot by as much as one row per cluster. Walk the stride up until it
  // genuinely fits, so maxRows is a ceiling rather than an aspiration.
  let stride = Math.max(2, Math.ceil(total / maxRows))
  while (stride < widest && keptAt(stride) > maxRows) stride++

  let kept = 0
  const out = clusters.map((rows) => {
    /** @type {any[]} */
    const keepList = []
    for (let i = 0; i < rows.length; i += stride) keepList.push(rows[i])
    kept += keepList.length
    return keepList
  })
  // Once every non-empty cluster is down to a single row there is nothing left
  // to thin: dropping clusters would break the ordering contract, so the cap
  // loses and the warning reports what actually happened.
  return { clusters: out, stride, total, kept }
}

/**
 * Turn per-cluster row arrays into the unit-chart series shape, applying the
 * cap and warning when it bites. Silence would read as data loss.
 *
 * Each datum carries the observation as `y` (so bubble sizing and colour scales
 * can read it), a stable `id` (so `transition: 'identity'` can follow one
 * observation across any relayout), and the colour of the mark it came out of:
 * rows inherit their mark's colour, which is what makes an explode look like
 * one thing coming apart rather than a new chart appearing.
 *
 * @param {any} w
 * @param {Array<{ name: string, realIndex: number, rows: any[] }>} clusters
 * @param {any} [opts]
 * @returns {any[]}
 */
function toUnitSeries(w, clusters, opts) {
  const maxRows = opts && opts.maxRows != null ? opts.maxRows : DEFAULT_MAX_ROWS
  const thinned = thinClusters(
    clusters.map((c) => c.rows),
    maxRows,
  )
  if (thinned.stride > 1) {
    console.warn(
      `ApexCharts: rowSeries() thinned ${thinned.total} rows to ${thinned.kept} ` +
        `(every ${thinned.stride}${thinned.stride === 2 ? 'nd' : thinned.stride === 3 ? 'rd' : 'th'} row) ` +
        `to stay under maxRows=${maxRows}. Raise maxRows to draw more.`,
    )
  }

  const colors = (w.globals && w.globals.colors) || []
  return clusters.map((c, i) => {
    const fillColor = colors[c.realIndex] || colors[0]
    return {
      name: c.name,
      data: thinned.clusters[i].map((v, q) => ({
        id: `${c.realIndex}:${i}:${q}`,
        x: c.name,
        y: v,
        ...(fillColor ? { fillColor } : {}),
      })),
    }
  })
}

/**
 * Histogram row source: the observations behind every bar.
 *
 * One cluster per (series, bin), in draw order, which is series-major because
 * that is how the bar renderer emits its groups. Bins with no observations keep
 * their empty cluster so cluster `k` stays aligned with bar `k`.
 *
 * A collapsed series draws no bars at all (its transform emits `data: []`), so
 * it contributes no clusters either. Emitting them anyway would push every
 * later cluster onto the wrong bar.
 *
 * @param {any} w
 * @param {any} [opts]
 * @returns {any[]|null}
 */
function histogramRows(w, opts) {
  const gl = w.globals
  const hd = w.histogramData
  const raw = gl && gl.histogramRawSeries
  if (!hd || !Array.isArray(hd.edges) || hd.edges.length < 2) return null
  if (!Array.isArray(raw) || !raw.length) return null

  const collapsed = (gl && gl.collapsedSeriesIndices) || []
  const edges = hd.edges
  /** @type {Array<{ name: string, realIndex: number, rows: any[] }>} */
  const clusters = []

  raw.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
    if (collapsed.indexOf(i) !== -1) return
    const buckets = rowsByBin(histogramValues(s && s.data), edges)
    const seriesName = (w.seriesData && w.seriesData.seriesNames?.[i]) || s?.name
    buckets.forEach((rows, k) => {
      const range = `${formatEdge(edges[k])}-${formatEdge(edges[k + 1])}`
      clusters.push({
        // Only qualify by series when there is more than one to tell apart.
        name: raw.length > 1 && seriesName ? `${seriesName} ${range}` : range,
        realIndex: i,
        rows,
      })
    })
  })

  return clusters.length ? toUnitSeries(w, clusters, opts) : null
}

/**
 * Bin edges are derived, so they arrive with float noise (a "24.000000000000004"
 * boundary). Cluster names are read by people.
 * @param {number} v
 * @returns {string}
 */
function formatEdge(v) {
  if (!isFinite(v)) return String(v)
  const r = Math.round(v)
  return Math.abs(v - r) < 1e-6 ? String(r) : String(Number(v.toFixed(2)))
}

/**
 * Build a row source for boxPlot / violin, whose observations are already on
 * the chart state, one dense array per (series, category), in draw order. The
 * two types differ only in which state slice holds them.
 *
 * @param {(w: any) => any[][] | null} pick - (w) => points[realIndex][j]
 * @returns {(w: any, opts?: any) => any[]|null}
 */
function pointsRowSource(pick) {
  return (w, opts) => {
    const perSeries = pick(w)
    if (!Array.isArray(perSeries) || !perSeries.length) return null

    const collapsed = (w.globals && w.globals.collapsedSeriesIndices) || []
    // `globals.labels` holds the axis POSITIONS once string categories have
    // been mapped to numbers (a boxPlot of 'Alpha'/'Beta' has labels [1, 2]).
    // The names people gave live on categoryLabels.
    const labels =
      (w.globals && (w.globals.categoryLabels?.length
        ? w.globals.categoryLabels
        : w.globals.labels)) || []
    /** @type {Array<{ name: string, realIndex: number, rows: any[] }>} */
    const clusters = []

    perSeries.forEach((/** @type {any} */ byCat, /** @type {number} */ i) => {
      if (collapsed.indexOf(i) !== -1) return
      if (!Array.isArray(byCat)) return
      const seriesName = w.seriesData && w.seriesData.seriesNames?.[i]
      byCat.forEach((/** @type {any} */ pts, /** @type {number} */ j) => {
        const label = labels[j] != null ? String(labels[j]) : `#${j + 1}`
        clusters.push({
          name:
            perSeries.length > 1 && seriesName
              ? `${seriesName} ${label}`
              : label,
          realIndex: i,
          rows: Array.isArray(pts) ? pts.slice() : [],
        })
      })
    })

    return clusters.length ? toUnitSeries(w, clusters, opts) : null
  }
}

const boxPlotRows = pointsRowSource((w) => w.candleData?.seriesBoxPoints)
const violinRows = pointsRowSource((w) => w.violinData?.seriesViolinPoints)

registerSeriesTransform('histogram', histogramTransform)
registerSeriesTransform('boxPlot', boxPlotTransform)
registerSeriesTransform('violin', violinTransform)

registerRowSource('histogram', histogramRows)
registerRowSource('boxPlot', boxPlotRows)
registerRowSource('violin', violinRows)

export default ApexCharts
export { histogramTransform, boxPlotTransform, violinTransform }
export { histogramRows, boxPlotRows, violinRows }
