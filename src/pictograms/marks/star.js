// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * A five-point star on a 46/19 radius ratio - fatter arms than a display star so the points survive being drawn 12px wide.
 */
export const star = /* @__PURE__ */ definePictogram({
  name: 'star',
  category: 'symbols',
  source: 'original',
  path:
    'M 50 6 L 61.2 36.6 L 93.8 37.8 L 68.1 57.9 L 77 89.2 L 50 71 L 23 89.2 L 31.9 57.9 L 6.2 37.8 L 38.8 36.6 Z',
})
