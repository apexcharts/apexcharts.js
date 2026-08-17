// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A money bag: revenue, funding, budget, cost.
 *
 * One outline: a tied neck over a heavy round sack. The neck is what identifies
 * it, so it stays wide enough to survive the dot pitch rather than tapering to a
 * realistic pinch.
 *
 * No currency symbol. A glyph cut into the sack would be thin strokes, which is
 * the stroke region's job, and it would also pick a currency for everyone.
 */
export const moneybag = /* @__PURE__ */ silhouette({
  name: 'moneybag',
  category: 'business',
  minUnits: 80,
  source: 'original',
  path:
    'M 36 8 L 64 8 L 59 24 C 80 32 90 48 90 65 C 90 83 73 94 50 94 '
    + 'C 27 94 10 83 10 65 C 10 48 20 32 41 24 Z',
})
