// @ts-check
/**
 * Positional option claims: how a plugin sets an option for ITS OWN series.
 *
 * Some chart options are indexed by series position with no per-series escape
 * hatch. `stroke.dashArray` is the clearest: a plugin that adds a projection and
 * wants only the projection dashed has to write the array covering every series.
 * Done in the plugin, that has four failure modes, three of which no amount of
 * care can fix:
 *
 *   1. it flattens the caller's own dashes, unless it first reads them,
 *   2. it restores a stale value if the caller changed the option meanwhile,
 *   3. it leaks the write permanently if the plugin throws before restoring,
 *   4. two plugins fight, and whichever releases last restores the other's write.
 *
 * So the plugin declares a CLAIM and the host answers the question where the
 * option is READ. Nothing is written to `w.config`: the caller's configuration
 * is what it always was, and a claim is an overlay consulted at the point of
 * use. Releasing a claim is therefore not a restore, it is a deletion, and
 * there is nothing to put back or to get wrong.
 *
 * ## Why this is an allowlist
 *
 * An unbounded `claim(path, value)` is "write anything to the caller's config",
 * which is the thing this platform refuses to do. An option earns a place here
 * only if it is positional, has no per-series alternative in the caller's own
 * data, and is read in few enough places to resolve at all. `colors` fails the
 * second test: a series carries its own `color`, so a plugin adding one sets it
 * there and needs nothing from the host.
 *
 * ## Where the state lives
 *
 * On `w`, beside `dom` and `interact`, for the reason those two are there
 * rather than in globals: `initGlobalVars` runs again on every `resetGlobals`,
 * so anything in globals is wiped by an `updateSeries`. A claim has to survive
 * a caller's update, because the point of it is that the caller's own changes
 * and the plugin's claim compose instead of overwriting each other. Created
 * lazily, so a chart with no claims carries nothing and a build without the
 * Weave host never creates it at all.
 *
 * See `plans/26-weave-capabilities.md`.
 *
 * @module weave/Claims
 */

/**
 * Options a plugin may claim, and the value type each takes per series.
 *
 * Adding a row is a decision about the three-part test in this file's header,
 * not a convenience. `tests/unit/weave-claims.spec.js` asserts the shape of
 * this table so a row cannot be added without one.
 *
 * `dataLabels.enabledOnSeries` is a membership list in the caller's config and
 * a boolean here on purpose: a claim answers "does THIS series print labels",
 * which is the question the consumption site asks, rather than restating the
 * caller's list shape.
 */
export const CLAIMABLE = Object.freeze({
  'stroke.dashArray': Object.freeze({ type: 'number' }),
  'dataLabels.enabledOnSeries': Object.freeze({ type: 'boolean' }),
})

/**
 * @typedef {Object} ClaimEntry
 * @property {string|number} series  a series NAME, or a position
 * @property {any} value
 */

/**
 * @typedef {Object} ClaimRecord
 * @property {string} owner
 * @property {string} option
 * @property {ClaimEntry[]} entries
 */

/**
 * The per-chart store, created on first claim.
 * @param {any} w
 */
function store(w) {
  if (!w.weaveClaims) w.weaveClaims = { byOption: new Map() }
  return w.weaveClaims
}

/** @param {any} w @param {string} option @returns {ClaimRecord[]} */
function claimsFor(w, option) {
  const s = store(w)
  if (!s.byOption.has(option)) s.byOption.set(option, [])
  return s.byOption.get(option)
}

/**
 * Keep the entries this option can actually use, warning about the rest.
 *
 * A bad entry is dropped rather than failing the whole claim: a plugin claiming
 * ten series and getting one wrong should still dash the nine, and the warning
 * names the option and the value so the tenth is findable.
 *
 * @param {string} option
 * @param {any} entries
 * @returns {ClaimEntry[]}
 */
