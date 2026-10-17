// @ts-check
/**
 * The key an x value is joined and sorted on, for the add-ons that build
 * their own columns out of several series (streamgraph, trellis split).
 *
 * A Date is keyed by its epoch, so two Date objects for the same instant are
 * one column. On a datetime axis a date STRING is keyed by the epoch it parses
 * to, with the same parser the axis plots it by, so '2024-02-01' and the
 * matching timestamp are one column and the columns sort by time rather than
 * by the order they were first seen. Anything else (a category name, a
 * number, a string that is not a date) is its own key.
 *
 * `withX` below gives a combo series' bare numbers the same x, for the
 * transforms that hand their own series back as `{x, y}`.
 *
 * Not a shared module: each bundle that imports it carries its own copy.
 */
import DateTime from '../../utils/DateTime'

/**
 * @param {any} x
 * @param {boolean} datetime - the x axis is `type: 'datetime'`
 * @returns {any}
 */
export function xKey(x, datetime) {
  if (x instanceof Date) return x.getTime()
  if (datetime && typeof x === 'string') {
    const t = DateTime.prototype.parseDate(x)
    if (!isNaN(t)) return t
  }
  return x
}

/**
 * A combo series' data with every bare number (or null) written as `{x, y}`,
 * x taken from `categories[j]`, else `j + 1`: the x the add-on gives its own
 * datum at that index.
 *
 * The streamgraph and waterfall transforms hand their own series back as
 * `{x, y}` objects, and core reads every series of a chart in one shape, so a
 * bare-number line left beside them has no x at all and draws nothing.
 *
 * @param {any[]} data
 * @param {any[]|undefined} categories
 * @returns {any[]}
 */
export function withX(data, categories) {
  return data.map((d, j) =>
    d !== null && typeof d === 'object'
      ? d
      : {
          x: categories && categories[j] !== undefined ? categories[j] : j + 1,
          y: d,
        },
  )
}
