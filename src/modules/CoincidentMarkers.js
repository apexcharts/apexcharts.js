// @ts-check
import Utils from '../utils/Utils'

/**
 * Markers of different series drawn at the same spot.
 *
 * Only the marker painted last at a spot can be under the pointer, so an
 * intersect tooltip and the marker events used to name that one point and
 * leave the series beneath it unreachable (apexcharts.js#4778). This finds
 * every point drawn there, from an index of the rendered marker centres
 * built once a render (on the first question asked of it), so a hover or a
 * click on a chart with thousands of markers looks up a few buckets instead
 * of reading every marker.
 *
 * The centres are the ones the chart drew: the `cx` / `cy` of each marker
 * node, or, on a chart that paints its markers to canvas and has no nodes,
 * the `pointsArray` positions the painted markers were placed at.
 *
 * @module CoincidentMarkers
 */

/**
 * How far apart, in grid px on either axis, two marker centres can be and
 * still be one spot. Equal values on the same axes land on the same centre
 * to within float noise; this only absorbs that.
 */
export const COINCIDENT_TOLERANCE = 0.5

/**
 * @typedef {{ seriesIndex: number, dataPointIndex: number }} CoincidentPoint
 * @typedef {{ i: number, j: number, x: number, y: number, node: Element | null }} Entry
 * @typedef {{
 *   token: any,
 *   points: any,
 *   byNode: Map<Element, Entry>,
 *   byPoint: Map<string, Entry>,
 *   buckets: Map<string, Entry[]>,
 *   misses: Set<Element | string>,
 * }} MarkerIndex
 */

/** @type {WeakMap<object, MarkerIndex>} one index per chart, per render */
const indexes = new WeakMap()

/**
 * The series a marker node belongs to, read the way the intersect tooltip
 * always has: the `data:realIndex` of its series group, or, where it has
 * none, the `rel` three levels up.
 * @param {Element} node
 * @returns {number}
 */
export function markerSeriesIndex(node) {
  const el = Utils.findAncestor(node, 'apexcharts-series')
  if (el) return parseInt(el.getAttribute('data:realIndex') ?? '', 10)
  const up = /** @type {any} */ (node).parentNode?.parentNode?.parentNode
  return parseInt(up?.getAttribute?.('rel') ?? '', 10) - 1
}

/**
 * Whether a node is a data point's marker (a series' hover dot is an
 * `.apexcharts-marker` too, but names no point).
 * @param {any} node
 * @returns {boolean}
 */
export function isPointMarker(node) {
  return !!(
    node?.classList?.contains('apexcharts-marker') && node.hasAttribute('rel')
  )
}

/** @param {number} x @param {number} y */
const bucketKey = (x, y) => `${Math.floor(x)},${Math.floor(y)}`

/**
 * @param {any} w
 * @returns {boolean}
 */
function paintsMarkers(w) {
  const renderer = w.globals?.activeRenderer
  return (
    renderer?.kind === 'canvas' &&
    typeof renderer.hitTestMarker === 'function' &&
    !!w.globals.xyCharts
  )
}

/**
 * What the index of a render is built from; a new one means a new render.
 * @param {any} w
 */
function renderToken(w) {
  return w.dom?.elGraphical?.node ?? w.dom?.baseEl ?? null
}

/**
 * @param {MarkerIndex} index
 * @param {Entry} entry
 */
function addEntry(index, entry) {
  if (!(entry.x === entry.x && entry.y === entry.y)) return
  const pointKey = `${entry.i}:${entry.j}`
  if (!index.byPoint.has(pointKey)) index.byPoint.set(pointKey, entry)
  const key = bucketKey(entry.x, entry.y)
  const bucket = index.buckets.get(key)
  if (bucket) bucket.push(entry)
  else index.buckets.set(key, [entry])
}

/**
 * @param {any} w
 * @returns {MarkerIndex | null}
 */
function buildIndex(w) {
  const token = renderToken(w)
  if (!token) return null
  const points = w.globals?.pointsArray
  /** @type {MarkerIndex} */
  const index = {
    token,
    points,
    byNode: new Map(),
    byPoint: new Map(),
    buckets: new Map(),
    misses: new Set(),
  }

  if (paintsMarkers(w)) {
    // Painted markers have no node: they were placed at pointsArray[i][j].
    if (Array.isArray(points)) {
      for (let i = 0; i < points.length; i++) {
        const row = points[i]
        if (!Array.isArray(row)) continue
        for (let j = 0; j < row.length; j++) {
          const p = row[j]
          if (!p) continue
          addEntry(index, { i, j, x: +p[0], y: +p[1], node: null })
        }
      }
    }
  } else {
    const nodes = token.querySelectorAll('.apexcharts-marker[rel]')
    for (let k = 0; k < nodes.length; k++) {
      const node = nodes[k]
      const entry = {
        i: markerSeriesIndex(node),
        j: parseInt(node.getAttribute('rel') ?? '', 10),
        x: parseFloat(node.getAttribute('cx') ?? ''),
        y: parseFloat(node.getAttribute('cy') ?? ''),
        node,
      }
      if (isNaN(entry.i) || isNaN(entry.j)) continue
      index.byNode.set(node, entry)
      // A marker drawn with no size (one off the plot) shares no spot.
      if (node.getAttribute('default-marker-size') === '0') continue
      addEntry(index, entry)
    }
  }

  indexes.set(w, index)
  return index
}

