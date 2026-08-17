// @ts-check
import { rings } from '../engine/radial.js'

/**
 * A target. Dots sit on concentric rings, handed out from the OUTSIDE IN, so a
 * funnel's stages fall into bands and the last one lands in the bullseye.
 *
 * The rings are positions only. Colour still comes from the series, as it does
 * in every other layout, so this is a bullseye the data draws rather than a
 * decoration drawn under it.
 */
export const target = /* @__PURE__ */ rings({
  name: 'target',
  category: 'business',
  minUnits: 40,
  order: 'centerIn',
  source: 'generated',
})
