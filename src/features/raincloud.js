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
 *   import 'apexcharts/raincloud'
 *
 * `apexcharts/raincloud` pulls in the violin renderer and this feature
 * together; since 8.0 the default bundle carries neither. A page that already
 * has the violin type can import just `apexcharts/features/raincloud`. Script
 * tag: load `dist/violin.js`, then `dist/features/raincloud.js`, after
 * whichever bundle the page already has, or use the full bundle.
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
  derivedStats,
  fiveNumberSummary,
  isDerived,
  kernelDensity,
  observationsOf,
} from '../charts/common/Stats'

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
  // What this transform wrote last pass, per statistic: each is derived or
  // given on its own, so a kde change never touches a hand-supplied summary
  // and a whisker change never touches a hand-supplied density.
  const ourDensity = derivedStats(w, 'raincloudDensity')
  const ourSummary = derivedStats(w, 'raincloudSummary')

  return ser.map((/** @type {any} */ s, /** @type {number} */ i) => {
    // A combo's other series are not samples: a boxPlot's or a rangeArea's
    // `y` is a flat number array too.
    if (
      !Array.isArray(s?.data) ||
      (s.type && s.type !== 'raincloud' && s.type !== 'violin')
    ) {
      return s
    }
    let touched = false
    const data = s.data.map((/** @type {any} */ d, /** @type {number} */ j) => {
      const key = i + ':' + j
      const y =
        d?.y && typeof d.y === 'object' && !Array.isArray(d.y) ? d.y : {}
      const needDensity =
        !Array.isArray(y.density) ||
        !y.density.length ||
        isDerived(ourDensity, key, y.density)
      const needSummary =
        !Array.isArray(y.summary) ||
        y.summary.length !== 5 ||
        isDerived(ourSummary, key, y.summary)
      if (!needDensity && !needSummary) return d

      const values = observationsOf(d, true)
      if (!values) return d
      // The sample rides in `y.points` (the rain) only when the cloud is ours,
      // as before: beside a hand-supplied density the datum keeps its own.
      const out = { ...y }
      if (needDensity) {
        const est = kernelDensity(values, {
          bandwidth: kde.bandwidth,
          resolution: kde.resolution,
        })
        // no density, no cloud: leave the datum as it came
        if (!est) return d
        out.density = est.density
        out.points = values
        ourDensity.set(key, est.density)
      }
      if (needSummary) {
        const est = fiveNumberSummary(values, { whiskers })
        if (est) {
          out.summary = est.summary
          ourSummary.set(key, est.summary)
        }
      }
      touched = true
      return { ...d, y: out }
    })
    return touched ? { ...s, data } : s
  })
}

registerSeriesTransform('raincloud', raincloudTransform)

export default ApexCharts
export { raincloudTransform }