export function normaliseEntries(option, entries) {
  const spec = /** @type {Record<string, {type: string}>} */ (CLAIMABLE)[option]
  const out = []
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || (typeof entry.series !== 'string' && typeof entry.series !== 'number')) {
      console.warn(
        `[apexcharts] claim on "${option}": each entry needs a series name or index.`,
      )
      continue
    }
    if (typeof entry.value !== spec.type) {
      console.warn(
        `[apexcharts] claim on "${option}": expected a ${spec.type} for series ${String(
          entry.series,
        )}, got ${typeof entry.value}.`,
      )
      continue
    }
    out.push({ series: entry.series, value: entry.value })
  }
  return out
}

/**
 * Register a claim. Returns null for an option that is not claimable, so a
 * plugin written against a newer host degrades instead of throwing.
 *
 * @param {any} w
 * @param {string} owner  plugin name
 * @param {string} option
 * @param {any} entries
 * @returns {ClaimRecord|null}
 */
export function addClaim(w, owner, option, entries) {
  if (!Object.prototype.hasOwnProperty.call(CLAIMABLE, option)) {
    console.warn(
      `[apexcharts] "${option}" is not a claimable option. Claimable: ${Object.keys(
        CLAIMABLE,
      ).join(', ')}.`,
    )
    return null
  }
  const record = { owner, option, entries: normaliseEntries(option, entries) }
  // Appended, so the LAST claim on a series wins and the order is the order
  // plugins ran in. Deterministic, and independent of render order.
  claimsFor(w, option).push(record)
  return record
}

/**
 * Drop one claim. Idempotent: releasing twice is not an error.
 * @param {any} w
 * @param {ClaimRecord} record
 */
export function releaseClaim(w, record) {
  if (!w.weaveClaims || !record) return
  const list = w.weaveClaims.byOption.get(record.option)
  if (!list) return
  const at = list.indexOf(record)
  if (at > -1) list.splice(at, 1)
}

/**
 * Drop every claim held by one plugin.
 *
 * Called on teardown and when the host disables a plugin after repeated hook
 * failures, which is what makes failure mode 3 unreachable: a plugin cannot
 * leave a claim behind, however badly it behaves.
 *
 * @param {any} w
 * @param {string} owner
 */
export function releaseOwner(w, owner) {
  if (!w.weaveClaims) return
  for (const [option, list] of w.weaveClaims.byOption) {
    const kept = list.filter((/** @type {ClaimRecord} */ c) => c.owner !== owner)
    if (kept.length !== list.length) w.weaveClaims.byOption.set(option, kept)
  }
}

/**
 * Which series an entry names, or -1.
 *
 * A NAME is resolved here rather than at claim time, which is what lets a claim
 * survive the caller adding, removing or reordering series: the position a name
 * resolves to is read fresh every time the option is. A number is taken as a
 * position, for charts whose series have no names.
 *
 * @param {any} w @param {string|number} series
 */
function indexOfSeries(w, series) {
  if (typeof series === 'number') return series
  const list = (w.config && w.config.series) || []
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].name === series) return i
  }
  return -1
}

/**
 * The value of a claimable option for one series: a claim if one names it,
 * otherwise what the caller configured.
 *
 * The hot path is the absence of claims, which is every chart that has no
 * plugin doing this: one property check and out. Call it with the value the
 * caller's config resolves to, so this file never has to know the shape of
 * an option, only that a claim overrides it.
 *
 * @template T
 * @param {any} w
 * @param {string} option
 * @param {number} seriesIndex
 * @param {T} fallback  what the caller's own config says for this series
 * @returns {T}
 */
export function resolveClaimed(w, option, seriesIndex, fallback) {
  if (!w || !w.weaveClaims) return fallback
  const list = w.weaveClaims.byOption.get(option)
  if (!list || !list.length) return fallback

  let resolved = fallback
  // Forwards, so the last claim naming this series wins: see addClaim.
  for (const claim of list) {
    for (const entry of claim.entries) {
      if (indexOfSeries(w, entry.series) === seriesIndex) resolved = entry.value
    }
  }
  return resolved
}
