// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * An aircraft from above: flights, routes, passengers, shipments.
 *
 * Swept wings and tailplane come off a single fuselage outline, so there is no
 * seam to close. The wing tips and the tail are the thinnest parts of any shape
 * in the catalog, which is why `minUnits` is the highest: below it the wings
 * dwindle to a single dot each and the plane reads as a cross.
 */
export const plane = /* @__PURE__ */ silhouette({
  name: 'plane',
  category: 'objects',
  minUnits: 160,
  source: 'original',
  path:
    'M 50 2 C 54 2 57 9 58 19 L 58 35 L 95 57 L 95 67 L 58 57 L 58 76 '
    + 'L 70 86 L 70 95 L 50 89 L 30 95 L 30 86 L 42 76 L 42 57 '
    + 'L 5 67 L 5 57 L 42 35 L 42 19 C 43 9 46 2 50 2 Z',
})
