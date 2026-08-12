// @ts-check
/**
 * Shared hierarchy resolver for the partition charts (sunburst, treemap).
 *
 * Both charts answer the same question before they can draw anything: given a
 * config, what is the tree? The two accepted shapes are
 *
 *   1. native nesting  - a datum carries `children: [...]`, to any depth
 *   2. the drilldown adapter - a datum carries `drilldown: '<id>'` naming an
 *      entry in `config.drilldown.series`, read here as plain data (NO
 *      dependency on the drilldown runtime feature, so a chart that only wants
 *      a nested view does not pull the feature in)
 *
 * A node is `{ name, value, color?, _key, children? }`. `_key` is the node's
 * identity across data updates: the path of names, indexed so same-named
 * siblings stay distinct, which is what update animations match on.
 *
 * `value` is left as authored here; call `fillValues` to roll a missing parent
 * value up from its children.
 *
 * This module is deliberately NOT registered in `sharedModules` (vite.config.mjs).
 * It is a handful of pure functions, so each split bundle carrying a partition
 * chart is welcome to its own copy; registering it would be a second name in a
 * shared module for no gain.
 *
 * @module charts/common/Hierarchy
 */

/**
 * Look up a drilldown series by id.
 * @param {any} w
 * @param {string|number} id
 * @returns {any}
 */
export function drilldownById(w, id) {
  const dd = w.config.drilldown
  const list = dd && Array.isArray(dd.series) ? dd.series : []
  return list.find((/** @type {any} */ s) => s && s.id === id)
}

/**
 * Resolve one datum (and everything under it) into a node.
 *
 * @param {any} w
 * @param {any} d  the datum: an object (`{x|name, y|value, children?, drilldown?}`)
 *   or a bare number
 * @param {number} i  index among its siblings
 * @param {string[]|null} paletteFromParent  per-level colours from a drilldown entry
 * @param {string} parentKey  hierarchical identity of the parent
 * @param {Set<any>|null} [seenIds]  drilldown ids already expanded on this path
 * @param {{ keepDatum?: boolean, expandDrilldown?: boolean }} [opts]
 *   `keepDatum` attaches the source datum as `_datum` (the treemap needs it to
 *   read a per-datum colour metric). Off by default so the node shape stays
 *   exactly what the sunburst has always seen.
 *   `expandDrilldown` (default true) reads `drilldown: '<id>'` as another level.
 *   The treemap turns this off unless asked: there, a `drilldown` id has always
 *   meant "descend on click" via the drilldown feature, and silently rendering
 *   those levels nested instead would change what existing charts draw.
 * @returns {any}
 */
export function toNode(
  w,
  d,
  i,
  paletteFromParent,
  parentKey,
  seenIds = null,
  opts = {},
) {
  const isObj = d && typeof d === 'object'
  const name = isObj ? (d.x ?? d.name ?? '') : ''
  const value = isObj ? Number(d.y ?? d.value) : Number(d)
  /** @type {any} */
  const node = {
    name: String(name),
    value: isNaN(value) ? null : value,
    color: isObj && d.color ? d.color : undefined,
    // Identity across data updates: the path of names (indexed so same-named
    // siblings stay distinct). Update animations morph matched keys in place.
    _key: `${parentKey}/${i}:${name}`,
  }
  if (paletteFromParent && !node.color) {
    node.color = paletteFromParent[i % paletteFromParent.length]
  }
  if (opts.keepDatum) node._datum = d

  if (isObj && Array.isArray(d.children) && d.children.length) {
    node.children = d.children.map(
      (/** @type {any} */ c, /** @type {number} */ j) =>
        toNode(w, c, j, null, node._key, seenIds, opts),
    )
  } else if (isObj && d.drilldown != null && opts.expandDrilldown !== false) {
    // Drilldown ids resolve indirectly, so a self- or mutually-referential id
    // (a malformed config) would recurse forever and overflow the stack. Track
    // the ids expanded on this path and stop when one repeats.
    const visited = seenIds || new Set()
    if (!visited.has(d.drilldown)) {
      const dd = drilldownById(w, d.drilldown)
      if (dd && Array.isArray(dd.data) && dd.data.length) {
        const nextSeen = new Set(visited)
        nextSeen.add(d.drilldown)
        const palette = Array.isArray(dd.colors) ? dd.colors : null
        node.children = dd.data.map(
          (/** @type {any} */ c, /** @type {number} */ j) =>
            toNode(w, c, j, palette, node._key, nextSeen, opts),
        )
      }
    }
  }
  return node
}

/**
 * Sunburst root set: the whole chart is one tree, so the roots are the data of
 * the first series (or the bare array when the config skips the series wrapper).
 *
 * @param {any} w
 * @param {{ keepDatum?: boolean, expandDrilldown?: boolean }} [opts]
 * @returns {any[]}
 */
