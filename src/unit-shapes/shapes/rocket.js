// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * Nose, hull, porthole and swept fins. The fins are subpaths that overlap the
 * hull and the porthole is one wound the other way: thin extremities and a hole
 * in a single packing pass.
 */
export const rocket = /* @__PURE__ */ silhouette({
  name: 'rocket',
  category: 'objects',
  minUnits: 120,
  source: 'original',
  path:
    'M 50 2 C 59 13 65 28 66 45 L 66 76 L 58 88 L 42 88 L 34 76 L 34 45 '
    + 'C 35 28 41 13 50 2 Z '
    + 'M 65 56 L 85 86 L 85 95 L 65 82 Z '
    + 'M 35 56 L 15 86 L 15 95 L 35 82 Z '
    + 'M 43.5 34 A 6.5 6.5 0 0 0 56.5 34 A 6.5 6.5 0 0 0 43.5 34 Z',
})
