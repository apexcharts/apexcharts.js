// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A heart with two full lobes and a real notch, so it reads as a heart rather
 * than a triangle with a dent.
 */
export const heart = /* @__PURE__ */ silhouette({
  name: 'heart',
  category: 'symbols',
  minUnits: 40,
  source: 'original',
  path:
    'M 50 93 C 20 71 5 53 5 34 C 5 17 18 6 32 6 C 41 6 47 11 50 19 '
    + 'C 53 11 59 6 68 6 C 82 6 95 17 95 34 C 95 53 80 71 50 93 Z',
})
