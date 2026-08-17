// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A figure with head, shoulders, arms and two legs. Head and body are separate
 * subpaths, so the neck is a gap rather than an outline that has to weave one.
 */
export const human = /* @__PURE__ */ silhouette({
  name: 'human',
  category: 'people',
  minUnits: 80,
  source: 'original',
  path:
    'M 39 13 A 11 11 0 0 1 61 13 A 11 11 0 0 1 39 13 Z '
    + 'M 38 30 C 33 31 29 34 27 40 L 19 64 L 26 67 L 33 48 L 34 58 L 31 96 '
    + 'L 44 96 L 46 64 L 54 64 L 56 96 L 69 96 L 66 58 L 67 48 L 74 67 '
    + 'L 81 64 L 73 40 C 71 34 67 31 62 30 Z',
})
