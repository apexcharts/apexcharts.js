// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * An open hand: votes, pledges, volunteers, hands raised.
 *
 * Palm and four fingers are one outline, dipping to a knuckle line between each
 * finger, with the thumb unioned on at the side. The fingers are the constraint:
 * each is 11 units wide against a 56 unit palm, so they are the first thing to
 * collapse, and `minUnits` is set where four of them still separate.
 */
export const hand = /* @__PURE__ */ silhouette({
  name: 'hand',
  category: 'people',
  minUnits: 180,
  source: 'original',
  path:
    'M 22 94 L 22 50 L 24 50 L 24 24 A 5.5 5.5 0 0 1 35 24 L 35 50 L 37 50 '
    + 'L 37 18 A 5.5 5.5 0 0 1 48 18 L 48 50 L 50 50 L 50 22 '
    + 'A 5.5 5.5 0 0 1 61 22 L 61 50 L 63 50 L 63 32 '
    + 'A 5 5 0 0 1 73 32 L 73 50 L 78 50 L 78 94 Z '
    + 'M 22 74 C 18 78 8 78 6 70 C 4 62 12 56 22 58 Z',
})
