// @ts-check
/**
 * Union-anchor path reconciliation for variable-length line/area updates.
 *
 * The command-level morph engine (PathMorphing.morphPaths) pairs commands by
 * array index. When the data length changes that pairing breaks down: the
 * shorter path gets padded with phantom commands frozen at its endpoint, so
 * appended points "unfurl" out of the old terminus, and, far worse, an area
 * path's closing baseline commands get paired against data vertices, which
 * tweens fill corners diagonally across the plot (self-intersecting fill).
 *
 * This module fixes the pairing by construction. Given the keyed join between
 * old and new datums (see LengthTransition.joinKeys) it rebuilds BOTH paths
 * over the union of anchors:
 *
 *  - the FROM path gains one anchor per ENTERING datum, placed exactly ON the
 *    old curve (de Casteljau split of the bracketing segment, or pinned to an
 *    endpoint for prepends/appends), so frame 0 renders pixel-identical to
 *    the old path;
 *  - the interpolation TARGET gains one anchor per EXITING datum, placed
 *    exactly ON the new curve, so exiting points melt into the line instead
 *    of collapsing to the endpoint; the runner then snaps to the clean,
 *    un-padded final path at t=1 (see SVGAnimationRunner.plot's snapTo).
 *
 * Both outputs have identical command counts and identical command types per
 * index (M, then all-L or all-C, then for areas a closing block that pairs
 * with the other side's closing block), so the per-command lerp degenerates
 * into a clean coordinate tween: fills can no longer tear.
 *
 * Scope guard: only single-segment paths from the standard builders are
 * handled (one M, uniform L or C segments, optional 3-command area close).
 * Anything else (null-segmented series, steplines' H/V, rangeArea joins)
 * fails analysis and the caller falls back to the legacy morph.
 *
 * @module svg/PathReconcile
 */

import { parsePath, arrayToPath } from './PathMorphing'

/**
 * @typedef {Object} UnionEntry
 * @property {number} oldJ - old datum index, or -1 for an entering datum
 * @property {number} newJ - new datum index, or -1 for an exiting datum
 */

/**
 * Merge a keyed join into the union sequence of datums, ordered so that both
 * the old indices and the new indices appear in ascending order.
 *
 * @param {{toOld: number[], exits: number[]}} join - from joinKeys()
 * @param {number} oldN
 * @returns {UnionEntry[]}
 */
export function buildUnionEntries(join, oldN) {
  const exitSet = new Set(join.exits)
  /** @type {UnionEntry[]} */
  const entries = []
  let oi = 0
  for (let nj = 0; nj < join.toOld.length; nj++) {
    const oj = join.toOld[nj]
    if (oj !== -1) {
      // Flush exits that sit before this survivor in the old order.
      while (oi < oj) {
        if (exitSet.has(oi)) entries.push({ oldJ: oi, newJ: -1 })
        oi++
      }
      entries.push({ oldJ: oj, newJ: nj })
      oi = oj + 1
    } else {
      entries.push({ oldJ: -1, newJ: nj })
    }
  }
  while (oi < oldN) {
    if (exitSet.has(oi)) entries.push({ oldJ: oi, newJ: -1 })
    oi++
  }
  return entries
}

/**
 * Parse and validate a series path against the structure the line/area
 * builders emit for a single un-segmented series.
 *
 * @param {string} d
 * @param {number} expectedAnchors - the datum count this path must carry
 * @param {boolean} isArea - expect the 3-command closing block
 * @returns {{body: any[], closing: any[] | null, segType: string, anchors: number[][]} | null}
 */
function analyzeSeriesPath(d, expectedAnchors, isArea) {
  if (!d || typeof d !== 'string') return null
  const cmds = parsePath(d)
  if (!cmds.length || cmds[0][0] !== 'M') return null
  for (let i = 1; i < cmds.length; i++) {
    if (cmds[i][0] === 'M') return null // multi-segment: not handled
  }

  let body = cmds
  /** @type {any[] | null} */
  let closing = null
  if (isArea) {
    if (cmds.length < 5) return null
    closing = cmds.slice(-3)
    body = cmds.slice(0, -3)
    if (closing[2][0] !== 'Z') return null
    if (closing[1][0] !== 'L') return null
    if (closing[0][0] !== 'L' && closing[0][0] !== 'C') return null
  } else if (cmds[cmds.length - 1][0] === 'Z') {
    return null
  }

  if (body.length !== expectedAnchors || body.length < 2) return null

  const segType = body[1][0]
  if (segType !== 'L' && segType !== 'C') return null
  for (let i = 2; i < body.length; i++) {
    if (body[i][0] !== segType) return null
  }

  /** @type {number[][]} */
  const anchors = body.map((c) =>
    c[0] === 'C' ? [Number(c[5]), Number(c[6])] : [Number(c[1]), Number(c[2])],
  )
  for (const a of anchors) {
    if (!isFinite(a[0]) || !isFinite(a[1])) return null
  }
  return { body, closing, segType, anchors }
}

/**
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} t
 */
