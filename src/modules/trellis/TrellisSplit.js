// @ts-check
/**
 * Trellis (#22): the pure data split.
 *
 * Groups a series array into panels by facet key(s) and re-emits every
 * panel's series against the UNION x-key list with explicit nulls. The union
 * alignment is load-bearing twice over (spike 22a, finding D5): it is what
 * makes ragged COLUMN panels satisfy the pixel-alignment invariant (bar width
 * derives from the panel's own point count), and it is what makes the group's
 * index-matched tooltip sync caption the right point on ragged data.
 *
 * One dimension (`by`) wraps into responsive columns (P1); two dimensions
 * (`row` x `column`, P4) form a fixed grid in row-major order, with every
 * (row, column) combination present so missing combinations keep their grid
 * slot (the emptyPanels policy is the orchestrator's concern; the split just
 * marks them).
 *
 * Reference-series semantics generalize per dimension: a series carrying
 * NEITHER key repeats in every panel; one carrying ONLY the row key repeats
 * across that row; ONLY the column key, down that column.
 *
 * Pure module: no DOM, no `w`, fully unit-testable in Node.
 *
 * @module modules/trellis/TrellisSplit
 */

/**
 * @typedef {Object} TrellisSlice
 * @property {string} key           display/lookup key ('North', or 'Sales / Q1')
 * @property {string|null} rowKey   2-D only
 * @property {string|null} colKey   2-D only
 * @property {any[]} series         the aligned series for this panel
 * @property {string[]} seriesNames names present in this panel, in order
 * @property {boolean} empty        nothing renders in this panel
 */

/**
 * @typedef {Object} TrellisSplitResult
 * @property {'1d'|'2d'} mode
 * @property {TrellisSlice[]} panels row-major in 2-D
 * @property {string[]|null} rowKeys 2-D only, ordered
 * @property {string[]|null} colKeys 2-D only, ordered
 * @property {string[]} seriesNames  unique names across the trellis, first-seen
 * @property {'plain'|'paired'|'object'} xForm dominant data form
 * @property {Array<string|number>} unionX     union x keys (or indices for plain)
 * @property {boolean} xIsNumeric   union keys are all numeric (or Date-derived)
 * @property {number} dropped       panels dropped by `limit` (1-D only)
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
 * Resolve the facet key of one series along one dimension.
 * @param {any} s
 * @param {number} i
 * @param {string|Function} by
 * @returns {string|null} null when the series carries no key (repeat it)
 */
