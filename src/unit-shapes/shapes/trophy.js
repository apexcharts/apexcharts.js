// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A trophy: wins, awards, targets met, deals closed.
 *
 * Cup, stem and base, unioned. No handles: they would be thin rings standing off
 * the sides, and a ring one dot thick is a dotted circle. The cup-stem-base
 * profile carries the read on its own.
 */
export const trophy = /* @__PURE__ */ silhouette({
  name: 'trophy',
  category: 'business',
  minUnits: 110,
  source: 'original',
  path:
    'M 30 8 L 70 8 L 68 40 C 68 54 58 62 50 62 C 42 62 32 54 32 40 Z '
    + 'M 45 60 L 55 60 L 55 78 L 45 78 Z '
    + 'M 30 78 L 70 78 L 74 92 L 26 92 Z',
})
