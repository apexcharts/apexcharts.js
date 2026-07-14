// @ts-check
/**
 * Crossfilter engine (Linked Views #4, Phase 2 / P2.1).
 *
 * The pure aggregation core behind `ApexCharts.crossfilter(...)`. It holds one
 * shared record set and, per participating chart, a DIMENSION (row -> key), a
 * REDUCTION (rows -> scalar), and a FILTER (a Set of selected categorical keys,
 * or a numeric `[min,max]` range).
 *
 * Crossfilter semantics: a chart's aggregation is computed over the records that
 * pass EVERY OTHER chart's filter (a chart never filters itself), so each chart
 * always shows "what else is available". A chart's own filter only marks which
 * of its own buckets are selected (used by the glue layer to self-dim).
 *
 * This module is intentionally free of DOM and browser globals (only the
 * `globalThis` id-registry, mirroring `__apexcharts_registry__`), so the
 * aggregation math is unit-testable in isolation. Chart wiring (reading
 * `chart.link`, injecting series, redrawing siblings) lives in LinkedViews and
 * is layered on top in later phases.
 *
 * @module modules/link/Crossfilter
 */

const REGISTRY_KEY = '__apexcharts_crossfilters__'

/**
 * Strip floating-point noise (0.30000000000000004 -> 0.3) without wrecking
 * large magnitudes such as timestamps.
 * @param {number} x
 * @returns {number}
 */
function cleanFloat(x) {
  if (!Number.isFinite(x)) return x
  const n = Number(x.toPrecision(12))
  return Object.is(n, -0) ? 0 : n
}

/**
 * Is v a usable finite numeric value for range bucketing/filtering.
 * @param {*} v
 * @returns {v is number}
 */
function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

/**
 * Normalize a `reduce` spec into a `(rows) => number` reducer.
 * @param {'count'|{sum?:string,avg?:string,min?:string,max?:string}|((rows:any[])=>number)|undefined} reduce
 * @returns {(rows:any[])=>number}
 */
function makeReducer(reduce) {
  if (typeof reduce === 'function') return reduce
  if (reduce && typeof reduce === 'object') {
    if (typeof reduce.sum === 'string') {
      const f = reduce.sum
      return (rows) => rows.reduce((a, r) => a + (Number(r[f]) || 0), 0)
    }
    if (typeof reduce.avg === 'string') {
      const f = reduce.avg
      return (rows) =>
        rows.length
          ? rows.reduce((a, r) => a + (Number(r[f]) || 0), 0) / rows.length
          : 0
    }
    if (typeof reduce.min === 'string') {
      const f = reduce.min
      return (rows) =>
        rows.length ? Math.min(...rows.map((r) => Number(r[f]) || 0)) : 0
    }
    if (typeof reduce.max === 'string') {
      const f = reduce.max
      return (rows) =>
        rows.length ? Math.max(...rows.map((r) => Number(r[f]) || 0)) : 0
    }
  }
  // 'count' (default)
  return (rows) => rows.length
}

/**
 * Discover the ordered, distinct categorical keys over the full record set.
 * @param {any[]} records
 * @param {(row:any)=>any} accessor
 * @param {'first-seen'|'asc'|'desc'|((a:any,b:any)=>number)|undefined} order
 * @returns {any[]}
 */
function categoryDomain(records, accessor, order) {
  const seen = new Set()
  const keys = []
  for (let i = 0; i < records.length; i++) {
    const k = accessor(records[i])
    if (k == null) continue
    if (!seen.has(k)) {
      seen.add(k)
      keys.push(k)
    }
  }
  if (typeof order === 'function') return keys.slice().sort(order)
  if (order === 'asc') {
    return keys
      .slice()
      .sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
  }
  if (order === 'desc') {
    return keys
      .slice()
      .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
  }
  return keys // first-seen (data order)
}

/**
 * Compute bin edges for a numeric/range dimension over the full record set.
 * Supports `{ thresholds }`, `{ width }`, or `{ count }` (default count: 30).
 * @param {any[]} records
 * @param {(row:any)=>any} accessor
 * @param {{width?:number,count?:number,thresholds?:number[]}|undefined} bins
 * @returns {number[]} edges, length = nBins + 1 (ascending)
 */
