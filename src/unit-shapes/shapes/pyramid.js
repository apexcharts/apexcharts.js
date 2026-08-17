// @ts-check
import { tiers } from '../engine/radial.js'

/**
 * A pyramid: tier one holds one dot, tier two holds two, and so on, so the dots
 * cut the slope themselves and every tier is a real count.
 *
 * Filled from the base by default, which is what turns a head count into the
 * hierarchy it describes. `pyramid.with({ order: 'rows' })` inverts it.
 */
export const pyramid = /* @__PURE__ */ tiers({
  name: 'pyramid',
  category: 'symbols',
  minUnits: 20,
  order: 'rowsUp',
  source: 'generated',
})
