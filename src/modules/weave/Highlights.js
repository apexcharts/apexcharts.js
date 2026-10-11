// @ts-check
/**
 * Plugin-supplied highlight parts: how a plugin draws a PART of each value
 * inside the slot that value already occupies.
 *
 * The highlight filter feature draws a datum's whole faded and a part of it
 * solid in front, from the same baseline, in the same slot. That is exactly the
 * shape a plugin wants when it has a second number per datum to show: a
 * forecast's realised portion, a target's attainment, a running total's share
 * so far. Drawing it as a part costs the caller's chart nothing, where the
 * alternative, adding a derived series, costs them a legend entry, a tooltip
 * row, an export column and a rescaled value axis.
 *
 * The feature's own `set()` cannot be that seam. It writes the parts onto the
 * series and calls `updateSeries`, which is the caller's data; a plugin that
 * did that would hit the four failure modes `weave/Claims` lists, plus a fifth
 * that is worse here, because the parts ride on the data rather than beside it:
 * a plugin's pick and a caller's own `updateSeries` would overwrite each other
 * point by point.
 *
 * So a plugin REGISTERS parts and the host answers with them where the feature
 * reads them, at the end of every parse. Nothing is written to `w.config`.
 * Releasing is a deletion, not a restore.
 *
 * ## Precedence, and why it is barely exercised
 *
 * A datum's own `highlight` key wins, and so does a series' own
 * `highlightData`. A plugin is an overlay on the chart as configured, and the
 * chart as configured may already be showing a dashboard's filter.
 *
 * In practice that tie is never reached, because `api.highlight()` refuses
 * outright on a chart whose series carry parts of their own (see
 * `WeaveHost._highlight`). Refusing is better than merging: a viewer looking at
 * a filtered dashboard would have no way to tell which parts were the filter's
 * and which were the plugin's, and the plugin gets a null it can fall back
 * from. The rule here is what makes that refusal safe to race against, since
 * the caller can add `highlightData` at any moment after the plugin registered.
 *
 * ## Where the state lives
 *
 * On `w`, beside `weaveClaims` and for the same reason: `initGlobalVars` runs
 * again on every `resetGlobals`, so anything in globals is wiped by an
 * `updateSeries`, and a registration has to survive the caller's own updates.
 * Created lazily, so a chart with no plugin parts carries nothing.
 *
 * @module weave/Highlights
 */

import { indexOfSeries } from './Claims'

/**
 * @typedef {Object} HighlightEntry
 * @property {string|number} series  a series NAME, or a position
 * @property {Array<number|null>} values  parallel to that series' data
 */

/**
 * @typedef {Object} HighlightRecord
 * @property {string} owner
 * @property {HighlightEntry[]} entries
 */

/**
 * The per-chart store, created on first registration.
 * @param {any} w
 */
function store(w) {
  if (!w.weaveHighlights) w.weaveHighlights = { records: [] }
  return w.weaveHighlights
}

/**
 * Whether anything is registered at all.
 *
 * The hot path is the absence of plugin parts, which is every chart in the
 * world that has no plugin doing this: one property check and out, before the
 * parse loop reads a single datum.
 *
 * @param {any} w
 */
export function hasHighlights(w) {
  return !!(w && w.weaveHighlights && w.weaveHighlights.records.length)
}

/**
 * Keep the entries that can be used, warning about the rest.
 *
 * A bad entry is dropped rather than failing the whole registration, on the
 * same terms as a claim: a plugin highlighting ten series and getting one wrong
 * should still draw the nine, and the warning names the series so the tenth is
 * findable.
 *
 * A value that is not a finite number is kept as null rather than dropped,
 * because position matters: the row is parallel to the series' data, and
 * dropping an entry would shift every part after it onto the wrong datum. Null
 * is the feature's own word for "this datum has no part", so a row with gaps in
 * it says what it means.
 *
 * @param {any} entries
 * @returns {HighlightEntry[]}
 */
export function normaliseHighlightEntries(entries) {
  /** @type {HighlightEntry[]} */
  const out = []
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (
      !entry ||
      (typeof entry.series !== 'string' && typeof entry.series !== 'number')
    ) {
      console.warn(
        '[apexcharts] highlight: each entry needs a series name or index.',
      )
      continue
    }
    if (!Array.isArray(entry.values)) {
      console.warn(
        `[apexcharts] highlight: expected an array of values for series ${String(
          entry.series,
        )}, got ${typeof entry.values}.`,
      )
      continue
    }
    out.push({
      series: entry.series,
      values: entry.values.map((/** @type {any} */ v) =>
        typeof v === 'number' && Number.isFinite(v) ? v : null,
      ),
    })
  }
  return out
}

/**
 * Register a plugin's parts.
 *
 * Returns null when nothing usable was handed in, so a plugin that computed an
 * empty pick gets the same null it gets from a host that cannot draw parts at
 * all, and has one branch to write rather than two.
 *
 * @param {any} w
 * @param {string} owner  plugin name
 * @param {any} entries
 * @returns {HighlightRecord|null}
 */
export function addHighlight(w, owner, entries) {
  const normalised = normaliseHighlightEntries(entries)
  if (!normalised.length) return null
  const record = { owner, entries: normalised }
  // Appended, so the LAST registration naming a series wins and the order is
  // the order plugins ran in: deterministic, and independent of render order.
  store(w).records.push(record)
  return record
}

/**
 * Drop one registration. Idempotent: releasing twice is not an error.
 * @param {any} w
 * @param {HighlightRecord} record
 */
export function releaseHighlight(w, record) {
  if (!w || !w.weaveHighlights || !record) return
  const list = w.weaveHighlights.records
  const at = list.indexOf(record)
  if (at > -1) list.splice(at, 1)
}

/**
 * Drop every registration held by one plugin.
 *
 * Called on teardown and when the host disables a plugin after repeated hook
 * failures, which is what makes a permanent leak unreachable: a plugin cannot
 * leave parts on someone's chart, however badly it behaves.
 *
 * @param {any} w
 * @param {string} owner
 */
export function releaseHighlightOwner(w, owner) {
  if (!w || !w.weaveHighlights) return
  const list = w.weaveHighlights.records
  const kept = list.filter((/** @type {HighlightRecord} */ r) => r.owner !== owner)
  if (kept.length !== list.length) w.weaveHighlights.records = kept
}

/**
 * The parts registered for one series, or null.
 *
 * Resolved by NAME each time the parse runs, which is what lets a registration
 * survive the caller adding, removing or reordering series: the position a name
 * resolves to is read fresh rather than remembered.
 *
 * @param {any} w
 * @param {number} seriesIndex
 * @returns {Array<number|null>|null}
 */
export function resolveHighlightRow(w, seriesIndex) {
  if (!hasHighlights(w)) return null
  /** @type {Array<number|null>|null} */
  let resolved = null
  // Forwards, so the last registration naming this series wins: see addHighlight.
  for (const record of w.weaveHighlights.records) {
    for (const entry of record.entries) {
      if (indexOfSeries(w, entry.series) === seriesIndex) resolved = entry.values
    }
  }
  return resolved
}
