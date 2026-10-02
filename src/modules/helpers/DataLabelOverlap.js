// @ts-check

/**
 * Cross-series de-overlap for cartesian data labels.
 *
 * `DataLabels.dataLabelsCorrection` already drops a label that would land on
 * the previous one, but it only ever compares within ONE series
 * (`dataLabelsRects[i]`) and it measures the raw text, not the background pill.
 * So the two cases users actually hit survive it:
 *
 *   - two series whose labels coincide. On a dual-axis chart the two axes are
 *     scaled independently, so this is not a question of the VALUES being
 *     close: a bar at 59.5K and a line at 68K can land on the same pixel row
 *     while 51K and 51.3K land 14px apart. Only pixel positions can decide it.
 *   - adjacent narrow bars (a waterfall is the usual one) whose labels are
 *     wider than the slot they belong to.
 *
 * This module owns the geometry only: it takes measured boxes and answers with
 * a vertical shift per box, so it is a pure function over numbers and can be
 * tested without a DOM. Moving the nodes is `DataLabels.avoidOverlaps`'s job.
 */

/**
 * @typedef {object} LabelBox
 * @property {number} x left edge, after any text-anchor has been applied
 * @property {number} y top edge
 * @property {number} width
 * @property {number} height
 * @property {number} order tie-break: which of two coincident labels goes up.
 *   Draw order, so the earlier series keeps the upper slot and a re-render
 *   cannot flip the pair.
 * @property {boolean} [fixed] this label cannot be moved, only avoided. A
 *   rotated label is the case that matters: its `y` attribute runs along its
 *   own rotated axis, so writing to it slides the label sideways on screen
 *   rather than up or down.
 */

/**
 * @typedef {object} ResolveOpts
 * @property {number} gap clear space to leave between two separated labels
 * @property {number} maxShift how far a label may travel from its mark before
 *   it stops being readable as that mark's label and is hidden instead
 * @property {number} minY top bound; a label is not pushed above this
 * @property {number} maxY bottom bound
 * @property {boolean} [hide] drop a label that could not be separated. Off by
 *   default: leaving an overlap is what the chart did before this pass, and a
 *   silently deleted value is worse than the overlap.
 * @property {number} [iterations] relaxation passes, default 6
 */

/**
 * Vertical overlap of two boxes, <= 0 when they are clear of each other.
 * @param {LabelBox} a
 * @param {number} aShift
 * @param {LabelBox} b
 * @param {number} bShift
 */
function overlapY(a, aShift, b, bShift) {
  const aTop = a.y + aShift
  const bTop = b.y + bShift
  return Math.min(aTop + a.height, bTop + b.height) - Math.max(aTop, bTop)
}

/**
 * Horizontal overlap; shifting is vertical only, so this never changes.
 * @param {LabelBox} a
 * @param {LabelBox} b
 */
function overlapX(a, b) {
  return Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
}

/**
 * Resolve a set of label boxes into per-box vertical shifts.
 *
 * Labels are separated vertically rather than horizontally because a data
 * label names a position on the value axis; sliding it sideways moves it over
 * a neighbouring category and reads as that category's label instead.
 *
 * The pass is pairwise relaxation, not column packing: a crowded chart would
 * otherwise chain every label into one tall stack through its neighbours, and
 * a label hundreds of pixels from its bar is worse than an overlapping one.
 * Each colliding pair splits the push between its two members, each member is
 * capped at `maxShift` from its own mark, and anything still colliding once the
 * budget is spent is hidden rather than left on top of its neighbour.
 *
 * @param {LabelBox[]} boxes
 * @param {ResolveOpts} opts
 * @returns {{ dy: number, hidden: boolean }[]} one per input box, input order
 */