function rangeEdges(records, accessor, bins) {
  if (bins && Array.isArray(bins.thresholds) && bins.thresholds.length >= 2) {
    const t = Array.from(new Set(bins.thresholds.filter(isNum))).sort(
      (a, b) => a - b,
    )
    return t.length >= 2 ? t.map(cleanFloat) : [0, 1]
  }

  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < records.length; i++) {
    const v = accessor(records[i])
    if (!isNum(v)) continue
    if (v < min) min = v
    if (v > max) max = v
  }
  if (min === Infinity) return [0, 1] // no numeric values
  if (min === max) {
    // Degenerate extent: a single bin around the lone value.
    const pad = Math.abs(min) > 0 ? Math.abs(min) : 1
    return [cleanFloat(min), cleanFloat(min + pad)]
  }

  if (bins && isNum(bins.width) && bins.width > 0) {
    const w = bins.width
    const start = Math.floor(min / w) * w
    let end = Math.ceil(max / w) * w
    if (end <= start) end = start + w
    const count = Math.max(1, Math.round((end - start) / w))
    const edges = new Array(count + 1)
    for (let i = 0; i <= count; i++) edges[i] = cleanFloat(start + i * w)
    return edges
  }

  const count =
    bins && isNum(bins.count) && bins.count >= 1 ? Math.floor(bins.count) : 30
  const w = (max - min) / count
  const edges = new Array(count + 1)
  for (let i = 0; i <= count; i++) edges[i] = cleanFloat(min + i * w)
  edges[count] = cleanFloat(max) // pin the top edge exactly
  return edges
}

/**
 * Bucket index of v within ascending `edges` (last bin inclusive of the top
 * edge). Returns -1 when v is outside the edge range or not numeric.
 * @param {*} v @param {number[]} edges
 */
function binIndexOf(v, edges) {
  if (!isNum(v)) return -1
  const last = edges.length - 1
  if (v < edges[0] || v > edges[last]) return -1
  if (v === edges[last]) return last - 1
  for (let i = 0; i < last; i++) {
    if (v >= edges[i] && v < edges[i + 1]) return i
  }
  return -1
}

export default class Crossfilter {
  /**
   * @param {string} id
   * @param {any[]} [records]
   */
  constructor(id, records) {
    this.id = id
    /** @type {any[]} */
    this.records = Array.isArray(records) ? records : []
    /**
     * chartId -> dimension descriptor
     * `{ accessor, reducer, type, bins, order, filter, labels, edges }`.
     * Typed loosely (the slots are mutated in place, like the rest of w-state).
     * @type {Map<string, any>}
     */
    this.dims = new Map()
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map()
  }

  // ----- registry ---------------------------------------------------------

  /** @returns {Map<string, Crossfilter>} */
  static _store() {
    const g = /** @type {any} */ (globalThis)
    if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = new Map()
    return g[REGISTRY_KEY]
  }

  /**
   * Get-or-create a coordinator by id. Passing `records` on an existing
   * coordinator swaps its dataset (re-aggregates).
   * @param {{id:string, records?:any[]}} opts
   * @returns {Crossfilter}
   */
  static getOrCreate(opts) {
    if (!opts || typeof opts.id !== 'string') {
      throw new Error('ApexCharts.crossfilter requires an { id } string.')
    }
    const store = Crossfilter._store()
    let cf = store.get(opts.id)
    if (cf) {
      if (opts.records) cf.setRecords(opts.records)
      return cf
    }
    cf = new Crossfilter(opts.id, opts.records)
    store.set(opts.id, cf)
    return cf
  }

  /** @param {string} id @returns {Crossfilter|null} */
  static get(id) {
    return Crossfilter._store().get(id) || null
  }

  // ----- data + dimensions ------------------------------------------------

  /**
   * Swap the shared dataset and recompute every dimension's domain. Existing
   * filters are kept where still valid (categorical keys no longer present are
   * pruned); the change is broadcast.
   * @param {any[]} records
   */
  setRecords(records) {
    this.records = Array.isArray(records) ? records : []
    this.dims.forEach((dim) => this._recomputeDomain(dim))
    this._emit('records', this.state())
    this._emit('change', this.state())
    return this
  }

