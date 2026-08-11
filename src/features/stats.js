// @ts-check
/**
 * ApexCharts — statistics feature.
 *
 * Opt-in support for chart types whose series carries **raw observations**
 * rather than the values it draws. The library computes the statistic:
 *
 *   - `histogram` : bins a sample into counts
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
 * The transforms register through SeriesTransformRegistry, so core keeps only
 * a registry lookup and a bundle that never asks for a raw-sample type never
 * pays for the statistics.
 *
 * @module features/stats
 */
import ApexCharts from '../apexcharts'
import Utils from '../utils/Utils'
import { registerSeriesTransform } from '../modules/SeriesTransformRegistry'
import {
  binCounts,
  computeBinning,
  normalizeCounts,
} from '../charts/common/Binning'

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

  return raw.map((/** @type {any} */ s, /** @type {number} */ i) => {
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

registerSeriesTransform('histogram', histogramTransform)

export default ApexCharts
export { histogramTransform }