export function resolveLabelOverlaps(boxes, opts) {
  const n = boxes.length
  const result = new Array(n)
  for (let i = 0; i < n; i++) result[i] = { dy: 0, hidden: false }
  if (n < 2) return result

  const { gap, maxShift, minY, maxY } = opts
  const iterations = opts.iterations ?? 6

  // Sweep order: left to right, so each box only has to look at the ones whose
  // left edge is still inside its own right edge. Without this the pass is
  // O(n^2) on every iteration, which a label-dense chart cannot afford.
  const idx = boxes.map((_, i) => i).sort((a, b) => boxes[a].x - boxes[b].x)

  /** @param {number} i @param {number} d */
  const clampShift = (i, d) => {
    const b = boxes[i]
    // A fixed label is an obstacle, never a mover.
    if (b.fixed) return result[i].dy
    // Budget is measured from the mark, so a label that has already been
    // pushed 6px down can only travel maxShift-6 further in that direction.
    const out = Math.max(-maxShift, Math.min(maxShift, d))
    // ...and never further out of the plot than it already is. Clamping to
    // `minY - b.y` directly would do something worse than restrict: for a
    // label that legitimately starts outside the bounds - the one above a bar
    // that reaches the top of the grid - that expression is positive and would
    // FORCE it downwards even when it was asked to stay put. Bounding each
    // direction against zero keeps this a restriction, never a push.
    const canGoUp = Math.min(0, minY - b.y)
    const canGoDown = Math.max(0, maxY - (b.y + b.height))
    return Math.max(canGoUp, Math.min(canGoDown, out))
  }

  for (let pass = 0; pass < iterations; pass++) {
    let moved = false

    for (let p = 0; p < idx.length; p++) {
      const i = idx[p]
      const a = boxes[i]
      if (result[i].hidden) continue

      for (let q = p + 1; q < idx.length; q++) {
        const j = idx[q]
        const b = boxes[j]
        if (result[j].hidden) continue
        // Sorted by x: once a box starts to the right of a's right edge, so
        // does every box after it.
        if (b.x >= a.x + a.width) break
        if (overlapX(a, b) <= 0) continue

        const oy = overlapY(a, result[i].dy, b, result[j].dy)
        if (oy <= -gap) continue

        const need = oy + gap

        // Who goes up: whichever already sits higher, and on an exact tie the
        // one drawn first, so the result is stable across re-renders.
        const aCy = a.y + result[i].dy + a.height / 2
        const bCy = b.y + result[j].dy + b.height / 2
        const aUp = aCy === bCy ? a.order <= b.order : aCy < bCy

        const upIdx = aUp ? i : j
        const downIdx = aUp ? j : i

        // Split the push, then let whichever side has room absorb the share
        // its partner could not take (a label at the top of the plot cannot
        // move up, so its partner takes the whole separation downwards).
        const wantUp = clampShift(upIdx, result[upIdx].dy - need / 2)
        const wantDown = clampShift(downIdx, result[downIdx].dy + need / 2)

        const gotUp = result[upIdx].dy - wantUp
        const gotDown = wantDown - result[downIdx].dy
        const shortfall = need - (gotUp + gotDown)

        let finalUp = wantUp
        let finalDown = wantDown
        if (shortfall > 0.01) {
          finalDown = clampShift(downIdx, wantDown + shortfall)
          const stillShort = need - (gotUp + (finalDown - result[downIdx].dy))
          if (stillShort > 0.01) {
            finalUp = clampShift(upIdx, wantUp - stillShort)
          }
        }

        if (finalUp !== result[upIdx].dy || finalDown !== result[downIdx].dy) {
          result[upIdx].dy = finalUp
          result[downIdx].dy = finalDown
          moved = true
        }
      }
    }

    if (!moved) break
  }

  if (!opts.hide) return result

  // Whatever the budget could not separate is hidden, later-drawn label first,
  // so the chart is short a label rather than showing two unreadable ones.
  for (let p = 0; p < idx.length; p++) {
    const i = idx[p]
    if (result[i].hidden) continue
    const a = boxes[i]
    for (let q = p + 1; q < idx.length; q++) {
      const j = idx[q]
      if (result[j].hidden) continue
      const b = boxes[j]
      if (b.x >= a.x + a.width) break
      if (overlapX(a, b) <= 0) continue
      if (overlapY(a, result[i].dy, b, result[j].dy) > 0) {
        // Prefer dropping the later-drawn label, but never drop one that was
        // never allowed to move: if neither could be separated, leaving both
        // visible is what the chart did before this pass existed, and silently
        // deleting a label is worse than the overlap it was meant to prevent.
        const first = a.order <= b.order ? j : i
        const second = first === i ? j : i
        const loser = !boxes[first].fixed
          ? first
          : !boxes[second].fixed
            ? second
            : -1
        if (loser === -1) continue
        result[loser].hidden = true
        // `a` itself just lost, so it has no further say over the boxes to
        // its right; they are judged against whoever is still visible.
        if (loser === i) break
      }
    }
  }

  return result
}
