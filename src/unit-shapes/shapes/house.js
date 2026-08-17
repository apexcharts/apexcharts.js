// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * Roof, eaves, walls, a door and two windows. The openings are subpaths wound
 * the other way, so they are dots that are missing rather than anything drawn
 * over the top, which is why they scale with the shape instead of the viewport.
 */
export const house = /* @__PURE__ */ silhouette({
  name: 'house',
  category: 'objects',
  minUnits: 120,
  order: 'rows',
  source: 'original',
  path:
    'M 50 4 L 97 44 L 97 50 L 84 50 L 84 95 L 16 95 L 16 50 L 3 50 L 3 44 Z '
    + 'M 44 95 L 56 95 L 56 70 L 44 70 Z '
    + 'M 25 58 L 25 69 L 37 69 L 37 58 Z '
    + 'M 63 58 L 63 69 L 75 69 L 75 58 Z',
})
