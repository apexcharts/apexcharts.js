// @ts-check
/**
 * The partition layout, shared by the charts that draw a hierarchy as
 * space-filling bands.
 *
 * A sunburst and an icicle ask the same question of a tree: how much of an
 * interval does each node own, and at what depth does it sit? The recursion
 * that answers it is identical; only the reading differs. A sunburst reads the
 * interval as degrees around a centre and the depth as a radial band; an icicle
 * reads it as pixels along the value axis and the depth as a row or a column.
 *
 * So the geometry-free part lives here and the two charts supply the units.
 * That is what stops them drifting, and it is where a change like true
 * `partition: 'strict'` rendering lands once rather than twice.
 *
 * Placing a node writes `_show`, `_vDepth`, `_t0`, `_t1`, `_parent` and `_leaf`
 * onto it. `_t0`/`_t1` are in whatever unit the caller passed in.
 *
 * Deliberately NOT registered in `sharedModules` (`build/shared-modules.mjs`),
 * for the reason `charts/common/Hierarchy.js` gives at its head: these are pure
 * functions, so each split bundle is welcome to its own copy, and a named
 * export on a shared module is a trap only a full build catches.
 *
 * @module charts/common/partition/Partition
 */

/**
 * Place one node and everything under it into `[t0, t1]`.
 *
 * @param {any} node
 * @param {number} vDepth  depth as DRAWN (0 at the focused node, not in the data)
 * @param {number} t0
 * @param {number} t1
 * @param {any} parent
 * @param {{ maxDepth: number, cap?: number }} state  accumulates the deepest
 *   depth reached; `cap` stops the walk at that depth index
 */
export function placeSubtree(node, vDepth, t0, t1, parent, state) {
  node._show = true
  node._vDepth = vDepth
  node._t0 = t0
  node._t1 = t1
  node._parent = parent
  node._leaf = !(node.children && node.children.length)
  // A branch whose children were cut by the cap. It is NOT a leaf: it keeps its
  // own band rather than extending, and the renderer marks it so a reader can
  // tell "nothing below" from "more below, zoom in".
  node._clipped = !node._leaf && state.cap != null && vDepth >= state.cap
  if (vDepth > state.maxDepth) state.maxDepth = vDepth
  if (node._leaf || node._clipped) return

  // Normalize: each child takes its share of its siblings, so the children
  // always fill the parent exactly whatever the authored values sum to.
  const total = node.children.reduce(
    (/** @type {number} */ s, /** @type {any} */ c) => s + Math.max(0, c.value),
    0,
  )
  const denom = total || 1
  let t = t0
  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i]
    const span = ((t1 - t0) * Math.max(0, c.value)) / denom
    placeSubtree(c, vDepth + 1, t, t + span, node, state)
    t += span
  }
}

/**
 * Lay the whole tree (or one focused branch) across `[t0, t1]`.
 *
 * Everything in `nodesAll` is hidden first, so a node outside the focused
 * branch keeps its element and its last geometry (which is what lets a zoom
 * animate it away) while being excluded from this layout.
 *
 * @param {{
 *   roots: any[],
 *   nodesAll: any[],
 *   focus: any,
 *   t0: number,
 *   t1: number,
 *   cap?: number,
 * }} opts  `focus` null lays out the whole tree; `cap` is the deepest depth
 *   index to walk to, leaving anything below it unplaced
 * @returns {number} the deepest visible depth, 0-based
 */
export function placeTree({ roots, nodesAll, focus, t0, t1, cap }) {
  for (let i = 0; i < nodesAll.length; i++) nodesAll[i]._show = false
  /** @type {{ maxDepth: number, cap?: number }} */
  const state = { maxDepth: 0, cap }

  if (focus) {
    placeSubtree(focus, 0, t0, t1, focus._parent, state)
    return state.maxDepth
  }

  const total = roots.reduce(
    (/** @type {number} */ s, /** @type {any} */ r) => s + Math.max(0, r.value),
    0,
  )
  const denom = total || 1
  let t = t0
  for (let i = 0; i < roots.length; i++) {
    const span = ((t1 - t0) * Math.max(0, roots[i].value)) / denom
    placeSubtree(roots[i], 0, t, t + span, null, state)
    t += span
  }
  return state.maxDepth
}

/**
 * Sibling order within every parent, in place.
 *
 * `'none'` (the default everywhere) keeps authored order. `'value'` is
 * descending by size. `'name'` is alphabetical, and is the flame-graph
 * convention: a frame then holds the same position in every profile of the same
 * program, so two runs can be compared by eye. Sorting by value instead moves
 * every frame and destroys exactly that comparison.
 *
 * Call it once after the values are filled, not inside the placement recursion,
 * which re-runs on every zoom. `_key` is assigned at build time from the
 * authored index, so sorting never changes a node's identity and an update
 * still morphs the right shapes.
 *
 * @param {any[]} roots
 * @param {'none'|'value'|'name'|string} [sort]
 */
