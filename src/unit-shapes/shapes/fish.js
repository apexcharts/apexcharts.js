// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A fish, side on: a lens body with a forked tail unioned onto its left end.
 *
 * The tail is wound to match the body, so it adds to it. Wound the other way it
 * would cut the fork straight out of the body instead, which is exactly the kind
 * of mistake that looks intentional until someone points at it.
 *
 * No eye. At any dot count where a two-dot eye would fit, the surrounding rows
 * close over it anyway.
 */
export const fish = /* @__PURE__ */ silhouette({
  name: 'fish',
  category: 'nature',
  minUnits: 80,
  source: 'original',
  path:
    'M 20 50 C 34 26 58 20 76 30 C 86 36 92 44 94 50 '
    + 'C 92 56 86 64 76 70 C 58 80 34 74 20 50 Z '
    + 'M 26 50 L 4 74 L 12 50 L 4 26 Z',
})
