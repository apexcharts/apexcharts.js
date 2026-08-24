// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * A broadleaf tree: a two-lobed canopy over a short trunk. The canopy overlaps the trunk so the two wind as a union.
 */
export const tree = /* @__PURE__ */ definePictogram({
  name: 'tree',
  category: 'nature',
  source: 'original',
  path:
    'M 50 6 C 66 6 78 18 78 33 C 78 38 77 42 75 46 C 82 50 86 57 86 65 C 86 77 76 86 64 86 L 55 86 L 55 96 L 45 96 L 45 86 L 36 86 C 24 86 14 77 14 65 C 14 57 18 50 25 46 C 23 42 22 38 22 33 C 22 18 34 6 50 6 Z',
})
