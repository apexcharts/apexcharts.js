// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A mountain range: two peaks over a shared base.
 *
 * The valley between them stops short of the base, so the range stays one solid
 * mass instead of two triangles standing apart. Peaks of unequal height, because
 * two matching triangles read as a pattern rather than as terrain.
 */
export const mountain = /* @__PURE__ */ silhouette({
  name: 'mountain',
  category: 'geography',
  minUnits: 60,
  source: 'original',
  path: 'M 2 90 L 34 26 L 50 56 L 64 18 L 98 90 Z',
})