  /**
   * Register (or replace) a chart's dimension + reduction.
   * @param {string} chartId
   * @param {{
   *   dimension:(row:any)=>any, reduce?:any, type?:'category'|'range',
   *   bins?:{width?:number,count?:number,thresholds?:number[]},
   *   order?:'first-seen'|'asc'|'desc'|((a:any,b:any)=>number),
   *   filter?:any }} spec
   */
  registerDimension(chartId, spec) {
    if (!spec || typeof spec.dimension !== 'function') {
      throw new Error(
        `crossfilter.registerDimension("${chartId}") needs a dimension function.`,
      )
    }
    const type = spec.type || (spec.bins ? 'range' : 'category')
    const dim = {
      accessor: spec.dimension,
      reducer: makeReducer(spec.reduce),
      type,
      bins: spec.bins,
      order: spec.order,
      /** @type {Set<any>|[number,number]|null} */
      filter: null,
      /** @type {any[]} */
      labels: [],
      /** @type {number[]|null} */
      edges: null,
    }
    this.dims.set(chartId, dim)
    this._recomputeDomain(dim)
    if (spec.filter != null) this._setFilterOn(dim, spec.filter)
    return this
  }

  /** @param {string} chartId */
  removeDimension(chartId) {
    this.dims.delete(chartId)
    return this
  }

  /** @param {any} dim */
  _recomputeDomain(dim) {
    if (dim.type === 'range') {
      dim.edges = rangeEdges(this.records, dim.accessor, dim.bins)
      dim.labels = dim.edges.slice(0, -1) // bin lower edges
    } else {
      dim.labels = categoryDomain(this.records, dim.accessor, dim.order)
      dim.edges = null
      // Prune categorical filter keys that no longer exist in the domain.
      if (dim.filter instanceof Set) {
        const domain = new Set(dim.labels)
        Array.from(dim.filter).forEach((k) => {
          if (!domain.has(k)) dim.filter.delete(k)
        })
      }
    }
  }

  // ----- filters ----------------------------------------------------------

  /**
   * Set (replace) a chart's filter. Categorical: an array/Set of keys (or null
   * to clear). Range: a `[min,max]` tuple (or null to clear).
   * @param {string} chartId
   * @param {any[]|Set<any>|[number,number]|null} filter
   */
  filter(chartId, filter) {
    const dim = this.dims.get(chartId)
    if (!dim) return this
    this._setFilterOn(dim, filter)
    this._emit('change', this.state())
    return this
  }

  /**
   * Toggle one categorical key in a chart's filter Set (multi-select, OR).
   * @param {string} chartId @param {any} key
   */
  toggleKey(chartId, key) {
    const dim = this.dims.get(chartId)
    if (!dim || dim.type !== 'category') return this
    if (!(dim.filter instanceof Set)) dim.filter = new Set()
    const set = /** @type {Set<any>} */ (dim.filter)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    if (set.size === 0) dim.filter = null
    this._emit('change', this.state())
    return this
  }

  /** @param {any} dim @param {any} filter */
  _setFilterOn(dim, filter) {
    if (filter == null) {
      dim.filter = null
      return
    }
    if (dim.type === 'range') {
      if (Array.isArray(filter) && filter.length === 2 && filter.every(isNum)) {
        dim.filter = [Math.min(filter[0], filter[1]), Math.max(filter[0], filter[1])]
      } else {
        dim.filter = null
      }
      return
    }
    // categorical
    const set = filter instanceof Set ? new Set(filter) : new Set(filter)
    dim.filter = set.size ? set : null
  }

  /**
   * Clear one chart's filter.
   * @param {string} chartId
   */
  clear(chartId) {
    const dim = this.dims.get(chartId)
    if (dim) dim.filter = null
    this._emit('change', this.state())
    return this
  }

  /** Clear all filters across every dimension. */
  reset() {
    this.dims.forEach((dim) => {
      dim.filter = null
    })
    this._emit('change', this.state())
    return this
  }

  /** @param {any} dim @returns {boolean} does this dimension have an active filter */
  _hasFilter(dim) {
    if (dim.filter == null) return false
    if (dim.filter instanceof Set) return dim.filter.size > 0
    return true // range tuple
  }

  /** @param {any} dim @param {any} row @returns {boolean} does row pass this dim's filter */
  _passes(dim, row) {
    if (!this._hasFilter(dim)) return true
    const v = dim.accessor(row)
    if (dim.filter instanceof Set) return dim.filter.has(v)
    // range
    if (!isNum(v)) return false
    return v >= dim.filter[0] && v <= dim.filter[1]
  }

  // ----- aggregation ------------------------------------------------------

