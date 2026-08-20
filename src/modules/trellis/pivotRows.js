// @ts-check
/**
 * Trellis (#22, P2): the tidy-row pivot.
 *
 * Turns a row table (`[{ date, region, revenue }, ...]`) into the series form
 * the trellis split consumes, with the facet value attached under the SAME
 * key `trellis.by` names, so the pivoted output flows through the exact split
 * path the series form already proved (union x alignment included).
 *
 * Deliberately local to the trellis (plan §6.2): this is NOT a general
 * tabular input for the library. Aggregation is explicitly out of scope: two
 * rows landing on the same (panel, series, x) keep the LAST and warn once,
 * because silently summing is worse than refusing.
 *
 * Pure module: no DOM, no `w`, fully unit-testable in Node.
 *
 * @module modules/trellis/pivotRows
 */

/**
 * @typedef {Object} PivotResult
 * @property {any[]} series    series-form output ({ name, [by]: key, data })
 * @property {string[]} warnings
 */

/**
 * Pivot tidy rows into trellis series.
 *
 * @param {any[]} rows  plain row objects
 * @param {{ by?: any, x?: string, y?: string, seriesBy?: string }} spec
 *   by:       facet column name (must be a string for the tidy form)
 *   x:        x-value column name
 *   y:        y-value column name
 *   seriesBy: optional column whose values become series names; absent means
 *             one series per panel, named after the y column
 * @returns {PivotResult}
 */
export function pivotRows(rows, spec = {}) {
  /** @type {string[]} */
  const warnings = []
  const by = spec.by
  if (typeof by !== 'string' || !by) {
    return {
      series: [],
      warnings: [
        'trellis: tidy-row input (trellis.data) needs a string `by` column name',
      ],
    }
  }
  const xKey = spec.x
  const yKey = spec.y
  if (!xKey || !yKey) {
    return {
      series: [],
      warnings: [
        'trellis: tidy-row input (trellis.data) needs `x` and `y` column names',
      ],
    }
  }
  const list = Array.isArray(rows) ? rows : []
  if (!list.length) {
    return { series: [], warnings: ['trellis: trellis.data is empty'] }
  }

  const seriesBy = spec.seriesBy
  let skipped = 0
  let dupes = 0
  /**
   * facet -> (series name -> (x -> y)). Nested maps, so arbitrary key strings
   * can never collide, and the output keeps first-seen panel-then-series
   * order.
   * @type {Map<string, Map<string, Map<any, any>>>}
   */
  const acc = new Map()

  list.forEach((row) => {
    if (!row || typeof row !== 'object') {
      skipped++
      return
    }
    const facet = row[by]
    const x = row[xKey]
    if (facet === undefined || facet === null || x === undefined || x === null) {
      skipped++
      return
    }
    const name =
      seriesBy && row[seriesBy] !== undefined && row[seriesBy] !== null
        ? String(row[seriesBy])
        : String(yKey)
    let byName = acc.get(String(facet))
    if (!byName) {
      byName = new Map()
      acc.set(String(facet), byName)
    }
    let data = byName.get(name)
    if (!data) {
      data = new Map()
      byName.set(name, data)
    }
    const xk = x instanceof Date ? x.getTime() : x
    if (data.has(xk)) dupes++
    const y = row[yKey]
    data.set(xk, y === undefined ? null : y)
  })

  if (skipped) {
    warnings.push(
      `trellis: ${skipped} row(s) missing "${by}" or "${xKey}" were skipped`,
    )
  }
  if (dupes) {
    warnings.push(
      `trellis: ${dupes} duplicate (panel, series, x) row(s); kept the last. Aggregate the rows first if you want sums or means.`,
    )
  }

  /** @type {any[]} */
  const series = []
  acc.forEach((byName, facet) => {
    byName.forEach((data, name) => {
      series.push({
        name,
        [by]: facet,
        data: Array.from(data, ([x, y]) => ({ x, y })),
      })
    })
  })
  return { series, warnings }
}
