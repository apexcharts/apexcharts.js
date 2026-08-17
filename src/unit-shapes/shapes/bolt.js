// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A lightning bolt: energy, throughput, a spike in anything.
 *
 * Two wedges offset across a shared waist. The waist is the constraint: it is the
 * narrowest part of the shape, so it decides `minUnits`, and if it pinches to
 * less than a dot the bolt separates into two unrelated triangles.
 */
export const bolt = /* @__PURE__ */ silhouette({
  name: 'bolt',
  category: 'symbols',
  minUnits: 70,
  source: 'original',
  path: 'M 62 3 L 20 56 L 44 56 L 38 97 L 80 40 L 54 40 Z',
})
