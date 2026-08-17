// @ts-check
import { sphere } from '../engine/radial.js'

/**
 * A globe: latitude bands on the hemisphere facing the viewer, with the pole
 * leaning in. Rows curve and dots shrink towards the limb because the
 * projection says so, not because anything was drawn behind them.
 *
 * This is a sphere, not a map. Country and continent silhouettes need a real
 * projection and real boundary data, which is ApexMaps' job: it supplies
 * positions through the same layout seam.
 */
export const globe = /* @__PURE__ */ sphere({
  name: 'globe',
  category: 'geography',
  minUnits: 60,
  tilt: 15,
  source: 'generated',
})
