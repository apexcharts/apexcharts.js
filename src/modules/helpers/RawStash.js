/**
 * Shared by the transforms that keep a raw stash of the series and rebuild
 * their rows from it (histogram, streamgraph, waterfall, dumbbell, and the
 * zoom-aware data reducer), so they agree with the legend about what is
 * hidden. Not a shared module: each bundle that imports it carries its copy.
 */

/**
 * The indices of every series the legend has hidden. A series on a y axis
 * with `showAlways` is recorded on the ancillary list, and a rebuild from the
 * stash that read only the main one drew it again.
 *
 * @param {any} gl
 * @returns {number[]}
 */
export function collapsedIndices(gl) {
  return (gl.collapsedSeriesIndices || []).concat(
    gl.ancillaryCollapsedSeriesIndices || [],
  )
}

/**
 * Copy the series as the raw stash keeps them. A series hidden when the stash
 * is taken (`hidden: true` at init, or a legend hide kept across new data)
 * arrives emptied, its rows held by its collapse record, so the stash takes
 * them from there: stashing the empty row lost the series for good, and
 * showing it brought back nothing.
 *
 * The `hidden` flag stays out of the stash. It only says how the chart
 * starts, the collapse lists track it from then on, and the rows rebuilt from
 * the stash would otherwise carry it into every later render and hide the
 * series again right after it was shown.
 *
 * @param {any[]} ser
 * @param {any} gl
 * @returns {any[]}
 */
export function stashSeries(ser, gl) {
  const records = (gl.collapsedSeries || []).concat(
    gl.ancillaryCollapsedSeries || [],
  )
  return ser.map((/** @type {any} */ s, /** @type {number} */ i) => {
    const { hidden: _hidden, ...rest } = s || {}
    let data = rest.data
    if (Array.isArray(data) && !data.length) {
      const rec = records.find((/** @type {any} */ r) => r.index === i)
      if (rec && Array.isArray(rec.data)) data = rec.data
    }
    return { ...rest, data: Array.isArray(data) ? data.slice() : data }
  })
}