  /**
   * Records passing every ACTIVE filter except the one on `exceptChartId`
   * (pass null/undefined to apply all filters).
   * @param {string|null} [exceptChartId]
   * @returns {any[]}
   */
  filteredRecords(exceptChartId) {
    /** @type {any[]} */
    const active = []
    this.dims.forEach((dim, id) => {
      if (id === exceptChartId) return
      if (this._hasFilter(dim)) active.push(dim)
    })
    if (active.length === 0) return this.records
    return this.records.filter((row) => active.every((dim) => this._passes(dim, row)))
  }

  /** Rows passing ALL active filters (the fully filtered set). @returns {any[]} */
  filteredRows() {
    return this.filteredRecords(null)
  }

  /**
   * The crossfilter aggregation for one chart: reduce over records passing all
   * OTHER charts' filters, bucketed by this chart's dimension.
   * @param {string} chartId
   * @returns {{type:'category'|'range', labels:any[], values:number[], keys:any[], edges?:number[]}}
   */
  aggregateFor(chartId) {
    const dim = this.dims.get(chartId)
    if (!dim) return { type: 'category', labels: [], values: [], keys: [] }

    const rows = this.filteredRecords(chartId)

    if (dim.type === 'range') {
      const edges = dim.edges || [0, 1]
      const nBins = edges.length - 1
      /** @type {any[][]} */
      const buckets = Array.from({ length: nBins }, () => [])
      for (let i = 0; i < rows.length; i++) {
        const idx = binIndexOf(dim.accessor(rows[i]), edges)
        if (idx >= 0) buckets[idx].push(rows[i])
      }
      return {
        type: 'range',
        labels: edges.slice(0, -1),
        values: buckets.map((b) => dim.reducer(b)),
        keys: buckets.map((_, i) => [edges[i], edges[i + 1]]),
        edges,
      }
    }

    // categorical: preserve the full domain order (empty buckets included).
    /** @type {Map<any, any[]>} */
    const index = new Map()
    dim.labels.forEach((/** @type {any} */ k) => index.set(k, []))
    for (let i = 0; i < rows.length; i++) {
      const k = dim.accessor(rows[i])
      const bucket = index.get(k)
      if (bucket) bucket.push(rows[i])
    }
    return {
      type: 'category',
      labels: dim.labels.slice(),
      values: dim.labels.map((/** @type {any} */ k) =>
        dim.reducer(index.get(k) || []),
      ),
      keys: dim.labels.slice(),
    }
  }

  /**
   * Aggregate every registered chart.
   * @returns {Record<string, ReturnType<Crossfilter['aggregateFor']>>}
   */
  aggregateAll() {
    /** @type {any} */
    const out = {}
    this.dims.forEach((_dim, id) => {
      out[id] = this.aggregateFor(id)
    })
    return out
  }

  // ----- state + events ---------------------------------------------------

  /**
   * A serializable snapshot: active filters, filtered/total record counts.
   * @returns {{filters:Record<string, any[]|[number,number]>, filteredCount:number, total:number}}
   */
  state() {
    /** @type {any} */
    const filters = {}
    this.dims.forEach((dim, id) => {
      if (!this._hasFilter(dim)) return
      filters[id] = dim.filter instanceof Set ? Array.from(dim.filter) : dim.filter.slice()
    })
    return {
      filters,
      filteredCount: this.filteredRows().length,
      total: this.records.length,
    }
  }

  /** @param {string} chartId @returns {any} the current filter (Set copy / range copy / null) */
  filterOf(chartId) {
    const dim = this.dims.get(chartId)
    if (!dim || !this._hasFilter(dim)) return null
    return dim.filter instanceof Set ? new Set(dim.filter) : dim.filter.slice()
  }

  /**
   * Subscribe to an event ('change' | 'records'). Returns an unsubscribe fn.
   * @param {string} event @param {Function} cb
   */
  on(event, cb) {
    let set = this._listeners.get(event)
    if (!set) {
      set = new Set()
      this._listeners.set(event, set)
    }
    set.add(cb)
    return () => this.off(event, cb)
  }

  /** @param {string} event @param {Function} cb */
  off(event, cb) {
    this._listeners.get(event)?.delete(cb)
    return this
  }

  /** @param {string} event @param {any} payload */
  _emit(event, payload) {
    this._listeners.get(event)?.forEach((cb) => {
      try {
        cb(payload)
      } catch (e) {
        // A listener throwing must not corrupt the coordinator.
        console.error(e)
      }
    })
  }

  /** Remove this coordinator from the registry and drop all state. */
  destroy() {
    Crossfilter._store().delete(this.id)
    this.dims.clear()
    this._listeners.clear()
    this.records = []
  }
}
