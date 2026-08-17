// @ts-check
import { stroke } from '../engine/stroke.js'

/**
 * A checkmark: passes, completions, agreements, anything counted as done.
 *
 * The first stroke shape, and the reason the stroke region exists. As a filled
 * outline this would need both sides of both arms plus a mitred corner and two
 * angled caps, authored by hand; as a centreline it is three points and a width.
 */
export const check = /* @__PURE__ */ stroke({
  name: 'check',
  category: 'symbols',
  minUnits: 40,
  width: 19,
  source: 'original',
  path: 'M 13 55 L 37 79 L 87 22',
})
