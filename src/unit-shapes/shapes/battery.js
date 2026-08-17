// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A battery body with its terminal. Filled in COLUMN order, so the first
 * category reads as a charge level instead of a band across the top.
 */
export const battery = /* @__PURE__ */ silhouette({
  name: 'battery',
  category: 'objects',
  minUnits: 40,
  order: 'cols',
  source: 'original',
  path:
    'M 14 22 L 72 22 C 78 22 82 26 82 32 L 82 38 L 93 38 L 93 62 L 82 62 '
    + 'L 82 68 C 82 74 78 78 72 78 L 14 78 C 8 78 4 74 4 68 L 4 32 '
    + 'C 4 26 8 22 14 22 Z',
})
