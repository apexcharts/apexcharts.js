// @ts-check
/*
 * treemap-squarify.js - open source implementation of squarified treemaps
 *
 * Based on Treemap Squared 0.5 by Imran Ghory
 * https://github.com/imranghory/treemap-squared/
 *
 * Copyright (c) 2012 Imran Ghory (imranghory@gmail.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 *
 * Implementation of the squarify treemap algorithm described in:
 *
 * Bruls, Mark; Huizing, Kees; van Wijk, Jarke J. (2000), "Squarified treemaps"
 * in de Leeuw, W.; van Liere, R., Data Visualization 2000:
 * Proc. Joint Eurographics and IEEE TCVG Symp. on Visualization, Springer-Verlag, pp. 33-42.
 *
 */

/**
 * @param {number[]} data
 * @param {number} area
 */
function normalize(data, area) {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i]
  }
  const multiplier = area / sum
  const result = new Array(data.length)
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] * multiplier
  }
  return result
}

/**
 * @param {number} rowMin
 * @param {number} rowMax
 * @param {number} rowSum
 * @param {number} length
 */
function calculateRatio(rowMin, rowMax, rowSum, length) {
  const lengthSq = length * length
  const sumSq = rowSum * rowSum
  return Math.max(
    (lengthSq * rowMax) / sumSq,
    sumSq / (lengthSq * rowMin)
  )
}

/**
 * @param {number} rowLen
 * @param {number} rowMin
 * @param {number} rowMax
 * @param {number} rowSum
 * @param {number} nextNode
 * @param {number} length
 */
function improvesRatio(rowLen, rowMin, rowMax, rowSum, nextNode, length) {
  if (rowLen === 0) return true

  const currentRatio = calculateRatio(rowMin, rowMax, rowSum, length)
  const newRatio = calculateRatio(
    Math.min(rowMin, nextNode),
    Math.max(rowMax, nextNode),
    rowSum + nextNode,
    length
  )

  return currentRatio >= newRatio
}

/**
 * @param {any[]} coords
 * @param {number[]} row
 * @param {number} rowLen
 * @param {number} rowSum
 * @param {number} xoffset
 * @param {number} yoffset
 * @param {number} width
 * @param {number} height
 */
function emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height) {
  if (width >= height) {
    const areaWidth = rowSum / height
    let subY = yoffset
    for (let i = 0; i < rowLen; i++) {
      const h = row[i] / areaWidth
      coords.push([xoffset, subY, xoffset + areaWidth, subY + h])
      subY += h
    }
  } else {
    const areaHeight = rowSum / width
    let subX = xoffset
    for (let i = 0; i < rowLen; i++) {
      const w = row[i] / areaHeight
      coords.push([subX, yoffset, subX + w, yoffset + areaHeight])
      subX += w
    }
  }
}

/**
 * @param {number[]} data
 * @param {number} xoffset
 * @param {number} yoffset
 * @param {number} width
 * @param {number} height
 */
function squarify(data, xoffset, yoffset, width, height) {
  /** @type {any[]} */
  const coords = []
  const n = data.length
  if (n === 0) return coords

  const row = new Array(n)
  let rowLen = 0
  let rowSum = 0
  let rowMin = Infinity
  let rowMax = -Infinity

  let i = 0
  while (i < n) {
    const length = Math.min(width, height)
    const val = data[i]

    if (improvesRatio(rowLen, rowMin, rowMax, rowSum, val, length)) {
      row[rowLen] = val
      rowLen++
      rowSum += val
      if (val < rowMin) rowMin = val
      if (val > rowMax) rowMax = val
      i++
    } else {
      emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height)

      if (width >= height) {
        const areaWidth = rowSum / height
        xoffset += areaWidth
        width -= areaWidth
      } else {
        const areaHeight = rowSum / width
        yoffset += areaHeight
        height -= areaHeight
      }

      rowLen = 0
      rowSum = 0
      rowMin = Infinity
      rowMax = -Infinity
    }
  }

  if (rowLen > 0) {
    emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height)
  }

  return coords
}

/**
 * @param {any[]} data
 * @param {number} width
 * @param {number} height
 */
function generate(data, width, height) {
  const n = data.length

  const sums = new Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    const series = data[i]
    for (let j = 0; j < series.length; j++) {
      s += series[j]
    }
    sums[i] = s
  }

  const seriesRects = squarify(
    normalize(sums, width * height),
    0, 0, width, height
  )

  const results = new Array(n)
  for (let i = 0; i < n; i++) {
    const rect = seriesRects[i]
    const rx = rect[0]
    const ry = rect[1]
    const rw = rect[2] - rx
    const rh = rect[3] - ry
    results[i] = squarify(
      normalize(data[i], rw * rh),
      rx, ry, rw, rh
    )
  }

  return results
}

