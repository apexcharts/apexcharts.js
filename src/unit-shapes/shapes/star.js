// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A five pointed star, one point up.
 *
 * Outer and inner radii are 48 and 20. The ratio matters more than either
 * number: push the inner radius out and the points stop being points, pull it in
 * and they turn into spikes that no dot count can fill.
 */
export const star = /* @__PURE__ */ silhouette({
  name: 'star',
  category: 'symbols',
  minUnits: 80,
  source: 'original',
  path:
    'M 50 2 L 61.8 33.8 L 95.7 35.2 L 69 56.2 L 78.2 88.8 '
    + 'L 50 70 L 21.8 88.8 L 31 56.2 L 4.3 35.2 L 38.2 33.8 Z',
})
