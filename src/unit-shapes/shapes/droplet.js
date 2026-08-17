// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A water drop: a point drawn out of a circle.
 */
export const droplet = /* @__PURE__ */ silhouette({
  name: 'droplet',
  category: 'nature',
  minUnits: 40,
  source: 'original',
  path:
    'M 50 3 C 50 3 13 46 13 66 A 37 37 0 0 0 87 66 C 87 46 50 3 50 3 Z',
})
