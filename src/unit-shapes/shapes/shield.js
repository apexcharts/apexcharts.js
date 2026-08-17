// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * Heraldic: a flat top, sides that stay full width, then a long taper to a
 * point. Rows fill from the top, so a critical tail lands in the point where a
 * handful of dots cannot be missed.
 */
export const shield = /* @__PURE__ */ silhouette({
  name: 'shield',
  category: 'technology',
  minUnits: 40,
  source: 'original',
  path:
    'M 6 8 L 94 8 L 94 38 C 94 60 82 81 50 97 C 18 81 6 60 6 38 Z',
})