export function buildHierarchy(w, opts = {}) {
  const cfgSeries = /** @type {any} */ (w.config.series)
  const first = cfgSeries && cfgSeries[0]
  const data = first && Array.isArray(first.data) ? first.data : cfgSeries
  if (!Array.isArray(data)) return []
  return data.map((/** @type {any} */ d, /** @type {number} */ i) =>
    toNode(w, d, i, null, '', null, opts),
  )
}

/**
 * Treemap root set: every series is a level-0 group, so each series becomes a
 * node whose children are its data. This is the shape the flat two-level
 * treemap has always drawn, expressed as a tree, which is what lets one
 * recursive layout serve both the flat and the nested case.
 *
 * @param {any} w
 * @param {any[]} [series]  defaults to `w.config.series`
 * @param {{ keepDatum?: boolean, expandDrilldown?: boolean }} [opts]
 * @returns {any[]}
 */
export function buildSeriesRoots(w, series, opts = {}) {
  const cfgSeries = /** @type {any} */ (series || w.config.series)
  if (!Array.isArray(cfgSeries)) return []
  return cfgSeries.map((/** @type {any} */ s, /** @type {number} */ i) => {
    const data = s && Array.isArray(s.data) ? s.data : []
    const key = `${i}:${s?.name ?? ''}`
    /** @type {any} */
    const root = {
      name: String(s?.name ?? ''),
      value: null,
      color: s?.color || undefined,
      _key: key,
      _seriesIndex: i,
      children: data.map((/** @type {any} */ d, /** @type {number} */ j) =>
        toNode(w, d, j, null, key, null, opts),
      ),
    }
    return root
  })
}

/**
 * Fill a parent's value from its children when missing.
 * @param {any} node
 */
export function fillValues(node) {
  if (node.children && node.children.length) {
    node.children.forEach((/** @type {any} */ c) => fillValues(c))
    if (node.value == null || isNaN(node.value)) {
      node.value = node.children.reduce(
        (/** @type {number} */ s, /** @type {any} */ c) =>
          s + Math.max(0, c.value || 0),
        0,
      )
    }
  }
  if (node.value == null || isNaN(node.value)) node.value = 0
}

/**
 * True when any node in the config carries a nested shape, i.e. the chart has
 * more than the two levels a flat series array describes. Cheap enough to run
 * on every parse and the only thing that decides whether a treemap takes the
 * nested path.
 *
 * @param {any[]} series
 * @param {{ drilldown?: boolean }} [opts]  `drilldown` (default true) counts a
 *   `drilldown` id as nesting. See `toNode`'s `expandDrilldown`.
 * @returns {boolean}
 */
export function hasNesting(series, opts = {}) {
  if (!Array.isArray(series)) return false
  const countDrilldown = opts.drilldown !== false
  for (let i = 0; i < series.length; i++) {
    const data = series[i] && series[i].data
    if (!Array.isArray(data)) continue
    for (let j = 0; j < data.length; j++) {
      const d = data[j]
      if (!d || typeof d !== 'object') continue
      if (Array.isArray(d.children) && d.children.length) return true
      if (countDrilldown && d.drilldown != null) return true
    }
  }
  return false
}

/**
 * A node's identity for CROSS-CHART pairing, i.e. the same branch seen by a
 * treemap and by a sunburst.
 *
 * The two build their trees from the same config but not from the same root:
 * `buildHierarchy` (sunburst) starts at `series[0].data`, so its keys read
 * `/0:Tech/0:Software`; `buildSeriesRoots` (treemap) starts one level higher,
 * at the series itself, so the same branch reads `0:Market/0:Tech/0:Software`.
 * The paths agree from the first separator onward, which is exactly the part
 * that describes the data rather than the wrapper.
 *
 * Dropping the leading segment therefore gives one key both charts compute
 * independently, which is what lets a morph pair marks at every level instead
 * of only at the leaves. A series root itself normalizes to '' - correctly, as
 * it is the level a sunburst has no counterpart for.
 *
 * @param {string} key
 * @returns {string}
 */
export function morphKey(key) {
  if (typeof key !== 'string') return ''
  const i = key.indexOf('/')
  return i === -1 ? '' : key.slice(i)
}

/**
 * Depth-first walk over a root set. `fn` receives `(node, depth, parent)`.
 * @param {any[]} roots
 * @param {(node: any, depth: number, parent: any) => void} fn
 */
export function eachNode(roots, fn) {
  /**
   * @param {any} node
   * @param {number} depth
   * @param {any} parent
   */
  const walk = (node, depth, parent) => {
    fn(node, depth, parent)
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        walk(node.children[i], depth + 1, node)
      }
    }
  }
  for (let i = 0; i < roots.length; i++) walk(roots[i], 0, null)
}
