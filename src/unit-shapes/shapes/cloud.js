// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A cloud: three overlapping discs sitting on a flat base.
 *
 * Built as a union rather than as one traced outline, because the union is what
 * keeps the lobes readable at any dot count: each disc contributes its own
 * curve, and the base flattens the bottom into a single horizon instead of three
 * scallops. All four subpaths are wound the same way so none of them cuts a hole.
 */
export const cloud = /* @__PURE__ */ silhouette({
  name: 'cloud',
  category: 'nature',
  minUnits: 60,
  source: 'original',
  path:
    // The base is inset well inside the discs. Run it out to their full width and
    // its corners poke through as vertical edges, which squares the cloud off.
    'M 22 76 L 80 76 L 80 58 L 22 58 Z '
    + 'M 14 60 A 18 18 0 0 0 50 60 A 18 18 0 0 0 14 60 Z '
    + 'M 28 50 A 24 24 0 0 0 76 50 A 24 24 0 0 0 28 50 Z '
    + 'M 60 58 A 17 17 0 0 0 94 58 A 17 17 0 0 0 60 58 Z',
})
