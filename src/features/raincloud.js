// @ts-check
/**
 * ApexCharts — raincloud feature (PREMIUM, opt-in).
 *
 * `chart.type: 'raincloud'` is the classic three-layer distribution chart
 * (Allen et al. 2019): a half-density curve (the "cloud"), a five-number box
 * beside it, and the raw observations as jittered points on the other side
 * (the "rain"). It renders through the violin pathway — the type is an alias,
 * and every layer is a `plotOptions.violin` capability (`side`, `box`,
 * `points.position`) that the raincloud Defaults preset switches on. This
 * module supplies the statistics: the kernel density estimate for the cloud
 * and the five-number summary for the box, derived from the raw sample on
 * each datum.
 *
 * Usage:
 *
 *   import ApexCharts from 'apexcharts'
 *   import 'apexcharts/features/raincloud'
 *
 * lean-core: `import ApexCharts from 'apexcharts/raincloud'` (pulls in the
 * violin renderer and this feature together). Script tag: load
 * `dist/features/raincloud.js` after whichever bundle the page already has.
 *
 * This feature is NEVER part of the default bundle. Without it, a raincloud
 * chart warns and renders blank (see Data.applySeriesTransform). Licensing is
 * trial-mode like every premium feature: without a valid premium/enterprise
 * key the chart keeps working but carries the APEXCHARTS watermark — it is
 * never degraded or blocked (see modules/license/LicenseEnforcer).
 *
 * Series shape: one datum per category, observations in `points` (or a flat
 * number array as `y`):
 *
 *   { x: 'DD', points: [92, 101, 87, ...] }
 *
 * A datum may pre-supply any of `y.density` / `y.summary`; whatever is
 * missing is derived from the sample, and hand-supplied statistics are drawn
 * exactly as given.
 *
 * Row source: none registered here — RowSourceRegistry falls back from the
 * requested type to the base type, and the stats feature's 'violin' row
 * source reads the same `w.violinData.seriesViolinPoints` slice a raincloud
 * fills. (In a lean-core page without the stats feature, explode-to-unit is
 * simply unavailable.)
 *
 * @module features/raincloud
 */
import ApexCharts from '../apexcharts'
import { registerSeriesTransform } from '../modules/SeriesTransformRegistry'
import {
  fiveNumberSummary,
  kernelDensity,
  observationsOf,
} from '../charts/common/Stats'

/**
 * Datum objects whose density AND summary this feature computed. Same
 * contract as the stats feature's WeakSet: parseData writes the transform's
 * output back to `config.series`, so without the marker a second pass would
 * freeze the statistic at whatever the first render produced, and
 * `updateOptions({plotOptions: {violin: {kde | box.whiskers}}})` could never
 * re-derive it. Entries die with the datum.
 */
const derivedData = new WeakSet()

/**
 * Datum objects where the user precomputed the density and only the SUMMARY
 * is ours. Tracked separately so a re-parse re-derives just the summary and
 * never clobbers the hand-supplied density with a KDE of the points.
 */
const derivedSummaryOnly = new WeakSet()

/**
 * raincloud transform: derive the density (cloud) and five-number summary
 * (box) from the raw observations. Idempotent by the same shape-check the
 * violin transform uses: fully precomputed datums pass through untouched, and
 * datums we produced are re-derived so option changes take effect.
 *
 * @param {any[]} ser
 * @param {any} w
 * @returns {any[]}
 */
function raincloudTransform(ser, w) {
  if (!Array.isArray(ser)) return ser
  const violinCfg = w.config.plotOptions?.violin || {}
  const kde = violinCfg.kde || {}
  const whiskers = violinCfg.box?.whiskers || 'minmax'

  return ser.map((/** @type {any} */ s) => {
    if (!Array.isArray(s?.data)) return s
    let touched = false
    const data = s.data.map((/** @type {any} */ d) => {
      const hasDensity =
        Array.isArray(d?.y?.density) && d.y.density.length > 0
      const hasSummary = Array.isArray(d?.y?.summary) && d.y.summary.length === 5

      // A hand-supplied density is never recomputed: derive at most the
      // missing summary from the sample (if one is attached).
      if (hasDensity && !derivedData.has(d)) {
        if (hasSummary && !derivedSummaryOnly.has(d)) return d
        const values = observationsOf(d, false)
        if (!values) return d
        const summary = fiveNumberSummary(values, { whiskers })
        if (!summary) return d
        touched = true
        const next = { ...d, y: { ...d.y, summary: summary.summary } }
        derivedSummaryOnly.add(next)
        return next
      }

      const values = observationsOf(d, true)
      if (!values) return d
      const est = kernelDensity(values, {
        bandwidth: kde.bandwidth,
        resolution: kde.resolution,
      })
      if (!est) return d
      const summary = fiveNumberSummary(values, { whiskers })
      touched = true
      const next = {
        ...d,
        y: {
          density: est.density,
          points: values,
          ...(summary ? { summary: summary.summary } : {}),
        },
      }
      derivedData.add(next)
      return next
    })
    return touched ? { ...s, data } : s
  })
}

registerSeriesTransform('raincloud', raincloudTransform)

export default ApexCharts
export { raincloudTransform }
