// @ts-check
/**
 * Trellis (#22): the pure data split.
 *
 * Groups a series array into panels by a facet key and re-emits every panel's
 * series against the UNION x-key list with explicit nulls. The union alignment
 * is load-bearing twice over (spike 22a, finding D5): it is what makes ragged
 * COLUMN panels satisfy the pixel-alignment invariant (bar width derives from
 * the panel's own point count), and it is what makes the group's index-matched
 * tooltip sync caption the right point on ragged data.
 *
 * Pure module: no DOM, no `w`, fully unit-testable in Node.
 *
 * @module modules/trellis/TrellisSplit
 */

/**
 * @typedef {Object} TrellisSlice
 * @property {string} key           resolved facet key ('North')
 * @property {any[]} series         the aligned series for this panel
 * @property {string[]} seriesNames names present in this panel, in order
 */

/**
 * @typedef {Object} TrellisSplitResult
 * @property {TrellisSlice[]} panels
 * @property {string[]} seriesNames  unique names across the trellis, first-seen
 * @property {'plain'|'paired'|'object'} xForm dominant data form
 * @property {Array<string|number>} unionX     union x keys (or indices for plain)
 * @property {boolean} xIsNumeric   union keys are all numeric (or Date-derived)
 * @property {number} dropped       panels dropped by `limit`
 * @property {string[]} warnings    human-readable anomalies (mixed forms, dupes)
 */

/**
 * Detect the data form of one series from its first non-null datum.
 * @param {any} data
 * @returns {'plain'|'paired'|'object'|'empty'}
 */
function detectForm(data) {
  if (!Array.isArray(data) || data.length === 0) return 'empty'
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    if (d === null || d === undefined) continue
    if (Array.isArray(d)) return 'paired'
    if (typeof d === 'object') return 'object'
    return 'plain'
  }
  return 'empty'
}

/**
 * The x key of one datum, normalized for map lookup (Date -> epoch ms).
 * Returns undefined for plain-form data (position IS the key there).
 * @param {any} d
 * @param {'plain'|'paired'|'object'|'empty'} form
 * @returns {string|number|undefined}
 */
function xKeyOf(d, form) {
  if (d === null || d === undefined) return undefined
  if (form === 'paired') {
    const x = d[0]
    return x instanceof Date ? x.getTime() : x
  }
  if (form === 'object') {
    const x = d.x
    return x instanceof Date ? x.getTime() : x
  }
  return undefined
}

/**
 * The null placeholder for a missing x in the series' own data form, so a
 * padded series keeps the shape its renderer expects.
 * @param {string|number} x
 * @param {'plain'|'paired'|'object'|'empty'} form
 */
function placeholderFor(x, form) {
  if (form === 'paired') return [x, null]
  if (form === 'object') return { x, y: null }
  return null
}

/**
 * Resolve the facet key of one series.
 * @param {any} s
 * @param {number} i
 * @param {string|Function} by
 * @returns {string|null} null when the series carries no key (repeat it)
 */
function keyOf(s, i, by) {
  const raw = typeof by === 'function' ? by(s, i) : s ? s[by] : undefined
  if (raw === undefined || raw === null || raw === '') return null
  return String(raw)
}

/**
 * Order the panel keys.
 * @param {string[]} keys first-seen order
 * @param {any} order 'first-seen' | 'asc' | 'desc' | string[] | comparator
 * @returns {string[]}
 */
export function orderKeys(keys, order) {
  if (!order || order === 'first-seen') return keys.slice()
  if (order === 'asc' || order === 'desc') {
    const sorted = keys.slice().sort((a, b) => {
      const na = Number(a)
      const nb = Number(b)
      if (isFinite(na) && isFinite(nb)) return na - nb
      return a < b ? -1 : a > b ? 1 : 0
    })
    return order === 'desc' ? sorted.reverse() : sorted
  }
  if (Array.isArray(order)) {
    // Explicit order first, then any keys it forgot, first-seen.
    const explicit = order.map(String).filter((k) => keys.indexOf(k) !== -1)
    const rest = keys.filter((k) => explicit.indexOf(k) === -1)
    return explicit.concat(rest)
  }
  if (typeof order === 'function') return keys.slice().sort(order)
  return keys.slice()
}

/**
 * Split a series array into aligned panel slices.
 *
 * Series carrying the facet key form panels; series WITHOUT the key repeat in
 * every panel (the reference-series case: one 'Target' series shared by all).
 *
 * @param {any[]} series the host config series
 * @param {{ by?: string|Function, order?: any, limit?: number }} cfg
 * @returns {TrellisSplitResult}
 */
