// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * A takeaway cup with a solid handle nub. The handle is part of the body outline, not a ring, so there is no hole to lose.
 */
export const cup = /* @__PURE__ */ definePictogram({
  name: 'cup',
  category: 'objects',
  source: 'original',
  path:
    'M 14 22 L 70 22 L 70 34 L 80 34 C 90 34 96 41 96 51 C 96 63 87 71 75 71 L 69 71 C 65 84 55 92 42 92 C 26 92 14 79 14 61 Z',
})
