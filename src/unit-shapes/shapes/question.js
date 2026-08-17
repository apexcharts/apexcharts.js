// @ts-check
import { stroke } from '../engine/stroke.js'

/**
 * A question mark: unknowns, unclassified, no response, not stated.
 *
 * Useful precisely because so much real data has a category like that, and a
 * pictogram of it is usually more honest than leaving it out. The dot below the
 * hook is a zero-length segment, which the stroke resolves to a single disc.
 */
export const question = /* @__PURE__ */ stroke({
  name: 'question',
  category: 'symbols',
  minUnits: 90,
  width: 14,
  source: 'original',
  path: 'M 25 32 C 25 8 76 8 76 33 C 76 52 50 54 50 70 M 50 90 L 50 90',
})
