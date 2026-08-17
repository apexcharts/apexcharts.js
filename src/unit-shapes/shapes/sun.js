// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A sun: one polygon, eight rays.
 *
 * No separate disc subpath is needed. The outline never comes closer to the
 * centre than the ray roots, so the polygon already encloses the disc; a second
 * circle would only add a seam for the packer to trip over.
 *
 * The rays are what set `minUnits`. They taper, so at low counts they thin to a
 * single dot and the sun reads as a plain circle.
 */
export const sun = /* @__PURE__ */ silhouette({
  name: 'sun',
  category: 'nature',
  minUnits: 140,
  source: 'original',
  path:
    'M 75.5 41.2 L 98 50 L 75.5 58.8 L 74.3 61.8 L 83.9 83.9 L 61.8 74.3 '
    + 'L 58.8 75.5 L 50 98 L 41.2 75.5 L 38.2 74.3 L 16.1 83.9 L 25.7 61.8 '
    + 'L 24.5 58.8 L 2 50 L 24.5 41.2 L 25.7 38.2 L 16.1 16.1 L 38.2 25.7 '
    + 'L 41.2 24.5 L 50 2 L 58.8 24.5 L 61.8 25.7 L 83.9 16.1 L 74.3 38.2 Z',
})
