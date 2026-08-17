// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A canopy of nine lobes (deliberately not a circle on a stick) overlapping a
 * trunk that flares into roots. Two subpaths union under the nonzero rule.
 */
export const tree = /* @__PURE__ */ silhouette({
  name: 'tree',
  category: 'nature',
  minUnits: 80,
  source: 'original',
  path:
    'M 50 3 C 62 3 70 11 70 19 C 81 16 91 24 91 34 C 97 39 97 51 89 56 '
    + 'C 87 62 77 66 67 63 C 63 68 55 70 50 68 C 45 70 37 68 33 63 '
    + 'C 23 66 13 62 11 56 C 3 51 3 39 9 34 C 9 24 19 16 30 19 '
    + 'C 30 11 38 3 50 3 Z '
    + 'M 41 58 L 59 58 L 60 88 C 61 92 63 94 67 96 L 33 96 '
    + 'C 37 94 39 92 40 88 Z',
})