/**
 * The index for the chart's current render, building it when there is none
 * or the chart has drawn again since.
 * @param {any} w
 * @param {boolean} [rebuild]
 * @returns {MarkerIndex | null}
 */
function getIndex(w, rebuild = false) {
  const index = indexes.get(w)
  if (
    !rebuild &&
    index &&
    index.token === renderToken(w) &&
    index.points === w.globals?.pointsArray
  ) {
    return index
  }
  return buildIndex(w)
}

/**
 * Where an entry's marker is now. A node tweened since the index was taken
 * reads its live centre; a painted marker's is the one it was indexed at.
 * @param {Entry} entry
 */
function liveCentre(entry) {
  if (!entry.node) return entry
  return {
    x: parseFloat(entry.node.getAttribute('cx') ?? ''),
    y: parseFloat(entry.node.getAttribute('cy') ?? ''),
  }
}

/**
 * @param {Entry} entry
 */
function isStale(entry) {
  if (!entry.node) return false
  if (!entry.node.isConnected) return true
  const c = liveCentre(entry)
  return c.x !== entry.x || c.y !== entry.y
}

/**
 * @param {any} w
 * @param {{ node?: Element | null, i?: number, j?: number }} at
 * @param {boolean} rebuild
 * @returns {{ index: MarkerIndex, entry: Entry } | null}
 */
function locate(w, at, rebuild) {
  const index = getIndex(w, rebuild)
  if (!index) return null
  const entry = at.node
    ? index.byNode.get(at.node)
    : index.byPoint.get(`${at.i}:${at.j}`)
  return entry ? { index, entry } : null
}

/**
 * Every visible series' point drawn at the same spot as a marker, the
 * marker's own point among them, in series order (then by data point).
 * Null when the point has no marker drawn for it.
 *
 * Name the marker by its node (`{ node }`), or by its point (`{ i, j }`) on
 * a chart that paints its markers, or where the node is not to hand.
 *
 * @param {any} w
 * @param {{ node?: Element | null, i?: number, j?: number }} at
 * @returns {CoincidentPoint[] | null}
 */
export function coincidentPoints(w, at) {
  if (!w?.globals || !w.dom) return null
  if (at.node && !isPointMarker(at.node)) return null

  let found = locate(w, at, false)
  if (!found || isStale(found.entry)) {
    // Drawn again without a new graphical group, or moved since: once more
    // from what is on the page now. A point with no marker (a bar's, say) is
    // remembered, so asking again does not rebuild every time.
    const missKey = at.node ?? `${at.i}:${at.j}`
    if (!found && indexes.get(w)?.misses.has(missKey)) return null
    found = locate(w, at, true)
    if (!found) {
      indexes.get(w)?.misses.add(missKey)
      return null
    }
  }

  const { index, entry } = found
  const centre = liveCentre(entry)
  const hidden = new Set([
    ...(w.globals.collapsedSeriesIndices || []),
    ...(w.globals.ancillaryCollapsedSeriesIndices || []),
  ])
  const tol = COINCIDENT_TOLERANCE

  /** @type {Map<string, CoincidentPoint>} */
  const out = new Map()
  out.set(`${entry.i}:${entry.j}`, {
    seriesIndex: entry.i,
    dataPointIndex: entry.j,
  })

  const bx = Math.floor(centre.x)
  const by = Math.floor(centre.y)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const bucket = index.buckets.get(`${bx + dx},${by + dy}`)
      if (!bucket) continue
      for (const other of bucket) {
        if (other === entry || hidden.has(other.i)) continue
        const key = `${other.i}:${other.j}`
        if (out.has(key)) continue
        const c = liveCentre(other)
        if (Math.abs(c.x - centre.x) > tol || Math.abs(c.y - centre.y) > tol) {
          continue
        }
        out.set(key, { seriesIndex: other.i, dataPointIndex: other.j })
      }
    }
  }

  return [...out.values()].sort(
    (a, b) =>
      a.seriesIndex - b.seriesIndex || a.dataPointIndex - b.dataPointIndex,
  )
}
