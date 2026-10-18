// @ts-check

/**
 * Lookups into the previous render's captured paths
 * (`w.globals.previousPaths`, filled by Series.getPreviousPaths) for the
 * renderers that morph from them.
 *
 * Each renderer used to find a series' records with a linear scan of every
 * captured record, two parseInt calls per entry, once per series (line,
 * radar) or once per bar (bar family). On a chart with many series that is
 * S x N x S work per update. The records are indexed by series once per
 * capture instead.
 */

/** @type {WeakMap<any[], {n: number, m: Map<number, any[]>}>} */
const indexes = new WeakMap()

/**
 * Every captured record of a series, in capture order (the order the old
 * scans visited them, so a "last match wins" caller still ends on the same
 * record). Keyed by the array: a capture always starts a new one, and the
 * length check catches an array appended to after it was indexed.
 *
 * @param {any} w
 * @param {number | string} realIndex
 * @returns {any[]}
 */
export function prevRecords(w, realIndex) {
  const all = w.globals.previousPaths
  let idx = indexes.get(all)
  if (!idx || idx.n !== all.length) {
    idx = { n: all.length, m: new Map() }
    for (const gpp of all) {
      // Non-axis charts leave plain values here, which carry no index.
      const k = parseInt((gpp || {}).realIndex, 10)
      if (k === k) {
        const list = idx.m.get(k)
        if (list) list.push(gpp)
        else idx.m.set(k, [gpp])
      }
    }
    indexes.set(all, idx)
  }
  return idx.m.get(parseInt(String(realIndex), 10)) || []
}