export function keyOf(s, i, by) {
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
 * Collect the union x-key list over every series that will render (22a D5).
 * @param {any[]} contributing
 * @param {string[]} warnings mutated
 */
function collectUnion(contributing, warnings) {
  /** @type {Array<string|number>} */
  const unionX = []
  const seen = new Set()
  let sawKeyed = false
  let sawPlain = false
  let plainMaxLen = 0
  /** @type {'plain'|'paired'|'object'} */
  let xForm = 'plain'

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

  return { unionX, sawKeyed, plainMaxLen, xForm, xIsNumeric }
}

/**
 * Build the aligner: re-emits one series against the union x list, recording
 * trellis-wide series names first-seen.
 * @param {ReturnType<typeof collectUnion>} u
 * @param {string[]} warnings mutated
 */
function makeAligner(u, warnings) {
  /** @type {string[]} */
  const seriesNames = []
  const nameSeen = new Set()
  let globalIdx = 0

  /** @param {any} s */
  const align = (s) => {
    const form = detectForm(s && s.data)
    const name =
      s && s.name != null ? String(s.name) : `series-${globalIdx + 1}`
    globalIdx++
    if (!nameSeen.has(name)) {
      nameSeen.add(name)
      seriesNames.push(name)
    }
    /** @type {any} */
    const out = { ...s, name }
    if (form === 'plain' || form === 'empty') {
      // Positional data: pad the tail with nulls to the longest plain series
      // (or to the union length when keyed series define the frame).
      const targetLen = u.sawKeyed ? u.unionX.length : u.plainMaxLen
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
    out.data = u.unionX.map((x) =>
      map.has(x) ? map.get(x) : placeholderFor(x, form),
    )
    return out
  }

  return { align, seriesNames }
}

/**
 * One valueless series aligned to the split's union x list, in the dominant
 * data form: the 'placeholder' emptyPanels mode mounts a REAL panel with
 * this series, so the placeholder runs the exact scale/geometry code every
 * other panel runs and the alignment invariant holds by construction.
 *
 * Bar-family types get DEGENERATE ZERO marks instead of nulls: the numeric
 * bar pad (`gridPadForColumnsInNumericAxis`, the D5 geometry) only engages
 * for series that draw, so an all-null bar placeholder would sit ~a bar
 * width wider than its siblings. Zero-size marks at the baseline engage the
 * pad and paint nothing (the shared bar scale is zero-floored).
 *
 * @param {TrellisSplitResult} splitResult
 * @param {{ name?: string, chartType?: string }} [opts]
 * @returns {any}
 */
export function placeholderSeries(splitResult, opts = {}) {
  const form = splitResult.xForm
  /** @type {Record<string, any>} */
  const zeroByType = {
    bar: 0,
    column: 0,
    rangeBar: [0, 0],
    candlestick: [0, 0, 0, 0],
    boxPlot: [0, 0, 0, 0, 0],
  }
  const fill =
    opts.chartType && opts.chartType in zeroByType
      ? zeroByType[opts.chartType]
      : null
  /** @param {string|number} x */
  const datum = (x) => {
    if (fill === null) return placeholderFor(x, form)
    const y = Array.isArray(fill) ? fill.slice() : fill
    return form === 'object' ? { x, y } : [x, y]
  }
  const data =
    form === 'plain'
      ? splitResult.unionX.map(() => fill)
      : splitResult.unionX.map(datum)
  return { name: opts.name || splitResult.seriesNames[0] || 'series-1', data }
}

/**
 * Split a series array into aligned panel slices.
 *
 * One dimension: series carrying `by` form panels; series WITHOUT the key
 * repeat in every panel. Two dimensions (`row`/`column` in cfg): panels are
 * every (row, column) combination in row-major order; `by` is ignored (with
 * a warning) when either is present.
 *
 * @param {any[]} series the host config series
 * @param {{ by?: string|Function, row?: string|Function, column?: string|Function, order?: any, limit?: number }} cfg
 * @returns {TrellisSplitResult}
 */
export function split(series, cfg = {}) {
  /** @type {string[]} */
  const warnings = []
  const list = Array.isArray(series) ? series : []

  if (cfg.row || cfg.column) {
    if (cfg.by) {
      warnings.push(
        'trellis: `by` is ignored when `row`/`column` are set (they are mutually exclusive)',
      )
    }
    return split2d(list, cfg, warnings)
  }

  const by = cfg.by || 'facet'

  /** @type {Map<string, any[]>} key -> series list */
  const byKey = new Map()
  /** @type {any[]} series repeated into every panel */
  const repeated = []

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
    return emptyResult([
      'trellis: no series carries the facet key; nothing to split',
    ])
  }

  let keys = orderKeys(Array.from(byKey.keys()), cfg.order)
  let dropped = 0
  if (typeof cfg.limit === 'number' && cfg.limit > 0 && keys.length > cfg.limit) {
    dropped = keys.length - cfg.limit
    keys = keys.slice(0, cfg.limit)
  }

  // Union collected over EVERY series that will render (kept panels +
  // repeated), so each panel is re-emitted against the identical x list.
  const contributing = keys
    .reduce((/** @type {any[]} */ acc, k) => acc.concat(byKey.get(k) || []), [])
    .concat(repeated)
  const u = collectUnion(contributing, warnings)
  const { align, seriesNames } = makeAligner(u, warnings)

  const panels = keys.map((key) => {
    const own = (byKey.get(key) || []).map(align)
    const rep = repeated.map(align)
    const slice = own.concat(rep)
    return {
      key,
      rowKey: null,
      colKey: null,
      series: slice,
      seriesNames: slice.map((/** @type {any} */ s) => s.name),
      empty: slice.length === 0,
    }
  })

  return {
    mode: /** @type {'1d'} */ ('1d'),
    panels,
    rowKeys: null,
    colKeys: null,
    seriesNames,
    xForm: u.sawKeyed ? u.xForm : 'plain',
    unionX: u.sawKeyed
      ? u.unionX
      : Array.from({ length: u.plainMaxLen }, (_, i) => i),
    xIsNumeric: u.xIsNumeric,
    dropped,
    warnings,
  }
}

/** @param {string[]} warnings @returns {TrellisSplitResult} */
function emptyResult(warnings) {
  return {
    mode: '1d',
    panels: [],
    rowKeys: null,
    colKeys: null,
    seriesNames: [],
    xForm: 'plain',
    unionX: [],
    xIsNumeric: false,
    dropped: 0,
    warnings,
  }
}

/**
 * The 2-D split (P4). Either dimension may be absent (a single pseudo-group):
 * `row` alone is a vertical strip of rows, `column` alone one row of columns.
 * @param {any[]} list
 * @param {{ row?: string|Function, column?: string|Function, order?: any, limit?: number }} cfg
 * @param {string[]} warnings
 * @returns {TrellisSplitResult}
 */
function split2d(list, cfg, warnings) {
  const rowBy = cfg.row
  const colBy = cfg.column

  /** @type {Map<string, Map<string, any[]>>} rowKey -> colKey -> series */
  const cells = new Map()
  /** @type {Map<string, any[]>} row-scoped reference series */
  const rowRepeats = new Map()
  /** @type {Map<string, any[]>} column-scoped reference series */
  const colRepeats = new Map()
  /** @type {any[]} everywhere reference series */
  const repeated = []
  /** @type {string[]} */
  const rowSeen = []
  /** @type {string[]} */
  const colSeen = []
  /** @param {string[]} arr @param {string} k */
  const note = (arr, k) => {
    if (arr.indexOf(k) === -1) arr.push(k)
  }

  list.forEach((s, i) => {
    // An absent dimension accessor groups everything under one '' key; an
    // accessor that exists but yields nothing marks a reference series.
    const rk = rowBy ? keyOf(s, i, rowBy) : ''
    const ck = colBy ? keyOf(s, i, colBy) : ''
    if (rk === null && ck === null) {
      repeated.push(s)
      return
    }
    if (rk === null) {
      note(colSeen, /** @type {string} */ (ck))
      if (!colRepeats.has(/** @type {string} */ (ck))) {
        colRepeats.set(/** @type {string} */ (ck), [])
      }
      colRepeats.get(/** @type {string} */ (ck))?.push(s)
      return
    }
    if (ck === null) {
      note(rowSeen, rk)
      if (!rowRepeats.has(rk)) rowRepeats.set(rk, [])
      rowRepeats.get(rk)?.push(s)
      return
    }
    note(rowSeen, rk)
    note(colSeen, ck)
    let cols = cells.get(rk)
    if (!cols) {
      cols = new Map()
      cells.set(rk, cols)
    }
    let arr = cols.get(ck)
    if (!arr) {
      arr = []
      cols.set(ck, arr)
    }
    arr.push(s)
  })

  if (!rowSeen.length && !colSeen.length) {
    return emptyResult([
      'trellis: no series carries the row/column facet keys; nothing to split',
    ])
  }
  if (typeof cfg.limit === 'number' && cfg.limit > 0) {
    warnings.push('trellis: `limit` is not applied to a 2-D grid; ignoring it')
  }

  const rowKeys = orderKeys(rowSeen.length ? rowSeen : [''], cfg.order)
  const colKeys = orderKeys(colSeen.length ? colSeen : [''], cfg.order)

  // Everything renders somewhere, so everything feeds the union.
  const u = collectUnion(list, warnings)
  const { align, seriesNames } = makeAligner(u, warnings)

  /** @type {TrellisSlice[]} */
  const panels = []
  rowKeys.forEach((rk) => {
    colKeys.forEach((ck) => {
      const own = cells.get(rk)?.get(ck) || []
      const slice = own
        .concat(rowRepeats.get(rk) || [])
        .concat(colRepeats.get(ck) || [])
        .concat(repeated)
        .map(align)
      panels.push({
        key: [rk, ck].filter((k) => k !== '').join(' / ') || 'all',
        rowKey: rk,
        colKey: ck,
        series: slice,
        seriesNames: slice.map((/** @type {any} */ s) => s.name),
        empty: slice.length === 0,
      })
    })
  })

  return {
    mode: /** @type {'2d'} */ ('2d'),
    panels,
    rowKeys,
    colKeys,
    seriesNames,
    xForm: u.sawKeyed ? u.xForm : 'plain',
    unionX: u.sawKeyed
      ? u.unionX
      : Array.from({ length: u.plainMaxLen }, (_, i) => i),
    xIsNumeric: u.xIsNumeric,
    dropped: 0,
    warnings,
  }
}