export function split(series, cfg = {}) {
  const by = cfg.by || 'facet'
  /** @type {string[]} */
  const warnings = []

  /** @type {Map<string, any[]>} key -> series list */
  const byKey = new Map()
  /** @type {any[]} series repeated into every panel */
  const repeated = []

  const list = Array.isArray(series) ? series : []
  list.forEach((s, i) => {
    const k = keyOf(s, i, by)
    if (k === null) repeated.push(s)
    else {
      if (!byKey.has(k)) byKey.set(k, [])
      const arr = byKey.get(k)
      if (arr) arr.push(s)
    }
  })

  // No keyed series at all: nothing to facet.
  if (byKey.size === 0) {
    return {
      panels: [],
      seriesNames: [],
      xForm: 'plain',
      unionX: [],
      xIsNumeric: false,
      dropped: 0,
      warnings: ['trellis: no series carries the facet key; nothing to split'],
    }
  }

  let keys = orderKeys(Array.from(byKey.keys()), cfg.order)
  let dropped = 0
  if (typeof cfg.limit === 'number' && cfg.limit > 0 && keys.length > cfg.limit) {
    dropped = keys.length - cfg.limit
    keys = keys.slice(0, cfg.limit)
  }

  // ── Union x-key list (22a D5) ────────────────────────────────────────────
  // Collected over EVERY series that will render (kept panels + repeated), so
  // each panel can be re-emitted against the identical x list.
  /** @type {Array<string|number>} */
  const unionX = []
  const seen = new Set()
  let sawKeyed = false
  let sawPlain = false
  let plainMaxLen = 0
  /** @type {'plain'|'paired'|'object'} */
  let xForm = 'plain'

  const contributing = keys
    .reduce((/** @type {any[]} */ acc, k) => acc.concat(byKey.get(k) || []), [])
    .concat(repeated)

  contributing.forEach((s) => {
    const form = detectForm(s && s.data)
    if (form === 'empty') return
    if (form === 'plain') {
      sawPlain = true
      plainMaxLen = Math.max(plainMaxLen, s.data.length)
      return
    }
    sawKeyed = true
    xForm = form
    s.data.forEach((/** @type {any} */ d) => {
      const x = xKeyOf(d, form)
      if (x === undefined) return
      const id = typeof x + ':' + String(x)
      if (!seen.has(id)) {
        seen.add(id)
        unionX.push(x)
      }
    })
  })

  if (sawKeyed && sawPlain) {
    warnings.push(
      'trellis: mixing x-keyed data ([x,y] / {x,y}) with plain value arrays; plain series are padded by position, not by x',
    )
  }

  const xIsNumeric =
    sawKeyed && unionX.every((x) => typeof x === 'number' && isFinite(x))
  // Numeric x sorts ascending (a time axis must be monotonic); string
  // categories keep first-seen order (they are labels, not positions).
  if (xIsNumeric) unionX.sort((a, b) => Number(a) - Number(b))

  // ── Re-emission ──────────────────────────────────────────────────────────
  /** @type {string[]} */
  const seriesNames = []
  const nameSeen = new Set()
  /** @param {any} s @param {number} fallbackIdx */
  const nameOf = (s, fallbackIdx) =>
    s && s.name != null ? String(s.name) : `series-${fallbackIdx + 1}`

  /** @param {any} s @param {number} idx */
  const alignSeries = (s, idx) => {
    const form = detectForm(s && s.data)
    const name = nameOf(s, idx)
    if (!nameSeen.has(name)) {
      nameSeen.add(name)
      seriesNames.push(name)
    }
    /** @type {any} */
    const out = { ...s, name }
    if (form === 'plain' || form === 'empty') {
      // Positional data: pad the tail with nulls to the longest plain series
      // (or to the union length when keyed series define the frame).
      const targetLen = sawKeyed ? unionX.length : plainMaxLen
      const data = Array.isArray(s.data) ? s.data.slice(0, targetLen) : []
      while (data.length < targetLen) data.push(null)
      out.data = data
      return out
    }
    /** @type {Map<any, any>} */
    const map = new Map()
    s.data.forEach((/** @type {any} */ d) => {
      const x = xKeyOf(d, form)
      if (x !== undefined && !map.has(x)) map.set(x, d)
      else if (x !== undefined && map.has(x)) {
        warnings.push(
          `trellis: duplicate x "${String(x)}" in series "${name}"; keeping the first`,
        )
      }
    })
    out.data = unionX.map((x) => (map.has(x) ? map.get(x) : placeholderFor(x, form)))
    return out
  }

  let globalIdx = 0
  const panels = keys.map((key) => {
    const own = (byKey.get(key) || []).map((s) => alignSeries(s, globalIdx++))
    const rep = repeated.map((s) => alignSeries(s, globalIdx++))
    const slice = own.concat(rep)
    return {
      key,
      series: slice,
      seriesNames: slice.map((s) => s.name),
    }
  })

  return {
    panels,
    seriesNames,
    xForm: sawKeyed ? xForm : 'plain',
    unionX: sawKeyed
      ? unionX
      : Array.from({ length: plainMaxLen }, (_, i) => i),
    xIsNumeric,
    dropped,
    warnings,
  }
}
