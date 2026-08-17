// @ts-check
import { stroke } from '../engine/stroke.js'

/**
 * An X: failures, rejections, cancellations, the other half of `check`.
 *
 * Two crossing strokes, and the crossing is the point worth noting: the region is
 * a union of capsules, so a centreline that intersects itself simply overlaps
 * itself. There is no crossing case to handle, and the middle comes out solid
 * rather than double-counted.
 */
export const xmark = /* @__PURE__ */ stroke({
  name: 'xmark',
  category: 'symbols',
  minUnits: 40,
  width: 18,
  source: 'original',
  path: 'M 18 18 L 82 82 M 82 18 L 18 82',
})