// ---------------------------------------------------------------------------
// Nested (arbitrary-depth) layout
//
// `generate` above is the two-level special case: series, then the rows inside
// each series. The same squarify step applied recursively lays out a tree of
// any depth, and because each level performs exactly the same
// normalize-then-squarify against its parent's rect, a two-level tree comes out
// bit-for-bit identical to `generate` (guarded in tests/unit/treemap-nested).
//
// A parent is drawn as a real container, so before its children are laid out
// its rect gives up a header strip at the top and an inset on all four sides.
// ---------------------------------------------------------------------------

/**
 * A node's laid-out area. Leaves take their own magnitude; a parent takes the
 * sum of its children's, never its own authored value: a container rect must
 * hold its children exactly, so an authored parent value that disagrees with
 * its children would tear the layout. The authored value stays on the node for
 * the tooltip to report.
 *
 * Cached as `_area` in one prepass; recomputing per level would be O(n * depth).
 *
 * @param {any} node
 * @returns {number}
 */
function computeArea(node) {
  const kids = node.children
  if (kids && kids.length) {
    let s = 0
    for (let i = 0; i < kids.length; i++) {
      s += computeArea(kids[i])
    }
    node._area = s
    return s
  }
  const v = Number(node.value)
  const a = isNaN(v) ? 0 : Math.abs(v)
  node._area = a
  return a
}

/**
 * Lay out one set of siblings inside a rect, then recurse into each that has
 * children.
 *
 * @param {any[]} nodes
 * @param {number} xoffset
 * @param {number} yoffset
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @param {(node: any, depth: number, w: number, h: number) => number} padding
 * @param {(node: any, depth: number, w: number, h: number) => number} header
 */
function layoutLevel(nodes, xoffset, yoffset, width, height, depth, padding, header) {
  const n = nodes.length
  if (n === 0 || width <= 0 || height <= 0) return

  const areas = new Array(n)
  let total = 0
  for (let i = 0; i < n; i++) {
    areas[i] = nodes[i]._area
    total += areas[i]
  }
  // Nothing to divide: normalize would multiply by Infinity/NaN and every rect
  // would come out unusable. Leave the nodes without a rect; the renderer skips
  // a node that has none.
  if (total <= 0) return

  const rects = squarify(
    normalize(areas, width * height),
    xoffset,
    yoffset,
    width,
    height,
  )

  for (let i = 0; i < n; i++) {
    const node = nodes[i]
    const r = rects[i]
    if (!r) continue
    node.rect = r
    node.depth = depth

    const kids = node.children
    if (!kids || !kids.length) continue

    const rw = r[2] - r[0]
    const rh = r[3] - r[1]

    // The accessors receive the parent's measured box, so the caller can decline
    // a header on a tile too small to ever show one (only the renderer knows the
    // font size). The clamps below are the geometric backstop: whatever comes
    // back, the content box must stay positive rather than invert.
    let pad = Math.max(0, padding(node, depth, rw, rh) || 0)
    if (pad * 2 >= rw || pad * 2 >= rh) pad = 0

    let head = Math.max(0, header(node, depth, rw, rh) || 0)
    // Reserve the strip only when the content box below it stays at least as
    // tall as the strip itself, otherwise the header would eat the children.
    if (head > 0 && rh - pad * 2 - head < head) head = 0
    node.headerHeight = head

    layoutLevel(
      kids,
      r[0] + pad,
      r[1] + head + pad,
      rw - pad * 2,
      rh - head - pad * 2,
      depth + 1,
      padding,
      header,
    )
  }
}

/**
 * Squarify a tree of any depth.
 *
 * Each node is `{ value: number, children?: node[] }` and is annotated in place
 * with:
 *   - `rect`         `[x1, y1, x2, y2]` in plot pixels (absent if it could not
 *                    be placed, e.g. an all-zero branch)
 *   - `depth`        0 for the roots
 *   - `_area`        the magnitude this node was sized by
 *   - `headerHeight` the strip actually reserved at the top of a parent, after
 *                    clamping (0 when it did not fit)
 *
 * Both accessors are called as `(node, depth, rectWidth, rectHeight)` with the
 * parent's own measured box, so the caller can decline an inset or a header
 * that the tile is too small to carry.
 *
 * @param {any[]} nodes  root-level siblings
 * @param {number} width
 * @param {number} height
 * @param {{ padding?: (node: any, depth: number, w: number, h: number) => number,
 *           header?: (node: any, depth: number, w: number, h: number) => number }} [opts]
 * @returns {any[]} the same `nodes`, annotated
 */
function generateNested(nodes, width, height, opts = {}) {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes || []
  const padding = opts.padding || (() => 0)
  const header = opts.header || (() => 0)

  for (let i = 0; i < nodes.length; i++) computeArea(nodes[i])
  layoutLevel(nodes, 0, 0, width, height, 0, padding, header)
  return nodes
}

export default { generate, generateNested }

