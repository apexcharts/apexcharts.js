// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A light bulb: ideas, patents, anything counted in bright ones.
 *
 * Glass and screw base are separate subpaths, wound alike so they union. The neck
 * between them is the narrow part, so it is what `minUnits` protects: pinch it
 * below a dot and the base floats free of the glass.
 */
export const bulb = /* @__PURE__ */ silhouette({
  name: 'bulb',
  category: 'objects',
  minUnits: 90,
  source: 'original',
  path:
    'M 50 4 C 29 4 14 21 14 39 C 14 54 25 62 30 72 L 70 72 '
    + 'C 75 62 86 54 86 39 C 86 21 71 4 50 4 Z '
    + 'M 34 74 L 36 96 L 64 96 L 66 74 Z',
})