export function sortTree(roots, sort) {
  if (sort !== 'value' && sort !== 'name') return
  const cmp =
    sort === 'value'
      ? (/** @type {any} */ a, /** @type {any} */ b) =>
          (b.value || 0) - (a.value || 0)
      : (/** @type {any} */ a, /** @type {any} */ b) =>
          String(a.name).localeCompare(String(b.name))

  /** @param {any[]} list */
  const walk = (list) => {
    list.sort(cmp)
    for (let i = 0; i < list.length; i++) {
      if (list[i].children && list[i].children.length) walk(list[i].children)
    }
  }
  walk(roots)
}

/**
 * Divide the depth axis into one band per visible level.
 *
 * `gap` separates adjacent bands and is dropped entirely when there is only one
 * level, where it would just shrink the single band for no visible gain.
 *
 * @param {{ maxDepth: number, near: number, far: number, gap?: number }} opts
 * @returns {{ near: (vDepth: number) => number, far: (vDepth: number) => number }}
 */
export function bandScale({ maxDepth, near, far, gap = 0 }) {
  const count = maxDepth + 1
  const band = (far - near) / count
  const g = count > 1 ? gap : 0
  return {
    near: (/** @type {number} */ vDepth) =>
      near + vDepth * band + (vDepth > 0 ? g / 2 : 0),
    far: (/** @type {number} */ vDepth) => near + (vDepth + 1) * band - g / 2,
  }
}

/**
 * Where a node's band ends, honouring ragged depth.
 *
 * `leaf: 'extend'` stretches a branch that bottoms out early all the way to the
 * far edge, so the chart has no holes; `'stop'` leaves the deeper bands empty
 * behind it, which shows the reader where the data actually ran out.
 *
 * @param {any} node
 * @param {{ far: (vDepth: number) => number }} scale
 * @param {number} maxDepth
 * @param {'extend'|'stop'|string} leafMode
 * @param {number} edge  the far edge of the whole depth axis
 * @returns {number}
 */
export function farEdge(node, scale, maxDepth, leafMode, edge) {
  return node._leaf && leafMode === 'extend' && node._vDepth < maxDepth
    ? edge
    : scale.far(node._vDepth)
}

/**
 * With `partition: 'strict'`, warn once when a parent's value does not match
 * the sum of its children. The layout still normalizes (true strict rendering
 * is a later refinement); this only surfaces the data mismatch.
 *
 * @param {any[]} roots
 * @param {{ type: string, remedy: string }} opts
 */
export function validateStrict(roots, { type, remedy }) {
  let warned = false
  /** @param {any} node */
  const walk = (node) => {
    if (node.children && node.children.length) {
      const sum = node.children.reduce(
        (/** @type {number} */ s, /** @type {any} */ c) =>
          s + Math.max(0, c.value || 0),
        0,
      )
      if (!warned && node.value != null && Math.abs(sum - node.value) > 0.5) {
        console.warn(
          `ApexCharts ${type}: partition 'strict' but "${node.name}" (${node.value}) != sum of its children (${sum}). ${remedy}`,
        )
        warned = true
      }
      node.children.forEach(walk)
    }
  }
  roots.forEach(walk)
}

/**
 * Root -> focus chain, for the breadcrumb.
 * @param {any} focus
 * @returns {any[]}
 */
export function focusChain(focus) {
  const chain = []
  let n = focus
  while (n) {
    chain.unshift(n)
    n = n._parent
  }
  return chain
}

/**
 * Which node a click should focus.
 *
 * Clicking the current focus zooms out one level. A leaf is never a meaningful
 * target (its subtree is itself, so the chart would show one full band), so a
 * click on one resolves to its parent branch instead. A tree with a single
 * root is the same case one level up: that root already owns the whole value
 * axis, so focusing it would draw exactly what is on screen, and it resolves to
 * the whole tree, which is the view the reader is already looking at.
 *
 * Then whatever the walk lands on, a resolved focus equal to the current one
 * means the click cannot change the picture. Saying so (`changed: false`) is
 * what stops the caller re-running a layout and raising a breadcrumb for a view
 * the reader never left.
 *
 * @param {any} node  the clicked node
 * @param {any} current  the current focus, null at the root
 * @param {any[]} [roots]  the tree's roots; without them a lone root is treated
 *   as a focusable branch like any other
 * @returns {{ changed: boolean, focus: any }}
 */
export function resolveFocus(node, current, roots) {
  let next = node === current ? node._parent || null : node
  if (next && !(next.children && next.children.length)) {
    next = next._parent || null
  }
  if (roots && roots.length === 1 && next === roots[0]) next = null
  if (next === current) return { changed: false, focus: current }
  return { changed: true, focus: next }
}

/**
 * Read a px number or a `'%'` string against a maximum.
 *
 * @param {string|number} size
 * @param {number} max
 * @param {number} [fallbackRatio]  used when the value parses to nothing
 * @returns {number}
 */
export function parseSize(size, max, fallbackRatio = 0) {
  if (typeof size === 'number') return size
  const s = String(size).trim()
  if (s.endsWith('%')) return (parseFloat(s) / 100) * max
  const n = parseFloat(s)
  return isNaN(n) ? fallbackRatio * max : n
}
