// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A car, side on: vehicles, journeys, deliveries, registrations.
 *
 * Body plus two wheel discs, all wound the same way so the wheels add to the body
 * instead of boring holes through it (which is what they do if the arcs sweep the
 * other way, and it looks deliberate enough to miss).
 *
 * The wheels hang below the sill, so the silhouette sits on them. That, plus the
 * stepped roofline, is what separates a car from a rounded rectangle.
 */
export const car = /* @__PURE__ */ silhouette({
  name: 'car',
  category: 'objects',
  minUnits: 120,
  source: 'original',
  path:
    'M 4 78 L 4 56 L 20 52 L 32 30 L 68 30 L 82 52 L 96 56 L 96 78 Z '
    + 'M 13 78 A 13 13 0 0 1 39 78 A 13 13 0 0 1 13 78 Z '
    + 'M 61 78 A 13 13 0 0 1 87 78 A 13 13 0 0 1 61 78 Z',
})
