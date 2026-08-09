// @ts-check

/**
 * Resolves a dataLabels offset which may either be a plain number or a
 * function evaluated per data point. This mirrors `dataLabels.style.colors`,
 * which already accepts a function with the same signature, so varying a
 * dataLabel property per point works the same way across the whole config.
 *
 * A function lets a label be nudged by both series and data point, which an
 * index-keyed value cannot do: `dataLabels` is chart-wide config, so every
 * series shares it. See https://github.com/apexcharts/apexcharts.js/issues/5107
 *
 * Note the offset may be resolved more than once for the same label (some
 * chart types add it while positioning and again while drawing), so the
 * function must be pure.
 *
 * Lives here rather than in `modules/DataLabels.js` on purpose. The split
 * per-type bundles rewrite shared modules to a shim that re-exports only the
 * names registered in `sharedModules` (vite.config.mjs), so a named export on
 * a shared module is invisible to the chart code that imports it and the
 * bundle fails to build. This module is not shared, so the bar and treemap
 * bundles inline these few lines instead.
 *
 * @param {number | ((opts: any) => number)} value
 * @param {import('../../types/internal').ChartStateW} w
 * @param {number} seriesIndex
 * @param {number} dataPointIndex
 * @returns {number}
 */
export const resolveDataLabelOffset = (
  value,
  w,
  seriesIndex,
  dataPointIndex,
) => {
  if (typeof value !== 'function') return value

  const resolved = value({
    series: w.seriesData.series,
    seriesIndex,
    dataPointIndex,
    w,
  })

  // guard against a formatter returning undefined/NaN, which would otherwise
  // propagate into the x/y attribute and drop the label entirely
  return Number.isFinite(resolved) ? resolved : 0
}
