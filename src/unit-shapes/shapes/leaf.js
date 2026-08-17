// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A leaf: a lens pointed at both ends, with a stub of stem below it.
 *
 * The stem is a second subpath wound the same way as the blade, so it unions
 * rather than cutting a notch. It is the first thing to go at low dot counts,
 * which is why `minUnits` sits where the blade still reads without it.
 */
export const leaf = /* @__PURE__ */ silhouette({
  name: 'leaf',
  category: 'nature',
  minUnits: 60,
  source: 'original',
  // Two cubics per side, so both ends close as cusps: one cubic per side pulls
  // wide too early and rounds the tip off. Narrow (roughly 2:1) and tilted 28
  // degrees, both for the same reason. Drawn upright and square it reads as a
  // playing-card spade, since a spade is exactly a wide leaf with a stem.
  path:
    'M 27.5 7.6 C 22.6 28.3 17.8 49 26.2 64.9 C 35.6 82.6 55.5 90.1 71.6 90.6 '
    + 'C 80.2 77 85.1 56.3 75.7 38.6 C 67.2 22.7 47.3 15.2 27.5 7.6 Z '
    + 'M 67.1 88.5 L 71.9 101.8 L 80.7 97.1 L 72.4 85.7 Z',
})
