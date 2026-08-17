// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * Three figures shoulder to shoulder: households, teams, cohorts, crowds.
 *
 * Six subpaths, a disc and a body each, all wound alike so they union.
 *
 * The bodies must NOT touch. Overlapped by even a few units they fuse into one
 * wide slab wearing three heads, which is what the first attempt did: the three
 * figure count is carried entirely by the gaps, so the gaps are the shape. They
 * are 6 units wide here, which stays open at the dot pitch `minUnits` implies.
 *
 * Distinct from `human`, which is one figure with limbs. Use this when the unit
 * being counted is a group and that one is for counting people.
 */
export const group = /* @__PURE__ */ silhouette({
  name: 'group',
  category: 'people',
  minUnits: 160,
  source: 'original',
  path:
    'M 8 94 L 8 57 C 8 48 14.6 48 14.6 48 L 23.4 48 C 23.4 48 30 48 30 57 L 30 94 Z '
    + 'M 9.5 34 A 9.5 9.5 0 0 1 28.5 34 A 9.5 9.5 0 0 1 9.5 34 Z '
    + 'M 36 94 L 36 47 C 36 38 44.4 38 44.4 38 L 55.6 38 C 55.6 38 64 38 64 47 L 64 94 Z '
    + 'M 38.5 23 A 11.5 11.5 0 0 1 61.5 23 A 11.5 11.5 0 0 1 38.5 23 Z '
    + 'M 70 94 L 70 57 C 70 48 76.6 48 76.6 48 L 85.4 48 C 85.4 48 92 48 92 57 L 92 94 Z '
    + 'M 71.5 34 A 9.5 9.5 0 0 1 90.5 34 A 9.5 9.5 0 0 1 71.5 34 Z',
})
