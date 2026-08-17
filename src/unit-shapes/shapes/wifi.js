// @ts-check
import { stroke } from '../engine/stroke.js'

/**
 * A wifi symbol: connections, sessions, devices online, signal.
 *
 * Three arcs on a common centre plus a dot, as four subpaths of one centreline.
 * The dot is a deliberately zero-length segment, which the stroke region resolves
 * to a single disc, so the same `width` sizes both the arcs and the dot.
 *
 * The arc gaps are the constraint. Radii 44, 30 and 16 against a width of 8 leave
 * 6 units of clear air between bands, which is what `minUnits` is protecting: pack
 * fewer dots than that and neighbouring arcs merge into a solid fan.
 */
export const wifi = /* @__PURE__ */ stroke({
  name: 'wifi',
  category: 'technology',
  minUnits: 120,
  width: 8,
  source: 'original',
  path:
    'M 11.9 62 A 44 44 0 0 1 88.1 62 '
    + 'M 24 69 A 30 30 0 0 1 76 69 '
    + 'M 36.1 76 A 16 16 0 0 1 63.9 76 '
    + 'M 50 86 L 50 86',
})
