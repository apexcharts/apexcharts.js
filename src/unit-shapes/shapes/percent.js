// @ts-check
import { stroke } from '../engine/stroke.js'

/**
 * A percent sign: rates, shares, conversion, anything already a proportion.
 *
 * Two rings and a slash, as three subpaths of one centreline. The rings are closed
 * paths, so stroking them traces a circle rather than filling a disc, which is the
 * same trick `outlined()` uses on the silhouettes.
 */
export const percent = /* @__PURE__ */ stroke({
  name: 'percent',
  category: 'symbols',
  minUnits: 150,
  width: 9,
  source: 'original',
  path:
    'M 12 24 A 12 12 0 0 1 36 24 A 12 12 0 0 1 12 24 Z '
    + 'M 64 76 A 12 12 0 0 1 88 76 A 12 12 0 0 1 64 76 Z '
    + 'M 80 14 L 20 86',
})
