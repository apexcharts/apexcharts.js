// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A block arrow pointing up: growth, or a share of it moving.
 *
 * Blocky on purpose. A line-and-chevron arrow is a stroke, not a silhouette, so
 * it belongs to the stroke region rather than here; this one has a body wide
 * enough to carry rows of dots at any count.
 */
export const arrow = /* @__PURE__ */ silhouette({
  name: 'arrow',
  category: 'symbols',
  minUnits: 60,
  source: 'original',
  path: 'M 50 4 L 92 46 L 70 46 L 70 96 L 30 96 L 30 46 L 8 46 Z',
})
