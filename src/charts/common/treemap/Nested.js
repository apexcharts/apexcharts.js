// @ts-check
/**
 * Nested-treemap data preparation.
 *
 * A treemap datum may carry `children` to any depth. The renderer wants that as
 * a tree, but the rest of the pipeline (colours, data labels, tooltips, events,
 * the y-extent) has always addressed a treemap by `(seriesIndex,
 * dataPointIndex)` into a flat matrix. Both come from here: the tree is
 * resolved once per parse and the leaves are handed back as a flat series in
 * depth-first order, so `dataPointIndex` keeps meaning "the nth leaf of this
 * series" and nothing downstream needs to learn about depth.
 *
 * For flat data this module does nothing at all: `resolveTreemapTree` is only
 * called when `children` are actually present, and the renderer's own
 * `getTreemapRoots` then builds the trivial series-then-rows tree that the
 * two-level layout has always drawn.
 *
 * @module charts/common/treemap/Nested
 */
import { buildSeriesRoots, fillValues, hasNesting } from '../Hierarchy'

/**
 * Whether the config asked for `drilldown` ids to be read as extra levels.
 * Off by default: on a treemap a `drilldown` id has always meant "descend on
 * click" (the drilldown feature), so expanding those into nested levels would
 * silently change what an existing chart draws.
 * @param {any} w
 * @returns {boolean}
 */
export function drilldownAsLevels(w) {
  return !!w?.config?.plotOptions?.treemap?.nested?.drilldownAsLevels
}

/**
 * True when this treemap should take the nested path.
 * @param {any} w
 * @param {any[]} series
 * @returns {boolean}
 */
export function isNestedTreemap(w, series) {
  const nestedCfg = w?.config?.plotOptions?.treemap?.nested
  if (nestedCfg && nestedCfg.enabled === false) return false
  return hasNesting(series, { drilldown: drilldownAsLevels(w) })
}

/**
 * Annotate a resolved tree with everything the renderer addresses a node by:
 * its parent, its depth, whether it is a leaf, the series it belongs to and -
 * for leaves - its index in the flattened series.
 *
 * @param {any[]} roots
 * @returns {{ leaves: any[][], maxDepth: number }}
 */
export function annotate(roots) {
  /** @type {any[][]} */
  const leaves = []
  let maxDepth = 0

  roots.forEach((/** @type {any} */ root, /** @type {number} */ si) => {
    /** @type {any[]} */
    const seriesLeaves = []
    /**
     * @param {any} node
     * @param {number} depth
     * @param {any} parent
     */
    const walk = (node, depth, parent) => {
      node._parent = parent
      node._depth = depth
      node._si = si
      node._leaf = !(node.children && node.children.length)
      if (depth > maxDepth) maxDepth = depth
      if (node._leaf) {
        node._di = seriesLeaves.length
        seriesLeaves.push(node)
      } else {
        // A parent is not a row in the series matrix, so it has no
        // dataPointIndex. Anything keyed by (i, j) must skip it.
        node._di = -1
        node.children.forEach((/** @type {any} */ c) =>
          walk(c, depth + 1, node),
        )
      }
    }
    walk(root, 0, null)
    leaves.push(seriesLeaves)
  })

  return { leaves, maxDepth }
}

/**
 * Turn a leaf node back into the `{x, y}` row the pipeline parses, preserving
 * whatever else the author put on the datum (per-point `color`, `fillColor`,
 * `colorValue`, `meta`, ...) so per-point features keep working. `children` is
 * dropped: the row is a leaf by construction, and leaving it would make the
 * flattened series look nested on the next parse.
 *
 * @param {any} node
 * @returns {any}
 */
function leafRow(node) {
  const d = node._datum
  if (d && typeof d === 'object') {
    const row = { ...d, x: node.name, y: node.value }
    delete row.children
    return row
  }
  return { x: node.name, y: node.value }
}

/**
 * Resolve a nested treemap config into the tree the renderer lays out plus the
 * flat leaf series the rest of the pipeline parses.
 *
 * @param {any} w
 * @param {any[]} series  the ORIGINAL (nested) series
 * @returns {{ roots: any[], leafSeries: any[], maxDepth: number }}
 */
export function resolveTreemapTree(w, series) {
  const roots = buildSeriesRoots(w, series, {
    keepDatum: true,
    expandDrilldown: drilldownAsLevels(w),
  })
  roots.forEach(fillValues)
  const { leaves, maxDepth } = annotate(roots)

  const leafSeries = series.map((/** @type {any} */ s, /** @type {number} */ i) => ({
    ...s,
    data: (leaves[i] || []).map(leafRow),
  }))

  return { roots, leafSeries, maxDepth }
}

/**
 * The tree the renderer draws.
 *
 * Nested data: the tree resolved at parse time (the flat leaves in
 * `config.series` are all that survives there, so it cannot be rebuilt from
 * them). Flat data: the two-level tree that a series array already describes,
 * built here so there is exactly one layout path.
 *
 * @param {any} w
 * @returns {{ roots: any[], maxDepth: number, nested: boolean }}
 */
export function getTreemapRoots(w) {
  const stashed = w.globals.treemapRoots
  if (stashed && stashed.length) {
    return {
      roots: stashed,
      maxDepth: w.globals.treemapMaxDepth || 1,
      nested: true,
    }
  }
  const roots = buildSeriesRoots(w, w.config.series, {
    keepDatum: true,
    expandDrilldown: false,
  })
  roots.forEach(fillValues)
  const { maxDepth } = annotate(roots)
  return { roots, maxDepth, nested: false }
}

export { hasNesting }
