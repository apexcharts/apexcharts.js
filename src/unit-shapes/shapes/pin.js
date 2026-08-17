// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A map pin: places, locations, sites, stores.
 *
 * A teardrop with the point at the bottom and a reverse wound bore through the
 * head. Without the bore it is just a droplet turned upside down, so the hole is
 * doing the identifying here.
 *
 * This is the only geography shape besides the globe, and deliberately so:
 * countries and regions need a real projection and real boundary data, which is
 * ApexMaps' job. It feeds this same layout seam.
 */
export const pin = /* @__PURE__ */ silhouette({
  name: 'pin',
  category: 'geography',
  minUnits: 120,
  source: 'original',
  path:
    'M 50 96 C 50 96 16 56 16 38 C 16 20 31 6 50 6 C 69 6 84 20 84 38 '
    + 'C 84 56 50 96 50 96 Z '
    + 'M 39 37 A 11 11 0 0 0 61 37 A 11 11 0 0 0 39 37 Z',
})