function lerpPt(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/**
 * De Casteljau split of a cubic segment at parameter t.
 *
 * @param {number[]} s - segment start point
 * @param {any[]} cmd - ['C', x1, y1, x2, y2, x, y]
 * @param {number} t
 * @returns {{first: any[], second: any[], mid: number[]}}
 */
function splitCubic(s, cmd, t) {
  const p0 = s
  const p1 = [cmd[1], cmd[2]]
  const p2 = [cmd[3], cmd[4]]
  const p3 = [cmd[5], cmd[6]]
  const p01 = lerpPt(p0, p1, t)
  const p12 = lerpPt(p1, p2, t)
  const p23 = lerpPt(p2, p3, t)
  const p012 = lerpPt(p01, p12, t)
  const p123 = lerpPt(p12, p23, t)
  const mid = lerpPt(p012, p123, t)
  return {
    first: ['C', p01[0], p01[1], p012[0], p012[1], mid[0], mid[1]],
    second: ['C', p123[0], p123[1], p23[0], p23[1], p3[0], p3[1]],
    mid,
  }
}

/**
 * Split of a straight segment at parameter t.
 *
 * @param {number[]} s - segment start point
 * @param {any[]} cmd - ['L', x, y]
 * @param {number} t
 * @returns {{first: any[], second: any[], mid: number[]}}
 */
function splitLine(s, cmd, t) {
  const e = [cmd[1], cmd[2]]
  const mid = lerpPt(s, e, t)
  return {
    first: ['L', mid[0], mid[1]],
    second: ['L', e[0], e[1]],
    mid,
  }
}

/**
 * Rebuild one path over the union sequence. `ownIdx[k]` is the entry's anchor
 * index in THIS path (old index for the from path, new index for the target
 * path) or -1 for a foreign entry (an enter when rebuilding the from path, an
 * exit when rebuilding the target). Foreign entries between two own anchors
 * split the original segment at equal parameters (staying exactly on the
 * curve); leading/trailing foreigners pin to the first/last anchor.
 *
 * Own anchor indices are guaranteed to appear in ascending 0..n-1 order by
 * buildUnionEntries.
 *
 * @param {{body: any[], closing: any[] | null, segType: string, anchors: number[][]}} analysis
 * @param {number[]} ownIdx
 * @returns {any[]}
 */
function expandPath(analysis, ownIdx) {
  const { body, closing, segType, anchors } = analysis
  const n = anchors.length
  const m = ownIdx.length
  /** @param {number[]} p */
  const degen = (p) =>
    segType === 'C'
      ? ['C', p[0], p[1], p[0], p[1], p[0], p[1]]
      : ['L', p[0], p[1]]

  const out = [['M', anchors[0][0], anchors[0][1]]]

  // Leading foreign entries sit at the first anchor: the M covers entry 0,
  // every further entry up to (and including) own anchor 0 is a degenerate
  // segment pinned there.
  let firstOwn = 0
  while (firstOwn < m && ownIdx[firstOwn] !== 0) firstOwn++
  for (let q = 1; q <= firstOwn; q++) out.push(degen(anchors[0]))

  let entry = firstOwn + 1
  for (let s = 0; s < n - 1; s++) {
    let interior = 0
    while (entry + interior < m && ownIdx[entry + interior] === -1) interior++
    const cmd = body[s + 1]
    if (!interior) {
      out.push(cmd.slice())
    } else {
      const totalParts = interior + 1
      let start = anchors[s]
      let rest = cmd
      for (let q = 0; q < interior; q++) {
        const t = 1 / (totalParts - q)
        const sp =
          segType === 'C' ? splitCubic(start, rest, t) : splitLine(start, rest, t)
        out.push(sp.first)
        start = sp.mid
        rest = sp.second
      }
      out.push(rest)
    }
    entry += interior + 1 // interiors + own anchor s+1
  }

  // Trailing foreign entries pin to the last anchor.
  while (entry < m) {
    out.push(degen(anchors[n - 1]))
    entry++
  }

  if (closing) closing.forEach((c) => out.push(c.slice()))
  return out
}

/**
 * Reconcile one from/to path pair over the union entries.
 *
 * @param {string} fromD - the previous render's path for this series
 * @param {string} toD - the freshly built (clean) path
 * @param {UnionEntry[]} entries - from buildUnionEntries()
 * @param {number} oldN - old datum count (fromD must carry this many anchors)
 * @param {number} newN - new datum count (toD must carry this many anchors)
 * @param {boolean} isArea
 * @returns {{from: string, toInterp: string} | null} null when either path
 *   does not match the expected single-segment structure (caller falls back
 *   to the legacy morph)
 */
export function reconcilePathPair(fromD, toD, entries, oldN, newN, isArea) {
  const fromAnalysis = analyzeSeriesPath(fromD, oldN, isArea)
  if (!fromAnalysis) return null
  const toAnalysis = analyzeSeriesPath(toD, newN, isArea)
  if (!toAnalysis) return null
  // The morph lerps index-to-index: segment types must agree or the engine
  // would still bezier-promote mid-flight.
  if (fromAnalysis.segType !== toAnalysis.segType) return null
  if (
    (fromAnalysis.closing || toAnalysis.closing) &&
    (!fromAnalysis.closing ||
      !toAnalysis.closing ||
      fromAnalysis.closing[0][0] !== toAnalysis.closing[0][0])
  ) {
    return null
  }

  const fromOwn = entries.map((e) => e.oldJ)
  const toOwn = entries.map((e) => e.newJ)
  return {
    from: arrayToPath(expandPath(fromAnalysis, fromOwn)),
    toInterp: arrayToPath(expandPath(toAnalysis, toOwn)),
  }
}
