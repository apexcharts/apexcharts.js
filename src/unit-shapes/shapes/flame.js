// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A flame: a teardrop pulled off-centre, with one lick cut into its left flank.
 *
 * The asymmetry is the whole point. A symmetric teardrop is already the droplet,
 * so a flame has to lean, and the notch on the left is what stops it reading as
 * water. The notch is deliberately wide: the packer handles concave spans without
 * complaint, but a bite narrower than a dot would swallow whole rows.
 */
export const flame = /* @__PURE__ */ silhouette({
  name: 'flame',
  category: 'nature',
  minUnits: 60,
  source: 'original',
  path:
    'M 56 2 C 52 24 34 30 30 50 C 27 64 33 70 34 78 '
    + 'C 24 72 20 60 21 50 C 12 62 10 76 16 86 '
    + 'C 24 95 38 98 52 98 C 72 98 84 84 82 64 '
    + 'C 80 46 68 40 66 26 C 64 38 60 42 58 44 C 62 30 60 14 56 2 Z',
})
