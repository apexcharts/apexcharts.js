// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A crown: three peaks over a flared band.
 *
 * The two valleys stop well short of the base, so the band stays solid across the
 * full width. Cut them deeper and the crown falls apart into three separate
 * spikes at low dot counts, which is why `minUnits` is up where the valleys still
 * hold together.
 */
export const crown = /* @__PURE__ */ silhouette({
  name: 'crown',
  category: 'symbols',
  minUnits: 90,
  source: 'original',
  path: 'M 8 84 L 14 26 L 32 52 L 50 16 L 68 52 L 86 26 L 92 84 Z',
})
